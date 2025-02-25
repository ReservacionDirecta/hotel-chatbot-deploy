-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AIConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "provider" TEXT NOT NULL DEFAULT 'glhf',
    "apiKey" TEXT NOT NULL,
    "baseURL" TEXT NOT NULL DEFAULT 'https://glhf.chat/api/openai/v1',
    "model" TEXT NOT NULL DEFAULT 'hf:meta-llama/Llama-3.3-70B-Instruct',
    "exchangeRate" TEXT NOT NULL DEFAULT '3.70',
    "customInstructions" TEXT NOT NULL DEFAULT 'Eres un asistente virtual del Hotel Cascade. Cuando menciones precios de habitaciones, debes hacer la conversión de dólares a soles usando el tipo de cambio del día. 
Por ejemplo, si una habitación cuesta $100 USD y el tipo de cambio es 3.70, deberás indicar: "La habitación cuesta $100 USD (S/. 370 soles)".
Siempre muestra ambos precios: en dólares y en soles.',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AIConfig" ("apiKey", "baseURL", "createdAt", "id", "model", "provider", "updatedAt") SELECT "apiKey", "baseURL", "createdAt", "id", "model", "provider", "updatedAt" FROM "AIConfig";
DROP TABLE "AIConfig";
ALTER TABLE "new_AIConfig" RENAME TO "AIConfig";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
