import * as d3 from 'd3';
import { StockData } from '../types';

export function calculateMoneyFlow(data: StockData[]): StockData[] {
  let maxClose = -Infinity;
  const period = 20; // For average volume calculation

  // Helper to calculate SMA of Total Dollar Volume
  const calculateSMA = (arr: number[], period: number) => {
    const sma = [];
    for (let i = 0; i < arr.length; i++) {
      if (i < period - 1) {
        sma.push(0); // Not enough data
        continue;
      }
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += arr[i - j];
      }
      sma.push(sum / period);
    }
    return sma;
  };

  // Pre-calculate Total Dollar Volume for SMA
  const totalDollarVolumes = data.map(d => d.volume * d.close);
  const avgTotalDollarVolumes = calculateSMA(totalDollarVolumes, period);

  return data.map((d, i) => {
    // 1. Calculate Dollar Volume
    const totalDollarVolume = totalDollarVolumes[i];

    // 2. Calculate Buy/Sell Force
    const range = d.high - d.low;
    let buyForce = 0.5;
    let sellForce = 0.5;

    if (range > 0) {
      buyForce = (d.close - d.low) / range;
      sellForce = (d.high - d.close) / range;
    }

    const buyDollarVolume = totalDollarVolume * buyForce;
    const sellDollarVolume = totalDollarVolume * sellForce;

    // 3. Calculate Drawdown
    // Update Cumulative Max Close
    if (d.close > maxClose) {
      maxClose = d.close;
    }
    const drawdownPct = maxClose > 0 ? ((d.close - maxClose) / maxClose) * 100 : 0;

    // 4. Get Average Dollar Volume
    const avgTotalDollarVolume = avgTotalDollarVolumes[i];

    // 5. Detect Selling Climax
    // Condition: Total DV > 2 * Avg DV AND Drawdown < -20%
    const isSellingClimax = (avgTotalDollarVolume > 0) && (totalDollarVolume > avgTotalDollarVolume * 2) && (drawdownPct < -20);
    
    // 6. Detect Buying Climax / Absorption (Green Spike)
    // Condition: Total DV > 1.5 * Avg DV AND Buy DV > Sell DV
    const isAbsorption = (avgTotalDollarVolume > 0) && (totalDollarVolume > avgTotalDollarVolume * 1.5) && (buyDollarVolume > sellDollarVolume);

    // 7. Detect Panic (High Red Volume + New Low)
    const recentLow = d3.min(data.slice(Math.max(0, i - 20), i + 1), d => d.low) || d.low;
    const isPanic = (avgTotalDollarVolume > 0) && (totalDollarVolume > avgTotalDollarVolume * 1.5) && (sellDollarVolume > buyDollarVolume) && (d.low <= recentLow);

    // 8. Detect Exhaustion (Low Volume + After long decline)
    const isExhaustion = (avgTotalDollarVolume > 0) && (totalDollarVolume < avgTotalDollarVolume * 0.5) && (drawdownPct < -15);

    return {
      ...d,
      totalDollarVolume,
      buyDollarVolume,
      sellDollarVolume,
      avgTotalDollarVolume,
      drawdownPct,
      isSellingClimax,
      isAbsorption,
      isPanic,
      isExhaustion
    };
  });
}

export function generateMoneyFlowInsights(data: StockData[]): { insights: string[], summary: any } {
  if (data.length === 0) return { insights: [], summary: null };

  const insights: string[] = [];
  const latest = data[data.length - 1];
  const recentBars = data.slice(-20); // Look at last 20 bars for context
  
  // Calculate Historical Average Drawdown (excluding 0s)
  const drawdowns = data.map(d => d.drawdownPct || 0).filter(d => d < 0);
  const avgDrawdown = drawdowns.length > 0 ? d3.mean(drawdowns) || -15 : -15;

  // 1. Rule-based Logic
  const hasRecentAbsorb = recentBars.some(d => d.isAbsorption);
  const isNewHigh = latest.close >= (d3.max(data.slice(-50), d => d.close) || 0);
  const isLowVol = latest.totalDollarVolume && latest.avgTotalDollarVolume && latest.totalDollarVolume < latest.avgTotalDollarVolume * 0.7;

  // Drawdown < -30% และ Money Flow มี ABSORB
  if ((latest.drawdownPct || 0) < -30 && hasRecentAbsorb) {
    insights.push("\"Strong Value Zone\": หุ้นอยู่ในช่วงลดราคาลึก และเริ่มมีเงินก้อนใหญ่เข้าพยุงฐานราคานี้อย่างมีนัยสำคัญ");
  }
  
  // Drawdown > -5% และ Money Flow มี ABSORB
  if ((latest.drawdownPct || 0) > -5 && latest.isAbsorption) {
    insights.push("\"Aggressive Accumulation\": มีความต้องการหุ้นสูงมาก เงินก้อนใหญ่ยอมรับของแม้ราคาใกล้จุดสูงสุดเดิม ระวังการพักตัวระยะสั้นแต่ภาพใหญ่ยังแข็งแกร่ง");
  }

  // Drawdown ลึกขึ้นเรื่อยๆ แต่ Money Flow เขียวบาง แดงป่อง
  const recentSells = recentBars.filter(d => (d.sellDollarVolume || 0) > (d.buyDollarVolume || 0)).length;
  if ((latest.drawdownPct || 0) < -15 && recentSells > 12 && !hasRecentAbsorb) {
    insights.push("\"Falling Knife\": แรงขายยังครอบงำตลาด และยังไม่มีเงินก้อนใหญ่เข้ามาหยุดราคา แนะนำให้รอดูสถานการณ์จนกว่าจะเกิดสัญญาณ ABSORB แรก");
  }

  // ราคาทำ New High แต่ Money Flow เริ่มแห้ง
  if (isNewHigh && isLowVol) {
    insights.push("\"Drive Exhaustion\": ราคาขึ้นแต่ขาดแรงส่งจากเงินก้อนใหญ่ ระวังการเกิด Bull Trap หรือการกลับตัวลงแรง");
  }

  // 2. Trade Setup Summary
  const absorbCount3M = data.slice(-60).filter(d => d.isAbsorption).length;
  let actionBias = "Neutral";
  if ((latest.drawdownPct || 0) < avgDrawdown && hasRecentAbsorb) actionBias = "High Reward/Risk (Accumulate)";
  else if (latest.isPanic || latest.isSellingClimax) actionBias = "Potential Reversal (Watch)";
  else if (isNewHigh && !isLowVol) actionBias = "Strong Momentum (Hold)";

  const summary = {
    currentStatus: (latest.drawdownPct || 0) < -25 ? `Extreme Discount (DD ${latest.drawdownPct?.toFixed(1)}%)` : `Normal (DD ${latest.drawdownPct?.toFixed(1)}%)`,
    smartMoneyAction: absorbCount3M > 0 ? `ตรวจพบการ ABSORB ${absorbCount3M} ครั้งในรอบ 3 เดือน` : "ไม่พบการสะสมที่ผิดปกติ",
    actionBias: actionBias,
    avgDrawdown: avgDrawdown,
    isGoldenDiscount: (latest.drawdownPct || 0) < avgDrawdown
  };

  return { insights, summary };
}
