import React, { useState, useEffect } from 'react';
import { StickyNote, Plus, Trash2, Clock, DollarSign } from 'lucide-react';
import { StockNote } from '../types';
import { formatCurrency } from '../utils/formatters';
import { cn } from '../utils/cn';

interface StockNotebookProps {
  symbol: string;
  currentPrice: number;
  currency?: string;
}

export const StockNotebook: React.FC<StockNotebookProps> = ({ symbol, currentPrice, currency }) => {
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
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden flex flex-col h-[500px]">
      <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-zinc-900" />
          <h3 className="text-xs font-bold uppercase tracking-widest">Notebook</h3>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="p-1.5 hover:bg-zinc-200 rounded-lg transition-colors text-zinc-500 hover:text-zinc-900"
        >
          <Plus className={cn("w-4 h-4 transition-transform", isAdding && "rotate-45")} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isAdding && (
          <div className="space-y-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase">
              <span>New Note</span>
              <span>{formatCurrency(currentPrice, currency)}</span>
            </div>
            <textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Write your thoughts..."
              className="w-full bg-white border border-zinc-200 rounded-lg p-2 text-sm outline-none focus:border-zinc-900 transition-colors min-h-[80px] resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddNote}
                disabled={loading || !newNoteContent.trim()}
                className="flex-1 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest py-2 rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Saving...' : 'Save Note'}
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className="px-3 py-2 border border-zinc-200 text-zinc-500 rounded-lg hover:bg-zinc-100 text-[10px] font-bold uppercase tracking-widest transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {notes.length === 0 && !isAdding ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mb-3">
              <StickyNote className="w-6 h-6 text-zinc-200" />
            </div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">No notes yet</p>
            <p className="text-[10px] text-zinc-300 mt-1">Record your analysis for {symbol}</p>
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="group p-3 bg-white border border-zinc-100 rounded-xl hover:border-zinc-200 transition-all shadow-sm hover:shadow-md">
              <div className="flex items-start justify-between mb-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                    <Clock className="w-3 h-3" />
                    {new Date(note.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 uppercase tracking-wider">
                    <DollarSign className="w-3 h-3" />
                    Price: {formatCurrency(note.price, currency)}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="p-1 text-zinc-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed whitespace-pre-wrap">{note.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
