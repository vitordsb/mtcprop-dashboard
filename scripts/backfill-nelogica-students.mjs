#!/usr/bin/env node
/**
 * Backfill: para cada trader ativo na Nelogica, garante Student + Enrollment ativos no DB.
 * Cruza por CPF (nelogicaDocument) → quando bate com algum venda na Guru, preenche
 * guruProductName / guruStatus / guruContactId / guruProductId no Enrollment.
 *
 * Idempotente — pode rodar várias vezes. Não duplica.
 *
 * Uso:
 *   cd appDashInterno/App && set -a && source .env.local && set +a && node scripts/backfill-nelogica-students.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const AUTH = process.env.NELOGICA_AUTH_CODE;
const ORIGIN = process.env.NELOGICA_ORIGIN || "";
const BASE = process.env.NELOGICA_BASE_URL || "https://api-broker3.nelogica.com.br/";
const GURU_USER_TOKEN = process.env.GURU_USER_TOKEN;
const GURU_ACCOUNT_TOKEN = process.env.GURU_ACCOUNT_TOKEN;
const GURU_BASE = process.env.GURU_API_BASE_URL || "https://digitalmanager.guru/api/v2";

if (!AUTH) {
  console.error("NELOGICA_AUTH_CODE missing");
  process.exit(1);
}

async function fetchNelogicaTraders() {
  const res = await fetch(new URL("request.php", BASE).toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: ORIGIN },
    body: JSON.stringify({
      request: "prop_trading_list_user_subscription",
      authenticationCode: AUTH,
      active: 1,
      page: 1,
      perPage: 1000,
    }),
  });
  if (!res.ok) throw new Error(`Nelogica HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function fetchGuruTransactionsAll() {
  const tokens = [GURU_ACCOUNT_TOKEN, GURU_USER_TOKEN].filter(Boolean);
  if (tokens.length === 0) {
    console.warn("Sem GURU_*_TOKEN — pulando cruzamento Guru");
    return [];
  }
  const out = [];
  // Guru limita 180 dias por janela — fazemos 6 janelas (~3 anos)
  const toIso = (d) => d.toISOString().slice(0, 10);
  const now = new Date();
  const windows = [];
  for (let i = 0; i < 6; i++) {
    const end = new Date(now);
    end.setDate(end.getDate() - i * 179);
    const start = new Date(end);
    start.setDate(start.getDate() - 179);
    windows.push({ start: toIso(start), end: toIso(end) });
  }

  for (const { start, end } of windows) {
   for (const field of ["ordered_at", "confirmed_at"]) {
    let cursor = null;
    let safety = 0;
    do {
      const url = new URL(`${GURU_BASE}/transactions`);
      url.searchParams.set(field + "_ini", start);
      url.searchParams.set(field + "_end", end);
      if (cursor) url.searchParams.set("cursor", cursor);
      let res = null;
      for (const t of tokens) {
        try {
          res = await fetch(url, {
            headers: { Authorization: `Bearer ${t}`, Accept: "application/json" },
          });
        } catch {
          continue;
        }
        if (res && res.status !== 401 && res.status !== 403) break;
      }
      if (!res || !res.ok) {
        console.warn(`  Guru ${field} → HTTP ${res?.status ?? "?"} (pulando)`);
        break;
      }
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.warn(`  Guru ${field} → resposta não-JSON (pulando)`);
        break;
      }
      const items = data.data ?? [];
      for (const it of items) out.push(it);
      cursor = data.has_more_pages ? data.next_cursor : null;
      safety++;
    } while (cursor && safety < 20);
   }
  }
  return out;
}

async function ensureFallbackProduct() {
  const slug = "trader-prop-nelogica";
  const existing = await prisma.product.findUnique({ where: { slug } });
  if (existing) return existing;
  return prisma.product.create({
    data: {
      name: "Trader Prop (Nelogica)",
      slug,
      kind: "PROP_PLAN",
      price: 0,
      isActive: true,
    },
  });
}

function normalizeDoc(doc) {
  return (doc ?? "").replace(/\D/g, "");
}

async function main() {
  console.log("→ Buscando traders na Nelogica...");
  const traders = await fetchNelogicaTraders();
  console.log(`  ${traders.length} traders ativos`);

  console.log("→ Buscando transactions na Guru...");
  const guruTxs = await fetchGuruTransactionsAll();
  console.log(`  ${guruTxs.length} transactions`);

  // Mapa CPF → última transação relevante
  const guruByDoc = new Map();
  for (const tx of guruTxs) {
    const cpf = normalizeDoc(tx?.contact?.doc || tx?.contact?.document);
    if (!cpf) continue;
    const existing = guruByDoc.get(cpf);
    const txDate = new Date(tx?.dates?.confirmed_at || tx?.dates?.ordered_at || tx?.created_at || 0);
    if (!existing || txDate > new Date(existing.dates?.confirmed_at || existing.dates?.ordered_at || existing.created_at || 0)) {
      guruByDoc.set(cpf, tx);
    }
  }
  console.log(`  ${guruByDoc.size} CPFs únicos na Guru`);

  const fallbackProduct = await ensureFallbackProduct();

  let createdStudent = 0;
  let updatedStudent = 0;
  let createdEnroll = 0;
  let updatedEnroll = 0;
  let withGuru = 0;

  for (const t of traders) {
    const cpf = normalizeDoc(t.document);
    if (!cpf) continue;
    const guruTx = guruByDoc.get(cpf) ?? null;

    // 1) Student
    let student = await prisma.student.findFirst({
      where: { nelogicaDocument: cpf },
    });

    const studentData = {
      name: t.subAccountHolder || `Trader ${cpf.slice(0, 6)}`,
      nelogicaDocument: cpf,
      nelogicaActivationCode: t.activationCode ?? null,
      nelogicaContaID: t.subAccount ?? null,
      nelogicaProduct: t.product ?? null,
      nelogicaStatus: "ATIVO",
    };
    const email = guruTx?.contact?.email || `${cpf}@trader.mtcprop.local`;

    if (!student) {
      // tenta achar por email (caso já exista um Student sem nelogicaDocument)
      const byEmail = await prisma.student.findUnique({ where: { email } });
      if (byEmail) {
        student = await prisma.student.update({
          where: { id: byEmail.id },
          data: studentData,
        });
        updatedStudent++;
      } else {
        student = await prisma.student.create({
          data: { ...studentData, email },
        });
        createdStudent++;
      }
    } else {
      student = await prisma.student.update({
        where: { id: student.id },
        data: studentData,
      });
      updatedStudent++;
    }

    // 2) Enrollment ativo
    const enrollData = {
      guruProductName: guruTx?.product?.name ?? null,
      guruProductId: guruTx?.product?.id ?? null,
      guruStatus: guruTx?.status ?? null,
      guruContactId: guruTx?.contact?.id ?? null,
      guruSubscriptionId: guruTx?.subscription?.id ?? null,
      guruSubscriptionCode: guruTx?.subscription?.code ?? null,
      guruLastWebhookAt: null,
    };
    if (guruTx) withGuru++;

    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId: student.id, status: "ACTIVE" },
    });
    if (!enrollment) {
      await prisma.enrollment.create({
        data: {
          studentId: student.id,
          productId: fallbackProduct.id,
          status: "ACTIVE",
          startedAt: t.createdAt ? new Date(t.createdAt.replace(" ", "T")) : new Date(),
          ...enrollData,
        },
      });
      createdEnroll++;
    } else {
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: enrollData,
      });
      updatedEnroll++;
    }
  }

  console.log("\n=== Resumo ===");
  console.log(`Students criados: ${createdStudent} | atualizados: ${updatedStudent}`);
  console.log(`Enrollments criados: ${createdEnroll} | atualizados: ${updatedEnroll}`);
  console.log(`Traders cruzados com Guru: ${withGuru}/${traders.length}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
