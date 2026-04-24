import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/auth';

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const { jerseyId, bidderName, amount } = await req.json();

  if (!jerseyId || !bidderName || !amount) {
    return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
  }

  const jersey = await prisma.jersey.findUnique({ where: { id: Number(jerseyId) } });
  if (!jersey) return NextResponse.json({ error: 'Maglia non trovata' }, { status: 404 });

  const numericAmount = Number(amount);
  const current = Number(jersey.currentPrice);

  if (Number.isNaN(numericAmount) || numericAmount <= current) {
    return NextResponse.json({ error: `Offerta deve essere maggiore di CHF ${current.toFixed(2)}` }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.bid.create({
      data: {
        jerseyId: Number(jerseyId),
        bidderName: bidderName.trim(),
        amount: numericAmount
      }
    }),
    prisma.jersey.update({
      where: { id: Number(jerseyId) },
      data: { currentPrice: numericAmount }
    })
  ]);

  return NextResponse.json({ ok: true });
}

export async function PUT(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const { playerNumber, playerSurname, startingPrice } = await req.json();

  const numericNumber = Number(playerNumber);
  const numericPrice = Number(startingPrice);
  const cleanSurname = String(playerSurname || '').trim();

  if (!numericNumber || !cleanSurname || !numericPrice) {
    return NextResponse.json({ error: 'Compilare tutti i campi' }, { status: 400 });
  }

  if (!Number.isInteger(numericNumber) || numericNumber <= 0) {
    return NextResponse.json({ error: 'Numero maglia non valido' }, { status: 400 });
  }

  if (Number.isNaN(numericPrice) || numericPrice <= 0) {
    return NextResponse.json({ error: 'Prezzo iniziale non valido' }, { status: 400 });
  }

  const existing = await prisma.jersey.findFirst({
    where: { playerNumber: numericNumber }
  });

  if (existing) {
    return NextResponse.json({ error: 'Esiste gia una maglia con questo numero' }, { status: 400 });
  }

  await prisma.jersey.create({
    data: {
      playerNumber: numericNumber,
      playerSurname: cleanSurname,
      startingPrice: numericPrice,
      currentPrice: numericPrice
    }
  });

  return NextResponse.json({ ok: true });
}
