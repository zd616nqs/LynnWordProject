
import React from 'react';
import { Word } from '../types';
import { Calendar as CalendarIcon, Search, Brain, Sparkles, Zap, Timer } from 'lucide-react';

interface Props {
  words: Word[];
  onStartStudy: () => void;
  onAddWord: () => void;
  onOpenCalendar: () => void;
}

const Dashboard: React.FC<Props> = ({ words, onStartStudy, onAddWord, onOpenCalendar }) => {
  const learningWords = words.filter(w => !w.isMastered);
  const masteredCount = words.filter(w => w.isMastered).length;
  const todayReviewCount = learningWords.filter(w => w.nextReviewDate <= Date.now()).length;

  // Group words by memory stage for the curve visualization
  // Stage 0-2: Short-term, 3-5: Transition, 6-7: Long-term
  const stages = [0, 0, 0]; // [Short, Mid, Long]
  learningWords.forEach(w => {
    if (w.level <= 2) stages[0]++;
    else if (w.level <= 5) stages[1]++;
    else stages[2]++;
  });

  const totalActive = learningWords.length || 1;
  const shortPerc = (stages[0] / totalActive) * 100;
  const midPerc = (stages[1] / totalActive) * 100;
  const longPerc = (stages[2] / totalActive) * 100;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center font-bold text-white shadow-lg">B</div>
          <div>
            <h1 className="text-xl font-extrabold text-black">Buddy Vocab</h1>
            <p className="text-xs text-gray-400 font-medium">Professional Memory Engine</p>
          </div>
        </div>
        <button 
          onClick={onOpenCalendar}
          className="p-3 bg-white rounded-full soft-shadow text-gray-500 hover:text-black transition-colors"
        >
          <CalendarIcon size={20} />
        </button>
      </header>

      {/* Discovery / Search Area */}
      <div className="bg-[#B5F5D1] p-6 rounded-[2.5rem] relative overflow-hidden group cursor-pointer" onClick={onAddWord}>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-black/60 font-bold text-[10px] uppercase tracking-widest mb-2">
            <Sparkles size={14} /> New Encounter
          </div>
          <h2 className="text-2xl font-black text-black leading-tight">Capture a word <br/>from your day.</h2>
          <div className="mt-4 flex items-center bg-white/80 backdrop-blur rounded-full px-4 py-3 gap-3">
            <Search size={18} className="text-black/30" />
            <span className="text-sm text-black/40 font-medium italic">Type word or phrase...</span>
          </div>
        </div>
        <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
      </div>

      {/* Memory Curve Chart */}
      <div className="bg-white p-6 rounded-[2.5rem] soft-shadow border border-gray-100">
        <div className="flex justify-between items-center mb-6 px-1">
          <h3 className="font-black text-sm uppercase tracking-widest text-gray-400">Memory Status</h3>
          <div className="flex items-center gap-2 text-[10px] font-black text-green-500">
            <Brain size={12} /> SCIENTIFIC SRS
          </div>
        </div>
        
        <div className="flex gap-2 h-12 mb-6 px-1">
          <div style={{ width: `${shortPerc}%` }} className="h-full bg-red-100 rounded-lg transition-all duration-1000 relative group min-w-[4px]">
            <div className="absolute bottom-full left-0 mb-2 opacity-0 group-hover:opacity-100 bg-black text-white text-[8px] py-1 px-2 rounded pointer-events-none transition-opacity">Short-term</div>
          </div>
          <div style={{ width: `${midPerc}%` }} className="h-full bg-yellow-100 rounded-lg transition-all duration-1000 relative group min-w-[4px]">
            <div className="absolute bottom-full left-0 mb-2 opacity-0 group-hover:opacity-100 bg-black text-white text-[8px] py-1 px-2 rounded pointer-events-none transition-opacity">Consolidating</div>
          </div>
          <div style={{ width: `${longPerc}%` }} className="h-full bg-blue-100 rounded-lg transition-all duration-1000 relative group min-w-[4px]">
            <div className="absolute bottom-full left-0 mb-2 opacity-0 group-hover:opacity-100 bg-black text-white text-[8px] py-1 px-2 rounded pointer-events-none transition-opacity">Long-term</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
           <div className="text-center">
             <div className="text-xl font-black">{learningWords.length}</div>
             <div className="text-[9px] font-black uppercase text-gray-300">Active</div>
           </div>
           <div className="text-center border-x border-gray-50">
             <div className="text-xl font-black text-green-500">{masteredCount}</div>
             <div className="text-[9px] font-black uppercase text-gray-300">Mastered</div>
           </div>
           <div className="text-center">
             <div className="text-xl font-black text-blue-500">{longPerc.toFixed(0)}%</div>
             <div className="text-[9px] font-black uppercase text-gray-300">Stability</div>
           </div>
        </div>
      </div>

      {/* Review Section */}
      <div className="bg-white p-7 rounded-[2.5rem] soft-shadow border border-gray-100 relative overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Timer size={18} className="text-orange-400" />
            <h3 className="font-black text-lg">Next Session</h3>
          </div>
          {todayReviewCount > 0 && (
            <div className="px-3 py-1 bg-red-50 text-red-500 text-[10px] font-black rounded-full animate-pulse">
              DUE NOW
            </div>
          )}
        </div>
        
        {todayReviewCount > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-black">{todayReviewCount}</p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Words in critical zone</p>
              </div>
              <button 
                onClick={onStartStudy}
                className="bg-black text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-black/10 hover:scale-105 transition-all"
              >
                <Zap size={18} fill="currentColor" /> Start Review
              </button>
            </div>
            <p className="text-[10px] text-gray-400 font-medium italic">
              * Intervals optimized via Ebbinghaus Forgetting Curve.
            </p>
          </div>
        ) : (
          <div className="text-center py-4 space-y-2">
            <div className="text-4xl">🌱</div>
            <p className="text-gray-400 text-sm font-bold italic">Memory stability is high. Check back later!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
