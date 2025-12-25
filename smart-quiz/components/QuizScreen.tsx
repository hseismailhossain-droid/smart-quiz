
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, Timer, CheckCircle2, ArrowRight, Trophy, AlertCircle, RefreshCw, Loader2, X, Sparkles, Clock, HelpCircle, ArrowLeft, Hash } from 'lucide-react';
import { generateQuestions } from '../services/geminiService';
import { Question, QuizResult } from '../types';
import { auth, db } from '../services/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { Language, translations } from '../services/translations';

interface QuizScreenProps {
  subject: string;
  onClose: () => void;
  onFinish: (result: QuizResult) => void;
  numQuestions: number;
  timePerQuestion: number;
  isPaid?: boolean;
  quizId?: string;
  lang: Language;
}

const QuizScreen: React.FC<QuizScreenProps> = ({ 
  subject, onClose, onFinish, numQuestions, timePerQuestion, isPaid, quizId, lang
}) => {
  const t = translations[lang];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timer, setTimer] = useState(timePerQuestion);
  const [mistakes, setMistakes] = useState<Question[]>([]);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (quizId && quizId !== 'mock') {
        const d = await getDoc(doc(db, 'mock_quizzes', quizId));
        if (d.exists() && d.data().manualQuestions) {
          setQuestions(d.data().manualQuestions);
          setLoading(false);
          return;
        }
      }
      const data = await generateQuestions(subject, numQuestions, lang);
      if (data && !data.error) {
        setQuestions(data);
      } else {
        throw new Error(data?.details || "Failed to load questions");
      }
    } catch (e: any) {
      console.error("Quiz load error:", e);
      setError({ message: lang === 'bn' ? "প্রশ্নপত্র লোড করা সম্ভব হয়নি। পুনরায় চেষ্টা করুন।" : "Questions failed to load. Please try again." });
    } finally {
      setLoading(false);
    }
  }, [subject, numQuestions, quizId, lang]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  useEffect(() => {
    if (loading || finished || isAnswered || error || questions.length === 0) return;
    const interval = setInterval(() => {
      setTimer(ti => {
        if (ti <= 1) { handleAnswer(-1); return 0; }
        return ti - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, finished, isAnswered, error, questions]);

  const handleAnswer = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);
    if (idx === questions[currentIndex].correctAnswer) setScore(s => s + 1);
    else setMistakes(p => [...p, questions[currentIndex]]);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimer(timePerQuestion);
    } else setFinished(true);
  };

  // স্ক্রিনশট অনুযায়ী লোডিং স্ক্রিন
  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10 text-center font-['Hind_Siliguri'] relative max-w-md mx-auto">
      {/* ফিরে আসুন বাটন */}
      <button 
        onClick={onClose} 
        className="absolute top-10 left-6 flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-[12px] text-slate-700 hover:text-emerald-700 transition-all active:scale-95 border border-slate-200 shadow-sm"
      >
        <ChevronLeft size={16} strokeWidth={3} />
        <span className="font-bold text-[12px]">{lang === 'bn' ? 'ফিরে আসুন' : 'Back'}</span>
      </button>

      <div className="relative mb-10 mt-12">
        <div className="w-20 h-20 border-[6px] border-slate-50 border-t-emerald-700 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="text-emerald-700/40 animate-pulse" size={28} />
        </div>
      </div>

      <h2 className="text-xl font-black text-slate-800 mb-2">{lang === 'bn' ? 'প্রশ্নপত্র লোড হচ্ছে...' : 'Loading Questions...'}</h2>
      <p className="text-[11px] text-slate-400 font-bold mb-12 leading-tight">
        {lang === 'bn' ? 'অনুগ্রহ করে অপেক্ষা করুন, AI প্রশ্ন সাজাচ্ছে' : 'Please wait, AI is generating your test'}
      </p>

      {/* কুইজ ইনফো কার্ডস (স্ক্রিনশট অনুযায়ী) */}
      <div className="flex gap-4 w-full">
        <div className="flex-1 bg-emerald-50/50 p-5 rounded-[24px] border border-emerald-100/50 flex flex-col items-center justify-center min-h-[100px] shadow-sm">
           <Hash size={24} className="text-emerald-600 mb-2" />
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{lang === 'bn' ? 'প্রশ্ন' : 'Questions'}</span>
           <span className="text-2xl font-black text-emerald-800">{numQuestions}</span>
        </div>
        <div className="flex-1 bg-blue-50/50 p-5 rounded-[24px] border border-blue-100/50 flex flex-col items-center justify-center min-h-[100px] shadow-sm">
           <Clock size={24} className="text-blue-600 mb-2" />
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{lang === 'bn' ? 'সময়/প্রশ্ন' : 'Time/Q'}</span>
           <span className="text-2xl font-black text-blue-800">{timePerQuestion === 60 ? '1m' : `${timePerQuestion}s`}</span>
        </div>
      </div>
    </div>
  );

  // এরর হ্যান্ডলিং
  if (error || (questions && questions.length === 0)) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10 text-center font-['Hind_Siliguri'] relative max-w-md mx-auto">
      <button 
        onClick={onClose} 
        className="absolute top-10 left-6 flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-slate-700 border border-slate-200"
      >
        <ChevronLeft size={16} strokeWidth={3} />
        <span className="font-bold text-[12px]">{lang === 'bn' ? 'ফিরে যান' : 'Back'}</span>
      </button>

      <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6">
        <AlertCircle size={40} />
      </div>
      <h2 className="text-xl font-black text-slate-800 mb-2">{error?.message || (lang === 'bn' ? "কোনো প্রশ্ন পাওয়া যায়নি" : "No questions found")}</h2>
      <p className="text-sm text-slate-400 font-bold mb-8">{lang === 'bn' ? "অনুগ্রহ করে ইন্টারনেট চেক করে পুনরায় চেষ্টা করুন" : "Please check your internet and try again"}</p>
      
      <button onClick={loadQuestions} className="w-full bg-emerald-700 text-white py-5 rounded-[24px] font-black flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
        <RefreshCw size={20} /> {lang === 'bn' ? 'আবার চেষ্টা করুন' : 'Try Again'}
      </button>
    </div>
  );

  if (finished) return (
    <div className="min-h-screen bg-white p-8 flex flex-col items-center justify-center text-center font-['Hind_Siliguri'] max-w-md mx-auto">
      <Trophy size={80} className="text-emerald-700 mb-6" />
      <h2 className="text-3xl font-black text-slate-900 mb-2">{lang === 'bn' ? 'কুইজ শেষ!' : 'Quiz Finished!'}</h2>
      <div className="bg-slate-50 p-10 rounded-[44px] w-full mb-10">
        <p className="text-5xl font-black text-emerald-700">{score} / {questions.length}</p>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">{t.points}</p>
      </div>
      <button onClick={onClose} className="w-full bg-slate-900 text-white py-6 rounded-[32px] font-black text-lg shadow-xl active:scale-95 transition-all">{lang === 'bn' ? 'হোমে ফিরে যান' : 'Back Home'}</button>
    </div>
  );

  const q = questions[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-['Hind_Siliguri'] max-w-md mx-auto">
      <div className="bg-white p-5 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><ChevronLeft size={24}/></button>
        <div className="text-center">
           <p className="font-black text-slate-800 text-xs truncate max-w-[150px]">{subject}</p>
           <p className="text-[10px] text-slate-400 font-bold uppercase">{currentIndex + 1}/{questions.length}</p>
        </div>
        <div className={`px-4 py-2 rounded-2xl font-black text-sm ${timer < 10 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-emerald-50 text-emerald-700'}`}>
          <Timer size={16} className="inline mr-1" /> {timer}s
        </div>
      </div>

      <div className="p-6 flex-grow overflow-y-auto no-scrollbar">
        <div className="bg-white p-10 rounded-[48px] shadow-sm mb-10 border border-slate-100 text-center min-h-[150px] flex items-center justify-center">
           <h3 className="text-xl font-black text-slate-900 leading-relaxed">{q.question}</h3>
        </div>
        
        <div className="space-y-4">
          {q.options.map((opt, idx) => (
            <button 
              key={idx} 
              disabled={isAnswered} 
              onClick={() => handleAnswer(idx)}
              className={`w-full p-6 rounded-[32px] text-left font-black border-2 transition-all flex justify-between items-center ${
                isAnswered ? (
                  idx === q.correctAnswer ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 
                  idx === selectedOption ? 'bg-rose-500 border-rose-500 text-white shadow-lg' : 'bg-white border-slate-50 opacity-40'
                ) : (
                  selectedOption === idx ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100'
                )
              }`}
            >
              <span className="text-sm pr-4">{opt}</span>
              {isAnswered && idx === q.correctAnswer && <CheckCircle2 size={20}/>}
            </button>
          ))}
        </div>
      </div>

      {isAnswered && (
        <div className="p-8 bg-white border-t rounded-t-[44px] animate-in slide-in-from-bottom duration-300">
           <button onClick={handleNext} className="w-full bg-emerald-700 text-white py-6 rounded-[32px] font-black flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
             {currentIndex === questions.length - 1 ? (lang === 'bn' ? 'ফলাফল দেখুন' : 'View Results') : (lang === 'bn' ? 'পরবর্তী প্রশ্ন' : 'Next Question')} <ArrowRight size={20}/>
           </button>
        </div>
      )}
    </div>
  );
};

export default QuizScreen;
