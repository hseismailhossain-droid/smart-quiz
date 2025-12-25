
import React, { useState, useEffect, useRef } from 'react';
import AuthScreen from './components/AuthScreen';
import SetupScreen from './components/SetupScreen';
import MainLayout from './components/MainLayout';
import QuizScreen from './components/QuizScreen';
import AdminLayout from './components/admin/AdminLayout';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, collection, query, orderBy, addDoc, getDoc, deleteDoc, increment, where, serverTimestamp } from 'firebase/firestore';
import { Category, Question, QuizResult, UserProfile, Notification, DepositRequest, Lesson, UserReport, WithdrawRequest } from './types';
import { Settings, Languages } from 'lucide-react';
import { ADMIN_EMAIL } from './constants';
import { Language } from './services/translations';

const App: React.FC = () => {
  const [view, setView] = useState<'auth' | 'setup' | 'main' | 'quiz' | 'admin' | 'loading' | 'privacy'>('loading');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [lang, setLang] = useState<Language>('bn');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [userReports, setUserReports] = useState<UserReport[]>([]);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [quizConfig, setQuizConfig] = useState<{ 
    numQuestions: number; 
    timePerQuestion: number; 
    isLive?: boolean; 
    isPaid?: boolean;
    quizId?: string;
    entryFee?: number;
    payoutNumber?: string;
  } | null>(null);
  
  const [history, setHistory] = useState<{ exams: QuizResult[], mistakes: Question[], marked: Question[] }>({
    exams: [],
    mistakes: [],
    marked: []
  });

  const firestoreUnsubscribers = useRef<(() => void)[]>([]);

  const toggleLanguage = () => {
    const newLang = lang === 'bn' ? 'en' : 'bn';
    setLang(newLang);
    localStorage.setItem('app_lang', newLang);
  };

  useEffect(() => {
    const savedLang = localStorage.getItem('app_lang') as Language;
    if (savedLang) setLang(savedLang);

    if (window.location.pathname === '/privacy') {
      setView('privacy');
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      firestoreUnsubscribers.current.forEach(unsub => unsub());
      firestoreUnsubscribers.current = [];

      if (firebaseUser) {
        const currentUserEmail = firebaseUser.email?.toLowerCase() || '';
        const isUserAdmin = currentUserEmail === ADMIN_EMAIL.toLowerCase();

        const unsubUser = onSnapshot(doc(db, 'users', firebaseUser.uid), 
          (docSnap) => {
            if (docSnap.exists()) {
              setUser(docSnap.data() as UserProfile);
              setView(isUserAdmin ? 'admin' : 'main');
            } else {
              if (isUserAdmin) setView('admin');
              else setView('setup');
            }
          }, (e) => console.warn(e.message));
        firestoreUnsubscribers.current.push(unsubUser);

        const unsubNotif = onSnapshot(query(collection(db, 'notifications'), orderBy('timestamp', 'desc')), 
          (snapshot) => {
            setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
          });
        firestoreUnsubscribers.current.push(unsubNotif);

        if (isUserAdmin) {
          const unsubDeps = onSnapshot(query(collection(db, 'deposit_requests'), orderBy('timestamp', 'desc')), 
            (snapshot) => setDepositRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DepositRequest))));
          firestoreUnsubscribers.current.push(unsubDeps);
        }
      } else {
        setUser(null);
        setView('auth');
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setView('auth');
  };

  const handleFinishQuiz = async (res: QuizResult) => {
    if (user && auth.currentUser) {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        totalPoints: increment(res.score * 10),
        streak: increment(1)
      });
    }
    setView('main');
  };

  if (view === 'loading') return <div className="min-h-screen flex items-center justify-center bg-white"><div className="w-12 h-12 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin"></div></div>;

  if (view === 'auth') return <AuthScreen onLogin={() => {}} lang={lang} toggleLanguage={toggleLanguage} />;
  
  if (view === 'setup') return <SetupScreen onComplete={async (name, cat) => {
    if (!auth.currentUser) return;
    const avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=" + name;
    await setDoc(doc(db, 'users', auth.currentUser.uid), { name, email: auth.currentUser.email, category: cat, balance: 10, totalPoints: 100, streak: 1, playedQuizzes: [], avatarUrl: avatar });
    setView('main');
  }} lang={lang} />;
  
  if (view === 'quiz' && activeSubject && quizConfig) {
    return (
      <QuizScreen 
        subject={activeSubject} 
        onClose={() => setView('main')} 
        onFinish={handleFinishQuiz} 
        numQuestions={quizConfig.numQuestions} 
        timePerQuestion={quizConfig.timePerQuestion} 
        isPaid={quizConfig.isPaid}
        quizId={quizConfig.quizId}
        lang={lang}
      />
    );
  }

  const isAdmin = auth.currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return (
    <div className="bg-slate-50 min-h-screen">
      {view === 'admin' && isAdmin ? (
        <AdminLayout 
          onExit={() => setView('main')} 
          onLogout={handleLogout} 
          onSendNotification={async (t, m) => { await addDoc(collection(db, 'notifications'), { title: t, message: m, time: 'Now', timestamp: Date.now(), isRead: false }); }} 
          onDeleteNotification={async (id) => await deleteDoc(doc(db, 'notifications', id))}
          onDeleteQuiz={async (id, type) => {
             const col = type === 'paid' ? 'paid_quizzes' : type === 'live' ? 'live_quizzes' : type === 'lesson' ? 'lessons' : type === 'special' ? 'admin_special_quizzes' : 'mock_quizzes';
             await deleteDoc(doc(db, col, id));
          }}
          notifications={notifications}
          depositRequests={depositRequests}
          withdrawRequests={withdrawRequests}
          userReports={userReports}
          onResolveReport={async (id) => await updateDoc(doc(db, 'user_reports', id), { status: 'resolved' })}
          onApproveDeposit={async (id) => {
            const r = doc(db, 'deposit_requests', id);
            const s = await getDoc(r);
            if (s.exists() && s.data().status === 'pending') {
              const d = s.data();
              await updateDoc(doc(db, 'users', d.uid), { balance: increment(Number(d.amount)) });
              await updateDoc(r, { status: 'approved' });
            }
          }} 
          onRejectDeposit={async (id) => await updateDoc(doc(db, 'deposit_requests', id), { status: 'rejected' })}
          onApproveWithdraw={async (id) => {
            const r = doc(db, 'withdraw_requests', id);
            const s = await getDoc(r);
            if (s.exists() && s.data().status === 'pending') {
              const d = s.data();
              const uRef = doc(db, 'users', d.uid);
              const uSnap = await getDoc(uRef);
              if(uSnap.exists() && uSnap.data().balance >= d.amount) {
                await updateDoc(uRef, { balance: increment(-d.amount) });
                await updateDoc(r, { status: 'approved' });
              }
            }
          }}
          onRejectWithdraw={async (id) => await updateDoc(doc(db, 'withdraw_requests', id), { status: 'rejected' })}
        />
      ) : (
        <>
          <MainLayout 
            user={user!} history={history} 
            lang={lang}
            toggleLanguage={toggleLanguage}
            notifications={notifications} setNotifications={setNotifications} 
            lessons={lessons}
            onSubjectSelect={async (s, c) => { 
              if (c.isPaid && c.entryFee && user) {
                if (user.balance < c.entryFee) return alert(lang === 'bn' ? "আপনার ব্যালেন্স কম। রিচার্জ করুন।" : "Low balance! Please recharge.");
                await updateDoc(doc(db, 'users', auth.currentUser!.uid), { balance: increment(-c.entryFee) });
              }
              setActiveSubject(s); 
              setQuizConfig(c); 
              setView('quiz'); 
            }} 
            onUpdateProfile={async (data) => { if(auth.currentUser) await updateDoc(doc(db, 'users', auth.currentUser.uid), data); }}
            onSubmitDeposit={async (a, m, t) => {
              if (!auth.currentUser) return;
              await addDoc(collection(db, 'deposit_requests'), { uid: auth.currentUser.uid, userName: user?.name || 'User', amount: Number(a), method: m, trxId: t, status: 'pending', time: new Date().toLocaleTimeString(), timestamp: Date.now() });
            }}
            onSubmitWithdraw={async (a, m, num) => {
              if (!auth.currentUser || !user || user.balance < a) return alert("Insufficient balance");
              await addDoc(collection(db, 'withdraw_requests'), { uid: auth.currentUser.uid, userName: user.name, amount: Number(a), method: m, accountNumber: num, status: 'pending', timestamp: serverTimestamp() });
            }}
            onLogout={handleLogout} 
          />
          <div className="fixed bottom-24 right-4 z-[100] flex flex-col gap-2">
             <button onClick={toggleLanguage} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-emerald-700 shadow-xl border-2 border-emerald-500 font-black text-xs active:scale-90 transition-all">
                {lang === 'bn' ? 'EN' : 'বাং'}
             </button>
             {isAdmin && <button onClick={() => setView('admin')} className="w-12 h-12 bg-emerald-700 rounded-full flex items-center justify-center text-white shadow-xl border-2 border-white active:scale-95 transition-all"><Settings size={20} /></button>}
          </div>
        </>
      )}
    </div>
  );
};

export default App;
