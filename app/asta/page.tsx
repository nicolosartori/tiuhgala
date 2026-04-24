import { prisma } from '@/lib/prisma';
import { formatCHF } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AstaPage() {
  const jerseys = await prisma.jersey.findMany({ orderBy: [{ playerNumber: 'asc' }] });

  return (
    <div className="card">
      <h1>Asta Silenziosa Maglie</h1>
      <table className="table">
        <thead>
          <tr>
            <th>N°</th>
            <th>Cognome</th>
            <th>Prezzo attuale</th>
          </tr>
        </thead>
        <tbody>
          {jerseys.map((j) => (
            <tr key={j.id}>
              <td className="big-number">{j.playerNumber}</td>
              <td>{j.playerSurname}</td>
              <td>{formatCHF(j.currentPrice.toString())}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
