import { StockData } from '../types';

export interface GhostCandle extends StockData {
  isGhost: boolean;
  confidence: number;
  patternName?: string;
}

export interface ScenarioResult {
  candles: GhostCandle[];
  setup: string;
  patternName: string;
  trigger: string;
  invalidation: number;
  confidence: number;
  type: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

/**
 * Generates a "Future Test" scenario showing what needs to happen for a reversal.
 */
export const generateScenario = (data: StockData[]): ScenarioResult | null => {
  if (data.length < 20) return null;

  const lastCandle = data[data.length - 1];
  const recentData = data.slice(-50);
  
  const rsi = lastCandle.rsi || 50;
  const macd = lastCandle.macd || 0;
  const macdSignal = lastCandle.macdSignal || 0;
  
  const high = Math.max(...recentData.map(d => d.high));
  const low = Math.min(...recentData.map(d => d.low));
  const range = high - low;
  const avgBody = recentData.reduce((sum, d) => sum + Math.abs(d.close - d.open), 0) / 50;
  const avgRange = recentData.reduce((sum, d) => sum + (d.high - d.low), 0) / 50;

  const fib236 = low + range * 0.236;
  const fib382 = low + range * 0.382;
  const fib500 = low + range * 0.500;
  const fib618 = low + range * 0.618;
  const fib786 = low + range * 0.786;

  let type: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  let patternName = "No Clear Pattern";
  let setup = "Market in Consolidation";
  let trigger = "Wait for breakout";
  let invalidation = 0;
  let confidence = 0;
  const ghostCandles: GhostCandle[] = [];

  // BULLISH REVERSAL SCENARIO (Buy Setup at Support)
  if (lastCandle.close <= fib382 * 1.05 || rsi < 35) {
    type = 'BULLISH';
    const patterns = [
      { name: "Bullish Engulfing", weight: 20 },
      { name: "Morning Star", weight: 15 },
      { name: "Hammer Reversal", weight: 15 },
      { name: "Double Bottom", weight: 20 },
      { name: "Cup & Handle", weight: 15 },
      { name: "Inverted H&S", weight: 15 }
    ];
    const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    patternName = `รูปแบบกลับตัวขาขึ้น (${selectedPattern.name})`;
    const level = lastCandle.close <= fib236 ? low : fib382;
    const isAbove = lastCandle.close > level;
    setup = `กำลังทดสอบ${isAbove ? 'แนวรับ' : 'แนวต้าน'}สำคัญ บริเวณ ${level.toFixed(2)}`;
    
    const targetPrice = lastCandle.high;
    const avgVol = recentData.reduce((s,d)=>s+d.volume,0)/50;
    const targetVol = avgVol * 1.5;
    
    trigger = `แท่งถัดไปต้องปิดเหนือ ${targetPrice.toFixed(2)} พร้อม Volume มากกว่า ${Math.round(targetVol).toLocaleString()} หน่วย`;
    
    // Calculate ATR for dynamic stop loss
    const h_list = recentData.map(d => d.high);
    const l_list = recentData.map(d => d.low);
    const c_list = recentData.map(d => d.close);
    const trs: number[] = [];
    for (let i = 1; i < h_list.length; i++) {
      trs.push(Math.max(h_list[i]-l_list[i], Math.abs(h_list[i]-c_list[i-1]), Math.abs(l_list[i]-c_list[i-1])));
    }
    const atr = trs.slice(-14).reduce((a,b)=>a+b,0)/14;

    // Dynamic Invalidation (Stop Loss)
    const swingLow = Math.min(lastCandle.low, low);
    const volatilityStop = lastCandle.close - (1.5 * atr);
    const riskCapStop = lastCandle.close * 0.96; // 4% max risk for scenarios
    
    invalidation = Math.max(swingLow * 0.995, volatilityStop, riskCapStop);
    if (invalidation >= lastCandle.low) invalidation = lastCandle.low * 0.99;
    
    confidence = 60;
    if (rsi < 30) confidence += 15;
    if (macd > macdSignal) confidence += 10;
    if (lastCandle.volume > avgVol) confidence += 5;

    if (selectedPattern.name === "Morning Star") {
      // Candle 1: Small Doji
      ghostCandles.push({
        date: new Date(new Date(lastCandle.date).getTime() + 86400000).toISOString(),
        open: lastCandle.close - avgBody * 0.1,
        close: lastCandle.close - avgBody * 0.05,
        high: lastCandle.close + avgBody * 0.1,
        low: lastCandle.close - avgBody * 0.3,
        volume: lastCandle.volume * 0.6,
        isGhost: true,
        confidence: confidence,
        patternName: "Doji (Star)",
        pe: lastCandle.pe, pb: lastCandle.pb
      });
      // Candle 2: Big Green
      ghostCandles.push({
        date: new Date(new Date(lastCandle.date).getTime() + 172800000).toISOString(),
        open: lastCandle.close,
        close: lastCandle.close + avgBody * 2.2,
        high: lastCandle.close + avgBody * 2.4,
        low: lastCandle.close - avgBody * 0.1,
        volume: targetVol * 1.2,
        isGhost: true,
        confidence: confidence - 5,
        patternName: "Morning Star Confirmation",
        pe: lastCandle.pe, pb: lastCandle.pb
      });
    } else if (selectedPattern.name === "Hammer Reversal") {
      // Candle 1: Hammer
      ghostCandles.push({
        date: new Date(new Date(lastCandle.date).getTime() + 86400000).toISOString(),
        open: lastCandle.close + avgBody * 0.2,
        close: lastCandle.close + avgBody * 0.4,
        high: lastCandle.close + avgBody * 0.5,
        low: lastCandle.close - avgRange * 1.5,
        volume: lastCandle.volume * 1.1,
        isGhost: true,
        confidence: confidence,
        patternName: "Hammer",
        pe: lastCandle.pe, pb: lastCandle.pb
      });
      // Candle 2: Green Follow-through
      ghostCandles.push({
        date: new Date(new Date(lastCandle.date).getTime() + 172800000).toISOString(),
        open: lastCandle.close + avgBody * 0.4,
        close: lastCandle.close + avgBody * 1.8,
        high: lastCandle.close + avgBody * 2.0,
        low: lastCandle.close + avgBody * 0.3,
        volume: targetVol,
        isGhost: true,
        confidence: confidence - 5,
        patternName: "Follow-through",
        pe: lastCandle.pe, pb: lastCandle.pb
      });
    } else if (selectedPattern.name === "Double Bottom") {
      // Bounce, Higher Low, Breakout
      for (let i = 1; i <= 4; i++) {
        const isLast = i === 4;
        ghostCandles.push({
          date: new Date(new Date(lastCandle.date).getTime() + (86400000 * i)).toISOString(),
          open: lastCandle.close + (i * avgBody * 0.5),
          close: lastCandle.close + (i * avgBody * (isLast ? 1.5 : 0.8)),
          high: lastCandle.close + (i * avgBody * (isLast ? 1.7 : 1.0)),
          low: lastCandle.close + (i * avgBody * 0.2),
          volume: targetVol * (isLast ? 1.5 : 0.8),
          isGhost: true,
          confidence: confidence - (i * 2),
          patternName: isLast ? "Neckline Breakout" : "Second Bottom Formation",
          pe: lastCandle.pe, pb: lastCandle.pb
        });
      }
    } else if (selectedPattern.name === "Cup & Handle") {
      // Rounded bottom + handle
      for (let i = 1; i <= 5; i++) {
        const isHandle = i >= 4;
        ghostCandles.push({
          date: new Date(new Date(lastCandle.date).getTime() + (86400000 * i)).toISOString(),
          open: lastCandle.close + (i * avgBody * 0.4),
          close: lastCandle.close + (i * avgBody * (isHandle ? 0.3 : 0.6)),
          high: lastCandle.close + (i * avgBody * 0.8),
          low: lastCandle.close + (i * avgBody * 0.2),
          volume: targetVol * (i === 5 ? 2.0 : 0.7),
          isGhost: true,
          confidence: confidence - (i * 3),
          patternName: i === 5 ? "Cup Breakout" : (isHandle ? "Handle" : "Cup Formation"),
          pe: lastCandle.pe, pb: lastCandle.pb
        });
      }
    } else {
      // Default: Bullish Engulfing
      ghostCandles.push({
        date: new Date(new Date(lastCandle.date).getTime() + 86400000).toISOString(),
        open: lastCandle.close - avgBody * 0.2,
        close: lastCandle.close + avgBody * 2.5,
        high: lastCandle.close + avgBody * 2.7,
        low: lastCandle.close - avgBody * 0.4,
        volume: targetVol * 1.1,
        isGhost: true,
        confidence: confidence,
        patternName: "Bullish Engulfing",
        pe: lastCandle.pe, pb: lastCandle.pb
      });
    }

    // Common Confirmation Candle
    const lastGhost = ghostCandles[ghostCandles.length - 1];
    ghostCandles.push({
      date: new Date(new Date(lastGhost.date).getTime() + 86400000).toISOString(),
      open: lastGhost.close,
      close: lastGhost.close + avgBody * 1.2,
      high: lastGhost.close + avgBody * 1.5,
      low: lastGhost.close - avgBody * 0.2,
      volume: lastCandle.volume * 1.2,
      isGhost: true,
      confidence: confidence - 10,
      pe: lastCandle.pe, pb: lastCandle.pb
    });
  }
  // BEARISH REVERSAL SCENARIO (Sell Setup at Resistance)
  else if (lastCandle.close >= fib618 * 0.95 || rsi > 65) {
    type = 'BEARISH';
    const patterns = [
      { name: "Bearish Engulfing", weight: 30 },
      { name: "Shooting Star", weight: 30 },
      { name: "Double Top", weight: 20 },
      { name: "Head and Shoulders", weight: 20 }
    ];
    const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];

    patternName = `รูปแบบกลับตัวขาลง (${selectedPattern.name})`;
    const level = lastCandle.close >= fib786 ? high : fib618;
    const isAbove = lastCandle.close > level;
    setup = `กำลังทดสอบ${isAbove ? 'แนวรับ' : 'แนวต้าน'}สำคัญ บริเวณ ${level.toFixed(2)}`;
    
    const targetPrice = lastCandle.low;
    const avgVol = recentData.reduce((s,d)=>s+d.volume,0)/50;
    const targetVol = avgVol * 1.5;

    trigger = `แท่งถัดไปต้องปิดต่ำกว่า ${targetPrice.toFixed(2)} พร้อม Volume มากกว่า ${Math.round(targetVol).toLocaleString()} หน่วย`;
    
    // Calculate ATR for dynamic stop loss
    const h_list_b = recentData.map(d => d.high);
    const l_list_b = recentData.map(d => d.low);
    const c_list_b = recentData.map(d => d.close);
    const trs_b: number[] = [];
    for (let i = 1; i < h_list_b.length; i++) {
      trs_b.push(Math.max(h_list_b[i]-l_list_b[i], Math.abs(h_list_b[i]-c_list_b[i-1]), Math.abs(l_list_b[i]-c_list_b[i-1])));
    }
    const atr_b = trs_b.slice(-14).reduce((a,b)=>a+b,0)/14;

    // Dynamic Invalidation (Stop Loss)
    const swingHigh = Math.max(lastCandle.high, high);
    const volatilityStop = lastCandle.close + (1.5 * atr_b);
    const riskCapStop = lastCandle.close * 1.04; // 4% max risk for scenarios
    
    invalidation = Math.min(swingHigh * 1.005, volatilityStop, riskCapStop);
    if (invalidation <= lastCandle.high) invalidation = lastCandle.high * 1.01;

    confidence = 55;
    if (rsi > 70) confidence += 20;
    if (macd < macdSignal) confidence += 10;

    if (selectedPattern.name === "Shooting Star") {
      // Candle 1: Shooting Star
      ghostCandles.push({
        date: new Date(new Date(lastCandle.date).getTime() + 86400000).toISOString(),
        open: lastCandle.close,
        close: lastCandle.close - avgBody * 0.2,
        high: lastCandle.close + avgRange * 1.8,
        low: lastCandle.close - avgBody * 0.3,
        volume: lastCandle.volume * 1.2,
        isGhost: true,
        confidence: confidence,
        patternName: "Shooting Star",
        pe: lastCandle.pe, pb: lastCandle.pb
      });
      // Candle 2: Red Follow-through
      ghostCandles.push({
        date: new Date(new Date(lastCandle.date).getTime() + 172800000).toISOString(),
        open: lastCandle.close - avgBody * 0.3,
        close: lastCandle.close - avgBody * 2.0,
        high: lastCandle.close - avgBody * 0.1,
        low: lastCandle.close - avgBody * 2.2,
        volume: targetVol,
        isGhost: true,
        confidence: confidence - 5,
        patternName: "Confirmation",
        pe: lastCandle.pe, pb: lastCandle.pb
      });
    } else if (selectedPattern.name === "Double Top") {
      for (let i = 1; i <= 4; i++) {
        const isLast = i === 4;
        ghostCandles.push({
          date: new Date(new Date(lastCandle.date).getTime() + (86400000 * i)).toISOString(),
          open: lastCandle.close - (i * avgBody * 0.5),
          close: lastCandle.close - (i * avgBody * (isLast ? 1.5 : 0.8)),
          high: lastCandle.close - (i * avgBody * 0.2),
          low: lastCandle.close - (i * avgBody * (isLast ? 1.7 : 1.0)),
          volume: targetVol * (isLast ? 1.5 : 0.8),
          isGhost: true,
          confidence: confidence - (i * 2),
          patternName: isLast ? "Neckline Breakdown" : "Second Top Formation",
          pe: lastCandle.pe, pb: lastCandle.pb
        });
      }
    } else {
      // Bearish Engulfing
      ghostCandles.push({
        date: new Date(new Date(lastCandle.date).getTime() + 86400000).toISOString(),
        open: lastCandle.close + avgBody * 0.3,
        close: lastCandle.close - avgBody * 2.8,
        high: lastCandle.close + avgBody * 0.5,
        low: lastCandle.close - avgBody * 3.0,
        volume: targetVol * 1.1,
        isGhost: true,
        confidence: confidence,
        patternName: "Bearish Engulfing",
        pe: lastCandle.pe, pb: lastCandle.pb
      });
    }

    // Common Confirmation Candle
    const lastGhost = ghostCandles[ghostCandles.length - 1];
    ghostCandles.push({
      date: new Date(new Date(lastGhost.date).getTime() + 86400000).toISOString(),
      open: lastGhost.close,
      close: lastGhost.close - avgBody * 1.5,
      high: lastGhost.close + avgBody * 0.2,
      low: lastGhost.close - avgBody * 1.8,
      volume: lastCandle.volume * 1.3,
      isGhost: true,
      confidence: confidence - 10,
      pe: lastCandle.pe, pb: lastCandle.pb
    });
  }

  return {
    candles: ghostCandles,
    setup,
    patternName,
    trigger,
    invalidation,
    confidence,
    type
  };
};
