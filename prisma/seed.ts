import path from "node:path";

import { PrismaClient, type TraderSourceOrigin } from "@prisma/client";

import {
  loadWorkbookTradersDataset,
  slugifyTraderName,
} from "../src/lib/workbook/traders-workbook";

const prisma = new PrismaClient();

function buildEmail(name: string, usedEmails: Set<string>) {
  const baseEmail =
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, ".")
      .replace(/[^a-z.]/g, "")
      .replace(/^\.+|\.+$/g, "")
      .slice(0, 40) || "trader";

  let email = `${baseEmail}@trader.mtcprop.com.br`;
  let suffix = 2;

  while (usedEmails.has(email)) {
    email = `${baseEmail}.${suffix}@trader.mtcprop.com.br`;
    suffix += 1;
  }

  usedEmails.add(email);
  return email;
}

function mapOriginToEnum(origin: string): TraderSourceOrigin {
  if (origin === "Fast") {
    return "FAST";
  }

  if (origin === "Conta real") {
    return "LIVE_DESK";
  }

  return "CHALLENGE";
}

async function createOrUpdateEnrollment(params: {
  studentId: string;
  productId: string;
  startedAt: Date;
}) {
  const existingEnrollment = await prisma.enrollment.findFirst({
    where: {
      studentId: params.studentId,
      productId: params.productId,
    },
    orderBy: { createdAt: "asc" },
  });

  const enrollment = existingEnrollment
    ? await prisma.enrollment.update({
      where: { id: existingEnrollment.id },
      data: {
        status: "ACTIVE",
        startedAt: params.startedAt,
        endsAt: null,
      },
    })
    : await prisma.enrollment.create({
      data: {
        studentId: params.studentId,
        productId: params.productId,
        status: "ACTIVE",
        startedAt: params.startedAt,
      },
    });

  await prisma.enrollment.updateMany({
    where: {
      studentId: params.studentId,
      status: "ACTIVE",
      NOT: {
        id: enrollment.id,
      },
    },
    data: {
      status: "COMPLETED",
      endsAt: params.startedAt,
    },
  });

  return enrollment;
}

async function syncAccessGrants(params: {
  studentId: string;
  enrollmentId: string;
  moduleKeys: string[];
}) {
  const currentAccessGrants = await prisma.accessGrant.findMany({
    where: { studentId: params.studentId },
  });

  for (const moduleKey of params.moduleKeys) {
    const existingAccess = currentAccessGrants.find(
      (accessGrant) => accessGrant.moduleKey === moduleKey,
    );

    if (existingAccess) {
      await prisma.accessGrant.update({
        where: { id: existingAccess.id },
        data: {
          enrollmentId: params.enrollmentId,
          status: "ACTIVE",
        },
      });
      continue;
    }

    await prisma.accessGrant.create({
      data: {
        studentId: params.studentId,
        enrollmentId: params.enrollmentId,
        moduleKey,
        status: "ACTIVE",
      },
    });
  }

  const desiredModuleKeys = new Set(params.moduleKeys);

  for (const currentAccessGrant of currentAccessGrants) {
    if (desiredModuleKeys.has(currentAccessGrant.moduleKey)) {
      continue;
    }

    await prisma.accessGrant.update({
      where: { id: currentAccessGrant.id },
      data: {
        enrollmentId: params.enrollmentId,
        status: "BLOCKED",
      },
    });
  }
}

async function main() {
  const dataset = loadWorkbookTradersDataset();
  const { traders, workbookPath } = dataset;
  const resetMode = process.env.SEED_MODE === "reset";

  if (resetMode) {
    await prisma.accessGrant.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.auditEvent.deleteMany();
    await prisma.student.deleteMany();
    await prisma.product.deleteMany();
    await prisma.adminUser.deleteMany();
  }

  const admin = await prisma.adminUser.upsert({
    where: {
      email: "operacoes@mtcprop.com.br",
    },
    update: {
      name: "Operacao MTCprop",
      role: "OWNER",
      isActive: true,
    },
    create: {
      name: "Operacao MTCprop",
      email: "operacoes@mtcprop.com.br",
      passwordHash: "ALTERAR_ANTES_DE_USAR",
      role: "OWNER",
      isActive: true,
    },
  });

  const products = await Promise.all([
    prisma.product.upsert({
      where: { slug: "plano-start" },
      update: { name: "Plano Start", kind: "PROP_PLAN", price: 297, maxContracts: 5, isActive: true },
      create: { name: "Plano Start", slug: "plano-start", kind: "PROP_PLAN", price: 297, maxContracts: 5, isActive: true },
    }),
    prisma.product.upsert({
      where: { slug: "plano-intermediario" },
      update: { name: "Plano Intermediário", kind: "PROP_PLAN", price: 447, maxContracts: 10, isActive: true },
      create: { name: "Plano Intermediário", slug: "plano-intermediario", kind: "PROP_PLAN", price: 447, maxContracts: 10, isActive: true },
    }),
    prisma.product.upsert({
      where: { slug: "plano-avancado" },
      update: { name: "Plano Avançado", kind: "PROP_PLAN", price: 747, maxContracts: 25, isActive: true },
      create: { name: "Plano Avançado", slug: "plano-avancado", kind: "PROP_PLAN", price: 747, maxContracts: 25, isActive: true },
    }),
    prisma.product.upsert({
      where: { slug: "plano-expert" },
      update: { name: "Plano Expert", kind: "PROP_PLAN", price: 1197, maxContracts: 50, isActive: true },
      create: { name: "Plano Expert", slug: "plano-expert", kind: "PROP_PLAN", price: 1197, maxContracts: 50, isActive: true },
    }),
    prisma.product.upsert({
      where: { slug: "plano-intermediario-fast" },
      update: { name: "Plano Intermediário Fast", kind: "PROP_PLAN", price: 347, maxContracts: 10, isActive: true },
      create: { name: "Plano Intermediário Fast", slug: "plano-intermediario-fast", kind: "PROP_PLAN", price: 347, maxContracts: 10, isActive: true },
    }),
    prisma.product.upsert({
      where: { slug: "plano-avancado-fast" },
      update: { name: "Plano Avançado Fast", kind: "PROP_PLAN", price: 597, maxContracts: 25, isActive: true },
      create: { name: "Plano Avançado Fast", slug: "plano-avancado-fast", kind: "PROP_PLAN", price: 597, maxContracts: 25, isActive: true },
    }),
    prisma.product.upsert({
      where: { slug: "plano-intermediario-fast-pro" },
      update: { name: "Plano Intermediário Fast Pro", kind: "PROP_PLAN", price: 447, maxContracts: 10, isActive: true },
      create: { name: "Plano Intermediário Fast Pro", slug: "plano-intermediario-fast-pro", kind: "PROP_PLAN", price: 447, maxContracts: 10, isActive: true },
    }),
    prisma.product.upsert({
      where: { slug: "plano-avancado-fast-pro" },
      update: { name: "Plano Avançado Fast Pro", kind: "PROP_PLAN", price: 747, maxContracts: 25, isActive: true },
      create: { name: "Plano Avançado Fast Pro", slug: "plano-avancado-fast-pro", kind: "PROP_PLAN", price: 747, maxContracts: 25, isActive: true },
    }),
    prisma.product.upsert({
      where: { slug: "metodo-trader-consistente-2" },
      update: { name: "Método Trader Consistente 2.0", kind: "COURSE", price: 997, isActive: true },
      create: { name: "Método Trader Consistente 2.0", slug: "metodo-trader-consistente-2", kind: "COURSE", price: 997, isActive: true },
    }),
  ]);

  const productBySlug = new Map(products.map((product) => [product.slug, product]));
  const existingStudents = await prisma.student.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      workbookSlug: true,
    },
  });
  const usedEmails = new Set(existingStudents.map((student) => student.email));
  const existingStudentBySlug = new Map(
    existingStudents.map((student) => [
      student.workbookSlug ?? slugifyTraderName(student.name),
      student,
    ]),
  );

  for (const trader of traders) {
    if (!trader.currentPlanSlug) {
      continue;
    }

    const existingStudent = existingStudentBySlug.get(trader.slug);
    const email = existingStudent?.email ?? buildEmail(trader.name, usedEmails);
    const product =
      productBySlug.get(trader.currentPlanSlug) ??
      productBySlug.get(
        trader.currentPlanSlug.includes("fast")
          ? "plano-intermediario-fast"
          : "plano-intermediario",
      );

    if (!product) {
      continue;
    }

    const student = existingStudent
      ? await prisma.student.update({
        where: { id: existingStudent.id },
        data: {
          name: trader.name,
          email,
          stage: trader.currentStage,
          isActive: true,
          workbookSlug: trader.slug,
          workbookOrigin: mapOriginToEnum(trader.primarySource),
          workbookSourceSheets: trader.sourceSheets,
          workbookHistoryCount: trader.historyCount,
          workbookSalesCount: trader.salesHistoryCount,
          workbookRestartUsed: trader.hasRestartBenefit,
          workbookHasLiveDesk: trader.hasLiveDeskHistory,
          workbookNextMonthlyDueAt: trader.nextMonthlyDueAt,
        },
      })
      : await prisma.student.create({
        data: {
          name: trader.name,
          email,
          stage: trader.currentStage,
          isActive: true,
          workbookSlug: trader.slug,
          workbookOrigin: mapOriginToEnum(trader.primarySource),
          workbookSourceSheets: trader.sourceSheets,
          workbookHistoryCount: trader.historyCount,
          workbookSalesCount: trader.salesHistoryCount,
          workbookRestartUsed: trader.hasRestartBenefit,
          workbookHasLiveDesk: trader.hasLiveDeskHistory,
          workbookNextMonthlyDueAt: trader.nextMonthlyDueAt,
        },
      });

    existingStudentBySlug.set(trader.slug, {
      id: student.id,
      email: student.email,
      name: student.name,
      workbookSlug: trader.slug,
    });

    const enrollment = await createOrUpdateEnrollment({
      studentId: student.id,
      productId: product.id,
      startedAt: trader.currentStartedAt,
    });

    const moduleKeys =
      trader.currentStage === "LIVE_DESK"
        ? ["live-room", "training-library", "premium-community", "support"]
        : ["training-library", "support"];

    await syncAccessGrants({
      studentId: student.id,
      enrollmentId: enrollment.id,
      moduleKeys,
    });
  }

  await prisma.auditEvent.create({
    data: {
      adminUserId: admin.id,
      action: resetMode ? "seed.reset.completed" : "seed.sync.completed",
      entityType: "system",
      entityId: "bootstrap",
      payload: {
        seededAt: new Date().toISOString(),
        source: path.basename(workbookPath),
        tradersImported: traders.length,
        resetMode,
      },
    },
  });

  console.log(
    `✓ Seed concluido — ${traders.length} traders sincronizados de ${workbookPath}. Modo reset: ${resetMode ? "sim" : "nao"}.`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
