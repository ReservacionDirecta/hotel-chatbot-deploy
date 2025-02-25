-- AlterTable
ALTER TABLE "Training" ADD COLUMN "processedContent" JSONB;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OccupancyRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "rate" REAL NOT NULL,
    "roomId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OccupancyRate_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_OccupancyRate" ("createdAt", "endDate", "id", "rate", "roomId", "startDate", "updatedAt") SELECT "createdAt", "endDate", "id", "rate", "roomId", "startDate", "updatedAt" FROM "OccupancyRate";
DROP TABLE "OccupancyRate";
ALTER TABLE "new_OccupancyRate" RENAME TO "OccupancyRate";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
