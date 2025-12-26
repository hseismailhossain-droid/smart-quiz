
import React, { useState, useEffect, useRef } from 'react';
import AuthScreen from './components/AuthScreen';
import SetupScreen from './components/SetupScreen';
import MainLayout from './components/MainLayout';
import QuizScreen from './components/QuizScreen';
import AdminLayout from './components/admin/AdminLayout';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, collection, query, orderBy, addDoc, getDoc, deleteDoc, increment, serverTimestamp } from 'firebase/firestore';
import { UserProfile, QuizResult, Notification, DepositRequest, Lesson, UserReport, WithdrawRequest } from './types';
import { Settings } from 'lucide-react';
import { ADMIN_EMAIL } from './constants';
import { Language } from './services/translations';

const App: React.FC = () => {
  const [view, setView] = useState<'auth' | 'setup' | 'main' | 'quiz' | 'admin' | 'loading' | 'privacy'>('loading');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [lang, setLang] = useState<Language>('bn');
  const [notifications, setNotifications] = useState<Notification[]>([]);
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

        const unsubUser = onSnapshot(doc(db, 'users', firebaseUser.uid), 
          (docSnap) => {
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

        const unsubNotif = onSnapshot(query(collection(db, 'notifications'), orderBy('timestamp', 'desc')), 
          (snapshot) => {
            setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
          });
        firestoreUnsubscribers.current.push(unsubNotif);
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

  const handleFinishQuiz = async (res: QuizResult) => {
    if (user && auth.currentUser) {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        totalPoints: increment(res.score * 10),
        streak: increment(1)
      });
      await addDoc(collection(db, 'quiz_attempts'), {
        uid: auth.currentUser.uid,
        userName: user.name,
        quizId: res.quizId || 'mock',
        subject: res.subject,
        score: res.score,
        total: res.total,
        timestamp: serverTimestamp()
      });
    }
    setView('main');
  };

  if (view === 'loading') return <div className="min-h-screen flex items-center justify-center bg-white"><div className="w-12 h-12 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin"></div></div>;

  if (view === 'auth') return <AuthScreen onLogin={() => {}} lang={lang} toggleLanguage={() => setLang(lang === 'bn' ? 'en' : 'bn')} />;
  
  if (view === 'setup') return <SetupScreen onComplete={async (name, cat) => {
    if (!auth.currentUser) return;
    await setDoc(doc(db, 'users', auth.currentUser.uid), { name, email: auth.currentUser.email, category: cat, balance: 10, totalPoints: 100, streak: 1, playedQuizzes: [], avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + name });
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
        collectionName={quizConfig.collection}
        lang={lang}
      />
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      {view === 'admin' ? (
        <AdminLayout 
          onExit={() => setView('main')} 
          onLogout={() => signOut(auth)} 
          onSendNotification={()=>{}} 
          onDeleteNotification={()=>{}}
          onDeleteQuiz={async (id, type) => {
             const col = type === 'paid' ? 'paid_quizzes' : type === 'live' ? 'live_quizzes' : type === 'lesson' ? 'lessons' : type === 'special' ? 'admin_special_quizzes' : 'mock_quizzes';
             await deleteDoc(doc(db, col, id));
          }}
          notifications={notifications}
          depositRequests={[]}
          withdrawRequests={[]}
          userReports={[]}
          onResolveReport={()=>{}}
          onApproveDeposit={()=>{}} 
          onRejectDeposit={()=>{}}
          onApproveWithdraw={()=>{}}
          onRejectWithdraw={()=>{}}
        />
      ) : (
        <MainLayout 
          user={user!} history={{exams: [], mistakes: [], marked: []}} 
          lang={lang}
          toggleLanguage={() => setLang(lang === 'bn' ? 'en' : 'bn')}
          notifications={notifications} setNotifications={()=>{}} 
          lessons={[]}
          onSubjectSelect={async (s, c) => { 
            if (c.isPaid && c.entryFee && user && user.balance < c.entryFee) return alert("ব্যালেন্স কম। রিচার্জ করুন।");
            if (c.isPaid && c.entryFee && auth.currentUser) await updateDoc(doc(db, 'users', auth.currentUser.uid), { balance: increment(-c.entryFee) });
            setActiveSubject(s); 
            setQuizConfig(c); 
            setView('quiz'); 
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
