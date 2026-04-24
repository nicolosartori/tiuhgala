'use client';

type Envelope = {
  id: number;
  number: number;
  status: 'DISPONIBILE' | 'VENDUTA' | 'INCASSATA';
  updatedAt: string;
};

const labels = {
  DISPONIBILE: 'disponibile',
  VENDUTA: 'venduta',
  INCASSATA: 'incassata'
};

export function AdminLotteryClient({ envelopes }: { envelopes: Envelope[] }) {
  const url = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const status = url.get('status') ?? 'ALL';
  const q = (url.get('q') ?? '').trim();

  const filtered = envelopes.filter((e) => {
    const statusOk = status === 'ALL' || e.status === status;
    const qOk = q.length === 0 || String(e.number).includes(q);
    return statusOk && qOk;
  });

  async function updateStatus(id: number, newStatus: Envelope['status']) {
    const res = await fetch('/api/admin/lotteria', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus })
    });
    if (res.ok) window.location.reload();
  }

  const counters = {
    DISPONIBILE: envelopes.filter((e) => e.status === 'DISPONIBILE').length,
    VENDUTA: envelopes.filter((e) => e.status === 'VENDUTA').length,
    INCASSATA: envelopes.filter((e) => e.status === 'INCASSATA').length
  };

  return (
    <div className="row">
      <div className="row row-3">
        <div className="card"><div>Disponibili</div><div className="big-number">{counters.DISPONIBILE}</div></div>
        <div className="card"><div>Vendute</div><div className="big-number">{counters.VENDUTA}</div></div>
        <div className="card"><div>Incassate</div><div className="big-number">{counters.INCASSATA}</div></div>
      </div>
      <form className="row row-2" method="GET">
        <select className="select" name="status" defaultValue={status}>
          <option value="ALL">Tutti gli stati</option>
          <option value="DISPONIBILE">disponibile</option>
          <option value="VENDUTA">venduta</option>
          <option value="INCASSATA">incassata</option>
        </select>
        <input className="input" name="q" placeholder="Cerca numero busta" defaultValue={q} />
        <button className="button" type="submit">Filtra</button>
      </form>
      <table className="table">
        <thead><tr><th>Busta</th><th>Stato</th><th>Azione rapida</th></tr></thead>
        <tbody>
          {filtered.map((e) => (
            <tr key={e.id}>
              <td>{e.number}</td>
              <td>{labels[e.status]}</td>
              <td>
                <div className="nav">
                  <button className="button" onClick={() => updateStatus(e.id, 'DISPONIBILE')}>Disponibile</button>
                  <button className="button" onClick={() => updateStatus(e.id, 'VENDUTA')}>Venduta</button>
                  <button className="button secondary" onClick={() => updateStatus(e.id, 'INCASSATA')}>Incassata</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
