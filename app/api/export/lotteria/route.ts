import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const items = await prisma.lotteryEnvelope.findMany({ orderBy: { number: 'asc' } });

  const rows = ['id,numero,stato,aggiornato_il'];
  items.forEach((e) => rows.push(`${e.id},${e.number},${e.status},${e.updatedAt.toISOString()}`));

  return new NextResponse(rows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="lotteria.csv"'
    }
  });
}
