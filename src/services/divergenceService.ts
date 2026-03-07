import { StockData } from '../types';

export interface DivergencePoint {
  index: number;
  price: number;
  rsi: number;
  volume: number;
  date: string;
}

export interface Divergence {
  type: 'Regular Bullish' | 'Hidden Bullish' | 'Regular Bearish' | 'Hidden Bearish';
  start: DivergencePoint;
  end: DivergencePoint;
  volumeConfirmation: boolean;
  targets: {
    entry: number;
    stopLoss: number;
    neckline: number;      // Target 1: The intervening peak/trough
    measuredMove: number;  // Target 2: 100% of pattern height
    fibo161: number;       // Target 3: 161.8% extension
    fibo261: number;       // Target 4: 261.8% extension
  };
}

export function detectDivergences(data: StockData[], lookback: number = 60): Divergence[] {
  let divergences: Divergence[] = [];
  const rsiPeriod = 14; 
  
  if (data.length < rsiPeriod + 5) return [];

  const troughs: DivergencePoint[] = [];
  const peaks: DivergencePoint[] = [];

  // 1. Identify Pivots
  for (let i = 5; i < data.length - 2; i++) {
    const current = data[i];
    const prev1 = data[i - 1];
    const prev2 = data[i - 2];
    const next1 = data[i + 1];
    const next2 = data[i + 2];

    if (!current.rsi || !prev1.rsi || !prev2.rsi || !next1.rsi || !next2.rsi) continue;

    // Local Low (Trough)
    if (current.rsi < prev1.rsi && current.rsi < prev2.rsi && current.rsi < next1.rsi && current.rsi < next2.rsi) {
      troughs.push({
        index: i,
        price: current.low,
        rsi: current.rsi,
        volume: current.volume,
        date: current.date
      });
    }

    // Local High (Peak)
    if (current.rsi > prev1.rsi && current.rsi > prev2.rsi && current.rsi > next1.rsi && current.rsi > next2.rsi) {
      peaks.push({
        index: i,
        price: current.high,
        rsi: current.rsi,
        volume: current.volume,
        date: current.date
      });
    }
  }

  // 2. Detect Bullish Divergences
  for (let i = troughs.length - 1; i > 0; i--) {
    const current = troughs[i];
    if (current.rsi > 40) continue; 

    for (let j = i - 1; j >= 0; j--) {
      const prev = troughs[j];
      const dist = current.index - prev.index;
      if (dist < 5) continue;
      if (dist > lookback) break;

      // Find intervening high for Fibo calculation
      let interveningHigh = -Infinity;
      for (let k = prev.index; k <= current.index; k++) {
        if (data[k].high > interveningHigh) interveningHigh = data[k].high;
      }

      // Regular Bullish
      if (current.price < prev.price && current.rsi > prev.rsi) {
        if (isValidTrendline(data, prev.index, current.index, prev.price, current.price, 'low')) {
           divergences.push(createDivergence('Regular Bullish', prev, current, data[current.index].close, interveningHigh));
           break;
        }
      }

      // Hidden Bullish
      if (current.price > prev.price && current.rsi < prev.rsi) {
        if (isValidTrendline(data, prev.index, current.index, prev.price, current.price, 'low')) {
           divergences.push(createDivergence('Hidden Bullish', prev, current, data[current.index].close, interveningHigh));
           break;
        }
      }
    }
  }

  // 3. Detect Bearish Divergences
  for (let i = peaks.length - 1; i > 0; i--) {
    const current = peaks[i];
    if (current.rsi < 60) continue;

    for (let j = i - 1; j >= 0; j--) {
      const prev = peaks[j];
      const dist = current.index - prev.index;
      if (dist < 5) continue;
      if (dist > lookback) break;

      // Find intervening low for Fibo calculation
      let interveningLow = Infinity;
      for (let k = prev.index; k <= current.index; k++) {
        if (data[k].low < interveningLow) interveningLow = data[k].low;
      }

      // Regular Bearish
      if (current.price > prev.price && current.rsi < prev.rsi) {
        if (isValidTrendline(data, prev.index, current.index, prev.price, current.price, 'high')) {
           divergences.push(createDivergence('Regular Bearish', prev, current, data[current.index].close, interveningLow));
           break;
        }
      }

      // Hidden Bearish
      if (current.price < prev.price && current.rsi > prev.rsi) {
        if (isValidTrendline(data, prev.index, current.index, prev.price, current.price, 'high')) {
           divergences.push(createDivergence('Hidden Bearish', prev, current, data[current.index].close, interveningLow));
           break;
        }
      }
    }
  }

  return cleanupOverlaps(divergences);
}

function createDivergence(
  type: Divergence['type'], 
  start: DivergencePoint, 
  end: DivergencePoint, 
  currentClose: number,
  interveningPoint: number // High for bullish, Low for bearish
): Divergence {
  let stopLoss, entry, neckline, measuredMove, fibo161, fibo261;

  // Volume Confirmation: Volume should ideally decrease on the second leg (exhaustion)
  // or be lower than the first leg.
  const volumeConfirmation = end.volume < start.volume;

  if (type.includes('Bullish')) {
    // Bullish Pattern
    // Range = Intervening High - Lowest Low
    const lowestLow = Math.min(start.price, end.price);
    const height = interveningPoint - lowestLow;
    
    entry = currentClose;
    stopLoss = lowestLow * 0.995; // Slightly below low
    
    // Targets
    neckline = interveningPoint; // Target 1 (Conservative)
    measuredMove = interveningPoint + height; // Target 2 (Standard AB=CD)
    fibo161 = interveningPoint + (height * 0.618); // Target 3 (1.618 Ext)
    fibo261 = interveningPoint + (height * 1.618); // Target 4 (2.618 Ext)

  } else {
    // Bearish Pattern
    // Range = Highest High - Intervening Low
    const highestHigh = Math.max(start.price, end.price);
    const height = highestHigh - interveningPoint;
    
    entry = currentClose;
    stopLoss = highestHigh * 1.005; // Slightly above high
    
    // Targets
    neckline = interveningPoint; // Target 1
    measuredMove = interveningPoint - height; // Target 2
    fibo161 = interveningPoint - (height * 0.618); // Target 3
    fibo261 = interveningPoint - (height * 1.618); // Target 4
  }

  return {
    type,
    start,
    end,
    volumeConfirmation,
    targets: { stopLoss, entry, neckline, measuredMove, fibo161, fibo261 }
  };
}

function cleanupOverlaps(divergences: Divergence[]): Divergence[] {
  // Sort by end index (descending) then by significance
  divergences.sort((a, b) => {
    if (b.end.index !== a.end.index) return b.end.index - a.end.index;
    const aScore = a.type.includes('Regular') ? 2 : 1;
    const bScore = b.type.includes('Regular') ? 2 : 1;
    return bScore - aScore;
  });

  const accepted: Divergence[] = [];
  
  for (const div of divergences) {
    const isBullish = div.type.includes('Bullish');
    
    // Check against already accepted divergences
    const isOverlapping = accepted.some(existing => {
      // Only check overlap if they are the same direction (both Bullish or both Bearish)
      const existingIsBullish = existing.type.includes('Bullish');
      if (isBullish !== existingIsBullish) return false;

      // Check for time range overlap
      // We add a small buffer to avoid lines starting exactly where another ends
      const buffer = 2;
      const overlap = (div.start.index <= existing.end.index - buffer) && (div.end.index >= existing.start.index + buffer);
      
      return overlap;
    });

    if (!isOverlapping) {
      accepted.push(div);
    }
  }

  return accepted;
}

function isValidTrendline(data: StockData[], startIdx: number, endIdx: number, startPrice: number, endPrice: number, type: 'high' | 'low'): boolean {
  const slope = (endPrice - startPrice) / (endIdx - startIdx);
  
  for (let i = startIdx + 1; i < endIdx; i++) {
    const expectedPrice = startPrice + slope * (i - startIdx);
    const current = data[i];
    
    if (type === 'low') {
      if (current.low < expectedPrice) return false;
    } else {
      if (current.high > expectedPrice) return false;
    }
  }
  return true;
}
