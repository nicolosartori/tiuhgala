import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatCHF } from '@/lib/format';

export const dynamic = 'force-dynamic';

function formatTime(value: Date) {
  return new Intl.DateTimeFormat('it-CH', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(value);
}

export default async function HomePage() {
  const [availableCount, reservedCount, soldCount, latestBid] = await Promise.all([
    prisma.lotteryEnvelope.count({ where: { status: 'DISPONIBILE' } }),
    prisma.lotteryEnvelope.count({ where: { status: 'RISERVATA' } }),
    prisma.lotteryEnvelope.count({ where: { status: 'VENDUTA' } }),
    prisma.bid.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        jersey: true
      }
    })
  ]);

  const totalCount = availableCount + reservedCount + soldCount;

  return (
    <div className="home-dashboard-page dashboard-shell">
      <section className="hero-board">
        <div className="hero-copy">
          <p className="hero-kicker">Cena di Gala Ticino Unihockey</p>
          <h1>La serata e in movimento. Lotteria e asta aggiornate in tempo reale.</h1>
          <p className="hero-text">
            Segui l&apos;andamento delle buste disponibili e l&apos;ultimo rilancio sulle maglie.
            Ogni minuto conta.
          </p>
        </div>
        <div className="ticker-strip">
          <div className="ticker-item">
            <span>Lotteria</span>
            <strong>{availableCount} disponibili</strong>
          </div>
          <div className="ticker-item">
            <span>Maglie attive</span>
            <strong>Ultimo update live</strong>
          </div>
          <div className="ticker-item">
            <span>Ritmo serata</span>
            <strong>Partecipa ora</strong>
          </div>
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="market-panel lottery-panel">
          <div className="panel-head">
            <div>
              <p className="panel-label">Borsa lotteria</p>
              <h2>Buste disponibili</h2>
            </div>
            <div className="pulse-dot" />
          </div>

          <div className="market-number">{availableCount}</div>
          <p className="market-alert">
            {availableCount <= 15 ? 'Le buste stanno terminando' : 'Assicurati la tua busta'}
          </p>

          <div className="market-stats">
            <div className="market-stat">
              <span>Totali</span>
              <strong>{totalCount}</strong>
            </div>
            <div className="market-stat">
              <span>Riservate</span>
              <strong>{reservedCount}</strong>
            </div>
            <div className="market-stat">
              <span>Vendute</span>
              <strong>{soldCount}</strong>
            </div>
          </div>

          <div className="market-footer">
            <p>Le disponibilita cambiano durante la serata. Non aspettare troppo.</p>
            <Link href="/lotteria" className="cta-button">
              Partecipa alla lotteria
            </Link>
          </div>
        </section>

        <section className="market-panel auction-panel">
          <div className="panel-head">
            <div>
              <p className="panel-label">Mercato maglie</p>
              <h2>Ultima offerta</h2>
            </div>
            <div className="pulse-dot" />
          </div>

          {latestBid ? (
            <>
              <div className="auction-card">
                <div className="auction-meta">
                  <span>Nuovo rilancio</span>
                  <strong>Maglia #{latestBid.jersey.playerNumber}</strong>
                </div>
                <div className="auction-player">{latestBid.jersey.playerSurname}</div>
                <div className="auction-price">{formatCHF(latestBid.amount.toString())}</div>
                <div className="auction-timestamp">
                  Offerta registrata alle {formatTime(latestBid.createdAt)}
                </div>
              </div>

              <div className="market-footer">
                <p>Il tabellone cambia a ogni rilancio. Controlla la maglia e supera l&apos;offerta.</p>
                <Link href="/asta" className="cta-button">
                  Rilancia ora
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="auction-empty">Nessuna offerta registrata finora</div>
              <div className="market-footer">
                <p>Apri il tabellone delle maglie e fai partire il primo rilancio della serata.</p>
                <Link href="/asta" className="cta-button">
                  Rilancia ora
                </Link>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
