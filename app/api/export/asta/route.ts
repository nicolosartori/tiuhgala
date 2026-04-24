import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const jerseys = await prisma.jersey.findMany({
    include: { bids: { orderBy: { createdAt: 'asc' } } },
    orderBy: { playerNumber: 'asc' }
  });

  const rows = ['tipo,maglia_id,numero,cognome,prezzo_iniziale,prezzo_attuale,offerente,importo,timestamp'];

  jerseys.forEach((j) => {
    rows.push(`MAGLIA,${j.id},${j.playerNumber},${j.playerSurname},${j.startingPrice},${j.currentPrice},,,`);
    j.bids.forEach((b) => {
      rows.push(`OFFERTA,${j.id},${j.playerNumber},${j.playerSurname},${j.startingPrice},${j.currentPrice},${b.bidderName},${b.amount},${b.createdAt.toISOString()}`);
    });
  });

  return new NextResponse(rows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="asta_maglie.csv"'
    }
  });
}
