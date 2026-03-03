import { StockData } from '../types';

export interface SRZone {
  name: string;
  price: number;
  color: string;
  percentage: number;
  type: 'support' | 'resistance';
}

export interface SmartSRResult {
  zones: SRZone[];
  guidance?: string;
  type?: 'support' | 'resistance';
}

export function calculateSmartSR(data: StockData[], selectedDate: string): SmartSRResult {
  const selectedIdx = data.findIndex(d => d.date === selectedDate);
  if (selectedIdx === -1) return { zones: [] };

  const lookback = 40;
  const startIdx = Math.max(0, selectedIdx - lookback);
  const windowData = data.slice(startIdx, selectedIdx + 1);
  
  const selectedCandle = data[selectedIdx];
  const windowHigh = Math.max(...windowData.map(d => d.high));
  const windowLow = Math.min(...windowData.map(d => d.low));

  const isPeak = selectedCandle.high >= windowHigh * 0.995; // Near window high
  const isBottom = selectedCandle.low <= windowLow * 1.005; // Near window low

  const ratios = [
    { label: "38.2%", value: 0.382 },
    { label: "50.0%", value: 0.500 },
    { label: "61.8% (Golden)", value: 0.618 },
    { label: "78.6%", value: 0.786 }
  ];

  if (isPeak && !isBottom) {
    // Case A: Bullish Peak -> Find Support
    // Find the lowest point in the window to use as the base for retracement
    const baseLow = windowLow;
    const baseHigh = selectedCandle.high;
    const diff = baseHigh - baseLow;

    const zones: SRZone[] = ratios.map(r => ({
      name: `Support ${r.label}`,
      price: baseHigh - (r.value * diff),
      color: "rgba(16, 185, 129, 0.3)", // Greenish
      percentage: r.value * 100,
      type: 'support'
    }));

    return { zones, type: 'support' };
  } else if (isBottom && !isPeak) {
    // Case B: Bearish Bottom -> Find Resistance
    // Find the highest point in the window to use as the base for retracement
    const baseHigh = windowHigh;
    const baseLow = selectedCandle.low;
    const diff = baseHigh - baseLow;

    const zones: SRZone[] = ratios.map(r => ({
      name: `Resistance ${r.label}`,
      price: baseLow + (r.value * diff),
      color: "rgba(244, 63, 94, 0.3)", // Reddish
      percentage: r.value * 100,
      type: 'resistance'
    }));

    return { zones, type: 'resistance' };
  } else {
    // Ambiguous
    return {
      zones: [],
      guidance: "ไม่สามารถคำนวณโซนที่แม่นยำได้จากจุดนี้\n\nคำแนะนำ:\n• หากต้องการหาแนวรับ: โปรดเลือกจุดสูงสุด (Peak) ของรอบขาขึ้นล่าสุด\n• หากต้องการหาแนวต้าน: โปรดเลือกจุดต่ำสุด (Bottom) ของรอบขาลงล่าสุด"
    };
  }
}
