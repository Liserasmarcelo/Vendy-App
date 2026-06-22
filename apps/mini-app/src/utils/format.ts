export function formatPrice(price: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    PYG: '₲',
    ARS: '$',
    BRL: 'R$',
    EUR: '€',
  };

  const symbol = symbols[currency] || currency;
  
  if (currency === 'PYG') {
    return `${symbol} ${price.toLocaleString('es-PY')}`;
  }
  
  return `${symbol} ${price.toFixed(2)}`;
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
