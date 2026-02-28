export const getFlag = (symbol: string) => {
  const s = symbol.toUpperCase();
  if (s.endsWith('.BK')) return '🇹🇭';
  if (s.endsWith('.HK')) return '🇭🇰';
  if (s.endsWith('.SS') || s.endsWith('.SZ')) return '🇨🇳';
  if (s.endsWith('.T')) return '🇯🇵';
  if (s.endsWith('.L')) return '🇬🇧';
  if (s.endsWith('.DE')) return '🇩🇪';
  if (s.endsWith('.PA')) return '🇫🇷';
  if (s.endsWith('.TO')) return '🇨🇦';
  if (s.endsWith('.AX')) return '🇦🇺';
  if (s.endsWith('.NS') || s.endsWith('.BO')) return '🇮🇳';
  if (s.endsWith('.SG')) return '🇸🇬';
  if (s.endsWith('.KL')) return '🇲🇾';
  if (s.includes('-USD') || s.includes('-BTC')) return '₿';
  return '🇺🇸';
};

export const formatCurrency = (value: number, currency: string = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  } catch (e) {
    return `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
};
