-- Single-use token that grants the ownership cookie to a browser arriving
-- from the bot. A link alone proves nothing about who opened it.
ALTER TABLE "readings" ADD COLUMN "accessToken" TEXT;
ALTER TABLE "readings" ADD COLUMN "accessExpires" TIMESTAMP(3);

CREATE UNIQUE INDEX "readings_accessToken_key" ON "readings"("accessToken");
