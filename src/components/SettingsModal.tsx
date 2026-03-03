import React from 'react';
import { X, Settings, Brain, Power } from 'lucide-react';
import { cn } from '../utils/cn';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
  isAiInsightEnabled: boolean;
  onToggleAiInsight: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  theme,
  isAiInsightEnabled,
  onToggleAiInsight
}) => {
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={cn(
        "relative w-full max-w-md rounded-3xl border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200",
        isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
      )}>
        <div className={cn(
          "flex items-center justify-between p-6 border-b",
          isDark ? "border-zinc-800" : "border-zinc-100"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              isDark ? "bg-zinc-800" : "bg-zinc-100"
            )}>
              <Settings className={cn("w-5 h-5", isDark ? "text-zinc-300" : "text-zinc-700")} />
            </div>
            <div>
              <h2 className={cn("text-lg font-black tracking-tight", isDark ? "text-zinc-100" : "text-zinc-900")}>
                System Settings
              </h2>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                Manage Features
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={cn(
              "p-2 rounded-xl transition-colors",
              isDark ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-zinc-100 text-zinc-500"
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className={cn(
            "p-5 rounded-2xl border flex items-center justify-between transition-colors",
            isDark ? "bg-zinc-800/30 border-zinc-800" : "bg-zinc-50 border-zinc-100"
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                isAiInsightEnabled 
                  ? (isDark ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-100 text-emerald-600")
                  : (isDark ? "bg-zinc-800 text-zinc-500" : "bg-zinc-200 text-zinc-500")
              )}>
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className={cn("text-sm font-bold", isDark ? "text-zinc-100" : "text-zinc-900")}>
                  AI Stock Insight
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Generate business profiles using Gemini AI
                </p>
              </div>
            </div>
            
            <button
              onClick={onToggleAiInsight}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative",
                isAiInsightEnabled 
                  ? "bg-emerald-500" 
                  : (isDark ? "bg-zinc-700" : "bg-zinc-300")
              )}
            >
              <div className={cn(
                "w-4 h-4 rounded-full bg-white absolute top-1 transition-transform",
                isAiInsightEnabled ? "left-7" : "left-1"
              )} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
