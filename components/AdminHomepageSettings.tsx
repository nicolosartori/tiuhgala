'use client';

import { useState } from 'react';

type AdminHomepageSettingsProps = {
  initialHomepageInterval: number;
  initialProjectionInterval: number;
};

export function AdminHomepageSettings({
  initialHomepageInterval,
  initialProjectionInterval
}: AdminHomepageSettingsProps) {
  const [homepageValue, setHomepageValue] = useState(String(initialHomepageInterval));
  const [projectionValue, setProjectionValue] = useState(String(initialProjectionInterval));
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homepageAuctionRotationSeconds: Number(homepageValue),
          projectionImageRotationSeconds: Number(projectionValue)
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? 'Salvataggio non riuscito');
        return;
      }

      setMessage('Intervallo aggiornato');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card row">
      <h2>Impostazioni homepage e proiezione</h2>
      <label className="row" style={{ maxWidth: 320 }}>
        <span>Intervallo aggiornamento homepage</span>
        <input
          className="input"
          type="number"
          min="5"
          max="300"
          value={homepageValue}
          onChange={(event) => setHomepageValue(event.target.value)}
        />
      </label>
      <label className="row" style={{ maxWidth: 320 }}>
        <span>Intervallo rotazione immagini proiezione</span>
        <input
          className="input"
          type="number"
          min="5"
          max="300"
          value={projectionValue}
          onChange={(event) => setProjectionValue(event.target.value)}
        />
      </label>
      <div className="small">Secondi</div>
      <div className="nav">
        <button type="button" className="button" disabled={saving} onClick={save}>
          Salva
        </button>
      </div>
      {message ? <p className="small">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
    </section>
  );
}
