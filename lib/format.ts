export function formatCHF(value: number | string) {
  const amount = typeof value === 'string' ? Number(value) : value;
  return new Intl.NumberFormat('it-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2
  }).format(amount);
}

export function envelopeStatusLabel(status: 'DISPONIBILE' | 'VENDUTA' | 'INCASSATA') {
  if (status === 'DISPONIBILE') return 'disponibile';
  if (status === 'VENDUTA') return 'venduta';
  return 'incassata';
}
