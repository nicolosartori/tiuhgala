'use client';

import { useState } from 'react';

type EnvelopeStatus = 'DISPONIBILE' | 'RISERVATA' | 'VENDUTA';

type EnvelopeHistory = {
  id: number;
  previousStatus: EnvelopeStatus;
  newStatus: EnvelopeStatus;
  reservedBy: string | null;
  createdAt: string;
};

type Envelope = {
  id: number;
  number: number;
  status: EnvelopeStatus;
  reservedBy: string | null;
  updatedAt: string;
  history: EnvelopeHistory[];
};

const labels: Record<EnvelopeStatus, string> = {
  DISPONIBILE: 'disponibile',
  RISERVATA: 'riservata',
  VENDUTA: 'venduta'
};

const sectionOrder: EnvelopeStatus[] = ['RISERVATA', 'DISPONIBILE', 'VENDUTA'];

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('it-CH', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

function sortEnvelopes(items: Envelope[]) {
  return [...items].sort((a, b) => a.number - b.number);
}

export function AdminLotteryClient({ envelopes }: { envelopes: Envelope[] }) {
  const [reservedNames, setReservedNames] = useState<Record<number, string>>(
    Object.fromEntries(envelopes.map((envelope) => [envelope.id, envelope.reservedBy ?? '']))
  );
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [lookupValue, setLookupValue] = useState('');

  const grouped = {
    RISERVATA: sortEnvelopes(envelopes.filter((envelope) => envelope.status === 'RISERVATA')),
    DISPONIBILE: sortEnvelopes(envelopes.filter((envelope) => envelope.status === 'DISPONIBILE')),
    VENDUTA: sortEnvelopes(envelopes.filter((envelope) => envelope.status === 'VENDUTA'))
  };

  const counters = {
    RISERVATA: grouped.RISERVATA.length,
    DISPONIBILE: grouped.DISPONIBILE.length,
    VENDUTA: grouped.VENDUTA.length
  };

  const lookupNumber = lookupValue.length > 0 ? Number(lookupValue) : null;
  const lookupResults =
    lookupNumber && Number.isInteger(lookupNumber)
      ? envelopes.filter((envelope) => envelope.number === lookupNumber)
      : [];

  async function updateEnvelope(envelope: Envelope, nextStatus: EnvelopeStatus) {
    const reservedBy = (reservedNames[envelope.id] ?? '').trim();

    if (nextStatus === 'RISERVATA' && reservedBy.length === 0) {
      setErrors((current) => ({
        ...current,
        [envelope.id]: 'Inserire il nome della persona che ha riservato la busta.'
      }));
      return;
    }

    setErrors((current) => ({ ...current, [envelope.id]: '' }));
    setPendingId(envelope.id);

    try {
      const res = await fetch('/api/admin/lotteria', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: envelope.id,
          status: nextStatus,
          reservedBy
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrors((current) => ({
          ...current,
          [envelope.id]: data?.error ?? 'Operazione non riuscita.'
        }));
        return;
      }

      window.location.reload();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="row">
      <div className="row row-3">
        <div className="card">
          <div>Buste riservate</div>
          <div className="big-number">{counters.RISERVATA}</div>
        </div>
        <div className="card">
          <div>Buste disponibili</div>
          <div className="big-number">{counters.DISPONIBILE}</div>
        </div>
        <div className="card">
          <div>Buste vendute</div>
          <div className="big-number">{counters.VENDUTA}</div>
        </div>
      </div>

      <section className="card row">
        <label className="row">
          <span>Cerca busta</span>
          <input
            className="input lookup-input"
            inputMode="numeric"
            min="1"
            max="100"
            pattern="[0-9]*"
            type="number"
            value={lookupValue}
            onChange={(event) => {
              const nextValue = event.target.value;
              if (nextValue === '') {
                setLookupValue('');
                return;
              }

              const parsed = Number(nextValue);
              if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) return;
              setLookupValue(nextValue);
            }}
            placeholder="Inserisci il numero della busta"
          />
        </label>
      </section>

      {lookupValue.length > 0 ? (
        <section className="row">
          {lookupResults.length === 0 ? (
            <div className="card small">Nessuna busta trovata</div>
          ) : (
            <div className="row">
              {sortEnvelopes(lookupResults).map((envelope) => {
                const reservedBy = reservedNames[envelope.id] ?? '';
                const disabled = pendingId === envelope.id;
                const reserveInputDisabled = disabled || envelope.status === 'RISERVATA';

                return (
                  <article key={envelope.id} className="card lottery-admin-card">
                    <div className="big-number">#{envelope.number}</div>

                    <div className="button-row">
                      <button
                        type="button"
                        className={`button ${envelope.status === 'DISPONIBILE' ? 'secondary current-status' : ''}`}
                        disabled={disabled || envelope.status === 'DISPONIBILE'}
                        onClick={() => updateEnvelope(envelope, 'DISPONIBILE')}
                      >
                        Disponibile
                      </button>
                      <button
                        type="button"
                        className={`button ${envelope.status === 'VENDUTA' ? 'secondary current-status' : ''}`}
                        disabled={disabled || envelope.status === 'VENDUTA'}
                        onClick={() => updateEnvelope(envelope, 'VENDUTA')}
                      >
                        Venduta
                      </button>
                    </div>

                    <div className="reserve-row">
                      <button
                        type="button"
                        className={`button ${envelope.status === 'RISERVATA' ? 'secondary current-status' : ''}`}
                        disabled={disabled || envelope.status === 'RISERVATA'}
                        onClick={() => updateEnvelope(envelope, 'RISERVATA')}
                      >
                        Riservata
                      </button>
                      <input
                        className="input"
                        value={reservedBy}
                        disabled={reserveInputDisabled}
                        onChange={(event) => {
                          const value = event.target.value;
                          setReservedNames((current) => ({ ...current, [envelope.id]: value }));
                          setErrors((current) => ({ ...current, [envelope.id]: '' }));
                        }}
                        placeholder="Nome e cognome"
                      />
                    </div>

                    {errors[envelope.id] ? <p className="error-text">{errors[envelope.id]}</p> : null}

                    <details className="history-box">
                      <summary>Mostra storico</summary>
                      {envelope.history.length === 0 ? (
                        <p className="small">Nessuna variazione registrata.</p>
                      ) : (
                        <ul className="history-list">
                          {envelope.history.map((entry) => (
                            <li key={entry.id}>
                              <strong>{formatTimestamp(entry.createdAt)}</strong>
                              {' - '}
                              {labels[entry.previousStatus]} {'>'} {labels[entry.newStatus]}
                              {entry.reservedBy ? ` - ${entry.reservedBy}` : ''}
                            </li>
                          ))}
                        </ul>
                      )}
                    </details>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {lookupValue.length === 0
        ? sectionOrder.map((status) => (
        <section key={status} className="row">
          <h2 className="section-title">
            {status === 'RISERVATA'
              ? 'Buste riservate'
              : status === 'DISPONIBILE'
                ? 'Buste disponibili'
                : 'Buste vendute'}
          </h2>
          <div className="row">
            {grouped[status].map((envelope) => {
              const reservedBy = reservedNames[envelope.id] ?? '';
              const disabled = pendingId === envelope.id;
              const reserveInputDisabled = disabled || envelope.status === 'RISERVATA';

              return (
                <article key={envelope.id} className="card lottery-admin-card">
                  <div className="big-number">#{envelope.number}</div>

                  <div className="button-row">
                    <button
                      type="button"
                      className={`button ${envelope.status === 'DISPONIBILE' ? 'secondary current-status' : ''}`}
                      disabled={disabled || envelope.status === 'DISPONIBILE'}
                      onClick={() => updateEnvelope(envelope, 'DISPONIBILE')}
                    >
                      Disponibile
                    </button>
                    <button
                      type="button"
                      className={`button ${envelope.status === 'VENDUTA' ? 'secondary current-status' : ''}`}
                      disabled={disabled || envelope.status === 'VENDUTA'}
                      onClick={() => updateEnvelope(envelope, 'VENDUTA')}
                    >
                      Venduta
                    </button>
                  </div>

                  <div className="reserve-row">
                    <button
                      type="button"
                      className={`button ${envelope.status === 'RISERVATA' ? 'secondary current-status' : ''}`}
                      disabled={disabled || envelope.status === 'RISERVATA'}
                      onClick={() => updateEnvelope(envelope, 'RISERVATA')}
                    >
                      Riservata
                    </button>
                    <input
                      className="input"
                      value={reservedBy}
                      disabled={reserveInputDisabled}
                      onChange={(event) => {
                        const value = event.target.value;
                        setReservedNames((current) => ({ ...current, [envelope.id]: value }));
                        setErrors((current) => ({ ...current, [envelope.id]: '' }));
                      }}
                      placeholder="Nome e cognome"
                    />
                  </div>

                  {errors[envelope.id] ? <p className="error-text">{errors[envelope.id]}</p> : null}

                  <details className="history-box">
                    <summary>Mostra storico</summary>
                    {envelope.history.length === 0 ? (
                      <p className="small">Nessuna variazione registrata.</p>
                    ) : (
                      <ul className="history-list">
                        {envelope.history.map((entry) => (
                          <li key={entry.id}>
                            <strong>{formatTimestamp(entry.createdAt)}</strong>
                            {' - '}
                            {labels[entry.previousStatus]} {'>'} {labels[entry.newStatus]}
                            {entry.reservedBy ? ` - ${entry.reservedBy}` : ''}
                          </li>
                        ))}
                      </ul>
                    )}
                  </details>
                </article>
              );
            })}
            {grouped[status].length === 0 ? (
              <div className="small">
                {status === 'RISERVATA'
                  ? 'Nessuna busta riservata.'
                  : status === 'DISPONIBILE'
                    ? 'Nessuna busta disponibile.'
                    : 'Nessuna busta venduta.'}
              </div>
            ) : null}
          </div>
        </section>
      ))
        : null}
    </div>
  );
}
