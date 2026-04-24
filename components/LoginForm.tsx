'use client';

import { useState } from 'react';

export function LoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    if (res.ok) {
      window.location.href = '/admin';
      return;
    }

    const data = await res.json();
    setError(data.error || 'Errore login');
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="row">
      <input
        className="input"
        type="password"
        placeholder="Password admin"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button className="button" disabled={loading}>
        {loading ? 'Accesso...' : 'Accedi'}
      </button>
      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
    </form>
  );
}
