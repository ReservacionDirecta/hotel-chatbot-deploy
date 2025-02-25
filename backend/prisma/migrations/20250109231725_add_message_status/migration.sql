-- AlterTable
ALTER TABLE "Message" ADD COLUMN "status" TEXT DEFAULT 'pending';

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");
