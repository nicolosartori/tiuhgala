'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { HomepageLiveData } from '@/lib/homepage-live';

function formatCHF(value: string) {
  return new Intl.NumberFormat('it-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2
  }).format(Number(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('it-CH', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

export function HomepageLiveDashboard({ initialData }: { initialData: HomepageLiveData }) {
  const [data, setData] = useState(initialData);
  const [view, setView] = useState<'latest' | 'top3'>('latest');
  const [pulseVersion, setPulseVersion] = useState(0);
  const [changedKeys, setChangedKeys] = useState<string[]>([]);
  const previousData = useRef(initialData);

  const changeMap = useMemo(() => new Set(changedKeys), [changedKeys]);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const response = await fetch(`/api/homepage/auction?ts=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) return;
        const nextData: HomepageLiveData = await response.json();
        if (cancelled) return;

        const previous = previousData.current;
        const nextChangedKeys: string[] = [];

        if (previous.lottery.availableCount !== nextData.lottery.availableCount) nextChangedKeys.push('lottery-available');
        if (previous.lottery.reservedCount !== nextData.lottery.reservedCount) nextChangedKeys.push('lottery-reserved');
        if (previous.lottery.soldCount !== nextData.lottery.soldCount) nextChangedKeys.push('lottery-sold');
        if (previous.auction.latestBid?.amount !== nextData.auction.latestBid?.amount) nextChangedKeys.push('auction-latest-amount');

        nextData.auction.topJerseys.forEach((jersey, index) => {
          if (previous.auction.topJerseys[index]?.amount !== jersey.amount) {
            nextChangedKeys.push(`auction-top-${index}`);
          }
        });

        previousData.current = nextData;
        setData(nextData);
        setView((current) => (current === 'latest' ? 'top3' : 'latest'));
        setPulseVersion((current) => current + 1);
        setChangedKeys(nextChangedKeys);

        window.setTimeout(() => {
          if (!cancelled) setChangedKeys([]);
        }, 550);
      } catch {
        return;
      }
    }

    const timeout = window.setTimeout(refresh, data.intervalSeconds * 1000);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [data.intervalSeconds, view]);

  return (
    <div className="dashboard-grid">
      <section className="market-panel lottery-panel">
        <div className="panel-head">
          <div>
            <p className="panel-label">Borsa lotteria</p>
            <h2>Buste disponibili</h2>
          </div>
          <div className={`pulse-dot ${pulseVersion ? 'refresh-burst' : ''}`} key={`lottery-dot-${pulseVersion}`} />
        </div>

        <div className={`market-number ${changeMap.has('lottery-available') ? 'value-flash' : ''}`}>
          {data.lottery.availableCount}
        </div>
        <p className="market-alert">
          {data.lottery.availableCount <= 15 ? 'Le buste stanno terminando' : 'Assicurati la tua busta'}
        </p>

        <div className="market-stats">
          <div className="market-stat">
            <span>Riservate</span>
            <strong className={changeMap.has('lottery-reserved') ? 'value-flash' : ''}>
              {data.lottery.reservedCount}
            </strong>
          </div>
          <div className="market-stat">
            <span>Vendute</span>
            <strong className={changeMap.has('lottery-sold') ? 'value-flash' : ''}>
              {data.lottery.soldCount}
            </strong>
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
            <p className="panel-label">Asta maglie</p>
            <h2>{view === 'latest' ? 'Ultima offerta' : 'Top 3 maglie'}</h2>
          </div>
          <div className={`pulse-dot ${pulseVersion ? 'refresh-burst' : ''}`} key={`auction-dot-${pulseVersion}`} />
        </div>

        {view === 'latest' ? (
          data.auction.latestBid ? (
            <>
              <div className="auction-card">
                <div className="auction-meta">
                  <span>Ultimo rilancio</span>
                  <strong>Maglia #{data.auction.latestBid.jerseyNumber}</strong>
                </div>
                <div className="auction-player">{data.auction.latestBid.playerName}</div>
                <div className={`auction-price ${changeMap.has('auction-latest-amount') ? 'value-flash' : ''}`}>
                  {formatCHF(data.auction.latestBid.amount)}
                </div>
                <div className="auction-timestamp">
                  Offerta registrata alle {formatTime(data.auction.latestBid.createdAt)}
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
          )
        ) : data.auction.topJerseys.length > 0 ? (
          <>
            <div className="top-jerseys-list">
              {data.auction.topJerseys.map((jersey, index) => (
                <div key={jersey.id} className="top-jersey-item">
                  <div>
                    <div className="top-jersey-number">#{jersey.jerseyNumber}</div>
                    <div className="top-jersey-name">{jersey.playerName}</div>
                  </div>
                  <div className={`top-jersey-price ${changeMap.has(`auction-top-${index}`) ? 'value-flash' : ''}`}>
                    {formatCHF(jersey.amount)}
                  </div>
                </div>
              ))}
            </div>

            <div className="market-footer">
              <p>Le maglie piu contese cambiano durante la serata. Controlla la classifica e rilancia.</p>
              <Link href="/asta" className="cta-button">
                Rilancia ora
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="auction-empty">
              {data.auction.hasJerseys ? 'Nessuna offerta registrata finora' : 'Nessuna maglia disponibile al momento'}
            </div>
            <div className="market-footer">
              <p>Apri il tabellone delle maglie per seguire i prossimi rilanci della serata.</p>
              <Link href="/asta" className="cta-button">
                Rilancia ora
              </Link>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
