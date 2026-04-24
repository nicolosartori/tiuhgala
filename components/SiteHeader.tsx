import Link from 'next/link';

export function SiteHeader() {
  return (
    <>
      <header className="header">Ticino Unihockey – Cena di Gala</header>
      <div className="container">
        <nav className="nav">
          <Link href="/">Home</Link>
          <Link href="/lotteria">Lotteria</Link>
          <Link href="/asta">Asta Maglie</Link>
          <Link href="/admin" className="secondary">Admin</Link>
        </nav>
      </div>
    </>
  );
}
