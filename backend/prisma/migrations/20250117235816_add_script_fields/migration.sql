-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Script" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "triggers" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'information',
    "requiresDate" BOOLEAN NOT NULL DEFAULT false,
    "requiresRoomType" BOOLEAN NOT NULL DEFAULT false,
    "requiresOccupancy" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Script" ("active", "createdAt", "description", "id", "name", "response", "triggers", "updatedAt") SELECT "active", "createdAt", "description", "id", "name", "response", "triggers", "updatedAt" FROM "Script";
DROP TABLE "Script";
ALTER TABLE "new_Script" RENAME TO "Script";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
