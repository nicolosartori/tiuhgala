import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const { homepageAuctionRotationSeconds } = await req.json();
  const value = Number(homepageAuctionRotationSeconds);

  if (!Number.isInteger(value) || value < 5 || value > 300) {
    return NextResponse.json({ error: 'Inserire un valore tra 5 e 300 secondi' }, { status: 400 });
  }

  await prisma.appConfig.upsert({
    where: { id: 1 },
    update: { homepageAuctionRotationSeconds: value },
    create: { id: 1, homepageAuctionRotationSeconds: value }
  });

  return NextResponse.json({ ok: true });
}
