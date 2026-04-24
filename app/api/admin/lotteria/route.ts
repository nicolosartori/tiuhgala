import { NextResponse } from 'next/server';
import { EnvelopeStatus } from '@prisma/client';
import { isAdminAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const { id, status, reservedBy } = await req.json();

  if (typeof id !== 'number') {
    return NextResponse.json({ error: 'Busta non valida' }, { status: 400 });
  }

  if (!Object.values(EnvelopeStatus).includes(status)) {
    return NextResponse.json({ error: 'Stato non valido' }, { status: 400 });
  }

  const normalizedReservedBy = typeof reservedBy === 'string' ? reservedBy.trim() : '';

  if (status === EnvelopeStatus.RISERVATA && normalizedReservedBy.length === 0) {
    return NextResponse.json({ error: 'Inserire il nome per una busta riservata' }, { status: 400 });
  }

  const envelope = await prisma.lotteryEnvelope.findUnique({ where: { id } });

  if (!envelope) {
    return NextResponse.json({ error: 'Busta non trovata' }, { status: 404 });
  }

  let nextReservedBy: string | null = envelope.reservedBy;

  if (status === EnvelopeStatus.DISPONIBILE) {
    nextReservedBy = null;
  } else if (status === EnvelopeStatus.RISERVATA) {
    nextReservedBy = normalizedReservedBy;
  } else if (normalizedReservedBy.length > 0) {
    nextReservedBy = normalizedReservedBy;
  }

  const statusChanged = envelope.status !== status;
  const reservationChanged = envelope.reservedBy !== nextReservedBy;

  if (!statusChanged && !reservationChanged) {
    return NextResponse.json({ ok: true });
  }

  await prisma.$transaction(async (tx) => {
    await tx.lotteryEnvelope.update({
      where: { id },
      data: {
        status,
        reservedBy: nextReservedBy
      }
    });

    if (statusChanged) {
      await tx.lotteryEnvelopeHistory.create({
        data: {
          envelopeId: envelope.id,
          previousStatus: envelope.status,
          newStatus: status,
          reservedBy: nextReservedBy
        }
      });
    }
  });

  return NextResponse.json({ ok: true });
}
