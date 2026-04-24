
import React, { useState, useEffect, useRef } from 'react';
import { Word } from '../types';
import { generateQuizDistractors, evaluatePronunciation, playTTS } from '../geminiClient';
import { Volume2, Mic, Check, X, ArrowRight, Loader2, Zap, Sparkles, Brain } from 'lucide-react';

interface Props {
  words: Word[];
  onFinish: () => void;
  onResult: (id: string, correct: boolean) => void;
}

type Step = 'meaning' | 'spelling' | 'pronunciation';

const StudySession: React.FC<Props> = ({ words, onFinish, onResult }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [step, setStep] = useState<Step>('meaning');
  const [options, setOptions] = useState<string[]>([]);
  const [spellingInput, setSpellingInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [pronunciationResult, setPronunciationResult] = useState<{ score: number; feedback: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isWrong, setIsWrong] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  const currentWord = words[currentIndex];

  const buildFallbackOptions = (correctDefinition: string): string[] => [
    '与该词无关的释义',
    '另一个常见但错误的释义',
    '上下文不匹配的释义',
    correctDefinition,
  ].sort(() => Math.random() - 0.5);

  useEffect(() => {
    if (currentWord && step === 'meaning') loadOptions();
  }, [currentWord, step]);

  const loadOptions = async () => {
    if (!currentWord) return;
    setLoading(true);
    try {
      const distractors = await generateQuizDistractors(currentWord.term, currentWord.definitionCn);
      setOptions([...distractors, currentWord.definitionCn].sort(() => Math.random() - 0.5));
    } catch (error) {
      console.error('Failed to load distractor options', error);
      setOptions(buildFallbackOptions(currentWord.definitionCn));
    } finally {
      setLoading(false);
    }
  };

  const playClick = () => {
    if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioContextRef.current.createOscillator();
    const gain = audioContextRef.current.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, audioContextRef.current.currentTime);
    gain.gain.setValueAtTime(0.05, audioContextRef.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(audioContextRef.current.destination);
    osc.start();
    osc.stop(audioContextRef.current.currentTime + 0.1);
  };

  const handleMeaningSelect = (option: string) => {
    if (option === currentWord.definitionCn) setStep('spelling');
    else triggerWrong();
  };

  const handleSpellingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (spellingInput.trim().toLowerCase() === currentWord.term.toLowerCase()) {
      triggerCorrect();
    } else {
      triggerWrong();
    }
  };

  const triggerWrong = () => {
    setIsWrong(true);
    setTimeout(() => setIsWrong(false), 500);
  };

  const triggerCorrect = () => {
    setIsCorrect(true);
    setTimeout(() => {
      setIsCorrect(false);
      setStep('pronunciation');
    }, 800);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        setLoading(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          const result = await evaluatePronunciation(currentWord.term, base64);
          setPronunciationResult(result);
          setLoading(false);
        };
      };
      recorder.start();
      setIsRecording(true);
    } catch (err) { console.error(err); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const nextWord = (success: boolean) => {
    onResult(currentWord.id, success);
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setStep('meaning');
      setSpellingInput('');
      setPronunciationResult(null);
    } else onFinish();
  };

  if (!currentWord) return (
    <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-4">
      <Sparkles size={48} className="text-yellow-400 animate-bounce" />
      <h2 className="text-2xl font-black">Memory Sync Complete!</h2>
      <p className="text-gray-400 font-medium italic">Your forgetting curve has been updated.</p>
      <button onClick={onFinish} className="bg-black text-white px-10 py-4 rounded-2xl font-black">Go Back</button>
    </div>
  );

  return (
    <div className={`space-y-8 animate-in fade-in duration-500 ${isWrong ? 'animate-shake' : ''}`}>
      <div className="flex justify-between items-center mb-6 px-2">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-gray-400" />
          <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            SRS Stage {currentWord.level}
          </h2>
        </div>
        <div className="flex gap-1">
          {words.slice(0, 10).map((_, i) => (
            <div key={i} className={`w-4 h-1 rounded-full ${i <= currentIndex ? 'bg-black' : 'bg-gray-200'}`}></div>
          ))}
        </div>
      </div>

      <div className={`bg-white p-8 rounded-[2.5rem] soft-shadow border border-gray-100 min-h-[450px] flex flex-col items-center justify-center text-center transition-all relative ${isCorrect ? 'ring-4 ring-green-400 border-green-400' : ''}`}>
        <div className="absolute top-6 left-6">
          {isCorrect ? <Sparkles size={24} className="text-green-500 animate-bounce" /> : <Zap size={24} className="text-yellow-400 fill-current" />}
        </div>

        {step === 'meaning' && (
          <div className="w-full space-y-10 animate-in slide-in-from-right-4">
            <h1 className="text-5xl font-black text-black tracking-tighter">{currentWord.term}</h1>
            <div className="grid grid-cols-1 gap-3 w-full">
              {loading ? (
                <div className="py-10" data-testid="loading-spinner"><Loader2 className="animate-spin mx-auto text-black/10" size={40} /></div>
              ) : (
                options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleMeaningSelect(opt)}
                    className="w-full py-5 px-6 rounded-2xl bg-[#F8F9FB] border-2 border-transparent hover:border-black font-bold transition-all text-gray-600 hover:text-black"
                  >
                    {opt}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {step === 'spelling' && (
          <div className="w-full space-y-10 animate-in slide-in-from-right-4">
            <h3 className="text-2xl font-black text-black/30 tracking-tight">{currentWord.definitionCn}</h3>
            <form onSubmit={handleSpellingSubmit} className="relative">
              <input
                autoFocus
                type="text"
                value={spellingInput}
                onChange={(e) => { setSpellingInput(e.target.value.toLowerCase()); playClick(); }}
                placeholder="type here..."
                disabled={isCorrect}
                className={`w-full text-center text-5xl font-black bg-transparent border-none focus:outline-none placeholder:text-black/5 transition-colors ${isCorrect ? 'text-green-500' : 'text-black'}`}
              />
              <div className={`w-24 h-1 mx-auto mt-4 rounded-full transition-colors ${isCorrect ? 'bg-green-500' : 'bg-black'}`}></div>
              
              {isCorrect && (
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 text-green-500 font-black animate-in slide-in-from-top-2">
                  <Check size={24} strokeWidth={3} /> Correct!
                </div>
              )}
            </form>
          </div>
        )}

        {step === 'pronunciation' && (
          <div className="w-full space-y-10 animate-in slide-in-from-right-4">
            <div className="space-y-4">
              <h1 className="text-5xl font-black text-black tracking-tighter">{currentWord.term}</h1>
              <button 
                onClick={() => playTTS(currentWord.term)}
                className="flex items-center gap-2 mx-auto text-[#4A86FF] font-black uppercase text-xs tracking-widest bg-[#D1E1FF] px-4 py-2 rounded-full"
              >
                <Volume2 size={16} /> {currentWord.phonetic}
              </button>
            </div>

            {!pronunciationResult ? (
              <div className="flex flex-col items-center gap-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Hold to Speak</p>
                <button
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                    isRecording ? 'bg-red-400 scale-125 shadow-2xl shadow-red-200' : 'bg-black text-white'
                  }`}
                >
                  <Mic size={32} strokeWidth={3} />
                </button>
              </div>
            ) : (
              <div className="animate-in zoom-in-95 duration-300 bg-[#F8F9FB] p-8 rounded-[2rem] border border-gray-100">
                <div className="text-6xl font-black mb-2">{pronunciationResult.score}</div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
                  {pronunciationResult.score > 70 ? 'Memory Strengthened' : 'Needs Reinforcement'}
                </p>
                <button 
                  onClick={() => nextWord(pronunciationResult.score > 70)}
                  className="bg-black text-white px-10 py-4 rounded-full font-black flex items-center gap-2 mx-auto shadow-xl shadow-black/20"
                >
                  Continue <ArrowRight size={20} strokeWidth={3} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-4 space-y-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Memory Hint</h4>
        <div className="bg-[#D1E1FF] p-6 rounded-[2rem] text-sm text-[#4A86FF] font-bold leading-relaxed relative">
           "{currentWord.sentences[0]}"
           <div className="absolute -top-3 -left-2 w-8 h-8 bg-white rounded-full flex items-center justify-center soft-shadow text-xs">💡</div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
};

export default StudySession;
