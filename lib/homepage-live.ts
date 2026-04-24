import { prisma } from '@/lib/prisma';

export type HomepageLiveData = {
  intervalSeconds: number;
  lottery: {
    availableCount: number;
    reservedCount: number;
    soldCount: number;
  };
  auction: {
    latestBid: {
      jerseyNumber: number;
      playerName: string;
      amount: string;
      createdAt: string;
    } | null;
    topJerseys: Array<{
      id: number;
      jerseyNumber: number;
      playerName: string;
      amount: string;
    }>;
    hasJerseys: boolean;
  };
};

export async function getHomepageLiveData(): Promise<HomepageLiveData> {
  const [config, latestBid, topJerseys, jerseyCount, availableCount, reservedCount, soldCount] = await Promise.all([
    prisma.appConfig.findUnique({ where: { id: 1 } }),
    prisma.bid.findFirst({
      orderBy: { createdAt: 'desc' },
      include: { jersey: true }
    }),
    prisma.jersey.findMany({
      orderBy: [{ currentPrice: 'desc' }, { startingPrice: 'desc' }, { playerNumber: 'asc' }],
      take: 3
    }),
    prisma.jersey.count(),
    prisma.lotteryEnvelope.count({ where: { status: 'DISPONIBILE' } }),
    prisma.lotteryEnvelope.count({ where: { status: 'RISERVATA' } }),
    prisma.lotteryEnvelope.count({ where: { status: 'VENDUTA' } })
  ]);

  return {
    intervalSeconds: config?.homepageAuctionRotationSeconds ?? 30,
    lottery: {
      availableCount,
      reservedCount,
      soldCount
    },
    auction: {
      latestBid: latestBid
        ? {
            jerseyNumber: latestBid.jersey.playerNumber,
            playerName: latestBid.jersey.playerSurname,
            amount: latestBid.amount.toString(),
            createdAt: latestBid.createdAt.toISOString()
          }
        : null,
      topJerseys: topJerseys.map((jersey) => ({
        id: jersey.id,
        jerseyNumber: jersey.playerNumber,
        playerName: jersey.playerSurname,
        amount: jersey.currentPrice.toString()
      })),
      hasJerseys: jerseyCount > 0
    }
  };
}
