import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const totalStudents = await prisma.student.count();
const withDoc = await prisma.student.count({ where: { nelogicaDocument: { not: null } } });
const enrollActive = await prisma.enrollment.count({ where: { status: "ACTIVE" } });
const enrollWithGuruName = await prisma.enrollment.count({
  where: { status: "ACTIVE", guruProductName: { not: null } },
});
const enrollWithGuruStatus = await prisma.enrollment.count({
  where: { status: "ACTIVE", guruStatus: { not: null } },
});

console.log("Students total:", totalStudents);
console.log("Students com nelogicaDocument:", withDoc);
console.log("Enrollments ativos:", enrollActive);
console.log("Enrollments ativos com guruProductName:", enrollWithGuruName);
console.log("Enrollments ativos com guruStatus:", enrollWithGuruStatus);

console.log("\nExemplos de Students sem nelogicaDocument:");
const sample = await prisma.student.findMany({
  where: { nelogicaDocument: null },
  select: { name: true, email: true },
  take: 5,
});
sample.forEach((s) => console.log(`  - ${s.name} <${s.email}>`));

await prisma.$disconnect();
