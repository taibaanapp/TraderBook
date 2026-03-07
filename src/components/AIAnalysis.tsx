import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Bot, Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';
import { TRANSLATIONS } from '../constants/translations';

const t = TRANSLATIONS.TH.aianalysis;

interface AIAnalysisProps {
  symbol: string;
  timeframe: string;
  kpis: any;
  theme?: 'light' | 'dark';
}

export function AIAnalysis({ symbol, timeframe, kpis, theme = 'light' }: AIAnalysisProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
        ${t.prompt_system.replace('{symbol}', symbol).replace('{timeframe}', timeframe)}
        
        ${t.prompt_kpis}
        - Net Profit: ${kpis.netProfitPercent.toFixed(2)}%
        - Profit Factor: ${kpis.profitFactor.toFixed(2)}
        - Max Drawdown: ${kpis.maxDrawdown.toFixed(2)}%
        - Win Rate: ${kpis.winRate.toFixed(2)}%
        - Risk/Reward Ratio: ${kpis.riskRewardRatio.toFixed(2)}
        - Expectancy: $${kpis.expectancy.toFixed(2)}
        - Recovery Factor: ${kpis.recoveryFactor.toFixed(2)}
        
        ${t.prompt_questions}
        
        ${t.prompt_format}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setAnalysis(response.text || t.no_analysis);
    } catch (err: any) {
      console.error(err);
      setError(err.message || t.error_occurred);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn(
      "p-6 rounded-xl border mt-6",
      theme === 'dark' ? "bg-indigo-950/30 border-indigo-900/50" : "bg-indigo-50 border-indigo-100"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bot className={cn("w-6 h-6", theme === 'dark' ? "text-indigo-400" : "text-indigo-600")} />
          <h2 className={cn("text-lg font-semibold", theme === 'dark' ? "text-indigo-300" : "text-indigo-900")}>{t.title}</h2>
        </div>
        {!analysis && !loading && (
          <button
            onClick={handleAnalyze}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm",
              theme === 'dark' ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-indigo-600 text-white hover:bg-indigo-700"
            )}
          >
            {t.generate_summary}
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className={cn("w-8 h-8 animate-spin", theme === 'dark' ? "text-indigo-400" : "text-indigo-600")} />
          <span className={cn("ml-3 font-medium", theme === 'dark' ? "text-indigo-300" : "text-indigo-700")}>{t.analyzing}</span>
        </div>
      )}

      {error && (
        <div className={cn(
          "p-4 rounded-lg text-sm border",
          theme === 'dark' ? "bg-red-900/20 text-red-400 border-red-900/50" : "bg-red-50 text-red-700 border-red-200"
        )}>
          {error}
        </div>
      )}

      {analysis && !loading && (
        <div className={cn(
          "prose max-w-none text-sm p-5 rounded-lg border shadow-sm whitespace-pre-wrap",
          theme === 'dark' ? "prose-invert text-indigo-100 bg-zinc-900/50 border-indigo-900/50" : "prose-indigo text-indigo-900 bg-white border-indigo-100"
        )}>
          {analysis}
        </div>
      )}
    </div>
  );
}
