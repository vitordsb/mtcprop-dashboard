import {
  PrismaClient,
  type UserRole,
} from "@prisma/client";

const prisma = new PrismaClient();

const internalAdmins = [
  {
    name: "Vitor DSB",
    email: "vitordsb2019@gmail.com",
    passwordHash: "$2b$12$Qmd5FA/37UKYKWQ7skJfvOWf9pe/80vacZZD78Ah0tZPpQK1MNo6y",
    role: "ADMIN" as UserRole,
  },
  {
    name: "Yago Ribeiro",
    email: "yagoribeirotrader@gmail.com",
    passwordHash: "$2b$12$lPjytegyQDY2kPwYLk6eg.gU6r2W.EOlKOP3O048tnXN/RMycCZXS",
    role: "OWNER" as UserRole,
  },
];

async function main() {
  const resetMode = process.env.SEED_MODE === "reset";

  if (resetMode) {
    await prisma.accessGrant.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.auditEvent.deleteMany();
    await prisma.student.deleteMany();
    await prisma.product.deleteMany();
    await prisma.adminUser.deleteMany();
  }

  const syncedAdmins = await Promise.all(
    internalAdmins.map((adminUser) =>
      prisma.adminUser.upsert({
        where: { email: adminUser.email },
        update: {
          name: adminUser.name,
          passwordHash: adminUser.passwordHash,
          role: adminUser.role,
          isActive: true,
        },
        create: {
          name: adminUser.name,
          email: adminUser.email,
          passwordHash: adminUser.passwordHash,
          role: adminUser.role,
          isActive: true,
        },
      }),
    ),
  );

  const ownerAdmin =
    syncedAdmins.find((adminUser) => adminUser.role === "OWNER") ??
    syncedAdmins[0];

  await Promise.all([
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

  await prisma.auditEvent.create({
    data: {
      adminUserId: ownerAdmin.id,
      action: resetMode ? "seed.reset.completed" : "seed.sync.completed",
      entityType: "system",
      entityId: "bootstrap",
      payload: {
        seededAt: new Date().toISOString(),
        adminUsersSynced: internalAdmins.map((adminUser) => adminUser.email),
        resetMode,
      },
    },
  });

  console.log(
    `✓ Seed concluido. Modo reset: ${resetMode ? "sim" : "nao"}.`,
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
