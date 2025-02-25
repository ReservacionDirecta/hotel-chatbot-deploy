-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_NotificationSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "phoneEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnBooking" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnCheckIn" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnCheckOut" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnMessage" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_NotificationSettings" ("createdAt", "emailEnabled", "id", "phoneEnabled", "pushEnabled", "updatedAt") SELECT "createdAt", "emailEnabled", "id", "phoneEnabled", "pushEnabled", "updatedAt" FROM "NotificationSettings";
DROP TABLE "NotificationSettings";
ALTER TABLE "new_NotificationSettings" RENAME TO "NotificationSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
