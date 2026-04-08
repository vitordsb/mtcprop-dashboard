-- AlterTable
ALTER TABLE "Enrollment"
ADD COLUMN "guruSubscriptionId" TEXT,
ADD COLUMN "guruSubscriptionCode" TEXT,
ADD COLUMN "guruStatus" TEXT,
ADD COLUMN "guruProductId" TEXT,
ADD COLUMN "guruProductName" TEXT,
ADD COLUMN "guruContactId" TEXT,
ADD COLUMN "guruLastWebhookAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Enrollment_guruSubscriptionId_idx" ON "Enrollment"("guruSubscriptionId");
