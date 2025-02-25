/*
  Warnings:

  - The primary key for the `Script` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `category` on the `Script` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `Script` table. All the data in the column will be lost.
  - You are about to drop the column `keywords` on the `Script` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Script` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `Script` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - Added the required column `description` to the `Script` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Script` table without a default value. This is not possible if the table is not empty.
  - Added the required column `triggers` to the `Script` table without a default value. This is not possible if the table is not empty.

*/
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Script" ("createdAt", "id", "response", "updatedAt") SELECT "createdAt", "id", "response", "updatedAt" FROM "Script";
DROP TABLE "Script";
ALTER TABLE "new_Script" RENAME TO "Script";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
