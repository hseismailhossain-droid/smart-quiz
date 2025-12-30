
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
      // Track mistakes to save later
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

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center font-black">লোড হচ্ছে...</div>;

  if (finished) return (
    <div className="min-h-screen bg-white p-8 flex flex-col items-center justify-center text-center max-w-md mx-auto">
      <Trophy size={80} className="text-emerald-700 mb-6" />
      <h2 className="text-3xl font-black text-slate-900 mb-10">কুইজ শেষ!</h2>
      <div className="bg-slate-50 p-10 rounded-[44px] w-full mb-10">
        <p className="text-5xl font-black text-emerald-700">{score.toFixed(2)}</p>
        <p className="text-[10px] font-black text-slate-400 uppercase mt-4">আপনার মার্কস</p>
      </div>
      <button onClick={() => onFinish({ score: Number(score.toFixed(2)), total: questions.length, subject, date: new Date().toLocaleDateString(), quizId, mistakes })} className="w-full bg-slate-900 text-white py-6 rounded-[32px] font-black text-lg">ফলাফল জমা দিন</button>
    </div>
  );

  const q = questions[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-['Hind_Siliguri'] max-w-md mx-auto relative">
      <div className="bg-white p-5 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <button onClick={onClose} className="p-2 text-slate-400"><ChevronLeft size={24}/></button>
        <div className="text-center">
           <p className="font-black text-slate-800 text-xs truncate max-w-[150px]">{subject}</p>
           <p className="text-[10px] text-slate-400 font-bold">{currentIndex + 1}/{questions.length}</p>
        </div>
        <div className={`px-4 py-2 rounded-2xl font-black text-sm ${timer < 10 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-emerald-50 text-emerald-700'}`}>{timer}s</div>
      </div>

      <div className="p-6 flex-grow">
        <AdRenderer placement={ads['quiz_start']} className="mb-6" />

        <div className="bg-white p-8 rounded-[44px] shadow-sm mb-8 border border-slate-100 text-center">
           {renderMedia(q)}
           <h3 className="text-lg font-black text-slate-900 leading-relaxed">{q.question}</h3>
        </div>
        
        <div className="space-y-4">
          {q.options.map((opt, idx) => (
            <button 
              key={idx} 
              disabled={isAnswered} 
              onClick={() => handleAnswer(idx)}
              className={`w-full p-6 rounded-[28px] text-left font-black border-2 transition-all flex justify-between items-center ${
                isAnswered ? (
                  idx === q.correctAnswer ? 'bg-emerald-500 border-emerald-500 text-white' : 
                  idx === selectedOption ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white opacity-40'
                ) : 'bg-white hover:border-emerald-200'
              }`}
            >
              <span className="text-sm">{opt}</span>
              {isAnswered && idx === q.correctAnswer && <CheckCircle2 size={20}/>}
            </button>
          ))}
        </div>

        {isAnswered && (
          <div className="mt-8 p-6 bg-blue-50 rounded-[32px] border border-blue-100 animate-in slide-in-from-bottom">
             <div className="flex gap-3 mb-6">
                <Info size={18} className="text-blue-600 shrink-0 mt-1" />
                <p className="text-xs text-blue-800 font-bold leading-relaxed">{q.explanation || 'ব্যাখ্যা দেওয়া হয়নি।'}</p>
             </div>
             <button onClick={handleNext} className="w-full bg-emerald-700 text-white py-5 rounded-[24px] font-black flex items-center justify-center gap-3">
               {currentIndex === questions.length - 1 ? 'ফলাফল দেখুন' : 'পরবর্তী প্রশ্ন'} <ArrowRight size={20}/>
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizScreen;
