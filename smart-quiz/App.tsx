import React, { useState, useEffect, useRef } from 'react';
import AuthScreen from './components/AuthScreen';
import SetupScreen from './components/SetupScreen';
import MainLayout from './components/MainLayout';
import QuizScreen from './components/QuizScreen';
import AdminLayout from './components/admin/AdminLayout';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, collection, query, orderBy, addDoc, getDoc, deleteDoc, increment, serverTimestamp } from 'firebase/firestore';
import { Category, Question, QuizResult, UserProfile, Notification, DepositRequest, Lesson, UserReport, WithdrawRequest } from './types';
import { Settings, ArrowLeft } from 'lucide-react';
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
  } | null>(null);
  
  const firestoreUnsubscribers = useRef<(() => void)[]>([]);

  const toggleLanguage = () => {
    const newLang = lang === 'bn' ? 'en' : 'bn';
    setLang(newLang);
    localStorage.setItem('app_lang', newLang);
  };

  useEffect(() => {
    const savedLang = localStorage.getItem('app_lang') as Language;
    if (savedLang) setLang(savedLang);

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clear previous listeners to prevent memory leaks and redundant calls
      firestoreUnsubscribers.current.forEach(unsub => unsub());
      firestoreUnsubscribers.current = [];

      if (firebaseUser) {
        const currentUserEmail = firebaseUser.email?.toLowerCase() || '';
        const isUserAdmin = currentUserEmail === ADMIN_EMAIL.toLowerCase();

        // 1. User Profile Listener
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
          }, (e) => console.warn("User Listener Error:", e.message));
        firestoreUnsubscribers.current.push(unsubUser);

        // 2. Notifications Listener
        const unsubNotif = onSnapshot(query(collection(db, 'notifications'), orderBy('timestamp', 'desc')), 
          (snapshot) => {
            setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
          });
        firestoreUnsubscribers.current.push(unsubNotif);

        // 3. Admin-Specific Real-time Listeners
        if (isUserAdmin) {
          // Deposit Requests Listener
          const unsubDeps = onSnapshot(query(collection(db, 'deposit_requests'), orderBy('timestamp', 'desc')), 
            (snapshot) => setDepositRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DepositRequest))));
          firestoreUnsubscribers.current.push(unsubDeps);

          // User Reports Listener
          const unsubReports = onSnapshot(query(collection(db, 'user_reports'), orderBy('timestamp', 'desc')), 
            (snapshot) => setUserReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserReport))));
          firestoreUnsubscribers.current.push(unsubReports);

          // Withdraw Requests Listener
          const unsubWithdraws = onSnapshot(query(collection(db, 'withdraw_requests'), orderBy('timestamp', 'desc')), 
            (snapshot) => setWithdrawRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithdrawRequest))));
          firestoreUnsubscribers.current.push(unsubWithdraws);
        }
      } else {
        setUser(null);
        setView('auth');
      }
    });

    return () => {
      unsubscribeAuth();
      firestoreUnsubscribers.current.forEach(unsub => unsub());
    };
  }, [view]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setView('auth');
    } catch (e) {
      alert("Logout failed");
    }
  };

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

  if (view === 'privacy') {
    return (
      <div className="min-h-screen bg-white p-8 max-w-md mx-auto font-['Hind_Siliguri']">
        <button onClick={() => setView('main')} className="mb-6 p-2 bg-slate-100 rounded-full"><ArrowLeft /></button>
        <h1 className="text-2xl font-black mb-4 text-emerald-800">গোপনীয়তা নীতি (Privacy Policy)</h1>
        <div className="prose text-sm text-slate-600 space-y-4">
          <p>Smart Quiz Pro আপনার তথ্যের নিরাপত্তাকে গুরুত্ব দেয়।</p>
          <h3 className="font-bold text-slate-800 mt-4">১. তথ্য সংগ্রহ</h3>
          <p>আমরা আপনার নাম, ইমেইল এবং কুইজ পারফরম্যান্স ডাটা সংরক্ষণ করি যাতে আপনাকে উন্নত সেবা দেওয়া যায়।</p>
          <h3 className="font-bold text-slate-800 mt-4">২. তথ্যের ব্যবহার</h3>
          <p>আপনার অর্জিত পয়েন্ট এবং র‍্যাঙ্কিং লিডারবোর্ডে প্রদর্শনের জন্য আপনার নাম ব্যবহার করা হয়।</p>
          <h3 className="font-bold text-slate-800 mt-4">৩. নিরাপত্তা</h3>
          <p>আমরা ফায়ারবেস সিকিউরিটি প্রোটোকল ব্যবহার করি যাতে আপনার তথ্য সুরক্ষিত থাকে।</p>
        </div>
      </div>
    );
  }

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
            user={user!} history={{exams: [], mistakes: [], marked: []}} 
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
