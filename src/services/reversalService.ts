import { StockData } from '../types';

export interface ReversalCondition {
  name: string;
  passed: boolean;
  reason: string;
  score: number;
}

export interface ReversalAnalysis {
  score: number;
  reasons: string[];
  conditions: ReversalCondition[];
  stopLoss: number;
  indicators: {
    ema20: number;
    ema50: number;
    rsi: number;
    volMA15: number;
  };
  patterns: {
    isBullishEngulfing: boolean;
    isHammer: boolean;
    isMorningStar: boolean;
    isPiercingLine: boolean;
    isBullishHarami: boolean;
    isEveningStar: boolean;
    isDarkCloudCover: boolean;
    isThreeWhiteSoldiers: boolean;
    isThreeBlackCrows: boolean;
    isDragonflyDoji: boolean;
    isGravestoneDoji: boolean;
    isDivergence: boolean;
    isBreakout: boolean;
    isSlopeUp: boolean;
  };
}

export function calculateEMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema = [data[0]];
  for (let i = 1; i < data.length; i++) {
    ema.push(data[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

export function calculateRSI(data: number[], period: number = 14): number[] {
  const rsi = new Array(data.length).fill(0);
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi[i] = 100 - 100 / (1 + rs);
  }

  return rsi;
}

export function calculateATR(highs: number[], lows: number[], closes: number[], period: number = 14): number {
  const trs: number[] = [];
  for (let i = 1; i < highs.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trs.push(tr);
  }
  return trs.slice(-period).reduce((a, b) => a + b, 0) / period;
}

export function analyzeReversal(data: StockData[]): ReversalAnalysis {
  if (data.length < 30) {
    return {
      score: 0,
      reasons: ["Insufficient data"],
      conditions: [],
      stopLoss: 0,
      indicators: { ema20: 0, ema50: 0, rsi: 0, volMA15: 0 },
      patterns: { 
        isBullishEngulfing: false, 
        isHammer: false, 
        isMorningStar: false,
        isPiercingLine: false,
        isBullishHarami: false,
        isEveningStar: false,
        isDarkCloudCover: false,
        isThreeWhiteSoldiers: false,
        isThreeBlackCrows: false,
        isDragonflyDoji: false,
        isGravestoneDoji: false,
        isDivergence: false, 
        isBreakout: false, 
        isSlopeUp: false 
      }
    };
  }

  const closes = data.map(d => d?.close || 0);
  const lows = data.map(d => d?.low || 0);
  const highs = data.map(d => d?.high || 0);
  const volumes = data.map(d => d?.volume || 0);

  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const rsi = calculateRSI(closes, 14);
  const atr = calculateATR(highs, lows, closes, 14);

  const lastIdx = data.length - 1;
  const current = data[lastIdx] || { close: 0, open: 0, high: 0, low: 0, volume: 0 };
  const prev = data[lastIdx - 1] || { close: 0, open: 0, high: 0, low: 0, volume: 0 };

  let score = 0;
  const reasons: string[] = [];
  const conditions: ReversalCondition[] = [];

  // 1. (25 คะแนน) ราคาปิดยืนเหนือ EMA 20
  const isAboveEma20 = current.close > ema20[lastIdx];
  if (isAboveEma20) {
    score += 25;
    reasons.push("ราคาปิดยืนเหนือ EMA 20 (+25)");
  }
  conditions.push({
    name: "ราคาปิดยืนเหนือ EMA 20",
    passed: isAboveEma20,
    reason: isAboveEma20 ? "ราคาปัจจุบันสูงกว่าเส้นค่าเฉลี่ย 20 วัน" : "ราคายังอยู่ใต้เส้นค่าเฉลี่ย 20 วัน",
    score: 25
  });

  // 2. (20 คะแนน) เกิด Bullish Divergence (ราคาทำ Low ใหม่แต่ RSI ยก Low สูงขึ้น)
  let lastLocalLowIdx = -1;
  let prevLocalLowIdx = -1;
  
  for (let i = lastIdx - 2; i > lastIdx - 20; i--) {
    if (lows[i] < lows[i-1] && lows[i] < lows[i+1]) {
      if (lastLocalLowIdx === -1) lastLocalLowIdx = i;
      else if (prevLocalLowIdx === -1) {
        prevLocalLowIdx = i;
        break;
      }
    }
  }

  let isDivergence = false;
  if (lastLocalLowIdx !== -1 && prevLocalLowIdx !== -1) {
    if (lows[lastLocalLowIdx] < lows[prevLocalLowIdx] && rsi[lastLocalLowIdx] > rsi[prevLocalLowIdx]) {
      isDivergence = true;
      score += 20;
      reasons.push("เกิด Bullish Divergence (+20)");
    }
  }
  conditions.push({
    name: "Bullish Divergence",
    passed: isDivergence,
    reason: isDivergence ? "ราคาทำ Low ใหม่ แต่ RSI ยกตัวสูงขึ้น" : "ไม่พบสัญญาณขัดแย้งเชิงบวก (Divergence) ในรอบ 20 วัน",
    score: 20
  });

  // 3. (20 คะแนน) ราคา Breakout ทะลุจุดสูงสุดของ 5 วันที่ผ่านมา
  const fiveDayHigh = Math.max(...highs.slice(lastIdx - 5, lastIdx));
  const isBreakout = current.close > fiveDayHigh;
  if (isBreakout) {
    score += 20;
    reasons.push("ราคา Breakout ทะลุ High 5 วัน (+20)");
  }
  conditions.push({
    name: "Breakout High 5 วัน",
    passed: isBreakout,
    reason: isBreakout ? "ราคาทะลุจุดสูงสุดของ 5 วันที่ผ่านมาได้สำเร็จ" : "ราคายังไม่สามารถทะลุจุดสูงสุดในรอบ 5 วันได้",
    score: 20
  });

  // 4. (15 คะแนน) Volume วันที่เขียวสูงกว่าค่าเฉลี่ย 15 วัน (Volume Surge)
  const volMA15 = volumes.slice(lastIdx - 15, lastIdx).reduce((a, b) => a + b, 0) / 15;
  const isVolumeSurge = current.close > current.open && current.volume > volMA15;
  if (isVolumeSurge) {
    score += 15;
    reasons.push("Volume Surge ในวันที่ราคาบวก (+15)");
  }
  conditions.push({
    name: "Volume Surge (แท่งเขียว)",
    passed: isVolumeSurge,
    reason: isVolumeSurge ? "ปริมาณการซื้อขายสูงกว่าค่าเฉลี่ย 15 วัน และราคาปิดบวก" : "ปริมาณการซื้อขายยังไม่โดดเด่น หรือราคาไม่ได้ปิดบวก",
    score: 15
  });

  // 5. (10 คะแนน) เกิดแท่งเทียนกลับตัว (Bullish Engulfing, Hammer, Morning Star, etc.)
  const isBullishEngulfing = current.close > prev.open && current.open < prev.close && prev.close < prev.open;
  
  const bodySize = Math.abs(current.close - current.open);
  const lowerShadow = Math.min(current.open, current.close) - current.low;
  const upperShadow = current.high - Math.max(current.open, current.close);
  const isHammer = lowerShadow > bodySize * 2 && upperShadow < bodySize;

  const prev2 = data[lastIdx - 2] || { close: 0, open: 0, high: 0, low: 0, volume: 0 };
  const isMorningStar = prev2.close < prev2.open && 
                        Math.abs(prev.close - prev.open) < (prev2.open - prev2.close) * 0.3 &&
                        current.close > current.open &&
                        current.close > (prev2.open + prev2.close) / 2;

  const isPiercingLine = prev.close < prev.open &&
                         current.open < prev.low &&
                         current.close > (prev.open + prev.close) / 2 &&
                         current.close < prev.open;

  const isBullishHarami = prev.close < prev.open &&
                          current.open > prev.close &&
                          current.close < prev.open &&
                          Math.abs(current.close - current.open) < Math.abs(prev.close - prev.open) * 0.5;

  const isEveningStar = prev2.close > prev2.open &&
                        Math.abs(prev.close - prev.open) < (prev2.close - prev2.open) * 0.3 &&
                        current.close < current.open &&
                        current.close < (prev2.open + prev2.close) / 2;

  const isDarkCloudCover = prev.close > prev.open &&
                           current.open > prev.high &&
                           current.close < (prev.open + prev.close) / 2 &&
                           current.close > prev.open;

  const prev3 = data[lastIdx - 3] || { close: 0, open: 0, high: 0, low: 0, volume: 0 };
  const isThreeWhiteSoldiers = current.close > current.open &&
                               prev.close > prev.open &&
                               prev2.close > prev2.open &&
                               current.close > prev.close &&
                               prev.close > prev2.close;

  const isThreeBlackCrows = current.close < current.open &&
                             prev.close < prev.open &&
                             prev2.close < prev2.open &&
                             current.close < prev.close &&
                             prev.close < prev2.close;

  const isDragonflyDoji = Math.abs(current.close - current.open) < (current.high - current.low) * 0.1 &&
                          (current.high - Math.max(current.close, current.open)) < (current.high - current.low) * 0.1 &&
                          (Math.min(current.close, current.open) - current.low) > (current.high - current.low) * 0.7;

  const isGravestoneDoji = Math.abs(current.close - current.open) < (current.high - current.low) * 0.1 &&
                           (Math.min(current.close, current.open) - current.low) < (current.high - current.low) * 0.1 &&
                           (current.high - Math.max(current.close, current.open)) > (current.high - current.low) * 0.7;

  const hasPattern = isBullishEngulfing || isHammer || isMorningStar || isPiercingLine || isBullishHarami || isThreeWhiteSoldiers || isDragonflyDoji;
  const hasBearishPattern = isEveningStar || isDarkCloudCover || isThreeBlackCrows || isGravestoneDoji;

  if (hasPattern) {
    score += 10;
    let patternName = "Candlestick Pattern";
    if (isBullishEngulfing) patternName = "Bullish Engulfing";
    else if (isHammer) patternName = "Hammer";
    else if (isMorningStar) patternName = "Morning Star";
    else if (isPiercingLine) patternName = "Piercing Line";
    else if (isBullishHarami) patternName = "Bullish Harami";
    else if (isThreeWhiteSoldiers) patternName = "Three White Soldiers";
    else if (isDragonflyDoji) patternName = "Dragonfly Doji";
    
    reasons.push(`เกิดแท่งเทียน ${patternName} (+10)`);
  }

  if (hasBearishPattern) {
    score -= 10;
    let patternName = "Bearish Pattern";
    if (isEveningStar) patternName = "Evening Star";
    else if (isDarkCloudCover) patternName = "Dark Cloud Cover";
    else if (isThreeBlackCrows) patternName = "Three Black Crows";
    else if (isGravestoneDoji) patternName = "Gravestone Doji";
    reasons.push(`ระวัง: เกิดแท่งเทียน ${patternName} (-10)`);
  }

  conditions.push({
    name: "Candlestick Pattern",
    passed: hasPattern || hasBearishPattern,
    reason: hasPattern ? "พบรูปแบบแท่งเทียนกลับตัวขาขึ้น" : (hasBearishPattern ? "พบรูปแบบแท่งเทียนกลับตัวขาลง" : "ไม่พบรูปแบบแท่งเทียนที่ชัดเจน"),
    score: hasPattern ? 10 : (hasBearishPattern ? -10 : 0)
  });

  // 6. (10 คะแนน) เส้น EMA 20 เริ่มหักหัวขึ้น (Slope Change)
  const isSlopeUp = ema20[lastIdx] > ema20[lastIdx - 1] && ema20[lastIdx - 1] <= ema20[lastIdx - 2];
  if (isSlopeUp) {
    score += 10;
    reasons.push("เส้น EMA 20 เริ่มหักหัวขึ้น (+10)");
  }
  conditions.push({
    name: "EMA 20 หักหัวขึ้น",
    passed: isSlopeUp,
    reason: isSlopeUp ? "เส้นค่าเฉลี่ย 20 วันเริ่มเปลี่ยนความชันเป็นบวก" : "เส้นค่าเฉลี่ย 20 วันยังคงชี้ลงหรือทรงตัว",
    score: 10
  });

  // --- Dynamic Stop Loss Calculation ---
  // 1. Swing Low: Lowest of last 5 days
  const swingLow = Math.min(...lows.slice(lastIdx - 5, lastIdx + 1));
  
  // 2. Volatility Stop: Current Price - 1.5 * ATR
  const volatilityStop = current.close - (1.5 * atr);
  
  // 3. Max Risk Cap: 5% from current price
  const maxRiskStop = current.close * 0.95;

  // We choose the highest (tightest) of these to avoid "wide" stops, 
  // but ensure it is at least below the current low.
  let stopLoss = Math.max(swingLow * 0.995, volatilityStop, maxRiskStop);
  
  // Safety check: Stop loss must be below current low
  if (stopLoss >= current.low) {
    stopLoss = current.low * 0.99;
  }

  return {
    score,
    reasons,
    conditions,
    stopLoss,
    indicators: {
      ema20: ema20[lastIdx],
      ema50: ema50[lastIdx],
      rsi: rsi[lastIdx],
      volMA15
    },
    patterns: {
      isBullishEngulfing,
      isHammer,
      isMorningStar,
      isPiercingLine,
      isBullishHarami,
      isEveningStar,
      isDarkCloudCover,
      isThreeWhiteSoldiers,
      isThreeBlackCrows,
      isDragonflyDoji,
      isGravestoneDoji,
      isDivergence,
      isBreakout,
      isSlopeUp
    }
  };
}
