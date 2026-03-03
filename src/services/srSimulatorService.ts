import { StockData } from '../types';

export interface SRLevel {
  name: string;
  price: number;
  color: string;
  percentage: number;
}

export interface SRSimulationResult {
  high: number;
  low: number;
  levels: SRLevel[];
  selectedIndex: number;
  selectedDate: string;
}

/**
 * Calculates Fibonacci support/resistance levels based on a selected date.
 * Only uses data up to the selected date.
 */
export function calculateSRLevels(data: StockData[], selectedIndex: number): SRSimulationResult | null {
  if (selectedIndex < 10 || selectedIndex >= data.length) return null;

  // 1. Slice data up to selected date
  const historicalData = data.slice(0, selectedIndex + 1);
  
  // 2. Find Swing High and Swing Low in the historical data
  // We look for the absolute high and low in the visible historical range
  // In a more advanced version, we could look for specific swing points, 
  // but for a simulator, the range high/low is a standard reference.
  let high = -Infinity;
  let low = Infinity;
  
  for (const d of historicalData) {
    if (d.high > high) high = d.high;
    if (d.low < low) low = d.low;
  }

  if (high === -Infinity || low === Infinity || high === low) return null;

  const diff = high - low;

  // 3. Calculate Fibonacci Levels
  const levels: SRLevel[] = [
    {
      name: 'Minor Support',
      percentage: 38.2,
      price: high - (0.382 * diff),
      color: 'rgba(59, 130, 246, 0.3)' // Blue
    },
    {
      name: 'Mid Level',
      percentage: 50.0,
      price: high - (0.500 * diff),
      color: 'rgba(139, 92, 246, 0.3)' // Purple
    },
    {
      name: 'Golden Zone',
      percentage: 61.8,
      price: high - (0.618 * diff),
      color: 'rgba(245, 158, 11, 0.4)' // Amber/Gold
    },
    {
      name: 'Deep Support',
      percentage: 78.6,
      price: high - (0.786 * diff),
      color: 'rgba(239, 68, 68, 0.3)' // Red
    }
  ];

  return {
    high,
    low,
    levels,
    selectedIndex,
    selectedDate: data[selectedIndex].date
  };
}

/**
 * Detects if a price point has "hit" a level.
 * @param price The current price
 * @param levelPrice The target level price
 * @param tolerance Percentage tolerance (default 0.5%)
 */
export function checkCollision(price: number, levelPrice: number, tolerance: number = 0.005): boolean {
  const diff = Math.abs(price - levelPrice);
  const threshold = levelPrice * tolerance;
  return diff <= threshold;
}
