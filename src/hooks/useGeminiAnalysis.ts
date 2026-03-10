import { useState, useEffect } from 'react';
import { getStockProfile, getGeminiNewsAnalysis, getElliottWaveAnalysis } from '../services/geminiService';
import { StockData } from '../types';

export function useGeminiAnalysis(symbol: string) {
  const [geminiModalOpen, setGeminiModalOpen] = useState(false);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [geminiAnalysis, setGeminiAnalysis] = useState<any | null>(null);
  const [elliottAnalysis, setElliottAnalysis] = useState<string | null>(null);
  const [isElliottWaveAiEnabled, setIsElliottWaveAiEnabled] = useState(false);
  const [showAiConfirmation, setShowAiConfirmation] = useState(false);
  const [pendingElliottWaveData, setPendingElliottWaveData] = useState<{data: StockData, label: string} | null>(null);
  const [geminiTargetDate, setGeminiTargetDate] = useState<string>('');
  const [geminiUsage, setGeminiUsage] = useState<{ count: number; limit: number } | null>(null);
  const [stockProfile, setStockProfile] = useState<any | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isAiInsightEnabled, setIsAiInsightEnabled] = useState(false);

  useEffect(() => {
    const savedAiInsight = localStorage.getItem('isAiInsightEnabled');
    if (savedAiInsight !== null) setIsAiInsightEnabled(savedAiInsight === 'true');

    const savedElliottWaveAi = localStorage.getItem('isElliottWaveAiEnabled');
    if (savedElliottWaveAi !== null) setIsElliottWaveAiEnabled(savedElliottWaveAi === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem('isAiInsightEnabled', String(isAiInsightEnabled));
  }, [isAiInsightEnabled]);

  useEffect(() => {
    localStorage.setItem('isElliottWaveAiEnabled', String(isElliottWaveAiEnabled));
  }, [isElliottWaveAiEnabled]);

  const fetchStockProfile = async (targetSymbol: string, exchangeName?: string) => {
    if (!isAiInsightEnabled) return;
    setProfileLoading(true);
    try {
      const data = await getStockProfile(targetSymbol, exchangeName);
      setStockProfile(data);
    } catch (err) {
      console.error('Failed to fetch stock profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchGeminiUsage = async () => {
    try {
      const response = await fetch('/api/usage/gemini_news');
      if (response.ok) {
        const data = await response.json();
        setGeminiUsage(data);
      }
    } catch (err) {
      console.error('Failed to fetch usage:', err);
    }
  };

  const handleGeminiAnalysis = async (data: any) => {
    setGeminiModalOpen(true);
    setGeminiLoading(true);
    setGeminiError(null);
    setGeminiAnalysis(null);
    setElliottAnalysis(null);
    setGeminiTargetDate(new Date(data.date).toISOString().split('T')[0]);

    try {
      const result = await getGeminiNewsAnalysis(symbol, new Date(data.date).toISOString().split('T')[0]);
      setGeminiAnalysis(result);
      fetchGeminiUsage(); 
    } catch (err: any) {
      setGeminiError(err.message);
    } finally {
      setGeminiLoading(false);
    }
  };

  const handleElliottWaveAnalysis = (data: StockData, label: string) => {
    if (!isElliottWaveAiEnabled) return;
    setPendingElliottWaveData({ data, label });
    setShowAiConfirmation(true);
  };

  const confirmElliottWaveAnalysis = async (stockData: StockData[]) => {
    setShowAiConfirmation(false);
    if (!pendingElliottWaveData) return;
    
    const { data, label } = pendingElliottWaveData;
    setGeminiModalOpen(true);
    setGeminiLoading(true);
    setGeminiError(null);
    setGeminiAnalysis(null);
    setElliottAnalysis(null);
    setGeminiTargetDate(new Date(data.date).toISOString().split('T')[0]);

    try {
      const idx = stockData.findIndex(d => d.date === data.date) || -1;
      let contextData = '';
      if (idx !== -1) {
        const start = Math.max(0, idx - 20);
        const end = Math.min(stockData.length - 1, idx + 5);
        const slice = stockData.slice(start, end + 1);
        contextData = slice.map(d => 
          `${d.date}: O=${d.open}, H=${d.high}, L=${d.low}, C=${d.close}`
        ).join('\n');
      }

      const result = await getElliottWaveAnalysis(symbol, label, contextData);
      setElliottAnalysis(result);
      fetchGeminiUsage();
    } catch (err: any) {
      setGeminiError(err.message);
    } finally {
      setGeminiLoading(false);
      setPendingElliottWaveData(null);
    }
  };

  return {
    geminiModalOpen, setGeminiModalOpen,
    geminiLoading,
    geminiError,
    geminiAnalysis,
    elliottAnalysis,
    isElliottWaveAiEnabled, setIsElliottWaveAiEnabled,
    showAiConfirmation, setShowAiConfirmation,
    pendingElliottWaveData,
    geminiTargetDate,
    geminiUsage,
    stockProfile, setStockProfile,
    profileLoading,
    isAiInsightEnabled, setIsAiInsightEnabled,
    fetchStockProfile,
    handleGeminiAnalysis,
    handleElliottWaveAnalysis,
    confirmElliottWaveAnalysis
  };
}
