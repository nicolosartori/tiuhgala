import { randomUUID } from 'node:crypto';
import { S3Client, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '@/lib/prisma';

export const projectionImageFormats = ['.jpg', '.jpeg', '.png', '.webp'];

type UploadedProjectionImage = {
  id: number;
  originalName: string;
  storageKey: string;
  contentType: string;
  createdAt: string;
  imageUrl: string;
};

function getRegion() {
  return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || '';
}

function getBucket() {
  return process.env.AWS_S3_PROJECTION_BUCKET || process.env.AWS_S3_BUCKET || '';
}

function getPublicBaseUrl() {
  return process.env.AWS_S3_PUBLIC_BASE_URL || '';
}

function getS3Client() {
  return new S3Client({
    region: getRegion() || undefined
  });
}

function encodeKey(key: string) {
  return key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

export function getProjectionImageUrl(storageKey: string) {
  const baseUrl = getPublicBaseUrl();
  const bucket = getBucket();
  const region = getRegion();

  if (baseUrl) {
    return `${baseUrl.replace(/\/$/, '')}/${encodeKey(storageKey)}`;
  }

  if (!bucket || !region) {
    return '';
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${encodeKey(storageKey)}`;
}

function buildStorageKey(originalName: string) {
  const baseName = originalName
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9_-]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'image';

  const extension = originalName.split('.').pop()?.toLowerCase() ?? 'jpg';
  return `projection-images/${Date.now()}-${randomUUID()}-${baseName}.${extension}`;
}

function normalizeContentType(contentType: string | null, fileName: string) {
  if (contentType) return contentType;
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

function ensureConfigured() {
  const bucket = getBucket();
  const region = getRegion();

  if (!bucket || !region) {
    throw new Error('Configurazione AWS mancante per le immagini di proiezione');
  }

  return { bucket, region };
}

export async function listProjectionImages(): Promise<UploadedProjectionImage[]> {
  const images = await prisma.projectionImage.findMany({
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
  });

  return images
    .map((image) => ({
      id: image.id,
      originalName: image.originalName,
      storageKey: image.storageKey,
      contentType: image.contentType,
      createdAt: image.createdAt.toISOString(),
      imageUrl: getProjectionImageUrl(image.storageKey)
    }))
    .filter((image) => image.imageUrl.length > 0);
}

export async function getProjectionImageUrls() {
  const images = await listProjectionImages();
  return images.map((image) => image.imageUrl);
}

export async function uploadProjectionImage(file: File) {
  const { bucket } = ensureConfigured();

  const originalName = file.name.trim();
  const storageKey = buildStorageKey(originalName);
  const contentType = normalizeContentType(file.type, originalName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      Body: buffer,
      ContentType: contentType
    })
  );

  let created;
  try {
    created = await prisma.projectionImage.create({
      data: {
        storageKey,
        originalName,
        contentType
      }
    });
  } catch (error) {
    await getS3Client().send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: storageKey
      })
    );
    throw error;
  }

  return {
    id: created.id,
    originalName: created.originalName,
    storageKey: created.storageKey,
    contentType: created.contentType,
    createdAt: created.createdAt.toISOString(),
    imageUrl: getProjectionImageUrl(created.storageKey)
  };
}

export async function deleteProjectionImage(id: number) {
  const { bucket } = ensureConfigured();
  const image = await prisma.projectionImage.findUnique({ where: { id } });
  if (!image) return false;

  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: image.storageKey
    })
  );

  await prisma.projectionImage.delete({ where: { id } });
  return true;
}
