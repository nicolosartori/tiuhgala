import { randomUUID } from 'node:crypto';
import { mkdir, access, readdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
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

type ProjectionStorageMode = 'local' | 'aws';

const LOCAL_IMAGE_DIR = path.join(process.cwd(), 'public', 'projection-images');

function getRegion() {
  return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || '';
}

function getBucket() {
  return process.env.AWS_S3_PROJECTION_BUCKET || process.env.AWS_S3_BUCKET || '';
}

function getPublicBaseUrl() {
  return process.env.AWS_S3_PUBLIC_BASE_URL || '';
}

function getConfiguredStorageMode(): ProjectionStorageMode {
  const explicitMode = process.env.PROJECTION_IMAGE_STORAGE?.toLowerCase();
  if (explicitMode === 'local' || explicitMode === 'aws') {
    return explicitMode;
  }

  return getBucket() && getRegion() ? 'aws' : 'local';
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

function buildStorageKey(originalName: string) {
  const baseName =
    originalName
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

function getLocalImagePath(storageKey: string) {
  return path.join(process.cwd(), 'public', storageKey);
}

async function ensureLocalImageDir() {
  await mkdir(LOCAL_IMAGE_DIR, { recursive: true });
}

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export function getProjectionImageUrl(storageKey: string) {
  if (getConfiguredStorageMode() === 'local') {
    return `/${encodeKey(storageKey)}`;
  }

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

async function listLocalProjectionImages(): Promise<UploadedProjectionImage[]> {
  await ensureLocalImageDir();

  const entries = await readdir(LOCAL_IMAGE_DIR, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => projectionImageFormats.includes(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, 'it'));

  const images = await prisma.projectionImage.findMany({
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
  });

  const byStorageKey = new Map(images.map((image) => [image.storageKey, image]));

  return files
    .map((fileName) => {
      const storageKey = `projection-images/${fileName}`;
      const record = byStorageKey.get(storageKey);
      if (!record) {
        return null;
      }

      return {
        id: record.id,
        originalName: record.originalName,
        storageKey: record.storageKey,
        contentType: record.contentType,
        createdAt: record.createdAt.toISOString(),
        imageUrl: getProjectionImageUrl(record.storageKey)
      } satisfies UploadedProjectionImage;
    })
    .filter((image): image is UploadedProjectionImage => Boolean(image))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

async function listAwsProjectionImages(): Promise<UploadedProjectionImage[]> {
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

export async function listProjectionImages(): Promise<UploadedProjectionImage[]> {
  if (getConfiguredStorageMode() === 'local') {
    return listLocalProjectionImages();
  }

  return listAwsProjectionImages();
}

export async function getProjectionImageUrls() {
  const images = await listProjectionImages();
  return images.map((image) => image.imageUrl);
}

async function storeLocalProjectionImage(file: File, storageKey: string) {
  await ensureLocalImageDir();
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(getLocalImagePath(storageKey), buffer);
}

async function removeLocalProjectionImage(storageKey: string) {
  const filePath = getLocalImagePath(storageKey);
  if (await fileExists(filePath)) {
    await unlink(filePath);
  }
}

export async function uploadProjectionImage(file: File) {
  const storageMode = getConfiguredStorageMode();
  const originalName = file.name.trim();
  const storageKey = buildStorageKey(originalName);
  const contentType = normalizeContentType(file.type, originalName);

  if (storageMode === 'local') {
    await storeLocalProjectionImage(file, storageKey);
  } else {
    const { bucket } = ensureAwsConfigured();
    const buffer = Buffer.from(await file.arrayBuffer());
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: storageKey,
        Body: buffer,
        ContentType: contentType
      })
    );
  }

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
    if (storageMode === 'local') {
      await removeLocalProjectionImage(storageKey);
    } else {
      const { bucket } = ensureAwsConfigured();
      await getS3Client().send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: storageKey
        })
      );
    }
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
  const image = await prisma.projectionImage.findUnique({ where: { id } });
  if (!image) return false;

  if (getConfiguredStorageMode() === 'local') {
    await removeLocalProjectionImage(image.storageKey);
  } else {
    const { bucket } = ensureAwsConfigured();
    await getS3Client().send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: image.storageKey
      })
    );
  }

  await prisma.projectionImage.delete({ where: { id } });
  return true;
}

function ensureAwsConfigured() {
  const bucket = getBucket();
  const region = getRegion();

  if (!bucket || !region) {
    throw new Error('Configurazione AWS mancante per le immagini di proiezione');
  }

  return { bucket, region };
}
