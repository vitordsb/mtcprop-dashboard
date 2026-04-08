-- CreateTable
CREATE TABLE "GuruTransactionSnapshot" (
    "id" TEXT NOT NULL,
    "guruTransactionId" TEXT NOT NULL,
    "guruTransactionCode" TEXT,
    "guruContactId" TEXT,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactDocument" TEXT,
    "productName" TEXT NOT NULL,
    "productOfferName" TEXT,
    "status" TEXT,
    "currency" TEXT,
    "amount" DECIMAL(10,2),
    "orderedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "guruSubscriptionId" TEXT,
    "guruSubscriptionCode" TEXT,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuruTransactionSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GuruTransactionSnapshot_guruTransactionId_key" ON "GuruTransactionSnapshot"("guruTransactionId");

-- CreateIndex
CREATE INDEX "GuruTransactionSnapshot_guruContactId_idx" ON "GuruTransactionSnapshot"("guruContactId");

-- CreateIndex
CREATE INDEX "GuruTransactionSnapshot_contactEmail_idx" ON "GuruTransactionSnapshot"("contactEmail");

-- CreateIndex
CREATE INDEX "GuruTransactionSnapshot_contactDocument_idx" ON "GuruTransactionSnapshot"("contactDocument");

-- CreateIndex
CREATE INDEX "GuruTransactionSnapshot_orderedAt_idx" ON "GuruTransactionSnapshot"("orderedAt");

-- CreateIndex
CREATE INDEX "GuruTransactionSnapshot_confirmedAt_idx" ON "GuruTransactionSnapshot"("confirmedAt");

-- CreateIndex
CREATE INDEX "GuruTransactionSnapshot_canceledAt_idx" ON "GuruTransactionSnapshot"("canceledAt");
