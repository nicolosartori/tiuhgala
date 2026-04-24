import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function LotteriaPage() {
  const envelopes = await prisma.lotteryEnvelope.findMany({
    where: { status: 'DISPONIBILE' },
    orderBy: { number: 'asc' }
  });

  return (
    <div className="card">
      <h1>Lotteria – Buste 1-100</h1>
      <p className="small">Sono visibili solo le buste ancora disponibili.</p>
      <div className="grid-envelope">
        {envelopes.map((e) => (
          <div key={e.id} className="envelope disponibile">
            <div>{e.number}</div>
          </div>
        ))}
      </div>
      {envelopes.length === 0 ? <p className="small">Nessuna busta disponibile al momento.</p> : null}
    </div>
  );
}
