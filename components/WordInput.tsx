
import React, { useState } from 'react';
import { enrichWordData } from '../geminiService';
import { Loader2, X, ChevronRight, Edit3 } from 'lucide-react';

interface Props {
  onAdd: (word: any) => void;
  onCancel: () => void;
}

const WordInput: React.FC<Props> = ({ onAdd, onCancel }) => {
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim()) return;
    setLoading(true);
    setError('');

    try {
      const data = await enrichWordData(term);
      if (data) {
        onAdd({ term, ...data });
      } else {
        setError('Could not retrieve data. Try again.');
      }
    } catch (err) {
      setError('Network error. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in slide-in-from-bottom-6 duration-500 pb-12">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-black tracking-tight">New Note</h2>
        <button onClick={onCancel} className="bg-white p-3 rounded-full soft-shadow text-black/20 hover:text-black transition-colors">
          <X size={20} strokeWidth={3} />
        </button>
      </div>

      <div className="bg-[#FFEB99] p-8 rounded-[2.5rem] soft-shadow min-h-[300px] flex flex-col relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-black/5"></div>
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-black/40 text-xs font-black uppercase mb-4 tracking-widest">
            <Edit3 size={14} /> Add text to this note
          </div>
          <form onSubmit={handleSubmit}>
            <textarea
              autoFocus
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Start typing..."
              className="w-full bg-transparent text-4xl font-black text-black placeholder:text-black/10 focus:outline-none resize-none leading-tight"
              rows={3}
            />
          </form>
        </div>
        <div className="mt-8 flex justify-end">
          <div className="w-12 h-12 bg-white/40 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 bg-white rounded-full"></div>
          </div>
        </div>
      </div>

      <div className="mt-10 space-y-4">
        <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest px-2">Note Details</h4>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 soft-shadow space-y-6">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-gray-400">Category</span>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-[#D1E1FF] text-[#4A86FF] rounded-full text-[10px] font-black uppercase">Vocabulary</span>
            </div>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={loading || !term.trim()}
            className="w-full bg-black text-white py-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 disabled:opacity-30 hover:scale-[1.02] transition-all shadow-xl shadow-black/10"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Save Note'}
            {!loading && <ChevronRight size={20} />}
          </button>
        </div>
      </div>

      {error && <p className="mt-4 text-center text-red-500 font-bold text-sm">{error}</p>}
    </div>
  );
};

export default WordInput;
