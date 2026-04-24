'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { HomepageLiveData } from '@/lib/homepage-live';

type ProjectionData = HomepageLiveData & {
  projectionImageRotationSeconds: number;
  images: string[];
};

type ImageLayout = 'placeholder' | 'single' | 'double' | 'quad';

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

function pickUniqueImages(images: string[], count: number, recentImages: string[]) {
  if (images.length <= count) return images.slice(0, count);

  const pool = images.filter((image) => !recentImages.includes(image));
  const source = pool.length >= count ? pool : images;
  const shuffled = [...source].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function chooseImageSet(images: string[], recentImages: string[]) {
  if (images.length === 0) {
    return { layout: 'placeholder' as const, items: [] as string[] };
  }

  const eligibleLayouts: ImageLayout[] = ['single'];
  if (images.length >= 2) eligibleLayouts.push('double');
  if (images.length >= 4) eligibleLayouts.push('quad');

  const layout = eligibleLayouts[Math.floor(Math.random() * eligibleLayouts.length)];
  const count = layout === 'single' ? 1 : layout === 'double' ? 2 : 4;

  return {
    layout,
    items: pickUniqueImages(images, count, recentImages)
  };
}

export function ProjectionView({ initialData }: { initialData: ProjectionData }) {
  const [data, setData] = useState(initialData);
  const [auctionView, setAuctionView] = useState<'latest' | 'top3'>('latest');
  const [pulseVersion, setPulseVersion] = useState(0);
  const [changedKeys, setChangedKeys] = useState<string[]>([]);
  const [imageLayout, setImageLayout] = useState<ImageLayout>(() =>
    initialData.images.length > 0 ? 'single' : 'placeholder'
  );
  const [displayedImages, setDisplayedImages] = useState<string[]>(() =>
    initialData.images.length > 0 ? [initialData.images[0]] : []
  );
  const previousData = useRef(initialData);
  const recentImages = useRef<string[]>(displayedImages);

  const changeMap = useMemo(() => new Set(changedKeys), [changedKeys]);

  function applyLiveChanges(nextData: ProjectionData, toggleAuctionView: boolean) {
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
    setPulseVersion((current) => current + 1);
    setChangedKeys(nextChangedKeys);

    if (toggleAuctionView) {
      setAuctionView((current) => (current === 'latest' ? 'top3' : 'latest'));
    }

    window.setTimeout(() => setChangedKeys([]), 550);
  }

  useEffect(() => {
    let cancelled = false;

    async function refreshLiveData() {
      try {
        const response = await fetch(`/api/proiezione?ts=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) return;
        const nextData: ProjectionData = await response.json();
        if (cancelled) return;
        applyLiveChanges(nextData, true);
      } catch {
        return;
      }
    }

    const timeout = window.setTimeout(refreshLiveData, data.intervalSeconds * 1000);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [auctionView, data.intervalSeconds]);

  useEffect(() => {
    let cancelled = false;

    async function rotateImages() {
      try {
        const response = await fetch(`/api/proiezione?ts=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) return;
        const nextData: ProjectionData = await response.json();
        if (cancelled) return;

        applyLiveChanges(nextData, false);

        const nextSelection = chooseImageSet(nextData.images, recentImages.current);
        recentImages.current = nextSelection.items;
        setImageLayout(nextSelection.layout);
        setDisplayedImages(nextSelection.items);
      } catch {
        return;
      }
    }

    const timeout = window.setTimeout(rotateImages, data.projectionImageRotationSeconds * 1000);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [data.projectionImageRotationSeconds, imageLayout]);

  return (
    <div className="projection-page">
      <section className="projection-sidebar">
        <div className="projection-brand card">
          <img
            src="https://www.ticinounihockey.ch/upload/multimedia/2020.05.14.15.40.423522.png"
            alt="Ticino Unihockey"
            className="projection-logo"
          />
          <div className="projection-title">Cena di Gala 2026</div>
        </div>

        <section className="projection-panel lottery-panel">
          <div className="panel-head">
            <div>
              <p className="panel-label">Borsa lotteria</p>
              <h2>Buste disponibili</h2>
            </div>
            <div className={`pulse-dot ${pulseVersion ? 'refresh-burst' : ''}`} key={`projection-lottery-${pulseVersion}`} />
          </div>

          <div className={`market-number ${changeMap.has('lottery-available') ? 'value-flash' : ''}`}>
            {data.lottery.availableCount}
          </div>
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
        </section>

        <section className="projection-panel auction-panel">
          <div className="panel-head">
            <div>
              <p className="panel-label">Asta maglie</p>
              <h2>{auctionView === 'latest' ? 'Ultima offerta' : 'Top 3 maglie'}</h2>
            </div>
            <div className={`pulse-dot ${pulseVersion ? 'refresh-burst' : ''}`} key={`projection-auction-${pulseVersion}`} />
          </div>

          {auctionView === 'latest' ? (
            data.auction.latestBid ? (
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
            ) : (
              <div className="auction-empty">Nessuna offerta registrata finora</div>
            )
          ) : data.auction.topJerseys.length > 0 ? (
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
          ) : (
            <div className="auction-empty">
              {data.auction.hasJerseys ? 'Nessuna offerta registrata finora' : 'Nessuna maglia disponibile al momento'}
            </div>
          )}
        </section>
      </section>

      <section className="projection-gallery">
        {imageLayout === 'placeholder' ? (
          <div className="projection-placeholder">Le immagini della serata appariranno qui</div>
        ) : (
          <div className={`projection-image-grid layout-${imageLayout}`}>
            {displayedImages.map((imageUrl) => (
              <div key={`${imageLayout}-${imageUrl}`} className="projection-image-frame">
                <img src={imageUrl} alt="" className="projection-image" />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
