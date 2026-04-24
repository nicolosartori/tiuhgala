import { readdir } from 'node:fs/promises';
import path from 'node:path';

const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

export async function getProjectionImageUrls() {
  const imageDirectory = path.join(process.cwd(), 'public', 'projection-images');

  try {
    const entries = await readdir(imageDirectory, { withFileTypes: true });

    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => SUPPORTED_EXTENSIONS.has(path.extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, 'it'))
      .map((name) => `/projection-images/${encodeURIComponent(name)}`);
  } catch {
    return [];
  }
}

export const projectionImageFormats = ['.jpg', '.jpeg', '.png', '.webp'];
