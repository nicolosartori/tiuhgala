CREATE TYPE "EnvelopeStatus_new" AS ENUM ('DISPONIBILE', 'RISERVATA', 'VENDUTA');

ALTER TABLE "LotteryEnvelope"
ADD COLUMN "reservedBy" TEXT;

ALTER TABLE "LotteryEnvelope"
ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "LotteryEnvelope"
ALTER COLUMN "status" TYPE "EnvelopeStatus_new"
USING (
  CASE
    WHEN "status"::text = 'INCASSATA' THEN 'VENDUTA'::"EnvelopeStatus_new"
    WHEN "status"::text = 'VENDUTA' THEN 'VENDUTA'::"EnvelopeStatus_new"
    ELSE 'DISPONIBILE'::"EnvelopeStatus_new"
  END
);

ALTER TABLE "LotteryEnvelope"
ALTER COLUMN "status" SET DEFAULT 'DISPONIBILE';

ALTER TYPE "EnvelopeStatus" RENAME TO "EnvelopeStatus_old";
ALTER TYPE "EnvelopeStatus_new" RENAME TO "EnvelopeStatus";
DROP TYPE "EnvelopeStatus_old";

CREATE TABLE "LotteryEnvelopeHistory" (
    "id" SERIAL NOT NULL,
    "envelopeId" INTEGER NOT NULL,
    "previousStatus" "EnvelopeStatus" NOT NULL,
    "newStatus" "EnvelopeStatus" NOT NULL,
    "reservedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LotteryEnvelopeHistory_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "LotteryEnvelopeHistory"
ADD CONSTRAINT "LotteryEnvelopeHistory_envelopeId_fkey"
FOREIGN KEY ("envelopeId") REFERENCES "LotteryEnvelope"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "LotteryEnvelopeHistory_envelopeId_createdAt_idx"
ON "LotteryEnvelopeHistory"("envelopeId", "createdAt");
