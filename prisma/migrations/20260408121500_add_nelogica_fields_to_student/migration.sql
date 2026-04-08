-- AlterTable
ALTER TABLE "Student"
ADD COLUMN "nelogicaDocument" TEXT,
ADD COLUMN "nelogicaActivationCode" TEXT,
ADD COLUMN "nelogicaContaID" TEXT,
ADD COLUMN "nelogicaProduct" TEXT DEFAULT 'pro',
ADD COLUMN "nelogicaStatus" TEXT;
