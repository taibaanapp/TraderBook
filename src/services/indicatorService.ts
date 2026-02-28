import { StockData } from '../types';

/**
 * Calculates the Composite Money Flow Score based on OBV slope and MFI.
 * Returns an array of data points with finalScore and color properties.
 */
export function calculateCompositeMoneyFlow(data: StockData[]): StockData[] {
  if (!data || data.length === 0) return [];
  
  const n = data.length;
  
  // 1. Calculate OBV
  let currentOBV = 0;
  const obvValues: number[] = [];
  for (let i = 0; i < n; i++) {
    if (i > 0) {
      if (data[i].close > data[i-1].close) currentOBV += data[i].volume;
      else if (data[i].close < data[i-1].close) currentOBV -= data[i].volume;
    } else {
      currentOBV = data[i].volume;
    }
    obvValues.push(currentOBV);
  }

  // 2. Calculate EMA(OBV, 10)
  const emaOBV: number[] = [];
  const period = 10;
  const multiplier = 2 / (period + 1);
  let prevEMA = obvValues[0];
  for (let i = 0; i < n; i++) {
    const ema = (obvValues[i] - prevEMA) * multiplier + prevEMA;
    emaOBV.push(ema);
    prevEMA = ema;
  }

  // 3. Calculate obvSlope = OBV - EMA(OBV, 10)
  const obvSlopes = obvValues.map((v, i) => v - emaOBV[i]);
  
  // Normalize obvSlope to [-1, 1]
  const maxAbsSlope = Math.max(...obvSlopes.map(Math.abs)) || 1;
  const normalizedObvSlopes = obvSlopes.map(s => s / maxAbsSlope);

  // 4. Calculate MFI(14)
  const mfiValues: number[] = [];
  const mfiPeriod = 14;
  for (let i = 0; i < n; i++) {
    if (i < mfiPeriod) {
      mfiValues.push(50); // Default to neutral
      continue;
    }
    
    let posMF = 0;
    let negMF = 0;
    for (let j = i - mfiPeriod + 1; j <= i; j++) {
      const tp = (data[j].high + data[j].low + data[j].close) / 3;
      const prevTp = (data[j-1].high + data[j-1].low + data[j-1].close) / 3;
      const mf = tp * data[j].volume;
      if (tp > prevTp) posMF += mf;
      else if (tp < prevTp) negMF += mf;
    }
    
    const mr = negMF === 0 ? 100 : posMF / negMF;
    const mfi = 100 - (100 / (1 + mr));
    mfiValues.push(mfi);
  }

  // 5. Combine scores and assign colors
  return data.map((point, i) => {
    const obvSlope = normalizedObvSlopes[i];
    const mfi = mfiValues[i];
    const mfiScore = (mfi - 50) / 50;
    
    const moneyScore = (obvSlope * 0.6) + (mfiScore * 0.4);
    const finalScore = (moneyScore + 1) / 2 * 100;
    
    let color = '#94a3b8';
    if (finalScore >= 70) color = '#15803d';
    else if (finalScore >= 55) color = '#4ade80';
    else if (finalScore >= 45) color = '#94a3b8';
    else if (finalScore >= 30) color = '#f97316';
    else color = '#ef4444';

    return {
      ...point,
      obv: obvValues[i],
      finalScore,
      color,
      volumeColor: i > 0 
        ? (point.close >= data[i-1].close ? 'rgba(5, 150, 105, 0.3)' : 'rgba(225, 29, 72, 0.3)')
        : 'rgba(113, 113, 122, 0.3)',
    };
  });
}

export function calculateVWAP(data: StockData[]): StockData[] {
  let cumulativeTPV = 0;
  let cumulativeVolume = 0;
  
  return data.map(point => {
    const typicalPrice = (point.high + point.low + point.close) / 3;
    cumulativeTPV += typicalPrice * point.volume;
    cumulativeVolume += point.volume;
    return {
      ...point,
      vwap: cumulativeTPV / cumulativeVolume
    };
  });
}
