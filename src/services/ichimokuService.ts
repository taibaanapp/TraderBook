import { StockData } from '../types';

export function calculateIchimoku(data: StockData[]): StockData[] {
  // We need to work with a copy, but we also need to extend it for the future cloud
  // However, extending the array might break other indicators if they expect continuous data.
  // Ideally, we should only extend it for the chart visualization, or handle it here if the app can handle it.
  // Let's extend it here, but mark the new bars as 'future'.
  
  const result = [...data];
  const lastDate = new Date(data[data.length - 1].date);
  
  // Add 26 future bars
  for (let i = 1; i <= 26; i++) {
    const nextDate = new Date(lastDate);
    // Simple weekday increment (skipping weekends roughly)
    let daysAdded = 0;
    while (daysAdded < i) {
      nextDate.setDate(nextDate.getDate() + 1);
      if (nextDate.getDay() !== 0 && nextDate.getDay() !== 6) {
        daysAdded++;
      }
    }
    
    result.push({
      date: nextDate.toISOString().split('T')[0],
      open: NaN, 
      high: NaN, 
      low: NaN, 
      close: NaN, 
      volume: 0,
      isSimulated: true,
      pe: 0,
      pb: 0
    });
  }

  for (let i = 0; i < result.length; i++) {
    const current = result[i];
    
    // Skip calculation for future bars (they have no price)
    if (isNaN(current.close)) continue;

    // Tenkan-sen (Conversion Line): (9-period high + 9-period low) / 2
    if (i >= 8) {
      const periodSlice = result.slice(i - 8, i + 1);
      const high = Math.max(...periodSlice.map(d => d.high));
      const low = Math.min(...periodSlice.map(d => d.low));
      current.tenkanSen = (high + low) / 2;
    }

    // Kijun-sen (Base Line): (26-period high + 26-period low) / 2
    if (i >= 25) {
      const periodSlice = result.slice(i - 25, i + 1);
      const high = Math.max(...periodSlice.map(d => d.high));
      const low = Math.min(...periodSlice.map(d => d.low));
      current.kijunSen = (high + low) / 2;
    }

    // Senkou Span A (Leading Span A): (Tenkan-sen + Kijun-sen) / 2
    // Shifted forward 26 periods
    if (current.tenkanSen !== undefined && current.kijunSen !== undefined) {
      const spanA = (current.tenkanSen + current.kijunSen) / 2;
      if (i + 26 < result.length) {
        result[i + 26].senkouSpanA = spanA;
      }
    }

    // Senkou Span B (Leading Span B): (52-period high + 52-period low) / 2
    // Shifted forward 26 periods
    if (i >= 51) {
      const periodSlice = result.slice(i - 51, i + 1);
      const high = Math.max(...periodSlice.map(d => d.high));
      const low = Math.min(...periodSlice.map(d => d.low));
      const spanB = (high + low) / 2;
      if (i + 26 < result.length) {
        result[i + 26].senkouSpanB = spanB;
      }
    }

    // Chikou Span (Lagging Span): Current closing price shifted back 26 periods
    if (i >= 26) {
      result[i - 26].chikouSpan = current.close;
    }
  }

  return result;
}
