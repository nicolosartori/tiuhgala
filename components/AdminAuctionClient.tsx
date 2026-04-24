'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Bid = { id: number; bidderName: string; amount: string; createdAt: string };
type Jersey = {
  id: number;
  playerNumber: number;
  playerSurname: string;
  startingPrice: string;
  currentPrice: string;
  status: 'ATTIVA' | 'CHIUSA';
  bids: Bid[];
};

type CreateForm = {
  playerNumber: string;
  playerSurname: string;
  startingPrice: string;
};

const emptyCreateForm: CreateForm = {
  playerNumber: '',
  playerSurname: '',
  startingPrice: ''
};

function formatCHF(value: string) {
  return `CHF ${Number(value).toFixed(2)}`;
}

function formatBidTime(value: string) {
  return new Intl.DateTimeFormat('it-CH', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function AdminAuctionClient({ jerseys }: { jerseys: Jersey[] }) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(emptyCreateForm);
  const [createError, setCreateError] = useState('');
  const [bidErrors, setBidErrors] = useState<Record<number, string>>({});
  const [deleteError, setDeleteError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const sortedJerseys = [...jerseys].sort((a, b) => a.playerNumber - b.playerNumber);

  const normalizedSearch = searchValue.trim().toLowerCase();
  const exactNumberMatch =
    normalizedSearch.length > 0 && /^\d+$/.test(normalizedSearch)
      ? sortedJerseys.find((jersey) => jersey.playerNumber === Number(normalizedSearch)) ?? null
      : null;

  const filteredJerseys = normalizedSearch.length
    ? sortedJerseys.filter((jersey) => {
        return (
          String(jersey.playerNumber).includes(normalizedSearch) ||
          jersey.playerSurname.toLowerCase().includes(normalizedSearch)
        );
      })
    : sortedJerseys;

  const activeJersey =
    exactNumberMatch ??
    (normalizedSearch.length === 0
      ? sortedJerseys.find((jersey) => jersey.id === selectedId) ?? null
      : null);

  async function submitBid(formData: FormData, jerseyId: number) {
    setBusy(`bid-${jerseyId}`);
    setBidErrors((current) => ({ ...current, [jerseyId]: '' }));

    const bidderName = String(formData.get('bidderName') || '').trim();
    const amount = Number(formData.get('amount'));

    try {
      const res = await fetch('/api/admin/asta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jerseyId, bidderName, amount })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setBidErrors((current) => ({
          ...current,
          [jerseyId]: data?.error ?? 'Errore inserimento offerta'
        }));
        return;
      }

      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function createJersey() {
    setCreateError('');

    const payload = {
      playerNumber: Number(createForm.playerNumber),
      playerSurname: createForm.playerSurname.trim(),
      startingPrice: Number(createForm.startingPrice)
    };

    if (!payload.playerNumber || !payload.playerSurname || !payload.startingPrice) {
      setCreateError('Compilare tutti i campi');
      return;
    }

    if (payload.startingPrice <= 0) {
      setCreateError('Il prezzo iniziale deve essere maggiore di zero');
      return;
    }

    setBusy('create');

    try {
      const res = await fetch('/api/admin/asta', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setCreateError(data?.error ?? 'Errore salvataggio maglia');
        return;
      }

      setCreateOpen(false);
      setCreateForm(emptyCreateForm);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function deleteJersey(jersey: Jersey) {
    setDeleteError('');

    const confirmed = window.confirm(
      'Sei sicuro di voler cancellare questa maglia? Questa operazione non può essere annullata.'
    );

    if (!confirmed) return;

    setBusy(`delete-${jersey.id}`);

    try {
      const res = await fetch('/api/admin/asta', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jerseyId: jersey.id })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setDeleteError(data?.error ?? 'Errore cancellazione maglia');
        return;
      }

      setSelectedId((current) => (current === jersey.id ? null : current));
      setSearchValue((current) =>
        current.trim() === String(jersey.playerNumber) || current.trim().toLowerCase() === jersey.playerSurname.toLowerCase()
          ? ''
          : current
      );
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="row auction-admin-shell">
      <section className="card row auction-toolbar">
        <label className="row">
          <span>Cerca maglia</span>
          <input
            className="input lookup-input"
            value={searchValue}
            onChange={(event) => {
              setSearchValue(event.target.value);
              if (event.target.value.trim() === '') setSelectedId(null);
            }}
            placeholder="Cerca per numero o nome giocatore"
            inputMode="search"
          />
        </label>

        <div className="nav">
          <button
            type="button"
            className="button"
            onClick={() => {
              setCreateOpen(true);
              setCreateError('');
            }}
          >
            Aggiungi maglia
          </button>
        </div>
      </section>

      {createOpen ? (
        <section className="card row create-jersey-card">
          <h2>Aggiungi maglia</h2>
          <div className="row row-3">
            <label className="row">
              <span>Numero</span>
              <input
                className="input"
                type="number"
                min="1"
                value={createForm.playerNumber}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, playerNumber: event.target.value }))
                }
              />
            </label>
            <label className="row">
              <span>Giocatore</span>
              <input
                className="input"
                value={createForm.playerSurname}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, playerSurname: event.target.value }))
                }
              />
            </label>
            <label className="row">
              <span>Prezzo iniziale</span>
              <input
                className="input"
                type="number"
                step="0.01"
                min="0.01"
                value={createForm.startingPrice}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, startingPrice: event.target.value }))
                }
              />
            </label>
          </div>
          {createError ? <p className="error-text">{createError}</p> : null}
          <div className="nav">
            <button type="button" className="button" disabled={busy === 'create'} onClick={createJersey}>
              Salva
            </button>
            <button
              type="button"
              className="button secondary"
              disabled={busy === 'create'}
              onClick={() => {
                setCreateOpen(false);
                setCreateForm(emptyCreateForm);
                setCreateError('');
              }}
            >
              Annulla
            </button>
          </div>
        </section>
      ) : null}

      {activeJersey ? (
        <section className="card row auction-detail-card">
          <div className="auction-detail-header">
            <div>
              <p className="small">Dettaglio maglia</p>
              <h2>
                #{activeJersey.playerNumber} - {activeJersey.playerSurname}
              </h2>
            </div>
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                setSelectedId(null);
                setSearchValue('');
              }}
            >
              Torna alla lista
            </button>
          </div>
          <div className="auction-detail-actions">
            <button
              type="button"
              className="button subtle-danger"
              disabled={busy === `delete-${activeJersey.id}`}
              onClick={() => deleteJersey(activeJersey)}
            >
              Cancella maglia
            </button>
          </div>

          <div className="auction-detail-metrics">
            <div className="card">
              <div className="small">Prezzo iniziale</div>
              <div className="big-number">{formatCHF(activeJersey.startingPrice)}</div>
            </div>
            <div className="card">
              <div className="small">Offerta piu alta</div>
              <div className="big-number">{formatCHF(activeJersey.currentPrice)}</div>
            </div>
          </div>

          <form
            className="row row-3 bid-form-card"
            action={(formData) => submitBid(formData, activeJersey.id)}
          >
            <input className="input" name="bidderName" placeholder="Nome offerente" required />
            <input
              className="input"
              name="amount"
              type="number"
              step="0.01"
              min={(Number(activeJersey.currentPrice) + 0.01).toFixed(2)}
              placeholder="Importo"
              required
            />
            <button className="button" type="submit" disabled={busy === `bid-${activeJersey.id}`}>
              Aggiungi offerta
            </button>
          </form>
          {bidErrors[activeJersey.id] ? <p className="error-text">{bidErrors[activeJersey.id]}</p> : null}
          {deleteError ? <p className="error-text">{deleteError}</p> : null}

          <div className="row">
            <h3>Storico offerte</h3>
            <div className="auction-history">
              {activeJersey.bids.length === 0 ? (
                <div className="small">Nessuna offerta registrata finora</div>
              ) : (
                activeJersey.bids.map((bid) => (
                  <div key={bid.id} className="history-entry">
                    <div>
                      <strong>{bid.bidderName}</strong>
                      <div className="small">{formatBidTime(bid.createdAt)}</div>
                    </div>
                    <div className="history-amount">{formatCHF(bid.amount)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="card row">
          <h2>Elenco maglie</h2>
          {deleteError ? <p className="error-text">{deleteError}</p> : null}
          {filteredJerseys.length === 0 ? (
            <p className="small">Nessuna maglia trovata</p>
          ) : (
            <div className="auction-list">
              {filteredJerseys.map((jersey) => (
                <div key={jersey.id} className="auction-list-item-row">
                  <button
                    type="button"
                    className="auction-list-item"
                    onClick={() => setSelectedId(jersey.id)}
                  >
                    <div className="auction-list-main">
                      <div className="auction-list-number">#{jersey.playerNumber}</div>
                      <div>
                        <div className="auction-list-name">{jersey.playerSurname}</div>
                        <div className="small">Offerta attuale</div>
                      </div>
                    </div>
                    <div className="auction-list-price">{formatCHF(jersey.currentPrice)}</div>
                  </button>
                  <button
                    type="button"
                    className="button subtle-danger"
                    disabled={busy === `delete-${jersey.id}`}
                    onClick={() => deleteJersey(jersey)}
                  >
                    Cancella
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
