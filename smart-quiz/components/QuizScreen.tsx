
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
  onFinish: (result: QuizResult) => void;
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
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timer, setTimer] = useState(timePerQuestion);
  const [ads, setAds] = useState<Record<string, AdPlacement>>({});

  useEffect(() => {
    // Fetch Ads Real-time
    const unsubAds = onSnapshot(collection(db, 'ad_placements'), (snap) => {
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
          if (snap.exists()) fetched = snap.data().manualQuestions || [];
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
    return () => unsubAds();
  }, []);

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
      if (isPaid) setScore(s => s - 0.25); // Negative marking for paid mode
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

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10 max-w-md mx-auto">
      <div className="w-16 h-16 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin mb-6"></div>
      <h2 className="text-xl font-black text-slate-800">প্রশ্নপত্র লোড হচ্ছে...</h2>
      <p className="text-xs text-slate-400 mt-2 font-bold uppercase animate-pulse">অনুগ্রহ করে অপেক্ষা করুন</p>
    </div>
  );

  if (finished) return (
    <div className="min-h-screen bg-white p-8 flex flex-col items-center justify-center text-center max-w-md mx-auto animate-in zoom-in-95">
      <Trophy size={80} className="text-emerald-700 mb-6 drop-shadow-xl" />
      <h2 className="text-3xl font-black text-slate-900 mb-6">কুইজ শেষ!</h2>
      
      {/* Result Ad */}
      <AdRenderer placement={ads['quiz_end']} className="mb-6" />

      <div className="bg-slate-50 p-10 rounded-[44px] w-full mb-10 border border-slate-100 shadow-inner">
        <p className="text-5xl font-black text-emerald-700">{score.toFixed(2)}</p>
        <p className="text-[10px] font-black text-slate-400 uppercase mt-4 tracking-widest">আপনার মার্কস</p>
        <div className="flex justify-center gap-4 mt-6">
           <div className="text-center">
              <p className="font-black text-emerald-600">{correctCount}</p>
              <p className="text-[8px] font-black uppercase opacity-40">সঠিক</p>
           </div>
           <div className="text-center">
              <p className="font-black text-rose-500">{wrongCount}</p>
              <p className="text-[8px] font-black uppercase opacity-40">ভুল</p>
           </div>
        </div>
      </div>
      <button onClick={() => onFinish({ score: Number(score.toFixed(2)), total: questions.length, subject, date: new Date().toLocaleDateString(), quizId })} className="w-full bg-slate-900 text-white py-6 rounded-[32px] font-black text-lg shadow-xl active:scale-95 transition-all">ফলাফল জমা দিন</button>
    </div>
  );

  const q = questions[currentIndex];

  const renderMedia = () => {
    if (!q.mediaUrl || q.mediaType === 'none') return null;
    if (q.mediaType === 'image') {
      return <img src={q.mediaUrl} className="w-full h-44 object-cover rounded-[32px] mb-6 shadow-sm border border-slate-100" alt="Question Media" />;
    }
    if (q.mediaType === 'video') {
      const vidId = q.mediaUrl.includes('v=') ? q.mediaUrl.split('v=')[1].split('&')[0] : q.mediaUrl.split('/').pop();
      return (
        <div className="aspect-video w-full mb-6 rounded-[32px] overflow-hidden border bg-black shadow-lg">
           <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${vidId}`} frameBorder="0" allowFullScreen></iframe>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-['Hind_Siliguri'] max-w-md mx-auto relative">
      <div className="bg-white p-5 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><ChevronLeft size={24}/></button>
        <div className="text-center">
           <p className="font-black text-slate-800 text-xs truncate max-w-[150px]">{subject}</p>
           <p className="text-[10px] text-slate-400 font-bold uppercase">{currentIndex + 1}/{questions.length}</p>
        </div>
        <div className={`px-4 py-2 rounded-2xl font-black text-sm transition-all ${timer < 10 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-emerald-50 text-emerald-700'}`}>
          {timer}s
        </div>
      </div>

      <div className="p-6 flex-grow">
        {/* Ad: Quiz Start / Top */}
        <AdRenderer placement={ads['quiz_start']} className="mb-6" />

        <div className="bg-white p-8 rounded-[44px] shadow-sm mb-8 border border-slate-100 text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-[80px] -mr-8 -mt-8 opacity-40"></div>
           {renderMedia()}
           <h3 className="text-lg font-black text-slate-900 leading-relaxed relative z-10">{q.question}</h3>
        </div>
        
        <div className="space-y-4">
          {q.options.map((opt, idx) => (
            <button 
              key={idx} 
              disabled={isAnswered} 
              onClick={() => handleAnswer(idx)}
              className={`w-full p-6 rounded-[28px] text-left font-black border-2 transition-all flex justify-between items-center ${
                isAnswered ? (
                  idx === q.correctAnswer ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 
                  idx === selectedOption ? 'bg-rose-500 border-rose-500 text-white shadow-lg' : 'bg-white border-slate-50 opacity-40'
                ) : (
                  selectedOption === idx ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-100 hover:border-emerald-200'
                )
              }`}
            >
              <span className="text-sm pr-4">{opt}</span>
              {isAnswered && idx === q.correctAnswer && <CheckCircle2 size={20}/>}
            </button>
          ))}
        </div>

        {/* Ad: Between Questions / Bottom */}
        <AdRenderer placement={ads['quiz_question_bottom']} className="mt-8" />
      </div>

      {isAnswered && (
        <div className="p-8 bg-white border-t rounded-t-[44px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] sticky bottom-0 z-50 animate-in slide-in-from-bottom">
           {q.explanation && (
             <div className="mb-6 p-5 bg-blue-50 border border-blue-100 rounded-[28px] flex gap-3">
                <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-800 font-bold leading-relaxed">{q.explanation}</p>
             </div>
           )}
           <button onClick={handleNext} className="w-full bg-emerald-700 text-white py-6 rounded-[32px] font-black flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-emerald-700/20">
             {currentIndex === questions.length - 1 ? 'ফলাফল দেখুন' : 'পরবর্তী প্রশ্ন'} <ArrowRight size={20}/>
           </button>
        </div>
      )}
    </div>
  );
};

export default QuizScreen;
