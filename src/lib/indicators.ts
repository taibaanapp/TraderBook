import { StockData } from '../types';

export function calculateEMA(data: number[], period: number): number[] {
  const ema: number[] = [];
  const k = 2 / (period + 1);
  
  let currentEma = data[0];
  ema[0] = currentEma;
  
  for (let i = 1; i < data.length; i++) {
    currentEma = data[i] * k + currentEma * (1 - k);
    ema[i] = currentEma;
  }
  
  return ema;
}

export function calculateATR(data: StockData[], period: number): number[] {
  const atr: number[] = [];
  const tr: number[] = [];
  
  // Calculate True Range
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      tr[i] = data[i].high - data[i].low;
    } else {
      const h_l = data[i].high - data[i].low;
      const h_pc = Math.abs(data[i].high - data[i - 1].close);
      const l_pc = Math.abs(data[i].low - data[i - 1].close);
      tr[i] = Math.max(h_l, h_pc, l_pc);
    }
  }
  
  // Calculate ATR (Simple Moving Average of TR for the first period, then smoothed)
  let currentAtr = 0;
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      currentAtr += tr[i];
      if (i === period - 1) {
        currentAtr /= period;
        atr[i] = currentAtr;
      } else {
        atr[i] = 0;
      }
    } else {
      currentAtr = (currentAtr * (period - 1) + tr[i]) / period;
      atr[i] = currentAtr;
    }
  }
  
  return atr;
}

export function calculateRSI(data: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    gains.push(Math.max(0, diff));
    losses.push(Math.max(0, -diff));
  }

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = 0; i < period; i++) {
    rsi.push(0);
  }

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsi.push(100 - 100 / (1 + rs));

  for (let i = period + 1; i < data.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi.push(100 - 100 / (1 + rs));
  }

  return rsi;
}

export function calculateMACD(data: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) {
  const fastEma = calculateEMA(data, fastPeriod);
  const slowEma = calculateEMA(data, slowPeriod);
  
  const macdLine = fastEma.map((f, i) => f - slowEma[i]);
  const signalLine = calculateEMA(macdLine, signalPeriod);
  const histogram = macdLine.map((m, i) => m - signalLine[i]);

  return {
    macdLine,
    signalLine,
    histogram
  };
}
