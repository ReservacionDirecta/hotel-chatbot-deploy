/*
  Warnings:

  - You are about to drop the column `completedAt` on the `Training` table. All the data in the column will be lost.
  - You are about to drop the column `fileName` on the `Training` table. All the data in the column will be lost.
  - You are about to drop the column `filePath` on the `Training` table. All the data in the column will be lost.
  - You are about to drop the column `originalName` on the `Training` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `Training` table. All the data in the column will be lost.
  - Added the required column `filename` to the `Training` table without a default value. This is not possible if the table is not empty.
  - Added the required column `filepath` to the `Training` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Training` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Training" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Training" ("createdAt", "error", "id", "progress", "status") SELECT "createdAt", "error", "id", "progress", "status" FROM "Training";
DROP TABLE "Training";
ALTER TABLE "new_Training" RENAME TO "Training";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
