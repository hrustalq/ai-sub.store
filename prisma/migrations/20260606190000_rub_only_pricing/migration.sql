-- Rename USD price columns to RUB
ALTER TABLE "Plan" RENAME COLUMN "priceUsd" TO "priceRub";
ALTER TABLE "Order" RENAME COLUMN "amountUsd" TO "amountRub";

-- Convert legacy USD amounts to RUB (×90) and set currency
UPDATE "Plan" SET "priceRub" = "priceRub" * 90, "currency" = 'RUB' WHERE "currency" = 'USD';
UPDATE "Order" SET "amountRub" = "amountRub" * 90, "currency" = 'RUB' WHERE "currency" = 'USD';
