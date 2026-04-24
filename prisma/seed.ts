import { PrismaClient, EnvelopeStatus, JerseyStatus } from '@prisma/client';
import jerseys from './seed-data.json';

const prisma = new PrismaClient();

async function main() {
  const existingEnvelopes = await prisma.lotteryEnvelope.count();

  if (existingEnvelopes === 0) {
    await prisma.lotteryEnvelope.createMany({
      data: Array.from({ length: 100 }, (_, i) => ({
        number: i + 1,
        status: EnvelopeStatus.DISPONIBILE
      }))
    });
  }

  const existingJerseys = await prisma.jersey.count();

  if (existingJerseys === 0) {
    await prisma.jersey.createMany({
      data: jerseys.map((j) => ({
        playerNumber: j.playerNumber,
        playerSurname: j.playerSurname,
        startingPrice: j.startingPrice,
        currentPrice: j.startingPrice,
        status: JerseyStatus.ATTIVA
      }))
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
