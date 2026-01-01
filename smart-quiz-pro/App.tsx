
import React, { useState, useEffect, useRef } from 'react';
import AuthScreen from './components/AuthScreen';
import SetupScreen from './components/SetupScreen';
import MainLayout from './components/MainLayout';
import QuizScreen from './components/QuizScreen';
import AdminLayout from './components/admin/AdminLayout';
import { auth, db, refreshFirestore } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, collection, query, orderBy, addDoc, getDoc, deleteDoc, increment, serverTimestamp, where, limit, writeBatch } from 'firebase/firestore';
import { UserProfile, QuizResult, Notification, Question } from './types';
import { ADMIN_EMAIL } from './constants';
import { Language } from './services/translations';
import { AlertCircle, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<'auth' | 'setup' | 'main' | 'quiz' | 'admin' | 'loading' | 'error'>('loading');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [lang, setLang] = useState<Language>('bn');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [history, setHistory] = useState<{
    exams: QuizResult[];
    mistakes: Question[];
    marked: Question[];
  }>({ exams: [], mistakes: [], marked: [] });

  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [quizConfig, setQuizConfig] = useState<{ 
    numQuestions: number; 
    timePerQuestion: number; 
    isLive?: boolean; 
    isPaid?: boolean;
    quizId?: string;
    entryFee?: number;
    collection?: string;
  } | null>(null);
  
  const firestoreUnsubscribers = useRef<(() => void)[]>([]);

  // Crash protection: Handle unhandled promise rejections
  useEffect(() => {
    const handleError = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || String(event.reason);
      console.error('Unhandled rejection:', reason);
      
      // Ignore clipboard errors as they are non-fatal
      if (reason.includes('Clipboard') || reason.includes('writeText')) {
        event.preventDefault();
        return;
      }

      if (reason.includes('IndexedDB')) {
        refreshFirestore();
      }
    };
    window.addEventListener('unhandledrejection', handleError);
    return () => window.removeEventListener('unhandledrejection', handleError);
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        firestoreUnsubscribers.current.forEach(unsub => unsub());
        firestoreUnsubscribers.current = [];

        if (firebaseUser) {
          const isUserAdmin = firebaseUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

          // Safe User SnapShot
          const unsubUser = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
            if (docSnap.exists()) {
              setUser(docSnap.data() as UserProfile);
              if (view === 'loading' || view === 'auth' || view === 'setup') {
                setView(isUserAdmin ? 'admin' : 'main');
              }
            } else {
              if (isUserAdmin) setView('admin');
              else setView('setup');
            }
          }, (err) => {
            console.error("User Snap Error:", err);
            setErrorMsg("সার্ভারের সাথে সংযোগ বিচ্ছিন্ন হয়েছে।");
            setView('error');
          });
          firestoreUnsubscribers.current.push(unsubUser);

          // Safe Notifications
          const unsubNotif = onSnapshot(query(collection(db, 'notifications'), limit(10)), (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
            list.sort((a:any, b:any) => (b.timestamp || 0) - (a.timestamp || 0));
            setNotifications(list);
          });
          firestoreUnsubscribers.current.push(unsubNotif);

          // Fetch Exam History - Client side sorting for stability
          const unsubExams = onSnapshot(
            query(collection(db, 'quiz_attempts'), where('uid', '==', firebaseUser.uid), limit(30)),
            (snap) => {
              const list = snap.docs.map(d => {
                const data = d.data();
                return { 
                  id: d.id, 
                  ...data, 
                  date: data.timestamp ? new Date(data.timestamp.seconds * 1000).toLocaleDateString('bn-BD') : 'এইমাত্র'
                } as QuizResult;
              });
              list.sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
              setHistory(prev => ({ ...prev, exams: list }));
            }
          );
          firestoreUnsubscribers.current.push(unsubExams);

        } else {
          setUser(null);
          setView('auth');
        }
      } catch (err) {
        console.error("Auth Listener Error:", err);
        setView('auth');
      }
    });

    return () => {
      unsubscribeAuth();
      firestoreUnsubscribers.current.forEach(unsub => unsub());
    };
  }, []);

  const handleFinishQuiz = async (res: QuizResult & { mistakes?: Question[] }) => {
    if (!auth.currentUser) { setView('main'); return; }

    try {
      const uid = auth.currentUser.uid;
      const earnedPoints = Math.max(0, Math.floor(res.score * 10));
      
      const batch = writeBatch(db);
      const userRef = doc(db, 'users', uid);
      batch.update(userRef, {
        totalPoints: increment(earnedPoints),
        streak: increment(1)
      });

      const attemptRef = doc(collection(db, 'quiz_attempts'));
      batch.set(attemptRef, {
        uid,
        userName: user?.name || 'User',
        quizId: res.quizId || 'mock',
        subject: res.subject,
        score: res.score,
        total: res.total,
        mistakes: res.mistakes || [], // Ensure mistakes are saved to Firestore
        timestamp: serverTimestamp()
      });

      await batch.commit();
    } catch (err) { 
      console.error("Quiz Save Error:", err); 
    }
    setView('main');
  };

  if (view === 'loading') return (
    <div className="min-h-screen items-center justify-center bg-white flex flex-col font-['Hind_Siliguri']">
      <div className="w-12 h-12 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Smart Quiz Pro লোড হচ্ছে...</p>
    </div>
  );

  if (view === 'error') return (
    <div className="min-h-screen items-center justify-center bg-white flex flex-col p-10 text-center font-['Hind_Siliguri']">
       <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
          <AlertCircle size={40} />
       </div>
       <h2 className="text-xl font-black text-slate-900 mb-2">দুঃখিত, সমস্যা হয়েছে!</h2>
       <p className="text-sm text-slate-500 font-bold mb-8 leading-relaxed">{errorMsg || "অ্যাপটি লোড করতে সমস্যা হচ্ছে। আপনার ইন্টারনেট কানেকশন চেক করুন।"}</p>
       <button 
        onClick={() => refreshFirestore()} 
        className="bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl active:scale-95 transition-all"
       >
         <RefreshCw size={18} /> আবার চেষ্টা করুন
       </button>
    </div>
  );

  if (view === 'auth') return <AuthScreen onLogin={() => {}} lang={lang} toggleLanguage={() => setLang(lang === 'bn' ? 'en' : 'bn')} />;
  
  if (view === 'setup') return <SetupScreen onComplete={async (name, cat) => {
    if (!auth.currentUser) return;
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), { 
        name, email: auth.currentUser.email, category: cat, balance: 10, totalPoints: 0, streak: 1, avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + name 
      });
      setView('main');
    } catch (e) { alert("সেটআপ ব্যর্থ হয়েছে।"); }
  }} lang={lang} />;
  
  if (view === 'quiz' && activeSubject && quizConfig) {
    return <QuizScreen subject={activeSubject} onClose={() => setView('main')} onFinish={handleFinishQuiz} numQuestions={quizConfig.numQuestions} timePerQuestion={quizConfig.timePerQuestion} isPaid={quizConfig.isPaid} quizId={quizConfig.quizId} collectionName={quizConfig.collection} lang={lang} />;
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      {view === 'admin' ? (
        <AdminLayout 
          onExit={() => setView('main')} onLogout={() => signOut(auth)} 
          onSendNotification={()=>{}} onDeleteNotification={()=>{}}
          onDeleteQuiz={async (id, type) => {
             const col = type === 'paid' ? 'paid_quizzes' : type === 'live' ? 'live_quizzes' : type === 'lesson' ? 'lessons' : type === 'special' ? 'admin_special_quizzes' : 'mock_quizzes';
             await deleteDoc(doc(db, col, id));
          }}
          notifications={notifications}
        />
      ) : (
        <MainLayout 
          user={user!} history={history} lang={lang} toggleLanguage={() => setLang(lang === 'bn' ? 'en' : 'bn')}
          notifications={notifications} setNotifications={()=>{}} lessons={[]}
          onSubjectSelect={async (s, c) => { 
            if (c.isPaid && c.entryFee && user && user.balance < c.entryFee) return alert("ব্যালেন্স কম।");
            if (c.isPaid && c.entryFee && auth.currentUser) await updateDoc(doc(db, 'users', auth.currentUser.uid), { balance: increment(-c.entryFee) });
            setActiveSubject(s); setQuizConfig(c); setView('quiz'); 
          }} 
          onUpdateProfile={async (data) => { if(auth.currentUser) await updateDoc(doc(db, 'users', auth.currentUser.uid), data); }}
          onSubmitDeposit={async (a, m, t) => {
            if (!auth.currentUser) return;
            await addDoc(collection(db, 'deposit_requests'), { uid: auth.currentUser.uid, userName: user?.name, amount: Number(a), method: m, trxId: t, status: 'pending', timestamp: serverTimestamp() });
          }}
          onSubmitWithdraw={async (a, m, num) => {
            if (!auth.currentUser || !user || user.balance < a) return alert("Insufficient balance");
            await addDoc(collection(db, 'withdraw_requests'), { uid: auth.currentUser.uid, userName: user.name, amount: Number(a), method: m, accountNumber: num, status: 'pending', timestamp: serverTimestamp() });
          }}
          onLogout={() => signOut(auth)} 
        />
      )}
    </div>
  );
};

export default App;
