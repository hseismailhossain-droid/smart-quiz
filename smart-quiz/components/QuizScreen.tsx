
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, Timer, CheckCircle2, ArrowRight, Trophy, AlertCircle, RefreshCw, Bookmark, BookmarkCheck } from 'lucide-react';
import { generateQuestions } from '../services/geminiService';
import { Question, QuizResult } from '../types';
import { db, auth } from '../services/firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { Language, translations } from '../services/translations';

interface QuizScreenProps {
  subject: string;
  onClose: () => void;
  onFinish: (result: QuizResult) => void;
  numQuestions: number;
  timePerQuestion: number;
  isPaid?: boolean;
  quizId?: string;
  collectionName?: string;
  lang: Language;
}

const QuizScreen: React.FC<QuizScreenProps> = ({ 
  subject, onClose, onFinish, numQuestions, timePerQuestion, isPaid, quizId, collectionName, lang
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
  const [isBookmarked, setIsBookmarked] = useState(false);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (quizId && quizId !== 'mock') {
        const targetCollection = collectionName || 'mock_quizzes';
        const docRef = doc(db, targetCollection, quizId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const quizData = docSnap.data();
          if (quizData.manualQuestions && quizData.manualQuestions.length > 0) {
            setQuestions(quizData.manualQuestions);
            setLoading(false);
            return;
          }
        }
      }
      const data = await generateQuestions(subject, numQuestions, lang);
      if (data && !data.error) setQuestions(data);
      else throw new Error(data?.details || "Failed to load questions");
    } catch (e: any) {
      setError({ message: lang === 'bn' ? "প্রশ্নপত্র লোড করা সম্ভব হয়নি।" : "Failed to load questions." });
    } finally {
      setLoading(false);
    }
  }, [subject, numQuestions, quizId, collectionName, lang]);

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

  useEffect(() => {
    const checkBookmark = async () => {
      if (!auth.currentUser || questions.length === 0) return;
      const q = query(
        collection(db, 'user_bookmarks'), 
        where('uid', '==', auth.currentUser.uid),
        where('question', '==', questions[currentIndex].question)
      );
      const snap = await getDocs(q);
      setIsBookmarked(!snap.empty);
    };
    if (!loading && questions[currentIndex]) checkBookmark();
  }, [currentIndex, loading, questions]);

  const toggleBookmark = async () => {
    if (!auth.currentUser || questions.length === 0) return;
    const questionData = questions[currentIndex];
    const q = query(
      collection(db, 'user_bookmarks'), 
      where('uid', '==', auth.currentUser.uid),
      where('question', '==', questionData.question)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      await addDoc(collection(db, 'user_bookmarks'), {
        uid: auth.currentUser.uid,
        ...questionData,
        timestamp: serverTimestamp()
      });
      setIsBookmarked(true);
    } else {
      await deleteDoc(doc(db, 'user_bookmarks', snap.docs[0].id));
      setIsBookmarked(false);
    }
  };

  const handleAnswer = async (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);
    const correctIdx = questions[currentIndex].correctAnswer;
    
    if (idx === correctIdx) {
      setScore(s => s + 1);
    } else {
      if (auth.currentUser) {
        try {
          await addDoc(collection(db, 'user_mistakes'), {
            uid: auth.currentUser.uid,
            ...questions[currentIndex],
            timestamp: serverTimestamp(),
            subject: subject,
            date: new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric' })
          });
        } catch (e) {
          console.warn("Mistake logging error", e);
        }
      }
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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10 text-center max-w-md mx-auto">
      <div className="w-16 h-16 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin mb-6"></div>
      <h2 className="text-xl font-black text-slate-800">{t.loading_questions}</h2>
    </div>
  );

  if (finished) return (
    <div className="min-h-screen bg-white p-8 flex flex-col items-center justify-center text-center max-w-md mx-auto">
      <Trophy size={80} className="text-emerald-700 mb-6" />
      <h2 className="text-3xl font-black text-slate-900 mb-6">কুইজ শেষ!</h2>
      <div className="bg-slate-50 p-10 rounded-[44px] w-full mb-10 border border-slate-100">
        <p className="text-5xl font-black text-emerald-700">{score} / {questions.length}</p>
        <p className="text-[10px] font-black text-slate-400 uppercase mt-4">আপনার স্কোর</p>
      </div>
      <button onClick={() => onFinish({ score, total: questions.length, subject, date: new Date().toLocaleDateString(), quizId })} className="w-full bg-slate-900 text-white py-6 rounded-[32px] font-black text-lg shadow-xl">ফলাফল জমা দিন</button>
    </div>
  );

  const q = questions[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-['Hind_Siliguri'] max-w-md mx-auto">
      <div className="bg-white p-5 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <button onClick={onClose} className="p-2 text-slate-400"><ChevronLeft size={24}/></button>
        <div className="text-center">
           <p className="font-black text-slate-800 text-xs truncate max-w-[150px]">{subject}</p>
           <p className="text-[10px] text-slate-400 font-bold uppercase">{currentIndex + 1}/{questions.length}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleBookmark} className={`p-2 rounded-xl transition-all ${isBookmarked ? 'text-emerald-600 bg-emerald-50' : 'text-slate-300 bg-slate-50'}`}>
            {isBookmarked ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
          </button>
          <div className={`px-4 py-2 rounded-2xl font-black text-sm ${timer < 10 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-emerald-50 text-emerald-700'}`}>
            {timer}s
          </div>
        </div>
      </div>

      <div className="p-6 flex-grow">
        <div className="bg-white p-8 rounded-[40px] shadow-sm mb-10 border border-slate-100 text-center min-h-[140px] flex items-center justify-center">
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

        {isAnswered && q.explanation && (
          <div className="mt-8 p-6 bg-blue-50 rounded-3xl border border-blue-100 animate-in fade-in slide-in-from-top-2">
            <p className="text-[10px] font-black text-blue-700 uppercase mb-2">ব্যাখ্যা:</p>
            <p className="text-xs text-blue-900 font-bold leading-relaxed">{q.explanation}</p>
          </div>
        )}
      </div>

      {isAnswered && (
        <div className="p-8 bg-white border-t rounded-t-[44px] shadow-xl">
           <button onClick={handleNext} className="w-full bg-emerald-700 text-white py-6 rounded-[32px] font-black flex items-center justify-center gap-3 active:scale-95 transition-all">
             {currentIndex === questions.length - 1 ? 'ফলাফল দেখুন' : 'পরবর্তী প্রশ্ন'} <ArrowRight size={20}/>
           </button>
        </div>
      )}
    </div>
  );
};

export default QuizScreen;
