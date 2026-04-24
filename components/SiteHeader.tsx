import Link from 'next/link';

export function SiteHeader() {
  return (
    <>
      <header className="header header-auth">
        <div className="container header-auth-inner">
          <Link href="/" className="header-logo-link" aria-label="Home">
            <img
              src="https://www.ticinounihockey.ch/upload/multimedia/2020.05.14.15.40.423522.png"
              alt="Ticino Unihockey"
              className="header-logo"
            />
          </Link>
          <div className="header-title">Ticino Unihockey – Cena di Gala</div>
        </div>
      </header>
      <div className="container">
        <nav className="nav">
          <Link href="/">Home</Link>
          <Link href="/admin/lotteria">Admin Lotteria</Link>
          <Link href="/admin/asta">Admin Asta Maglie</Link>
        </nav>
      </div>
    </>
  );
}
