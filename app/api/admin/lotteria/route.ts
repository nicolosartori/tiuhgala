import { NextResponse } from 'next/server';
import { EnvelopeStatus } from '@prisma/client';
import { isAdminAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const { id, status } = await req.json();

  if (!Object.values(EnvelopeStatus).includes(status)) {
    return NextResponse.json({ error: 'Stato non valido' }, { status: 400 });
  }

  await prisma.lotteryEnvelope.update({ where: { id }, data: { status } });

  return NextResponse.json({ ok: true });
}
