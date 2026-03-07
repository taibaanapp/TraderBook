import { StockData } from '../types';

export interface DivergencePoint {
  index: number;
  price: number;
  value: number; // RSI or MACD value
  volume: number;
  date: string;
}

export interface Divergence {
  type: 'Regular Bullish' | 'Hidden Bullish' | 'Regular Bearish' | 'Hidden Bearish';
  indicator: 'RSI' | 'MACD';
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
  return detectGenericDivergences(data, lookback, 'RSI');
}

export function detectMACDDivergences(data: StockData[], lookback: number = 60): Divergence[] {
  const divergences: Divergence[] = [];
  const period = 26; // MACD slow period usually
  
  if (data.length < period + 5) return [];

  const troughs: DivergencePoint[] = [];
  const peaks: DivergencePoint[] = [];

  // 1. Identify Pivots for MACD
  // We use a slightly wider pivot check for MACD to avoid noise
  for (let i = 5; i < data.length - 2; i++) {
    const current = data[i];
    const prev1 = data[i - 1];
    const prev2 = data[i - 2];
    const next1 = data[i + 1];
    const next2 = data[i + 2];

    const currVal = current.macd;
    const prev1Val = prev1.macd;
    const prev2Val = prev2.macd;
    const next1Val = next1.macd;
    const next2Val = next2.macd;

    if (currVal === undefined || prev1Val === undefined || prev2Val === undefined || next1Val === undefined || next2Val === undefined) continue;

    // Local Low (Trough)
    if (currVal < prev1Val && currVal < prev2Val && currVal < next1Val && currVal < next2Val) {
      troughs.push({
        index: i,
        price: current.low,
        value: currVal,
        volume: current.volume,
        date: current.date
      });
    }

    // Local High (Peak)
    if (currVal > prev1Val && currVal > prev2Val && currVal > next1Val && currVal > next2Val) {
      peaks.push({
        index: i,
        price: current.high,
        value: currVal,
        volume: current.volume,
        date: current.date
      });
    }
  }

  // 2. Detect Bullish Divergences (Troughs)
  for (let i = troughs.length - 1; i > 0; i--) {
    const current = troughs[i];
    
    // MACD Filter: For Regular Bullish, we generally want MACD to be below zero (oversold territory)
    // This filters out weak divergences in strong uptrends
    if (current.value > 0) continue; 

    for (let j = i - 1; j >= 0; j--) {
      const prev = troughs[j];
      const dist = current.index - prev.index;
      
      if (dist < 8) continue; // Minimum distance for MACD (slower indicator)
      if (dist > lookback) break;

      // Check for Zero Line Crossover between points
      // If MACD crosses zero significantly, the cycle is broken
      let crossedZero = false;
      for (let k = prev.index; k <= current.index; k++) {
        if (data[k].macd && data[k].macd! > 0) {
           crossedZero = true;
           break;
        }
      }
      if (crossedZero) continue;

      // Find intervening high for Target calculation
      let interveningHigh = -Infinity;
      for (let k = prev.index; k <= current.index; k++) {
        if (data[k].high > interveningHigh) interveningHigh = data[k].high;
      }

      // Regular Bullish: Price Lower Low, MACD Higher Low
      if (current.price < prev.price && current.value > prev.value) {
        // Significant difference check (optional, prevents flat lines)
        if (isValidTrendline(data, prev.index, current.index, prev.price, current.price, 'low')) {
           divergences.push(createDivergence('Regular Bullish', 'MACD', prev, current, data[current.index].close, interveningHigh));
           break; // Found the most recent valid divergence for this point
        }
      }

      // Hidden Bullish: Price Higher Low, MACD Lower Low (Continuation)
      // Usually happens in uptrends, so MACD might be > 0, but we filtered > 0 above.
      // So Hidden Bullish is tricky with the Zero Line filter. 
      // Let's relax the zero line filter for Hidden Bullish or handle it separately?
      // For now, let's focus on Regular Bullish accuracy as requested.
    }
  }

  // 3. Detect Bearish Divergences (Peaks)
  for (let i = peaks.length - 1; i > 0; i--) {
    const current = peaks[i];

    // MACD Filter: For Regular Bearish, we generally want MACD to be above zero (overbought territory)
    if (current.value < 0) continue;

    for (let j = i - 1; j >= 0; j--) {
      const prev = peaks[j];
      const dist = current.index - prev.index;
      
      if (dist < 8) continue;
      if (dist > lookback) break;

      // Zero Line Cross Check
      let crossedZero = false;
      for (let k = prev.index; k <= current.index; k++) {
        if (data[k].macd && data[k].macd! < 0) {
           crossedZero = true;
           break;
        }
      }
      if (crossedZero) continue;

      // Find intervening low for Target calculation
      let interveningLow = Infinity;
      for (let k = prev.index; k <= current.index; k++) {
        if (data[k].low < interveningLow) interveningLow = data[k].low;
      }

      // Regular Bearish: Price Higher High, MACD Lower High
      if (current.price > prev.price && current.value < prev.value) {
        if (isValidTrendline(data, prev.index, current.index, prev.price, current.price, 'high')) {
           divergences.push(createDivergence('Regular Bearish', 'MACD', prev, current, data[current.index].close, interveningLow));
           break;
        }
      }
    }
  }

  return cleanupOverlaps(divergences);
}

function detectGenericDivergences(data: StockData[], lookback: number, indicator: 'RSI' | 'MACD'): Divergence[] {
  let divergences: Divergence[] = [];
  const period = 14; 
  
  if (data.length < period + 5) return [];

  const troughs: DivergencePoint[] = [];
  const peaks: DivergencePoint[] = [];

  // 1. Identify Pivots
  for (let i = 5; i < data.length - 2; i++) {
    const current = data[i];
    const prev1 = data[i - 1];
    const prev2 = data[i - 2];
    const next1 = data[i + 1];
    const next2 = data[i + 2];

    const getVal = (d: StockData) => indicator === 'RSI' ? d.rsi : d.macd;

    const currVal = getVal(current);
    const prev1Val = getVal(prev1);
    const prev2Val = getVal(prev2);
    const next1Val = getVal(next1);
    const next2Val = getVal(next2);

    if (currVal === undefined || prev1Val === undefined || prev2Val === undefined || next1Val === undefined || next2Val === undefined) continue;

    // Local Low (Trough)
    if (currVal < prev1Val && currVal < prev2Val && currVal < next1Val && currVal < next2Val) {
      troughs.push({
        index: i,
        price: current.low,
        value: currVal,
        volume: current.volume,
        date: current.date
      });
    }

    // Local High (Peak)
    if (currVal > prev1Val && currVal > prev2Val && currVal > next1Val && currVal > next2Val) {
      peaks.push({
        index: i,
        price: current.high,
        value: currVal,
        volume: current.volume,
        date: current.date
      });
    }
  }

  // 2. Detect Bullish Divergences
  for (let i = troughs.length - 1; i > 0; i--) {
    const current = troughs[i];
    // RSI Filter: only if oversold (optional, maybe skip for MACD or use different threshold)
    if (indicator === 'RSI' && current.value > 40) continue; 
    // MACD Filter: maybe only if below zero? For now, let's keep it simple or add a threshold.
    // Standard MACD divergence usually happens when MACD is negative for bullish.
    // But let's not be too strict for MACD yet unless requested.

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
      if (current.price < prev.price && current.value > prev.value) {
        if (isValidTrendline(data, prev.index, current.index, prev.price, current.price, 'low')) {
           divergences.push(createDivergence('Regular Bullish', indicator, prev, current, data[current.index].close, interveningHigh));
           break;
        }
      }

      // Hidden Bullish
      if (current.price > prev.price && current.value < prev.value) {
        if (isValidTrendline(data, prev.index, current.index, prev.price, current.price, 'low')) {
           divergences.push(createDivergence('Hidden Bullish', indicator, prev, current, data[current.index].close, interveningHigh));
           break;
        }
      }
    }
  }

  // 3. Detect Bearish Divergences
  for (let i = peaks.length - 1; i > 0; i--) {
    const current = peaks[i];
    // RSI Filter
    if (indicator === 'RSI' && current.value < 60) continue;

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
      if (current.price > prev.price && current.value < prev.value) {
        if (isValidTrendline(data, prev.index, current.index, prev.price, current.price, 'high')) {
           divergences.push(createDivergence('Regular Bearish', indicator, prev, current, data[current.index].close, interveningLow));
           break;
        }
      }

      // Hidden Bearish
      if (current.price < prev.price && current.value > prev.value) {
        if (isValidTrendline(data, prev.index, current.index, prev.price, current.price, 'high')) {
           divergences.push(createDivergence('Hidden Bearish', indicator, prev, current, data[current.index].close, interveningLow));
           break;
        }
      }
    }
  }

  return cleanupOverlaps(divergences);
}

function createDivergence(
  type: Divergence['type'], 
  indicator: 'RSI' | 'MACD',
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
    indicator,
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
