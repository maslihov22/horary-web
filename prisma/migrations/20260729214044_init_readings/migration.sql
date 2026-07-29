-- CreateTable
CREATE TABLE "readings" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "house" INTEGER NOT NULL,
    "askedAt" TIMESTAMP(3) NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "placeLabel" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "reasons" JSONB NOT NULL,
    "timing" TEXT,
    "chart" JSONB NOT NULL,
    "querentPlanet" TEXT NOT NULL,
    "querentSign" TEXT NOT NULL,
    "querentDeg" INTEGER NOT NULL,
    "querentMin" INTEGER NOT NULL,
    "quesitedPlanet" TEXT NOT NULL,
    "quesitedSign" TEXT NOT NULL,
    "quesitedDeg" INTEGER NOT NULL,
    "quesitedMin" INTEGER NOT NULL,
    "narration" TEXT NOT NULL,
    "fallback" BOOLEAN NOT NULL DEFAULT false,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "email" TEXT,
    "stripeSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "readings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "readings_stripeSessionId_key" ON "readings"("stripeSessionId");

-- CreateIndex
CREATE INDEX "readings_email_idx" ON "readings"("email");

-- CreateIndex
CREATE INDEX "readings_createdAt_idx" ON "readings"("createdAt");
