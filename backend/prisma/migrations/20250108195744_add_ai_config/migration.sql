-- CreateTable
CREATE TABLE "AIConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "provider" TEXT NOT NULL DEFAULT 'glhf',
    "apiKey" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'hf:meta-llama/Llama-3.3-70B-Instruct',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
