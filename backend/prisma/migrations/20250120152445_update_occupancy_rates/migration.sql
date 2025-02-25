/*
  Warnings:

  - You are about to drop the column `occupancy` on the `OccupancyRate` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `OccupancyRate` table. All the data in the column will be lost.
  - Added the required column `endDate` to the `OccupancyRate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rate` to the `OccupancyRate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `OccupancyRate` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Actualizar la tabla OccupancyRate
PRAGMA foreign_keys=OFF;

-- Crear tabla temporal con la nueva estructura
CREATE TABLE "temp_OccupancyRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME NOT NULL DEFAULT (datetime('now', '+1 year')),
    "rate" REAL NOT NULL DEFAULT 0,
    "roomId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OccupancyRate_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Copiar datos existentes a la tabla temporal
INSERT INTO "temp_OccupancyRate" ("id", "startDate", "endDate", "rate", "roomId", "createdAt", "updatedAt")
SELECT 
    "id",
    CURRENT_TIMESTAMP,
    datetime('now', '+1 year'),
    "price",
    "roomId",
    "createdAt",
    "updatedAt"
FROM "OccupancyRate";

-- Eliminar tabla original
DROP TABLE "OccupancyRate";

-- Renombrar tabla temporal
ALTER TABLE "temp_OccupancyRate" RENAME TO "OccupancyRate";

CREATE TABLE "new_Script" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "triggers" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "category" TEXT,
    "requiresDate" BOOLEAN NOT NULL DEFAULT false,
    "requiresRoomType" BOOLEAN NOT NULL DEFAULT false,
    "requiresOccupancy" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Script" ("active", "category", "createdAt", "description", "id", "name", "requiresDate", "requiresOccupancy", "requiresRoomType", "response", "triggers", "updatedAt") SELECT "active", "category", "createdAt", "description", "id", "name", "requiresDate", "requiresOccupancy", "requiresRoomType", "response", "triggers", "updatedAt" FROM "Script";
DROP TABLE "Script";
ALTER TABLE "new_Script" RENAME TO "Script";
CREATE TABLE "new_Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" REAL,
    "hotelId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Service_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Service" ("createdAt", "description", "hotelId", "id", "name", "price", "updatedAt") SELECT "createdAt", "description", "hotelId", "id", "name", "price", "updatedAt" FROM "Service";
DROP TABLE "Service";
ALTER TABLE "new_Service" RENAME TO "Service";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
