-- AlterTable
ALTER TABLE "Order" ADD COLUMN "yookassaPaymentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_yookassaPaymentId_key" ON "Order"("yookassaPaymentId");
