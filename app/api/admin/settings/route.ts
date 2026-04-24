import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const { homepageAuctionRotationSeconds, projectionImageRotationSeconds } = await req.json();
  const homepageValue = Number(homepageAuctionRotationSeconds);
  const projectionValue = Number(projectionImageRotationSeconds);

  if (!Number.isInteger(homepageValue) || homepageValue < 5 || homepageValue > 300) {
    return NextResponse.json({ error: 'Inserire un valore tra 5 e 300 secondi' }, { status: 400 });
  }

  if (!Number.isInteger(projectionValue) || projectionValue < 5 || projectionValue > 300) {
    return NextResponse.json({ error: 'Inserire un valore tra 5 e 300 secondi' }, { status: 400 });
  }

  await prisma.appConfig.upsert({
    where: { id: 1 },
    update: {
      homepageAuctionRotationSeconds: homepageValue,
      projectionImageRotationSeconds: projectionValue
    },
    create: {
      id: 1,
      homepageAuctionRotationSeconds: homepageValue,
      projectionImageRotationSeconds: projectionValue
    }
  });

  return NextResponse.json({ ok: true });
}
