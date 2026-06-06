-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserSession" (
    "telegramUserId" BIGINT NOT NULL PRIMARY KEY,
    "scenario" TEXT NOT NULL DEFAULT 'IDLE',
    "step" TEXT NOT NULL DEFAULT 'IDLE',
    "vendorId" TEXT,
    "planId" TEXT,
    "pendingOrderId" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserSession_telegramUserId_fkey" FOREIGN KEY ("telegramUserId") REFERENCES "TelegramUser" ("telegramUserId") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserSession" ("pendingOrderId", "planId", "step", "telegramUserId", "updatedAt", "vendorId") SELECT "pendingOrderId", "planId", "step", "telegramUserId", "updatedAt", "vendorId" FROM "UserSession";
DROP TABLE "UserSession";
ALTER TABLE "new_UserSession" RENAME TO "UserSession";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
