'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type ProjectionImage = {
  id: number;
  originalName: string;
  storageKey: string;
  contentType: string;
  createdAt: string;
  imageUrl: string;
};

export function AdminProjectionImages({
  initialImages
}: {
  initialImages: ProjectionImage[];
}) {
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [deleteBusyId, setDeleteBusyId] = useState<number | null>(null);

  async function uploadImages() {
    setBusy(true);
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append('files', file));

      const response = await fetch('/api/admin/projection-images', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? 'Caricamento non riuscito');
        return;
      }

      setSelectedFiles([]);
      setMessage('Immagini caricate');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function deleteImage(id: number) {
    if (!window.confirm('Sei sicuro di voler cancellare questa immagine? Questa operazione non può essere annullata.')) {
      return;
    }

    setDeleteBusyId(id);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/projection-images', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? 'Eliminazione non riuscita');
        return;
      }

      setMessage('Immagine eliminata');
      router.refresh();
    } finally {
      setDeleteBusyId(null);
    }
  }

  return (
    <section className="card row">
      <h2>Immagini proiezione</h2>
      <p className="small">
        Carica qui le immagini per <code>/proiezione</code>. Formati supportati: JPG, PNG, WEBP.
      </p>

      <label className="row" style={{ maxWidth: 520 }}>
        <span>Seleziona immagini</span>
        <input
          className="input"
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          multiple
          onChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []))}
        />
      </label>

      {selectedFiles.length > 0 ? (
        <p className="small">
          Selezionate: {selectedFiles.map((file) => file.name).join(', ')}
        </p>
      ) : null}

      <div className="nav">
        <button type="button" className="button" disabled={busy || selectedFiles.length === 0} onClick={uploadImages}>
          Carica immagini
        </button>
      </div>

      {message ? <p className="small">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <div className="admin-projection-grid">
        {initialImages.length === 0 ? (
          <p className="small">Nessuna immagine caricata al momento.</p>
        ) : (
          initialImages.map((image) => (
            <article key={image.id} className="admin-projection-item">
              <img src={image.imageUrl} alt={image.originalName} className="admin-projection-thumb" />
              <div className="row">
                <strong>{image.originalName}</strong>
                <div className="small">{image.storageKey}</div>
              </div>
              <button
                type="button"
                className="button subtle-danger"
                disabled={deleteBusyId === image.id}
                onClick={() => deleteImage(image.id)}
              >
                Cancella
              </button>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
