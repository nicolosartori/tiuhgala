'use client';

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

export function AdminAuctionClient({ jerseys }: { jerseys: Jersey[] }) {
  async function addBid(formData: FormData) {
    const jerseyId = Number(formData.get('jerseyId'));
    const bidderName = String(formData.get('bidderName') || '');
    const amount = Number(formData.get('amount'));

    const res = await fetch('/api/admin/asta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jerseyId, bidderName, amount })
    });

    if (res.ok) {
      window.location.reload();
      return;
    }

    const data = await res.json();
    alert(data.error || 'Errore inserimento offerta');
  }

  return (
    <div className="row">
      {jerseys.map((j) => (
        <div className="card" key={j.id}>
          <h3>Maglia #{j.playerNumber} – {j.playerSurname}</h3>
          <p>Prezzo iniziale: CHF {Number(j.startingPrice).toFixed(2)}</p>
          <p><strong>Prezzo attuale: CHF {Number(j.currentPrice).toFixed(2)}</strong></p>
          <form
            className="row row-3"
            action={(fd) => {
              fd.set('jerseyId', String(j.id));
              return addBid(fd);
            }}
          >
            <input className="input" name="bidderName" placeholder="Nome offerente" required />
            <input className="input" name="amount" type="number" step="0.01" min={Number(j.currentPrice) + 0.01} required />
            <button className="button" type="submit">Aggiungi offerta</button>
          </form>

          <p className="small">Storico offerte</p>
          <table className="table">
            <thead><tr><th>Ora</th><th>Offerente</th><th>Importo</th></tr></thead>
            <tbody>
              {j.bids.length === 0 && (
                <tr><td colSpan={3} className="small">Nessuna offerta</td></tr>
              )}
              {j.bids.map((b) => (
                <tr key={b.id}>
                  <td>{new Date(b.createdAt).toLocaleTimeString('it-CH')}</td>
                  <td>{b.bidderName}</td>
                  <td>CHF {Number(b.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
