-- CreateEnum
CREATE TYPE "EnvelopeStatus" AS ENUM ('DISPONIBILE', 'VENDUTA', 'INCASSATA');

-- CreateEnum
CREATE TYPE "JerseyStatus" AS ENUM ('ATTIVA', 'CHIUSA');

-- CreateTable
CREATE TABLE "LotteryEnvelope" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "status" "EnvelopeStatus" NOT NULL DEFAULT 'DISPONIBILE',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LotteryEnvelope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Jersey" (
    "id" SERIAL NOT NULL,
    "playerNumber" INTEGER NOT NULL,
    "playerSurname" TEXT NOT NULL,
    "startingPrice" DECIMAL(10,2) NOT NULL,
    "currentPrice" DECIMAL(10,2) NOT NULL,
    "status" "JerseyStatus" NOT NULL DEFAULT 'ATTIVA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Jersey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" SERIAL NOT NULL,
    "jerseyId" INTEGER NOT NULL,
    "bidderName" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LotteryEnvelope_number_key" ON "LotteryEnvelope"("number");

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_jerseyId_fkey" FOREIGN KEY ("jerseyId") REFERENCES "Jersey"("id") ON DELETE CASCADE ON UPDATE CASCADE;
