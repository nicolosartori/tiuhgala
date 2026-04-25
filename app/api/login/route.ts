import { NextResponse } from 'next/server';
import { setAdminSession, verifyAdminPassword } from '@/lib/auth';

export async function POST(req: Request) {
  const { password } = await req.json();

  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: 'Password non valida' }, { status: 401 });
  }

  await setAdminSession(req);
  return NextResponse.json({ ok: true });
}
