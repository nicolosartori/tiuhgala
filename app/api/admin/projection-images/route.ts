import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import {
  deleteProjectionImage,
  listProjectionImages,
  projectionImageFormats,
  uploadProjectionImage
} from '@/lib/projection-images';

export const runtime = 'nodejs';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const images = await listProjectionImages();
  return NextResponse.json({ images });
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll('files').filter((value): value is File => value instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: 'Selezionare almeno una immagine' }, { status: 400 });
    }

    const invalidFile = files.find((file) => {
      const extension = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`;
      return !projectionImageFormats.includes(extension);
    });

    if (invalidFile) {
      return NextResponse.json({ error: 'Formato immagine non supportato' }, { status: 400 });
    }

    const uploaded = [];
    for (const file of files) {
      uploaded.push(await uploadProjectionImage(file));
    }

    return NextResponse.json({ ok: true, images: uploaded });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Caricamento non riuscito' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    const numericId = Number(id);

    if (!Number.isInteger(numericId) || numericId <= 0) {
      return NextResponse.json({ error: 'Immagine non valida' }, { status: 400 });
    }

    const deleted = await deleteProjectionImage(numericId);
    if (!deleted) {
      return NextResponse.json({ error: 'Immagine non trovata' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Eliminazione non riuscita' },
      { status: 500 }
    );
  }
}
