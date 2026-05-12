-- AlterTable
ALTER TABLE "Student" ADD COLUMN "supabaseUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Student_supabaseUserId_key" ON "Student"("supabaseUserId");
