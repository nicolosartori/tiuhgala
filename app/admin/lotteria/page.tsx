import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AdminLotteryClient } from '@/components/AdminLotteryClient';

export default async function AdminLotteriaPage() {
  if (!(await isAdminAuthenticated())) redirect('/admin');

  const envelopes = await prisma.lotteryEnvelope.findMany({
    include: {
      history: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  return (
    <div className="card">
      <h1>Admin Lotteria</h1>
      <AdminLotteryClient
        envelopes={envelopes.map((e) => ({
          ...e,
          updatedAt: e.updatedAt.toISOString(),
          history: e.history.map((entry) => ({
            ...entry,
            createdAt: entry.createdAt.toISOString()
          }))
        }))}
      />
    </div>
  );
}
