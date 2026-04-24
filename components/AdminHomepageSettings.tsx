'use client';

import { useState } from 'react';

export function AdminHomepageSettings({ initialInterval }: { initialInterval: number }) {
  const [value, setValue] = useState(String(initialInterval));
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
        body: JSON.stringify({ homepageAuctionRotationSeconds: Number(value) })
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
      <h2>Homepage</h2>
      <label className="row" style={{ maxWidth: 320 }}>
        <span>Intervallo rotazione asta homepage</span>
        <input
          className="input"
          type="number"
          min="5"
          max="300"
          value={value}
          onChange={(event) => setValue(event.target.value)}
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
