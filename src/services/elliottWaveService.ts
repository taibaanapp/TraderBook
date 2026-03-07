import { StockData } from '../types';
import { detectDivergences, detectMACDDivergences } from './divergenceService';

export function detectElliottWaves(data: StockData[]): StockData[] {
  if (data.length < 50) return data;

  // 1. Pre-calculate indicators
  const rsiDivergences = detectDivergences(data, 20);
  const macdDivergences = detectMACDDivergences(data, 20);
  
  const divergenceMap = new Map<number, { type: string, indicator: string }[]>();
  [...rsiDivergences, ...macdDivergences].forEach(div => {
    const existing = divergenceMap.get(div.end.index) || [];
    existing.push({ type: div.type, indicator: div.indicator });
    divergenceMap.set(div.end.index, existing);
  });

  // 2. Find Major Pivots
  const pivots = findPivots(data, 5);
  const labeledData = [...data];

  // State
  let waveCount = 0;
  let cycleId = 0;
  
  // Wave Indices
  let idx0 = -1;
  let idx1 = -1;
  let idx2 = -1;
  let idx3 = -1;
  let idx4 = -1;
  let idx5 = -1;
  let idxA = -1;
  let idxB = -1;

  // Wave Metrics for Validation
  let w1Height = 0;
  let w2Retracement = 0;
  let w3Height = 0;
  let w4Retracement = 0;
  let confidence = 0;

  // Helpers
  const price = (i: number) => data[i].close;
  const high = (i: number) => data[i].high;
  const low = (i: number) => data[i].low;
  const vol = (start: number, end: number) => calculateAvgVolume(data, start, end);

  for (let i = 0; i < pivots.length; i++) {
    const p = pivots[i];
    const currentIdx = p.index;

    // --- WAVE 0 (START) ---
    if (waveCount === 0) {
      if (p.type === 'low') {
        const divs = divergenceMap.get(currentIdx);
        const hasBullishDiv = divs?.some(d => d.type.includes('Bullish'));
        
        // Volume Spike Check
        let hasVolumeSpike = false;
        const avgVol = vol(currentIdx - 20, currentIdx);
        for (let k = 1; k <= 5; k++) {
          if (currentIdx + k < data.length && data[currentIdx + k].volume > avgVol * 1.5) {
            hasVolumeSpike = true;
            break;
          }
        }

        if (hasBullishDiv || hasVolumeSpike || isLocalLowest(data, currentIdx, 20)) {
          idx0 = currentIdx;
          waveCount = 1;
          cycleId++;
          confidence = 0; // Reset confidence
          markWave(labeledData, currentIdx, '(0)', cycleId, 'impulse', confidence);
        }
      }
    }

    // --- WAVE 1 ---
    else if (waveCount === 1) {
      if (p.type === 'high') {
        if (high(currentIdx) > low(idx0)) {
          idx1 = currentIdx;
          w1Height = high(idx1) - low(idx0);
          
          // Fractal Check: Wave 1 should have 5 sub-waves
          if (checkSubWaves(data, idx0, idx1, 5)) confidence += 10;

          waveCount = 2;
          markWave(labeledData, currentIdx, '1', cycleId, 'impulse', confidence);
        } else {
          if (low(currentIdx) < low(idx0)) {
             waveCount = 0;
             clearWave(labeledData, idx0);
          }
        }
      } else if (p.type === 'low' && low(currentIdx) < low(idx0)) {
        clearWave(labeledData, idx0);
        idx0 = currentIdx;
        markWave(labeledData, currentIdx, '(0)', cycleId, 'impulse', 0);
      }
    }

    // --- WAVE 2 ---
    else if (waveCount === 2) {
      if (p.type === 'low') {
        if (low(currentIdx) <= low(idx0)) {
          // Invalid W2
          clearCycle(labeledData, cycleId);
          idx0 = currentIdx;
          waveCount = 1;
          cycleId++;
          confidence = 0;
          markWave(labeledData, currentIdx, '(0)', cycleId, 'impulse', confidence);
        } else {
          idx2 = currentIdx;
          const w2Drop = high(idx1) - low(idx2);
          w2Retracement = w2Drop / w1Height;

          // Fibonacci Score
          if (w2Retracement >= 0.5 && w2Retracement <= 0.618) confidence += 20; // Golden Zone
          else if (w2Retracement >= 0.382 && w2Retracement <= 0.786) confidence += 10;

          // Fractal Check: Wave 2 should have 3 sub-waves (ABC)
          if (checkSubWaves(data, idx1, idx2, 3)) confidence += 5;

          waveCount = 3;
          markWave(labeledData, currentIdx, '2', cycleId, 'impulse', confidence);
        }
      } else if (p.type === 'high' && high(currentIdx) > high(idx1)) {
        clearWave(labeledData, idx1);
        idx1 = currentIdx;
        w1Height = high(idx1) - low(idx0);
        markWave(labeledData, currentIdx, '1', cycleId, 'impulse', confidence);
      }
    }

    // --- WAVE 3 ---
    else if (waveCount === 3) {
      if (p.type === 'high') {
        if (high(currentIdx) > high(idx1)) {
          idx3 = currentIdx;
          w3Height = high(idx3) - low(idx2);
          const extension = w3Height / w1Height;

          // Fibonacci Score
          if (extension >= 1.618) confidence += 20; // Strong W3
          else if (extension >= 1.0) confidence += 10; // Valid W3

          // Volume Score: W3 vol > W1 vol
          const vol1 = vol(idx0, idx1);
          const vol3 = vol(idx2, idx3);
          if (vol3 > vol1) confidence += 10;

          // Fractal Check
          if (checkSubWaves(data, idx2, idx3, 5)) confidence += 10;

          waveCount = 4;
          markWave(labeledData, currentIdx, '3', cycleId, 'impulse', confidence);
        }
      } else if (p.type === 'low' && low(currentIdx) < low(idx2)) {
        // Broke Wave 2 low. Invalid count. Reset to new Start.
        clearCycle(labeledData, cycleId);
        idx0 = currentIdx;
        waveCount = 1;
        cycleId++;
        confidence = 0;
        markWave(labeledData, currentIdx, '(0)', cycleId, 'impulse', confidence);
      }
    }

    // --- WAVE 4 ---
    else if (waveCount === 4) {
      if (p.type === 'low') {
        // Overlap Rule
        if (low(currentIdx) < high(idx1)) {
          // Overlap! Invalid standard impulse.
          clearCycle(labeledData, cycleId);
          // Reset to new Start
          idx0 = currentIdx;
          waveCount = 1;
          cycleId++;
          confidence = 0;
          markWave(labeledData, currentIdx, '(0)', cycleId, 'impulse', confidence);
        } else {
          idx4 = currentIdx;
          const w4Drop = high(idx3) - low(idx4);
          w4Retracement = w4Drop / w3Height;

          // Fibonacci Score (0.382 is ideal)
          if (w4Retracement >= 0.3 && w4Retracement <= 0.5) confidence += 15;

          // Alternation Rule
          // If W2 was deep (>0.5), W4 should be shallow (<0.382)
          const w2Deep = w2Retracement > 0.5;
          const w4Shallow = w4Retracement < 0.382;
          if (w2Deep === w4Shallow) confidence += 10; // Alternation holds

          // Fractal Check
          if (checkSubWaves(data, idx3, idx4, 3)) confidence += 5;

          waveCount = 5;
          markWave(labeledData, currentIdx, '4', cycleId, 'impulse', confidence);
        }
      } else if (p.type === 'high' && high(currentIdx) > high(idx3)) {
        clearWave(labeledData, idx3);
        idx3 = currentIdx;
        // Re-evaluate W3 metrics
        w3Height = high(idx3) - low(idx2);
        markWave(labeledData, currentIdx, '3', cycleId, 'impulse', confidence);
      }
    }

    // --- WAVE 5 ---
    else if (waveCount === 5) {
      if (p.type === 'high') {
        const divs = divergenceMap.get(currentIdx);
        const hasBearishDiv = divs?.some(d => d.type.includes('Bearish'));

        if (high(currentIdx) > high(idx3) || hasBearishDiv) {
          idx5 = currentIdx;
          
          // Volume Divergence Score: W5 vol < W3 vol
          const vol3 = vol(idx2, idx3);
          const vol5 = vol(idx4, idx5);
          if (vol5 < vol3) confidence += 10;

          // Divergence Score
          if (hasBearishDiv) confidence += 10;

          // Fractal Check
          if (checkSubWaves(data, idx4, idx5, 5)) confidence += 5;

          waveCount = 6;
          markWave(labeledData, currentIdx, '5', cycleId, 'impulse', confidence);
        } else {
          idx5 = currentIdx;
          waveCount = 6;
          markWave(labeledData, currentIdx, '5?', cycleId, 'impulse', confidence);
        }
      } else if (p.type === 'low' && low(currentIdx) < low(idx4)) {
         // Failed W5. Reset to new Start.
         clearCycle(labeledData, cycleId);
         idx0 = currentIdx;
         waveCount = 1;
         cycleId++;
         confidence = 0;
         markWave(labeledData, currentIdx, '(0)', cycleId, 'impulse', confidence);
      }
    }

    // --- WAVE A ---
    else if (waveCount === 6) {
      if (p.type === 'low') {
        idxA = currentIdx;
        waveCount = 7;
        markWave(labeledData, currentIdx, 'A', cycleId, 'correction', confidence);
      } else if (p.type === 'high' && high(currentIdx) > high(idx5)) {
        clearWave(labeledData, idx5);
        idx5 = currentIdx;
        markWave(labeledData, currentIdx, '5', cycleId, 'impulse', confidence);
      }
    }

    // --- WAVE B ---
    else if (waveCount === 7) {
      if (p.type === 'high') {
        const volA = vol(idx5, idxA);
        const volB = vol(idxA, currentIdx);
        const vol5 = vol(idx4, idx5);

        // Calculate Wave A height
        const waveAHeight = high(idx5) - low(idxA);
        // Calculate potential Wave B height (from A low)
        const waveBHeight = high(currentIdx) - low(idxA);
        const bRatio = waveBHeight / waveAHeight;

        if (high(currentIdx) < high(idx5)) {
          // Normal B (Zigzag)
          idxB = currentIdx;
          
          // Volume Score: B vol should be low (Bull Trap)
          if (volB < volA) confidence += 5;

          waveCount = 8;
          markWave(labeledData, currentIdx, 'B', cycleId, 'correction', confidence);
        } else {
          // Expanded Flat or New Impulse?
          // Rule: Expanded Flat B is usually 1.236 - 1.382 of A
          if (bRatio <= 1.382) {
             // It's likely an Expanded Flat B
             idxB = currentIdx;
             
             // Volume Profile Confirmation for Bull Trap
             // If Vol B < Vol 5, it confirms B (Bull Trap)
             if (volB < vol5) {
               confidence += 15; // Strong confirmation
             } else {
               confidence -= 5; // Suspiciously high volume
             }

             waveCount = 8;
             markWave(labeledData, currentIdx, 'B', cycleId, 'correction', confidence);
          } else {
            // Exceeded 1.382 significantly. Likely start of new Impulse.
            // Reset cycle and treat this as potential Wave 3 or 1 of new cycle?
            // For now, let's just reset the correction part and treat as new impulse start
            clearWave(labeledData, idxA); 
            clearWave(labeledData, idx5); 
            
            // Re-evaluate this high as potential Wave 3 or 1
            // But we need to find where it started. 
            // Simplest is to reset to Wave 6 (looking for A) but maybe shift idx5?
            // Or just treat as W5 extension.
            idx5 = currentIdx;
            waveCount = 6; 
            markWave(labeledData, currentIdx, '5', cycleId, 'impulse', confidence);
          }
        }
      } else if (p.type === 'low' && low(currentIdx) < low(idxA)) {
        // Broke A low? Then A wasn't done or this is C.
        clearWave(labeledData, idxA);
        idxA = currentIdx;
        markWave(labeledData, currentIdx, 'A', cycleId, 'correction', confidence);
      }
    }

    // --- WAVE C ---
    else if (waveCount === 8) {
      if (p.type === 'low') {
        if (low(currentIdx) < low(idxA)) {
          markWave(labeledData, currentIdx, 'C', cycleId, 'correction', confidence);
          
          // AUTO-START NEW CYCLE
          // Wave C is the end of correction, thus the start (Wave 0) of the new Impulse
          idx0 = currentIdx;
          waveCount = 1; // Look for Wave 1 next
          cycleId++;
          confidence = 0; // Reset confidence for new cycle
          // We don't overwrite C label, but logic treats it as start
        }
      } else if (p.type === 'high' && high(currentIdx) > high(idxB)) {
         clearWave(labeledData, idxB);
         idxB = currentIdx;
         markWave(labeledData, currentIdx, 'B', cycleId, 'correction', confidence);
      }
    }
  }

  // 3. Calculate Projection for the NEXT wave
  // Find the last labeled wave to determine current state
  let lastLabel = '';
  let lastIdx = -1;
  let lastType = '';

  for (let i = labeledData.length - 1; i >= 0; i--) {
    if (labeledData[i].elliottWaveLabel) {
      lastLabel = labeledData[i].elliottWaveLabel!;
      lastIdx = i;
      lastType = labeledData[i].elliottWaveType!;
      break;
    }
  }

  if (lastIdx !== -1) {
    const lastData = labeledData[labeledData.length - 1];
    let targetPrice = 0;
    let waveLabel = '';
    let label = '';

    // Helper to find specific wave index in the current cycle
    const findWaveIdx = (lbl: string) => {
      // Search backwards from lastIdx for the same cycle
      const cycleId = labeledData[lastIdx].elliottWaveId;
      for (let i = lastIdx; i >= 0; i--) {
        if (labeledData[i].elliottWaveId === cycleId && labeledData[i].elliottWaveLabel === lbl) {
          return i;
        }
      }
      return -1;
    };

    const i0 = findWaveIdx('(0)');
    const i1 = findWaveIdx('1');
    const i2 = findWaveIdx('2');
    const i3 = findWaveIdx('3');
    const i4 = findWaveIdx('4');
    const i5 = findWaveIdx('5');
    const iA = findWaveIdx('A');
    const iB = findWaveIdx('B');

    // Projection Logic
    if (lastLabel === '1' && i0 !== -1) {
      // Completed Wave 1 -> Project Wave 2 (Retracement 50-61.8%)
      const w1Height = labeledData[lastIdx].high - labeledData[i0].low;
      targetPrice = labeledData[lastIdx].high - (w1Height * 0.5); // 50% retracement target
      waveLabel = '2';
      label = 'Target: 50% Retracement';
    } 
    else if (lastLabel === '2' && i1 !== -1 && i0 !== -1) {
      // Completed Wave 2 -> Project Wave 3 (1.618 * W1)
      const w1Height = labeledData[i1].high - labeledData[i0].low;
      targetPrice = labeledData[lastIdx].low + (w1Height * 1.618);
      waveLabel = '3';
      label = 'Target: 1.618 Ext';
    }
    else if (lastLabel === '3' && i2 !== -1) {
      // Completed Wave 3 -> Project Wave 4 (38.2% Retracement of W3)
      const w3Height = labeledData[lastIdx].high - labeledData[i2].low;
      targetPrice = labeledData[lastIdx].high - (w3Height * 0.382);
      waveLabel = '4';
      label = 'Target: 38.2% Retracement';
    }
    else if (lastLabel === '4' && i3 !== -1 && i0 !== -1 && i1 !== -1) {
      // Completed Wave 4 -> Project Wave 5 (Equal to W1 or 0.618 * W3)
      const w1Height = labeledData[i1].high - labeledData[i0].low;
      targetPrice = labeledData[lastIdx].low + w1Height; // Equality target
      waveLabel = '5';
      label = 'Target: W1 Equality';
    }
    else if (lastLabel === '5' && i0 !== -1) {
      // Completed Wave 5 -> Project Wave A (Correction start)
      // Usually retraces to Wave 4 low or 38.2% of entire 1-5
      const totalHeight = labeledData[lastIdx].high - labeledData[i0].low;
      targetPrice = labeledData[lastIdx].high - (totalHeight * 0.382);
      waveLabel = 'A';
      label = 'Target: 38.2% Correction';
    }
    else if (lastLabel === 'A' && i5 !== -1) {
      // Completed Wave A -> Project Wave B (50% Retracement of A)
      const wAHeight = labeledData[i5].high - labeledData[lastIdx].low;
      targetPrice = labeledData[lastIdx].low + (wAHeight * 0.5);
      waveLabel = 'B';
      label = 'Target: 50% Retracement';
    }
    else if (lastLabel === 'B' && iA !== -1 && i5 !== -1) {
      // Completed Wave B -> Project Wave C (Equal to A)
      const wAHeight = labeledData[i5].high - labeledData[iA].low;
      targetPrice = labeledData[lastIdx].high - wAHeight;
      waveLabel = 'C';
      label = 'Target: W.A Equality';
    }

    if (targetPrice > 0) {
      lastData.elliottWaveProjection = {
        targetPrice,
        label,
        waveLabel
      };
    }
  }

  return labeledData;
}

// --- Helpers ---

function markWave(data: StockData[], index: number, label: string, id: number, type: 'impulse' | 'correction', confidence: number) {
  if (index >= 0 && index < data.length) {
    data[index].elliottWaveLabel = label;
    data[index].elliottWaveId = `cycle-${id}`;
    data[index].elliottWaveType = type;
    data[index].elliottWaveConfidence = confidence;
  }
}

function clearWave(data: StockData[], index: number) {
  if (index >= 0 && index < data.length) {
    delete data[index].elliottWaveLabel;
    delete data[index].elliottWaveId;
    delete data[index].elliottWaveType;
    delete data[index].elliottWaveConfidence;
  }
}

function clearCycle(data: StockData[], id: number) {
  for (let i = 0; i < data.length; i++) {
    if (data[i].elliottWaveId === `cycle-${id}`) {
      delete data[i].elliottWaveLabel;
      delete data[i].elliottWaveId;
      delete data[i].elliottWaveType;
      delete data[i].elliottWaveConfidence;
    }
  }
}

interface Pivot {
  index: number;
  price: number;
  type: 'high' | 'low';
}

function findPivots(data: StockData[], period: number): Pivot[] {
  const pivots: Pivot[] = [];
  
  for (let i = period; i < data.length - period; i++) {
    const currentHigh = data[i].high;
    const currentLow = data[i].low;
    
    let isHigh = true;
    let isLow = true;
    
    for (let j = 1; j <= period; j++) {
      if (data[i - j].high > currentHigh || data[i + j].high > currentHigh) {
        isHigh = false;
      }
      if (data[i - j].low < currentLow || data[i + j].low < currentLow) {
        isLow = false;
      }
    }
    
    if (isHigh) {
      pivots.push({ index: i, price: currentHigh, type: 'high' });
    }
    if (isLow) {
      pivots.push({ index: i, price: currentLow, type: 'low' });
    }
  }
  
  return pivots;
}

function calculateAvgVolume(data: StockData[], start: number, end: number): number {
  let sum = 0;
  let count = 0;
  for (let i = Math.max(0, start); i <= Math.min(data.length - 1, end); i++) {
    sum += data[i].volume;
    count++;
  }
  return count > 0 ? sum / count : 0;
}

function isLocalLowest(data: StockData[], index: number, period: number): boolean {
  const val = data[index].low;
  const start = Math.max(0, index - period);
  const end = Math.min(data.length - 1, index + period);
  
  for (let i = start; i <= end; i++) {
    if (i !== index && data[i].low < val) return false;
  }
  return true;
}

function checkSubWaves(data: StockData[], startIdx: number, endIdx: number, count: number): boolean {
  // Simplified Fractal Check:
  // Look for smaller pivots within the range
  if (endIdx - startIdx < 5) return false; // Too small
  
  const slice = data.slice(startIdx, endIdx + 1);
  // Use a smaller period for sub-waves (e.g., 2)
  const subPivots = findPivots(slice, 2);
  
  // We expect roughly 'count' pivots (highs/lows)
  // 5 waves = 5 legs = ~3 highs + 3 lows? 
  // Actually, 5 waves means: 1(up), 2(down), 3(up), 4(down), 5(up)
  // That's 3 highs and 2 lows (or vice versa) inside the move.
  // So we check if we have enough pivots.
  return subPivots.length >= count;
}
