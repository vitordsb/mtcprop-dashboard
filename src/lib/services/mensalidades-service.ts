import { getCompanySnapshot } from "@/lib/company-snapshot";
import {
  CACHE_TAGS,
  DEFAULT_PAGINATION_LIMIT,
  MAX_PAGINATION_LIMIT,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { nelogicaService } from "@/lib/services/nelogica-service";
import type { PropTradingSubscription } from "@/lib/services/nelogica-types";
import { unstable_cache } from "next/cache";

const MASTERS_COM_MENSALIDADE = [
  "MTC Prop Remunerado",
  "MTC Prop - Remunerado",
  "MTC Prop Mesa Real",
];

const CICLO_DIAS = 30;
const GRACA_DIAS = 5;

export type MensalidadeStatus = "EM DIA" | "ATRASADA";

export type MensalidadeListItem = {
  id: string;
  subAccount: string;
  masterAccount: string;
  masterAccountHolder: string;
  document: string;
  studentName: string;
  /** Plataforma (Profit One / Profit Pro) */
  plataforma: string;
  /** Plano da Guru via cruzamento de CPF (pode ser null se não houver venda casada) */
  guruPlanName: string | null;
  /** Data de início (ISO) — createdAt da subconta na Nelogica */
  inicio: string;
  inicioFormatted: string;
  /** Data da próxima mensalidade (ISO) */
  proximaMensalidade: string;
  proximaMensalidadeFormatted: string;
  /** Dias restantes (positivo) ou dias em atraso (negativo) até a próxima */
  diasParaProxima: number;
  status: MensalidadeStatus;
};

export type MensalidadesPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  q?: string;
};

export type MensalidadesOverview = {
  company: ReturnType<typeof getCompanySnapshot>;
  items: MensalidadeListItem[];
  pagination: MensalidadesPagination;
};

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return typeof value === "string" ? value : "—";
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function parseIsoOrSql(value: string): Date {
  // Aceita "YYYY-MM-DD HH:mm:ss" (formato Nelogica) ou ISO padrão
  const normalized = value.includes("T") ? value : value.replace(" ", "T") + "Z";
  return new Date(normalized);
}

function toPositiveInteger(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }
  return null;
}

/**
 * Calcula a próxima data de mensalidade dado o início.
 * Ciclo fixo de 30 dias desde o início.
 */
function calcProximaMensalidade(inicio: Date, now: Date): { proxima: Date; diasParaProxima: number } {
  const diffMs = now.getTime() - inicio.getTime();
  const cicloMs = CICLO_DIAS * 24 * 60 * 60 * 1000;
  const ciclosCompletos = Math.floor(diffMs / cicloMs);
  // próxima = inicio + (ciclosCompletos + 1) * 30d
  const proxima = new Date(inicio.getTime() + (ciclosCompletos + 1) * cicloMs);
  const diasParaProxima = Math.ceil((proxima.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  return { proxima, diasParaProxima };
}

const getCachedTradersMap = unstable_cache(
  async (): Promise<Map<string, PropTradingSubscription>> => {
    try {
      const subscriptions = await nelogicaService.listPropTraders({ active: 1, perPage: 1000 });
      const map = new Map<string, PropTradingSubscription>();
      for (const sub of subscriptions) {
        const normalizedDoc = sub.document.replace(/\D/g, "");
        map.set(`${sub.subAccount}:${sub.account}:${normalizedDoc}`, sub);
      }
      return map;
    } catch {
      return new Map<string, PropTradingSubscription>();
    }
  },
  [CACHE_TAGS.MENSALIDADES_OVERVIEW, "nelogica-prop-traders-mensalidades"],
  { revalidate: 60, tags: [CACHE_TAGS.MENSALIDADES_OVERVIEW] },
);

const getCachedMensalidades = unstable_cache(
  async (
    pageParam?: number | string | null,
    limitParam?: number | string | null,
    queryParam?: string | null,
  ): Promise<MensalidadesOverview> => {
    const requestedLimit = toPositiveInteger(limitParam) ?? DEFAULT_PAGINATION_LIMIT;
    const limit = Math.min(requestedLimit, MAX_PAGINATION_LIMIT);
    const requestedPage = toPositiveInteger(pageParam) ?? 1;
    const searchQuery = queryParam?.trim().toLowerCase();

    const tradersMap = await getCachedTradersMap();
    const all = Array.from(tradersMap.values());

    // Filtra só pelas masters com mensalidade
    const filtered = all.filter((t) =>
      MASTERS_COM_MENSALIDADE.some((m) => t.accountHolder?.toLowerCase().includes(m.toLowerCase())),
    );

    // Busca
    const searched = searchQuery
      ? filtered.filter((t) =>
          [t.subAccountHolder, t.document, t.subAccount, t.account, t.accountHolder, t.product]
            .some((field) => field?.toLowerCase().includes(searchQuery)),
        )
      : filtered;

    // Ordena por próxima mensalidade (mais próxima/atrasada primeiro)
    const now = new Date();
    const computed = searched.map((t) => {
      const inicio = parseIsoOrSql(t.createdAt);
      const { proxima, diasParaProxima } = calcProximaMensalidade(inicio, now);
      return { trader: t, inicio, proxima, diasParaProxima };
    });
    computed.sort((a, b) => a.diasParaProxima - b.diasParaProxima);

    const total = computed.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(requestedPage, totalPages);
    const skip = (page - 1) * limit;
    const pageSlice = computed.slice(skip, skip + limit);

    // Enriquece com Enrollment (Guru) — match por CPF
    const docs = pageSlice.map(({ trader }) => trader.document.replace(/\D/g, "")).filter(Boolean);
    const students = docs.length > 0
      ? await prisma.student.findMany({
          where: { nelogicaDocument: { in: docs } },
          include: { enrollments: { where: { status: "ACTIVE" }, take: 1 } },
        })
      : [];
    const studentsByDoc = new Map<string, (typeof students)[number]>();
    for (const s of students) {
      if (s.nelogicaDocument) studentsByDoc.set(s.nelogicaDocument.replace(/\D/g, ""), s);
    }

    const items: MensalidadeListItem[] = pageSlice.map(({ trader, inicio, proxima, diasParaProxima }) => {
      const normalizedDoc = trader.document.replace(/\D/g, "");
      const student = studentsByDoc.get(normalizedDoc);
      const enrollment = student?.enrollments?.[0];
      const guruStatus = enrollment?.guruStatus?.toLowerCase() ?? "";

      // EM DIA: tem Guru status "active" OU ainda está dentro do ciclo + graça
      const guruAtivo = guruStatus === "active" || guruStatus === "ativo";
      const dentroDoGraceperiod = diasParaProxima > -GRACA_DIAS;
      const status: MensalidadeStatus = guruAtivo && dentroDoGraceperiod ? "EM DIA" : "ATRASADA";

      return {
        id: `${trader.account}-${trader.subAccount}`,
        subAccount: trader.subAccount,
        masterAccount: trader.account,
        masterAccountHolder: trader.accountHolder,
        document: trader.document,
        studentName: trader.subAccountHolder || student?.name || "—",
        plataforma: trader.product,
        guruPlanName: enrollment?.guruProductName ?? null,
        inicio: inicio.toISOString(),
        inicioFormatted: formatDate(inicio),
        proximaMensalidade: proxima.toISOString(),
        proximaMensalidadeFormatted: formatDate(proxima),
        diasParaProxima,
        status,
      };
    });

    return {
      company: getCompanySnapshot(),
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
        q: queryParam ?? undefined,
      },
    };
  },
  [CACHE_TAGS.MENSALIDADES_OVERVIEW],
  { revalidate: 60, tags: [CACHE_TAGS.MENSALIDADES_OVERVIEW] },
);

export const mensalidadesService = {
  async getOverview(params?: {
    page?: number | string | null;
    limit?: number | string | null;
    q?: string | null;
  }): Promise<MensalidadesOverview> {
    return getCachedMensalidades(params?.page, params?.limit, params?.q);
  },
};
