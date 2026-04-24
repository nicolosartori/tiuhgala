import { prisma } from '@/lib/prisma';
import { envelopeStatusLabel } from '@/lib/format';

export default async function LotteriaPage() {
  const envelopes = await prisma.lotteryEnvelope.findMany({ orderBy: { number: 'asc' } });

  return (
    <div className="card">
      <h1>Lotteria – Buste 1-100</h1>
      <p className="small">Stato aggiornato in tempo reale.</p>
      <div className="grid-envelope">
        {envelopes.map((e) => (
          <div key={e.id} className={`envelope ${envelopeStatusLabel(e.status)}`}>
            <div>{e.number}</div>
            <div className="small">{envelopeStatusLabel(e.status)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
