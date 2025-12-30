
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, Timer, CheckCircle2, ArrowRight, Trophy, Bookmark, BookmarkCheck, PlayCircle, Info } from 'lucide-react';
import { generateQuestions } from '../services/geminiService';
import { Question, QuizResult, AdPlacement } from '../types';
import { db, auth } from '../services/firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import AdRenderer from './AdRenderer';

interface QuizScreenProps {
  subject: string;
  onClose: () => void;
  onFinish: (result: QuizResult & { mistakes?: Question[] }) => void;
  numQuestions: number;
  timePerQuestion: number;
  isPaid?: boolean;
  quizId?: string;
  collectionName?: string;
  lang: any;
}

const QuizScreen: React.FC<QuizScreenProps> = ({ 
  subject, onClose, onFinish, numQuestions, timePerQuestion, isPaid, quizId, collectionName, lang
}) => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [mistakes, setMistakes] = useState<Question[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timer, setTimer] = useState(timePerQuestion);
  const [ads, setAds] = useState<Record<string, AdPlacement>>({});

  useEffect(() => {
    onSnapshot(collection(db, 'ad_placements'), (snap) => {
      const data: any = {};
      snap.docs.forEach(d => data[d.id] = d.data());
      setAds(data);
    });

    const load = async () => {
      setLoading(true);
      try {
        let fetched: Question[] = [];
        if (quizId && quizId !== 'mock') {
          const snap = await getDoc(doc(db, collectionName || 'mock_quizzes', quizId));
          if (snap.exists()) {
             fetched = snap.data().manualQuestions || snap.data().questions || [];
          }
        }
        if (fetched.length === 0) {
          const data = await generateQuestions(subject, numQuestions, lang);
          if (data && !data.error) fetched = data;
        }
        setQuestions(fetched.slice(0, numQuestions));
      } catch (e) { alert("Error loading questions"); }
      finally { setLoading(false); }
    };
    load();
  }, [quizId]);

  useEffect(() => {
    if (loading || finished || isAnswered || questions.length === 0) return;
    const interval = setInterval(() => {
      setTimer(ti => {
        if (ti <= 1) { handleAnswer(-1); return 0; }
        return ti - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, finished, isAnswered, questions]);

  const handleAnswer = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);
    if (idx === questions[currentIndex].correctAnswer) {
      setCorrectCount(c => c + 1);
      setScore(s => s + 1);
    } else {
      setWrongCount(w => w + 1);
      setMistakes(prev => [...prev, questions[currentIndex]]);
      if (isPaid) setScore(s => s - 0.25);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimer(timePerQuestion);
    } else setFinished(true);
  };

  const renderMedia = (q: Question) => {
    if (!q.mediaUrl || q.mediaType === 'none') return null;
    
    if (q.mediaType === 'image') {
      return (
        <div className="mb-6 rounded-3xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
           <img src={q.mediaUrl} className="w-full h-auto max-h-48 object-contain mx-auto" alt="Quiz" />
        </div>
      );
    }
    
    if (q.mediaType === 'video') {
      const vidUrl = q.mediaUrl;
      const vidId = vidUrl.includes('v=') ? vidUrl.split('v=')[1]?.split('&')[0] : vidUrl.split('/').pop();
      return (
        <div className="mb-6 rounded-3xl overflow-hidden border bg-black shadow-lg aspect-video">
           <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${vidId}`} frameBorder="0" allowFullScreen></iframe>
        </div>
      );
    }
    return null;
  };

  if (loading) return (
    <div className="h-full w-full bg-white flex flex-col items-center justify-center font-black p-10 text-center">
      <div className="w-16 h-16 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin mb-6"></div>
      <p className="text-slate-900 text-lg">প্রশ্নপত্র তৈরি হচ্ছে...</p>
      <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest">AI magic in progress</p>
    </div>
  );

  if (finished) return (
    <div className="h-full w-full bg-white p-8 flex flex-col items-center justify-center text-center max-w-md mx-auto safe-pb">
      <Trophy size={80} className="text-emerald-700 mb-6 animate-bounce" />
      <h2 className="text-3xl font-black text-slate-900 mb-10">কুইজ শেষ!</h2>
      <div className="bg-slate-50 p-10 rounded-[44px] w-full mb-10 border border-slate-100 shadow-inner">
        <p className="text-6xl font-black text-emerald-700">{score.toFixed(2)}</p>
        <p className="text-[10px] font-black text-slate-400 uppercase mt-4 tracking-widest">আপনার মোট মার্কস</p>
      </div>
      <button onClick={() => onFinish({ score: Number(score.toFixed(2)), total: questions.length, subject, date: new Date().toLocaleDateString(), quizId, mistakes })} className="w-full bg-slate-900 text-white py-6 rounded-[32px] font-black text-lg shadow-2xl active:scale-95 transition-all">ফলাফল জমা দিন</button>
    </div>
  );

  const q = questions[currentIndex];

  return (
    <div className="h-full w-full bg-[#fcfdfe] flex flex-col font-['Hind_Siliguri'] max-w-md mx-auto relative overflow-hidden">
      <div className="bg-white p-5 flex items-center justify-between shadow-sm sticky top-0 z-50 safe-pt">
        <button onClick={onClose} className="p-3 bg-slate-50 rounded-2xl text-slate-400 active:scale-90"><ChevronLeft size={24}/></button>
        <div className="text-center flex-grow px-4">
           <p className="font-black text-slate-800 text-sm truncate">{subject}</p>
           <div className="flex items-center justify-center gap-2 mt-0.5">
              <div className="h-1 w-16 bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}></div>
              </div>
              <p className="text-[10px] text-slate-400 font-black">{currentIndex + 1}/{questions.length}</p>
           </div>
        </div>
        <div className={`w-12 h-12 rounded-2xl font-black text-sm flex items-center justify-center shadow-sm transition-colors ${timer < 10 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-emerald-50 text-emerald-700'}`}>{timer}</div>
      </div>

      <div className="flex-grow overflow-y-auto no-scrollbar p-6">
        <AdRenderer placement={ads['quiz_start']} className="mb-6" />

        <div className="bg-white p-8 rounded-[44px] shadow-[0_10px_30px_rgba(0,0,0,0.02)] mb-8 border border-slate-100/50 text-center animate-in zoom-in-95 duration-300">
           {renderMedia(q)}
           <h3 className="text-[19px] font-black text-slate-900 leading-relaxed">{q.question}</h3>
        </div>
        
        <div className="space-y-4">
          {q.options.map((opt, idx) => (
            <button 
              key={idx} 
              disabled={isAnswered} 
              onClick={() => handleAnswer(idx)}
              className={`w-full p-6 rounded-[30px] text-left font-black border-2 transition-all flex justify-between items-center group active:scale-[0.98] ${
                isAnswered ? (
                  idx === q.correctAnswer ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-700/20' : 
                  idx === selectedOption ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white opacity-40 grayscale-[0.5]'
                ) : 'bg-white border-slate-100 hover:border-emerald-200'
              }`}
            >
              <span className="text-sm pr-4">{opt}</span>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isAnswered && idx === q.correctAnswer ? 'bg-white border-white' : 'border-slate-100 group-hover:border-emerald-200'}`}>
                 {isAnswered && idx === q.correctAnswer && <CheckCircle2 size={16} className="text-emerald-600"/>}
              </div>
            </button>
          ))}
        </div>

        {isAnswered && (
          <div className="mt-8 p-8 bg-blue-50/50 rounded-[40px] border border-blue-100 animate-in slide-in-from-bottom-6 duration-500 mb-10">
             <div className="flex gap-4 mb-8">
                <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shrink-0 shadow-sm"><Info size={20} /></div>
                <div>
                   <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">ব্যাখ্যা (AI Explanation)</p>
                   <p className="text-[13px] text-blue-900 font-bold leading-relaxed">{q.explanation || 'ব্যাখ্যা দেওয়া হয়নি।'}</p>
                </div>
             </div>
             <button onClick={handleNext} className="w-full bg-emerald-700 text-white py-5 rounded-[28px] font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-emerald-700/20 active:scale-95 transition-all">
               {currentIndex === questions.length - 1 ? 'ফলাফল দেখুন' : 'পরবর্তী প্রশ্ন'} <ArrowRight size={22}/>
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizScreen;
