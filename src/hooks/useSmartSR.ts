import { useState, useEffect, useMemo } from 'react';
import { calculateSmartSR, SRZone } from '../services/smartSRService';
import { StockData } from '../types';

export function useSmartSR(stockData: StockData[] | undefined) {
  const [isSmartSRMode, setIsSmartSRMode] = useState(false);
  const [selectedSRDate, setSelectedSRDate] = useState<string | null>(null);
  const [revealIndex, setRevealIndex] = useState(0);
  const [isRevealing, setIsRevealing] = useState(false);

  const srResult = useMemo(() => {
    if (!isSmartSRMode || !selectedSRDate || !stockData) return { zones: [] as SRZone[], guidance: '' };
    return calculateSmartSR(stockData, selectedSRDate);
  }, [isSmartSRMode, selectedSRDate, stockData]);

  const srZones = srResult.zones;
  const srGuidance = srResult.guidance;

  useEffect(() => {
    if (!isSmartSRMode) {
      setSelectedSRDate(null);
      setRevealIndex(0);
      setIsRevealing(false);
    }
  }, [isSmartSRMode]);

  useEffect(() => {
    let timer: any;
    if (isRevealing && stockData && selectedSRDate) {
      const selectedIdx = stockData.findIndex(d => d.date === selectedSRDate);
      const totalToReveal = stockData.length - 1 - selectedIdx;
      
      timer = window.setInterval(() => {
        setRevealIndex(prev => {
          if (prev >= totalToReveal) {
            setIsRevealing(false);
            return prev;
          }
          return prev + 1;
        });
      }, 200);
    }
    return () => window.clearInterval(timer);
  }, [isRevealing, stockData, selectedSRDate]);

  return {
    isSmartSRMode, setIsSmartSRMode,
    selectedSRDate, setSelectedSRDate,
    revealIndex, setRevealIndex,
    isRevealing, setIsRevealing,
    srZones,
    srGuidance
  };
}
