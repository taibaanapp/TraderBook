export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function generateMockData(symbol: string, days: number, timeframe: 'day' | 'week'): Candle[] {
  const data: Candle[] = [];
  let currentPrice = 100 + Math.random() * 50;
  let currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - days * (timeframe === 'week' ? 7 : 1));

  for (let i = 0; i < days; i++) {
    // Skip weekends if daily
    if (timeframe === 'day') {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }
    }

    const volatility = currentPrice * 0.02; // 2% daily volatility
    const change = (Math.random() - 0.48) * volatility; // Slight upward bias
    
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.floor(Math.random() * 1000000) + 500000;

    data.push({
      date: currentDate.toISOString().split('T')[0],
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });

    currentPrice = close;
    currentDate.setDate(currentDate.getDate() + (timeframe === 'week' ? 7 : 1));
  }

  return data;
}
