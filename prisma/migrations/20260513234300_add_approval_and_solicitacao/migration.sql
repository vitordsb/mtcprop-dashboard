-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDENTE', 'APROVADO', 'REPROVADO');

-- CreateEnum
CREATE TYPE "SolicitacaoType" AS ENUM ('APROVACAO', 'LIBERACAO_PLATAFORMA', 'MIGRACAO_MESA_REAL', 'RESET_GRATUITO', 'REPASSE');

-- CreateEnum
CREATE TYPE "SolicitacaoStatus" AS ENUM ('PENDENTE', 'APROVADA', 'REJEITADA', 'CONCLUIDA');

-- AlterTable
ALTER TABLE "Enrollment"
  ADD COLUMN "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDENTE',
  ADD COLUMN "approvalDecidedAt" TIMESTAMP(3),
  ADD COLUMN "approvalDecidedById" TEXT;

-- CreateIndex
CREATE INDEX "Enrollment_approvalStatus_idx" ON "Enrollment"("approvalStatus");

-- CreateTable
CREATE TABLE "Solicitacao" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" "SolicitacaoType" NOT NULL,
    "status" "SolicitacaoStatus" NOT NULL DEFAULT 'PENDENTE',
    "masterAccount" TEXT,
    "document" TEXT,
    "message" TEXT,
    "adminNotes" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decidedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Solicitacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Solicitacao_status_type_idx" ON "Solicitacao"("status", "type");

-- CreateIndex
CREATE INDEX "Solicitacao_studentId_idx" ON "Solicitacao"("studentId");

-- CreateIndex
CREATE INDEX "Solicitacao_createdAt_idx" ON "Solicitacao"("createdAt");

-- AddForeignKey
ALTER TABLE "Solicitacao" ADD CONSTRAINT "Solicitacao_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
