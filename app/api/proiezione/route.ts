import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getHomepageLiveData } from '@/lib/homepage-live';
import { getProjectionImageUrls } from '@/lib/projection-images';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [liveData, config, images] = await Promise.all([
    getHomepageLiveData(),
    prisma.appConfig.findUnique({ where: { id: 1 } }),
    getProjectionImageUrls()
  ]);

  return NextResponse.json({
    ...liveData,
    projectionImageRotationSeconds: config?.projectionImageRotationSeconds ?? 20,
    images
  });
}
