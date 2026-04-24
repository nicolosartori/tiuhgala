'use client';

export function LogoutButton() {
  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/admin';
  }

  return (
    <button className="button secondary" onClick={logout}>
      Esci
    </button>
  );
}
