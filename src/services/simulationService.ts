import { StockData } from '../types';

export interface ScenarioResult {
  entryDate: string;
  entryPrice: number;
  currentPrice: number;
  profitPercent: number;
  daysHeld: number;
  found: boolean;
}

export interface SimulationResult {
  scenario1: ScenarioResult;
  scenario2: ScenarioResult;
  found: boolean;
}

/**
 * Simulates "What if?" scenarios based on EMA and VWAP.
 */
export function simulateGoldenCross(data: StockData[], interval: string): SimulationResult {
  const emptyScenario: ScenarioResult = {
    entryDate: '',
    entryPrice: 0,
    currentPrice: 0,
    profitPercent: 0,
    daysHeld: 0,
    found: false
  };

  const result: SimulationResult = {
    scenario1: { ...emptyScenario },
    scenario2: { ...emptyScenario },
    found: false
  };

  // Only for Daily and Weekly
  if (interval !== '1d' && interval !== '1wk') {
    return result;
  }

  if (!data || data.length < 2) return result;

  // 1. Find the latest Golden Cross (EMA50 > EMA135 while previous EMA50 <= EMA135)
  let crossIndex = -1;
  for (let i = data.length - 1; i > 0; i--) {
    const current = data[i];
    const prev = data[i - 1];

    if (current.ema50 && current.ema135 && prev.ema50 && prev.ema135) {
      if (current.ema50 > current.ema135 && prev.ema50 <= prev.ema135) {
        crossIndex = i;
        break;
      }
    }
  }

  if (crossIndex === -1) return result;
  result.found = true;

  const latestPoint = data[data.length - 1];

  // SCENARIO 1: First day after cross where Open & Close > both EMAs
  let entryIndex1 = -1;
  for (let i = crossIndex; i < data.length; i++) {
    const d = data[i];
    if (d.ema50 && d.ema135) {
      const maxEMA = Math.max(d.ema50, d.ema135);
      if (d.open > maxEMA && d.close > maxEMA) {
        entryIndex1 = i;
        break;
      }
    }
  }

  if (entryIndex1 !== -1) {
    const entryPoint = data[entryIndex1];
    result.scenario1.found = true;
    result.scenario1.entryDate = entryPoint.date;
    result.scenario1.entryPrice = entryPoint.close;
    result.scenario1.currentPrice = latestPoint.close;
    result.scenario1.profitPercent = ((latestPoint.close - entryPoint.close) / entryPoint.close) * 100;
    
    const entryDate = new Date(entryPoint.date);
    const latestDate = new Date(latestPoint.date);
    const diffTime = Math.abs(latestDate.getTime() - entryDate.getTime());
    result.scenario1.daysHeld = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // SCENARIO 2: Latest EMA135 > VWAP cross after Golden Cross
  let entryIndex2 = -1;
  for (let i = data.length - 1; i > crossIndex; i--) {
    const current = data[i];
    const prev = data[i - 1];
    if (current.ema135 && current.vwap && prev.ema135 && prev.vwap) {
      if (current.ema135 > current.vwap && prev.ema135 <= prev.vwap) {
        entryIndex2 = i;
        break;
      }
    }
  }

  if (entryIndex2 !== -1) {
    const entryPoint = data[entryIndex2];
    result.scenario2.found = true;
    result.scenario2.entryDate = entryPoint.date;
    result.scenario2.entryPrice = entryPoint.close;
    result.scenario2.currentPrice = latestPoint.close;
    result.scenario2.profitPercent = ((latestPoint.close - entryPoint.close) / entryPoint.close) * 100;
    
    const entryDate = new Date(entryPoint.date);
    const latestDate = new Date(latestPoint.date);
    const diffTime = Math.abs(latestDate.getTime() - entryDate.getTime());
    result.scenario2.daysHeld = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return result;
}
