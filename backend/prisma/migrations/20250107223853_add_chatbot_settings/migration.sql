/*
  Warnings:

  - You are about to drop the column `aiModel` on the `ChatbotSettings` table. All the data in the column will be lost.
  - You are about to drop the column `enableAutoReply` on the `ChatbotSettings` table. All the data in the column will be lost.
  - You are about to drop the column `greetingMessage` on the `ChatbotSettings` table. All the data in the column will be lost.
  - You are about to drop the column `maxTokens` on the `ChatbotSettings` table. All the data in the column will be lost.
  - You are about to drop the column `offlineMessage` on the `ChatbotSettings` table. All the data in the column will be lost.
  - You are about to drop the column `temperature` on the `ChatbotSettings` table. All the data in the column will be lost.
  - You are about to drop the column `workingHoursEnd` on the `ChatbotSettings` table. All the data in the column will be lost.
  - You are about to drop the column `workingHoursStart` on the `ChatbotSettings` table. All the data in the column will be lost.
  - The primary key for the `HotelSettings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `currency` on the `HotelSettings` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `HotelSettings` table. All the data in the column will be lost.
  - You are about to drop the column `timezone` on the `HotelSettings` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `Message` table. All the data in the column will be lost.
  - The primary key for the `NotificationSettings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `enableEmail` on the `NotificationSettings` table. All the data in the column will be lost.
  - You are about to drop the column `enablePush` on the `NotificationSettings` table. All the data in the column will be lost.
  - You are about to drop the column `enableWhatsapp` on the `NotificationSettings` table. All the data in the column will be lost.
  - You are about to drop the column `notifyOnBooking` on the `NotificationSettings` table. All the data in the column will be lost.
  - You are about to drop the column `notifyOnCheckIn` on the `NotificationSettings` table. All the data in the column will be lost.
  - You are about to drop the column `notifyOnCheckOut` on the `NotificationSettings` table. All the data in the column will be lost.
  - You are about to drop the column `notifyOnMessage` on the `NotificationSettings` table. All the data in the column will be lost.
  - The primary key for the `SecuritySettings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `blockDuration` on the `SecuritySettings` table. All the data in the column will be lost.
  - You are about to drop the column `enableCaptcha` on the `SecuritySettings` table. All the data in the column will be lost.
  - You are about to drop the column `maxAttempts` on the `SecuritySettings` table. All the data in the column will be lost.
  - You are about to drop the column `rateLimit` on the `SecuritySettings` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ChatbotSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "welcomeMessage" TEXT NOT NULL DEFAULT '¡Hola! Bienvenido al Hotel. ¿En qué puedo ayudarte?',
    "language" TEXT NOT NULL DEFAULT 'es',
    "autoReply" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ChatbotSettings" ("id", "updatedAt") SELECT "id", "updatedAt" FROM "ChatbotSettings";
DROP TABLE "ChatbotSettings";
ALTER TABLE "new_ChatbotSettings" RENAME TO "ChatbotSettings";
CREATE TABLE "new_Conversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "whatsappId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastMessage" TEXT,
    "lastMessageAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Conversation" ("createdAt", "id", "lastMessage", "lastMessageAt", "name", "phoneNumber", "status", "updatedAt", "whatsappId") SELECT "createdAt", "id", "lastMessage", "lastMessageAt", "name", "phoneNumber", "status", "updatedAt", "whatsappId" FROM "Conversation";
DROP TABLE "Conversation";
ALTER TABLE "new_Conversation" RENAME TO "Conversation";
CREATE UNIQUE INDEX "Conversation_whatsappId_key" ON "Conversation"("whatsappId");
CREATE TABLE "new_HotelSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "checkInTime" TEXT NOT NULL,
    "checkOutTime" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_HotelSettings" ("address", "checkInTime", "checkOutTime", "email", "id", "name", "phone", "updatedAt") SELECT "address", "checkInTime", "checkOutTime", "email", "id", "name", "phone", "updatedAt" FROM "HotelSettings";
DROP TABLE "HotelSettings";
ALTER TABLE "new_HotelSettings" RENAME TO "HotelSettings";
CREATE TABLE "new_Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "whatsappId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Message" ("content", "conversationId", "createdAt", "id", "sender", "updatedAt", "whatsappId") SELECT "content", "conversationId", "createdAt", "id", "sender", "updatedAt", "whatsappId" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
CREATE UNIQUE INDEX "Message_whatsappId_key" ON "Message"("whatsappId");
CREATE TABLE "new_NotificationSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "phoneEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_NotificationSettings" ("id", "updatedAt") SELECT "id", "updatedAt" FROM "NotificationSettings";
DROP TABLE "NotificationSettings";
ALTER TABLE "new_NotificationSettings" RENAME TO "NotificationSettings";
CREATE TABLE "new_SecuritySettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "sessionTimeout" INTEGER NOT NULL DEFAULT 30,
    "ipWhitelist" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SecuritySettings" ("id", "ipWhitelist", "updatedAt") SELECT "id", "ipWhitelist", "updatedAt" FROM "SecuritySettings";
DROP TABLE "SecuritySettings";
ALTER TABLE "new_SecuritySettings" RENAME TO "SecuritySettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
