import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="row row-2">
      <section className="card">
        <h1>Benvenuti alla Cena di Gala</h1>
        <p>Gestione live di lotteria e asta maglie del Ticino Unihockey.</p>
        <div className="nav">
          <Link href="/lotteria">Apri Lotteria</Link>
          <Link href="/asta" className="secondary">Apri Asta Maglie</Link>
        </div>
      </section>
      <section className="card">
        <h2>Accesso Operatore</h2>
        <p>Area riservata per gestione evento.</p>
        <div className="nav">
          <Link href="/admin" className="secondary">Vai ad Admin</Link>
        </div>
      </section>
    </div>
  );
}
