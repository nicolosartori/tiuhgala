export function formatCHF(value: number | string) {
  const amount = typeof value === 'string' ? Number(value) : value;
  return new Intl.NumberFormat('it-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2
  }).format(amount);
}

export function envelopeStatusLabel(status: 'DISPONIBILE' | 'RISERVATA' | 'VENDUTA') {
  if (status === 'DISPONIBILE') return 'disponibile';
  if (status === 'RISERVATA') return 'riservata';
  if (status === 'VENDUTA') return 'venduta';
  return status;
}
