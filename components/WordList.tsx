
import React, { useState } from 'react';
import { Word } from '../types';
import { ChevronLeft, Volume2, Search, Sparkles, BookOpen, Quote, Eye, EyeOff } from 'lucide-react';
import { playTTS } from '../geminiClient';

interface Props {
  words: Word[];
  title: string;
  onBack: () => void;
}

const WordList: React.FC<Props> = ({ words, title, onBack }) => {
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [showTranslations, setShowTranslations] = useState(false);
  const colors = ['#D1E1FF', '#FFEB99', '#B5F5D1', '#FFD1E8'];

  if (selectedWord) {
    const colorIndex = words.findIndex(w => w.id === selectedWord.id) % colors.length;
    const themeColor = colors[colorIndex === -1 ? 0 : colorIndex];

    return (
      <div className="animate-in slide-in-from-right-4 duration-500 pb-12">
        <header className="flex items-center gap-6 mb-8">
          <button 
            onClick={() => { setSelectedWord(null); setShowTranslations(false); }} 
            className="bg-white p-3 rounded-full soft-shadow text-black/20 hover:text-black transition-colors"
          >
            <ChevronLeft size={20} strokeWidth={3} />
          </button>
          <h2 className="text-3xl font-black tracking-tight">Detail</h2>
        </header>

        <div className="bg-white rounded-[2.5rem] overflow-hidden soft-shadow border border-gray-100">
          <div className="h-24 px-8 flex justify-between items-center" style={{ backgroundColor: themeColor }}>
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-black/30" />
              <span className="text-xs font-black uppercase tracking-widest text-black/40">
                Word Profile
              </span>
            </div>
            <div className="bg-black/10 px-4 py-2 rounded-full text-[10px] font-black uppercase text-black/60">
              Level {selectedWord.level}
            </div>
          </div>

          <div className="p-8 space-y-8">
            <section>
              <h1 className="text-5xl font-black text-black tracking-tighter mb-2">{selectedWord.term}</h1>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-[#4A86FF] font-mono">{selectedWord.phonetic}</span>
                <button 
                  onClick={() => playTTS(selectedWord.term)}
                  className="bg-[#D1E1FF] p-2 rounded-full text-[#4A86FF] hover:scale-110 transition-transform"
                  title="Word Pronunciation"
                >
                  <Volume2 size={18} strokeWidth={2.5} />
                </button>
              </div>
            </section>

            <div className="space-y-6">
              <div className="p-6 bg-[#F8F9FB] rounded-3xl border border-gray-100">
                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                  <BookOpen size={14} /> Definitions
                </div>
                <p className="text-xl font-bold text-black mb-2">{selectedWord.definitionCn}</p>
                <p className="text-sm font-medium text-gray-400 italic leading-relaxed">{selectedWord.definitionEn}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <Quote size={14} /> Usage Examples
                  </div>
                  <button 
                    onClick={() => setShowTranslations(!showTranslations)}
                    className={`flex items-center gap-1.5 text-[10px] font-black uppercase transition-colors px-3 py-1.5 rounded-full ${showTranslations ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}
                  >
                    {showTranslations ? <EyeOff size={12} /> : <Eye size={12} />}
                    {showTranslations ? 'Hide Translation' : 'Show Translation'}
                  </button>
                </div>
                
                <div className="space-y-3">
                  {selectedWord.sentences.map((sentence, idx) => (
                    <div key={idx} className="p-5 bg-white border border-gray-100 rounded-2xl soft-shadow relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: themeColor }}></div>
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-sm font-bold text-gray-600 leading-relaxed group-hover:text-black transition-colors flex-1">
                            {sentence}
                          </p>
                          <button 
                            onClick={() => playTTS(sentence)}
                            className="text-gray-300 hover:text-[#4A86FF] transition-colors p-1"
                            title="Sentence Pronunciation"
                          >
                            <Volume2 size={16} />
                          </button>
                        </div>
                        {showTranslations && selectedWord.sentenceTranslations && selectedWord.sentenceTranslations[idx] && (
                          <p className="text-xs font-medium text-gray-400 italic border-t border-gray-50 pt-2 animate-in fade-in slide-in-from-top-1 duration-300">
                            {selectedWord.sentenceTranslations[idx]}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={() => { setSelectedWord(null); setShowTranslations(false); }}
          className="w-full mt-8 bg-black text-white py-5 rounded-[1.5rem] font-black shadow-xl shadow-black/10 hover:scale-[1.02] transition-transform"
        >
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <header className="flex items-center gap-6 mb-10">
        <button onClick={onBack} className="bg-white p-3 rounded-full soft-shadow text-black/20 hover:text-black transition-colors">
          <ChevronLeft size={20} strokeWidth={3} />
        </button>
        <h2 className="text-3xl font-black tracking-tight">{title}</h2>
      </header>

      <div className="bg-white rounded-[2rem] p-4 soft-shadow flex items-center gap-3 mb-8">
        <Search size={20} className="text-gray-300" />
        <input 
          type="text" 
          placeholder="Search your library..." 
          className="flex-1 bg-transparent text-sm font-bold placeholder:text-gray-300 focus:outline-none" 
        />
      </div>

      {words.length === 0 ? (
        <div className="text-center py-20 text-gray-300 font-bold italic">
          No records found yet.
        </div>
      ) : (
        <div className="space-y-6">
          {words.map((word, i) => (
            <div 
              key={word.id} 
              onClick={() => setSelectedWord(word)}
              className="bg-white rounded-[2rem] overflow-hidden soft-shadow border border-gray-100 ticket-cut animate-in slide-in-from-bottom-4 cursor-pointer hover:scale-[1.01] transition-transform group" 
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="h-14 px-6 flex justify-between items-center" style={{ backgroundColor: colors[i % colors.length] }}>
                <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Level {word.level}</span>
                <span className="text-[10px] font-black text-black/40 italic">Ref: {word.id.slice(0, 8)}</span>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-black text-black group-hover:text-[#4A86FF] transition-colors">{word.term}</h3>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-xs font-bold text-[#4A86FF]">{word.phonetic}</span>
                       <button 
                         onClick={(e) => { e.stopPropagation(); playTTS(word.term); }} 
                         className="text-gray-300 hover:text-black transition-colors"
                       >
                        <Volume2 size={14} />
                       </button>
                    </div>
                  </div>
                  <div className="bg-black text-white px-4 py-2 rounded-full text-[10px] font-black uppercase group-hover:bg-[#4A86FF] transition-colors">
                    View detail
                  </div>
                </div>
                
                <p className="text-sm font-bold text-gray-500 mb-6 line-clamp-1">{word.definitionCn}</p>
                
                <div className="pt-4 border-t border-dashed border-gray-100 flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-[10px] font-black">EX</div>
                   <p className="text-[10px] font-medium text-gray-400 italic flex-1 line-clamp-1">"{word.sentences[0]}"</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WordList;
