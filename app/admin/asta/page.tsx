import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AdminAuctionClient } from '@/components/AdminAuctionClient';

export default async function AdminAstaPage() {
  if (!(await isAdminAuthenticated())) redirect('/admin');

  const jerseys = await prisma.jersey.findMany({
    include: { bids: { orderBy: { createdAt: 'desc' } } },
    orderBy: { playerNumber: 'asc' }
  });

  return (
    <div className="card">
      <h1>Admin Asta Maglie</h1>
      <AdminAuctionClient
        jerseys={jerseys.map((j) => ({
          ...j,
          startingPrice: j.startingPrice.toString(),
          currentPrice: j.currentPrice.toString(),
          bids: j.bids.map((b) => ({ ...b, amount: b.amount.toString(), createdAt: b.createdAt.toISOString() }))
        }))}
      />
    </div>
  );
}
