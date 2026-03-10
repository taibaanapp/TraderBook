import React from 'react';
import { Brain, AlertCircle } from 'lucide-react';
import { GeminiModal } from '../GeminiModal';
import { SettingsModal } from '../SettingsModal';
import { AdminPanel } from '../AdminPanel';
import { cn } from '../../utils/cn';

interface ModalsProps {
  theme: 'light' | 'dark';
  geminiModalOpen: boolean;
  setGeminiModalOpen: (open: boolean) => void;
  geminiLoading: boolean;
  geminiError: string | null;
  geminiAnalysis: any;
  elliottAnalysis: string | null;
  geminiTargetDate: string;
  geminiUsage: any;
  showAiConfirmation: boolean;
  setShowAiConfirmation: (show: boolean) => void;
  confirmElliottWaveAnalysis: () => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isAdminPanelOpen: boolean;
  setIsAdminPanelOpen: (open: boolean) => void;
  showTicker: boolean;
  setShowTicker: (show: boolean) => void;
  showStockProfile: boolean;
  setShowStockProfile: (show: boolean) => void;
  showFinancials: boolean;
  setShowFinancials: (show: boolean) => void;
  showGeminiNews: boolean;
  setShowGeminiNews: (show: boolean) => void;
  showSaveImage: boolean;
  setShowSaveImage: (show: boolean) => void;
  showRecentStocks: boolean;
  setShowRecentStocks: (show: boolean) => void;
  showNotebook: boolean;
  setShowNotebook: (show: boolean) => void;
  isAiInsightEnabled: boolean;
  setIsAiInsightEnabled: (enabled: boolean) => void;
  isElliottWaveAiEnabled: boolean;
  setIsElliottWaveAiEnabled: (enabled: boolean) => void;
  showChartControls: boolean;
  setShowChartControls: (show: boolean) => void;
}

export const Modals: React.FC<ModalsProps> = ({
  theme,
  geminiModalOpen,
  setGeminiModalOpen,
  geminiLoading,
  geminiError,
  geminiAnalysis,
  elliottAnalysis,
  geminiTargetDate,
  geminiUsage,
  showAiConfirmation,
  setShowAiConfirmation,
  confirmElliottWaveAnalysis,
  isSettingsOpen,
  setIsSettingsOpen,
  isAdminPanelOpen,
  setIsAdminPanelOpen,
  showTicker,
  setShowTicker,
  showStockProfile,
  setShowStockProfile,
  showFinancials,
  setShowFinancials,
  showGeminiNews,
  setShowGeminiNews,
  showSaveImage,
  setShowSaveImage,
  showRecentStocks,
  setShowRecentStocks,
  showNotebook,
  setShowNotebook,
  isAiInsightEnabled,
  setIsAiInsightEnabled,
  isElliottWaveAiEnabled,
  setIsElliottWaveAiEnabled,
  showChartControls,
  setShowChartControls
}) => {
  return (
    <>
      <GeminiModal 
        isOpen={geminiModalOpen} 
        onClose={() => setGeminiModalOpen(false)}
        loading={geminiLoading}
        error={geminiError}
        analysis={geminiAnalysis}
        elliottAnalysis={elliottAnalysis}
        targetDate={geminiTargetDate}
        usage={geminiUsage}
        theme={theme}
      />

      {showAiConfirmation && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className={cn(
            "max-w-md w-full p-8 rounded-3xl border shadow-2xl animate-in zoom-in-95",
            theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
          )}>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-2xl bg-emerald-500/10">
                <Brain className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className={cn("text-xl font-black uppercase tracking-widest", theme === 'dark' ? "text-zinc-100" : "text-zinc-900")}>
                AI Analysis
              </h3>
            </div>
            <p className={cn("text-sm leading-relaxed mb-8", theme === 'dark' ? "text-zinc-400" : "text-zinc-600")}>
              This action will use Gemini AI to analyze the Elliott Wave structure and provide technical insights. This will count towards your daily AI usage limit.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAiConfirmation(false)}
                className={cn(
                  "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
                  theme === 'dark' ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                )}
              >
                Cancel
              </button>
              <button
                onClick={confirmElliottWaveAnalysis}
                className="flex-1 py-3 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        showTicker={showTicker} setShowTicker={setShowTicker}
        showStockProfile={showStockProfile} setShowStockProfile={setShowStockProfile}
        showFinancials={showFinancials} setShowFinancials={setShowFinancials}
        showGeminiNews={showGeminiNews} setShowGeminiNews={setShowGeminiNews}
        showSaveImage={showSaveImage} setShowSaveImage={setShowSaveImage}
        showRecentStocks={showRecentStocks} setShowRecentStocks={setShowRecentStocks}
        showNotebook={showNotebook} setShowNotebook={setShowNotebook}
        isAiInsightEnabled={isAiInsightEnabled} setIsAiInsightEnabled={setIsAiInsightEnabled}
        isElliottWaveAiEnabled={isElliottWaveAiEnabled} setIsElliottWaveAiEnabled={setIsElliottWaveAiEnabled}
        showChartControls={showChartControls} setShowChartControls={setShowChartControls}
      />

      <AdminPanel 
        isOpen={isAdminPanelOpen} 
        onClose={() => setIsAdminPanelOpen(false)} 
        theme={theme}
      />
    </>
  );
};
