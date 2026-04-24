import { NextResponse } from 'next/server';
import { getHomepageLiveData } from '@/lib/homepage-live';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = await getHomepageLiveData();
  return NextResponse.json(data);
}
