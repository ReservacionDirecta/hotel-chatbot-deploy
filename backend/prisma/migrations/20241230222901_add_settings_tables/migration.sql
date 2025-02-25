/*
  Warnings:

  - The primary key for the `ChatbotSettings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `autoResponse` on the `ChatbotSettings` table. All the data in the column will be lost.
  - You are about to drop the column `botName` on the `ChatbotSettings` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `ChatbotSettings` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `ChatbotSettings` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `ChatbotSettings` table. All the data in the column will be lost.
  - You are about to drop the column `maxConversationLength` on the `ChatbotSettings` table. All the data in the column will be lost.
  - You are about to drop the column `personality` on the `ChatbotSettings` table. All the data in the column will be lost.
  - You are about to drop the column `responseTime` on the `ChatbotSettings` table. All the data in the column will be lost.
  - You are about to drop the column `welcomeMessage` on the `ChatbotSettings` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `ChatbotSettings` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `HotelSettings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `HotelSettings` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `HotelSettings` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `HotelSettings` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `NotificationSettings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `NotificationSettings` table. All the data in the column will be lost.
  - You are about to drop the column `desktopNotifications` on the `NotificationSettings` table. All the data in the column will be lost.
  - You are about to drop the column `emailFrequency` on the `NotificationSettings` table. All the data in the column will be lost.
  - You are about to drop the column `emailNotifications` on the `NotificationSettings` table. All the data in the column will be lost.
  - You are about to drop the column `emailRecipients` on the `NotificationSettings` table. All the data in the column will be lost.
  - You are about to drop the column `notificationSound` on the `NotificationSettings` table. All the data in the column will be lost.
  - You are about to drop the column `notificationTypes` on the `NotificationSettings` table. All the data in the column will be lost.
  - You are about to drop the column `pushNotifications` on the `NotificationSettings` table. All the data in the column will be lost.
  - You are about to drop the column `quietHoursEnd` on the `NotificationSettings` table. All the data in the column will be lost.
  - You are about to drop the column `quietHoursStart` on the `NotificationSettings` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `NotificationSettings` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `SecuritySettings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `autoLogout` on the `SecuritySettings` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `SecuritySettings` table. All the data in the column will be lost.
  - You are about to drop the column `maxLoginAttempts` on the `SecuritySettings` table. All the data in the column will be lost.
  - You are about to drop the column `passwordComplexity` on the `SecuritySettings` table. All the data in the column will be lost.
  - You are about to drop the column `passwordExpiration` on the `SecuritySettings` table. All the data in the column will be lost.
  - You are about to drop the column `securityLevel` on the `SecuritySettings` table. All the data in the column will be lost.
  - You are about to drop the column `sessionTimeout` on the `SecuritySettings` table. All the data in the column will be lost.
  - You are about to drop the column `twoFactorAuth` on the `SecuritySettings` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `SecuritySettings` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ChatbotSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "enableAutoReply" BOOLEAN NOT NULL DEFAULT true,
    "greetingMessage" TEXT NOT NULL DEFAULT '¡Bienvenido al Hotel Cascade! ¿En qué puedo ayudarte?',
    "workingHoursStart" TEXT NOT NULL DEFAULT '08:00',
    "workingHoursEnd" TEXT NOT NULL DEFAULT '22:00',
    "offlineMessage" TEXT NOT NULL DEFAULT 'En este momento estamos fuera de horario. Te responderemos en cuanto sea posible.',
    "aiModel" TEXT NOT NULL DEFAULT 'gpt-3.5-turbo',
    "temperature" REAL NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 150,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ChatbotSettings" ("id", "updatedAt") SELECT "id", "updatedAt" FROM "ChatbotSettings";
DROP TABLE "ChatbotSettings";
ALTER TABLE "new_ChatbotSettings" RENAME TO "ChatbotSettings";
CREATE TABLE "new_HotelSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "name" TEXT NOT NULL DEFAULT 'Hotel Cascade',
    "address" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "checkInTime" TEXT NOT NULL DEFAULT '15:00',
    "checkOutTime" TEXT NOT NULL DEFAULT '12:00',
    "timezone" TEXT NOT NULL DEFAULT 'America/Mexico_City',
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "language" TEXT NOT NULL DEFAULT 'es',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_HotelSettings" ("address", "email", "id", "name", "phone", "updatedAt") SELECT coalesce("address", '') AS "address", coalesce("email", '') AS "email", "id", "name", coalesce("phone", '') AS "phone", "updatedAt" FROM "HotelSettings";
DROP TABLE "HotelSettings";
ALTER TABLE "new_HotelSettings" RENAME TO "HotelSettings";
CREATE TABLE "new_NotificationSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "enableEmail" BOOLEAN NOT NULL DEFAULT true,
    "enableWhatsapp" BOOLEAN NOT NULL DEFAULT true,
    "enablePush" BOOLEAN NOT NULL DEFAULT false,
    "notifyOnBooking" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnCheckIn" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnCheckOut" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnMessage" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_NotificationSettings" ("id", "updatedAt") SELECT "id", "updatedAt" FROM "NotificationSettings";
DROP TABLE "NotificationSettings";
ALTER TABLE "new_NotificationSettings" RENAME TO "NotificationSettings";
CREATE TABLE "new_SecuritySettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "rateLimit" INTEGER NOT NULL DEFAULT 100,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "blockDuration" INTEGER NOT NULL DEFAULT 15,
    "ipWhitelist" TEXT NOT NULL DEFAULT '[]',
    "enableCaptcha" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SecuritySettings" ("id", "ipWhitelist", "updatedAt") SELECT "id", coalesce("ipWhitelist", '[]') AS "ipWhitelist", "updatedAt" FROM "SecuritySettings";
DROP TABLE "SecuritySettings";
ALTER TABLE "new_SecuritySettings" RENAME TO "SecuritySettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
