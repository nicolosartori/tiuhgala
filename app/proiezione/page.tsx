import { prisma } from '@/lib/prisma';
import { getHomepageLiveData } from '@/lib/homepage-live';
import { getProjectionImageUrls } from '@/lib/projection-images';
import { ProjectionView } from '@/components/ProjectionView';

export const dynamic = 'force-dynamic';

export default async function ProjectionPage() {
  const [liveData, config, images] = await Promise.all([
    getHomepageLiveData(),
    prisma.appConfig.findUnique({ where: { id: 1 } }),
    getProjectionImageUrls()
  ]);

  return (
    <ProjectionView
      initialData={{
        ...liveData,
        projectionImageRotationSeconds: config?.projectionImageRotationSeconds ?? 20,
        images
      }}
    />
  );
}
