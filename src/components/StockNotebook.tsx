import React, { useState, useEffect } from 'react';
import { StickyNote, Plus, Trash2, Clock, DollarSign } from 'lucide-react';
import { StockNote } from '../types';
import { formatCurrency } from '../utils/formatters';
import { cn } from '../utils/cn';

interface StockNotebookProps {
  symbol: string;
  currentPrice: number;
  currency?: string;
  theme?: 'light' | 'dark';
}

export const StockNotebook: React.FC<StockNotebookProps> = ({ symbol, currentPrice, currency, theme }) => {
  const isDark = theme === 'dark';
  const [notes, setNotes] = useState<StockNote[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchNotes = async () => {
    try {
      const response = await fetch(`/api/notes/${symbol}`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [symbol]);

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;

    setLoading(true);
    const note: StockNote = {
      id: Math.random().toString(36).substr(2, 9),
      symbol,
      userId: 'default-user', // Future multi-user support
      price: currentPrice,
      content: newNoteContent,
      date: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note)
      });

      if (response.ok) {
        setNotes([note, ...notes]);
        setNewNoteContent('');
        setIsAdding(false);
      }
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setNotes(notes.filter(n => n.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  return (
    <div className={cn(
      "rounded-2xl border overflow-hidden flex flex-col h-[500px] transition-colors duration-300",
      isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
    )}>
      <div className={cn(
        "p-4 border-b flex items-center justify-between",
        isDark ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-100 bg-zinc-50/50"
      )}>
        <div className="flex items-center gap-2">
          <StickyNote className={cn("w-4 h-4", isDark ? "text-zinc-100" : "text-zinc-900")} />
          <h3 className={cn("text-[10px] font-bold uppercase tracking-widest", isDark ? "text-zinc-100" : "text-zinc-900")}>CrossVision Notebook</h3>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={cn(
            "p-1.5 rounded-lg transition-colors",
            isDark ? "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100" : "hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900"
          )}
        >
          <Plus className={cn("w-4 h-4 transition-transform", isAdding && "rotate-45")} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isAdding && (
          <div className={cn(
            "space-y-3 p-3 rounded-xl border animate-in fade-in slide-in-from-top-2",
            isDark ? "bg-zinc-800 border-zinc-700" : "bg-zinc-50 border-zinc-200"
          )}>
            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase">
              <span>New Note</span>
              <span>{formatCurrency(currentPrice, currency)}</span>
            </div>
            <textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Write your thoughts..."
              className={cn(
                "w-full rounded-lg p-2 text-base outline-none transition-colors min-h-[80px] resize-none",
                isDark ? "bg-zinc-950 border-zinc-700 text-zinc-100 focus:border-zinc-500" : "bg-white border-zinc-200 text-zinc-900 focus:border-zinc-900"
              )}
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddNote}
                disabled={loading || !newNoteContent.trim()}
                className={cn(
                  "flex-1 text-[10px] font-bold uppercase tracking-widest py-2 rounded-lg transition-colors disabled:opacity-50",
                  isDark ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200" : "bg-zinc-900 text-white hover:bg-zinc-800"
                )}
              >
                {loading ? 'Saving...' : 'Save Note'}
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className={cn(
                  "px-3 py-2 border text-[10px] font-bold uppercase tracking-widest transition-colors",
                  isDark ? "border-zinc-700 text-zinc-400 hover:bg-zinc-700" : "border-zinc-200 text-zinc-500 hover:bg-zinc-100 rounded-lg"
                )}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {notes.length === 0 && !isAdding ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mb-3", isDark ? "bg-zinc-800" : "bg-zinc-50")}>
              <StickyNote className={cn("w-6 h-6", isDark ? "text-zinc-700" : "text-zinc-200")} />
            </div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">No notes yet</p>
            <p className="text-[10px] text-zinc-500 mt-1 italic">Record your analysis for {symbol}</p>
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className={cn(
              "group p-3 border rounded-xl transition-all shadow-sm hover:shadow-md",
              isDark ? "bg-zinc-800 border-zinc-700 hover:border-zinc-600" : "bg-white border-zinc-100 hover:border-zinc-200"
            )}>
              <div className="flex items-start justify-between mb-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    <Clock className="w-3 h-3" />
                    {new Date(note.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                    <DollarSign className="w-3 h-3" />
                    Price: {formatCurrency(note.price, currency)}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className={cn(
                    "p-1 opacity-0 group-hover:opacity-100 transition-all",
                    isDark ? "text-zinc-500 hover:text-rose-400" : "text-zinc-300 hover:text-rose-500"
                  )}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className={cn(
                "text-sm leading-relaxed whitespace-pre-wrap",
                isDark ? "text-zinc-300" : "text-zinc-600"
              )}>{note.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
