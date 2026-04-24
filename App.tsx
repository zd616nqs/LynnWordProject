
import React, { useState, useEffect } from 'react';
import { Word, AppView, ActivityLog } from './types';
import Dashboard from './components/Dashboard';
import WordInput from './components/WordInput';
import WordList from './components/WordList';
import StudySession from './components/StudySession';
import Calendar from './components/Calendar';
import { Home, Plus, Book, CheckCircle2 } from 'lucide-react';
import { getLocalDateKey } from './utils/date';
import { buildStudyQueue, getNextLevel } from './utils/study';

const STORAGE_KEY = 'buddy_vocab_data_v2'; // Versioned key for new SRS logic
const ACTIVITY_KEY = 'buddy_vocab_activity_v2';

const App: React.FC = () => {
  const [words, setWords] = useState<Word[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog>({});
  const [view, setView] = useState<AppView>('dashboard');
  const [showCalendar, setShowCalendar] = useState(false);
  const [studyQueue, setStudyQueue] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

  // Ebbinghaus Forgetting Curve Intervals (in hours)
  // Stage: 0 (5m), 1 (30m), 2 (12h), 3 (24h), 4 (48h), 5 (96h), 6 (168h), 7 (360h/15d)
  const SRS_INTERVALS_HOURS = [0.08, 0.5, 12, 24, 48, 96, 168, 360];

  useEffect(() => {
    const savedWords = localStorage.getItem(STORAGE_KEY);
    const savedActivity = localStorage.getItem(ACTIVITY_KEY);
    if (savedWords) {
      try { setWords(JSON.parse(savedWords)); } catch (e) { console.error(e); }
    }
    if (savedActivity) {
      try { setActivityLog(JSON.parse(savedActivity)); } catch (e) { console.error(e); }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
      localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activityLog));
    }
  }, [words, activityLog, loading]);

  const markActivity = (type: 'added' | 'reviewed') => {
    const today = getLocalDateKey();
    setActivityLog(prev => ({
      ...prev,
      [today]: {
        ...prev[today],
        [type]: true
      }
    }));
  };

  const addOrUpdateWord = (newWord: Omit<Word, 'id' | 'level' | 'nextReviewDate' | 'isMastered' | 'lastEncountered' | 'encounterCount'>) => {
    const existingIndex = words.findIndex(w => w.term.toLowerCase() === newWord.term.toLowerCase());
    
    if (existingIndex >= 0) {
      const updatedWords = [...words];
      const word = updatedWords[existingIndex];
      // Reset level slightly but keep it in SRS if encountered again
      const newLevel = Math.max(0, word.level - 1);
      updatedWords[existingIndex] = {
        ...word,
        encounterCount: word.encounterCount + 1,
        lastEncountered: Date.now(),
        level: newLevel,
        nextReviewDate: Date.now() + (SRS_INTERVALS_HOURS[newLevel] * 60 * 60 * 1000),
        isMastered: false
      };
      setWords(updatedWords);
    } else {
      const word: Word = {
        ...newWord,
        id: crypto.randomUUID(),
        level: 0,
        nextReviewDate: Date.now(), // Due immediately for initial learning
        encounterCount: 1,
        lastEncountered: Date.now(),
        isMastered: false
      };
      setWords(prev => [word, ...prev]);
    }
    markActivity('added');
    setView('dashboard');
  };

  const updateWordLevel = (id: string, correct: boolean) => {
    setWords(prev => prev.map(w => {
      if (w.id === id) {
        let newLevel: number;
        newLevel = getNextLevel(w.level, correct);
        
        const nextReview = Date.now() + (SRS_INTERVALS_HOURS[newLevel] * 60 * 60 * 1000);
        return {
          ...w,
          level: newLevel,
          nextReviewDate: nextReview,
          isMastered: newLevel === 7
        };
      }
      return w;
    }));
  };

  const handleStudyFinish = () => {
    markActivity('reviewed');
    setStudyQueue([]);
    setView('dashboard');
  };

  const handleStartStudy = () => {
    // Snapshot due words at session start so SRS updates don't reshuffle the active session.
    const dueWords = buildStudyQueue(words);
    setStudyQueue(dueWords);
    setView('study');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB]">
      <div className="text-gray-400 font-medium animate-pulse">Initializing SRS Engine...</div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-[#F8F9FB] relative shadow-2xl overflow-hidden">
      <main className="flex-1 overflow-y-auto pb-32 pt-8 px-6">
        {view === 'dashboard' && (
          <Dashboard 
            words={words} 
            onStartStudy={handleStartStudy}
            onAddWord={() => setView('add')} 
            onOpenCalendar={() => setShowCalendar(true)}
          />
        )}
        {view === 'add' && (
          <WordInput onAdd={addOrUpdateWord} onCancel={() => setView('dashboard')} />
        )}
        {view === 'list' && (
          <WordList 
            words={words.filter(w => !w.isMastered)} 
            title="Active Learning" 
            onBack={() => setView('dashboard')} 
          />
        )}
        {view === 'mastered' && (
          <WordList 
            words={words.filter(w => w.isMastered)} 
            title="Mastered Library" 
            onBack={() => setView('dashboard')} 
          />
        )}
        {view === 'study' && (
          <StudySession 
            words={studyQueue}
            onFinish={handleStudyFinish}
            onResult={updateWordLevel}
          />
        )}
      </main>

      {showCalendar && (
        <Calendar 
          activityLog={activityLog} 
          onClose={() => setShowCalendar(false)} 
        />
      )}

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white/90 backdrop-blur-xl border border-white/20 rounded-[2.5rem] flex justify-around py-4 soft-shadow z-40">
        <button onClick={() => { setView('dashboard'); setShowCalendar(false); }} className={`flex flex-col items-center p-2 rounded-full transition-all ${view === 'dashboard' && !showCalendar ? 'text-black scale-110' : 'text-gray-300'}`}>
          <Home size={24} strokeWidth={view === 'dashboard' && !showCalendar ? 2.5 : 2} />
        </button>
        <button onClick={() => { setView('add'); setShowCalendar(false); }} className={`flex flex-col items-center p-2 rounded-full transition-all ${view === 'add' ? 'text-black scale-110' : 'text-gray-300'}`}>
          <Plus size={24} strokeWidth={view === 'add' ? 2.5 : 2} />
        </button>
        <button onClick={() => { setView('list'); setShowCalendar(false); }} className={`flex flex-col items-center p-2 rounded-full transition-all ${view === 'list' ? 'text-black scale-110' : 'text-gray-300'}`}>
          <Book size={24} strokeWidth={view === 'list' ? 2.5 : 2} />
        </button>
        <button onClick={() => { setView('mastered'); setShowCalendar(false); }} className={`flex flex-col items-center p-2 rounded-full transition-all ${view === 'mastered' ? 'text-black scale-110' : 'text-gray-300'}`}>
          <CheckCircle2 size={24} strokeWidth={view === 'mastered' ? 2.5 : 2} />
        </button>
      </nav>
    </div>
  );
};

export default App;
