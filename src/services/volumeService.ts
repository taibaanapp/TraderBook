import { StockData } from '../types';

export function detectVolumeSpikes(data: StockData[], multiplier: number = 2.5): StockData[] {
  if (data.length < 20) return data;

  const processedData = [...data];
  const period = 20;

  for (let i = period; i < data.length; i++) {
    let sumVolume = 0;
    for (let j = 1; j <= period; j++) {
      sumVolume += data[i - j].volume;
    }
    const avgVolume = sumVolume / period;

    if (data[i].volume > avgVolume * multiplier) {
      processedData[i].isVolumeSpike = true;
      
      // Identify potential Order Block
      // Bullish Order Block: The last down candle before a strong up move (often associated with high volume)
      // Bearish Order Block: The last up candle before a strong down move
      
      const current = data[i];
      const isBullish = current.close > current.open;
      
      if (isBullish) {
        // Look back for the last bearish candle within a small window
        for (let k = 1; k <= 3; k++) {
          const prev = data[i - k];
          if (prev.close < prev.open) {
            processedData[i - k].isOrderBlock = true; // Mark the bearish candle as the OB
            break; 
          }
        }
      } else {
        // Bearish Spike
        // Look back for the last bullish candle
        for (let k = 1; k <= 3; k++) {
          const prev = data[i - k];
          if (prev.close > prev.open) {
            processedData[i - k].isOrderBlock = true; // Mark the bullish candle as the OB
            break;
          }
        }
      }
    }
  }

  return processedData;
}
