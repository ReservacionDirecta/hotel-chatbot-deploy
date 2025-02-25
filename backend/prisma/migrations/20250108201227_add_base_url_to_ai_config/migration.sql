-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AIConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "provider" TEXT NOT NULL DEFAULT 'glhf',
    "apiKey" TEXT NOT NULL,
    "baseURL" TEXT NOT NULL DEFAULT 'https://glhf.chat/api/openai/v1',
    "model" TEXT NOT NULL DEFAULT 'hf:meta-llama/Llama-3.3-70B-Instruct',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AIConfig" ("apiKey", "createdAt", "id", "model", "provider", "updatedAt") SELECT "apiKey", "createdAt", "id", "model", "provider", "updatedAt" FROM "AIConfig";
DROP TABLE "AIConfig";
ALTER TABLE "new_AIConfig" RENAME TO "AIConfig";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
