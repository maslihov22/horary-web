-- AlterTable
ALTER TABLE "readings" ADD COLUMN     "claimedAt" TIMESTAMP(3),
ADD COLUMN     "telegramChatId" BIGINT;

-- CreateIndex
CREATE INDEX "readings_telegramChatId_idx" ON "readings"("telegramChatId");
