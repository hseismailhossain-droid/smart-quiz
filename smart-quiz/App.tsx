
import React, { useState, useEffect, useRef } from 'react';
import AuthScreen from './components/AuthScreen';
import SetupScreen from './components/SetupScreen';
import MainLayout from './components/MainLayout';
import QuizScreen from './components/QuizScreen';
import AdminLayout from './components/admin/AdminLayout';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, collection, query, orderBy, addDoc, getDoc, deleteDoc, increment, serverTimestamp, where, limit, writeBatch } from 'firebase/firestore';
import { UserProfile, QuizResult, Notification, DepositRequest, Lesson, UserReport, WithdrawRequest, Question } from './types';
import { ADMIN_EMAIL } from './constants';
import { Language } from './services/translations';

const App: React.FC = () => {
  const [view, setView] = useState<'auth' | 'setup' | 'main' | 'quiz' | 'admin' | 'loading' | 'privacy'>('loading');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [lang, setLang] = useState<Language>('bn');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
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

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      firestoreUnsubscribers.current.forEach(unsub => unsub());
      firestoreUnsubscribers.current = [];

      if (firebaseUser) {
        const isUserAdmin = firebaseUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

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
        });
        firestoreUnsubscribers.current.push(unsubUser);

        const unsubNotif = onSnapshot(query(collection(db, 'notifications'), orderBy('timestamp', 'desc'), limit(10)), (snapshot) => {
          setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
        });
        firestoreUnsubscribers.current.push(unsubNotif);

        // Fetch Exam History - Client side sorting to avoid index requirements
        const unsubExams = onSnapshot(
          query(collection(db, 'quiz_attempts'), where('uid', '==', firebaseUser.uid), limit(50)),
          (snap) => {
            const list = snap.docs.map(d => {
              const data = d.data();
              return { 
                id: d.id, 
                ...data, 
                date: data.timestamp ? new Date(data.timestamp.seconds * 1000).toLocaleDateString('bn-BD') : 'এইমাত্র'
              } as QuizResult;
            });
            // Client side sort descending by timestamp
            list.sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
            setHistory(prev => ({ ...prev, exams: list }));
          }
        );
        firestoreUnsubscribers.current.push(unsubExams);

        // Fetch Mistakes History - Client side sorting
        const unsubMistakes = onSnapshot(
          query(collection(db, 'user_mistakes'), where('uid', '==', firebaseUser.uid), limit(50)),
          (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            list.sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
            setHistory(prev => ({ ...prev, mistakes: list }));
          }
        );
        firestoreUnsubscribers.current.push(unsubMistakes);

      } else {
        setUser(null);
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
        timestamp: serverTimestamp()
      });

      if (res.mistakes && res.mistakes.length > 0) {
        res.mistakes.forEach(q => {
          const mistakeRef = doc(collection(db, 'user_mistakes'));
          batch.set(mistakeRef, {
            uid,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || '',
            timestamp: serverTimestamp()
          });
        });
      }

      await batch.commit();
    } catch (err) { 
      console.error("Quiz Finish Save Error:", err); 
    }
    
    setView('main');
  };

  if (view === 'loading') return <div className="min-h-screen items-center justify-center bg-white flex"><div className="w-10 h-10 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin"></div></div>;
  if (view === 'auth') return <AuthScreen onLogin={() => {}} lang={lang} toggleLanguage={() => setLang(lang === 'bn' ? 'en' : 'bn')} />;
  if (view === 'setup') return <SetupScreen onComplete={async (name, cat) => {
    if (!auth.currentUser) return;
    await setDoc(doc(db, 'users', auth.currentUser.uid), { 
      name, email: auth.currentUser.email, category: cat, balance: 10, totalPoints: 0, streak: 1, avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + name 
    });
    setView('main');
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
