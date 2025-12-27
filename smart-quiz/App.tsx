
import React, { useState, useEffect, useRef } from 'react';
import AuthScreen from './components/AuthScreen';
import SetupScreen from './components/SetupScreen';
import MainLayout from './components/MainLayout';
import QuizScreen from './components/QuizScreen';
import AdminLayout from './components/admin/AdminLayout';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, collection, query, orderBy, addDoc, getDoc, deleteDoc, increment, serverTimestamp, where, limit } from 'firebase/firestore';
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

        const unsubNotif = onSnapshot(query(collection(db, 'notifications'), orderBy('timestamp', 'desc'), limit(20)), (snapshot) => {
          setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
        });
        firestoreUnsubscribers.current.push(unsubNotif);

        // Exams History: UID ফিল্টার এবং ক্লায়েন্ট সাইড সর্টিং (ইন্ডেক্স এরর এড়াতে)
        const unsubExams = onSnapshot(
          query(collection(db, 'quiz_attempts'), where('uid', '==', firebaseUser.uid), limit(50)),
          (snap) => {
            const list = snap.docs.map(d => {
              const data = d.data();
              const ts = data.timestamp;
              const dateStr = ts ? new Date(ts.seconds * 1000).toLocaleDateString('bn-BD') : 'এখন মাত্র';
              return { id: d.id, ...data, date: dateStr } as any;
            });
            // Newest first sorting
            list.sort((a, b) => {
              const timeA = a.timestamp?.seconds || Date.now() / 1000;
              const timeB = b.timestamp?.seconds || Date.now() / 1000;
              return timeB - timeA;
            });
            setHistory(prev => ({ ...prev, exams: list }));
          }
        );
        firestoreUnsubscribers.current.push(unsubExams);

        // Mistakes History
        const unsubMistakes = onSnapshot(
          query(collection(db, 'user_mistakes'), where('uid', '==', firebaseUser.uid), limit(100)),
          (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            list.sort((a, b) => (b.timestamp?.seconds || Date.now() / 1000) - (a.timestamp?.seconds || 0));
            setHistory(prev => ({ ...prev, mistakes: list }));
          }
        );
        firestoreUnsubscribers.current.push(unsubMistakes);

        // Bookmarks History
        const unsubBookmarks = onSnapshot(
          query(collection(db, 'user_bookmarks'), where('uid', '==', firebaseUser.uid), limit(100)),
          (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            setHistory(prev => ({ ...prev, marked: list }));
          }
        );
        firestoreUnsubscribers.current.push(unsubBookmarks);

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
    if (auth.currentUser) {
      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        
        // ১. ইউজারের পয়েন্ট এবং স্ট্রিক আপডেট করুন (প্রতি সঠিক উত্তরের জন্য ১০ পয়েন্ট)
        const earnedPoints = Number(res.score) * 10;
        await updateDoc(userRef, {
          totalPoints: increment(earnedPoints),
          streak: increment(1)
        });

        // ২. কুইজ অ্যাটেম্পট সেভ করুন হিস্ট্রির জন্য
        await addDoc(collection(db, 'quiz_attempts'), {
          uid: auth.currentUser.uid,
          userName: user?.name || 'Anonymous',
          quizId: res.quizId || 'mock',
          subject: res.subject,
          score: Number(res.score),
          total: Number(res.total),
          timestamp: serverTimestamp()
        });

        console.log("Quiz data updated successfully");
      } catch (err) {
        console.error("Error updating quiz result:", err);
      }
    }
    setView('main');
  };

  if (view === 'loading') return <div className="min-h-screen items-center justify-center bg-white flex"><div className="w-12 h-12 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin"></div></div>;
  if (view === 'auth') return <AuthScreen onLogin={() => {}} lang={lang} toggleLanguage={() => setLang(lang === 'bn' ? 'en' : 'bn')} />;
  if (view === 'setup') return <SetupScreen onComplete={async (name, cat) => {
    if (!auth.currentUser) return;
    await setDoc(doc(db, 'users', auth.currentUser.uid), { 
      name, 
      email: auth.currentUser.email, 
      category: cat, 
      balance: 10, 
      totalPoints: 0, 
      streak: 1, 
      playedQuizzes: [], 
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + name 
    });
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
          onLogout={() => { signOut(auth); }} 
          onSendNotification={()=>{}} 
          onDeleteNotification={()=>{}}
          onDeleteQuiz={async (id, type) => {
             const col = type === 'paid' ? 'paid_quizzes' : type === 'live' ? 'live_quizzes' : type === 'lesson' ? 'lessons' : type === 'special' ? 'admin_special_quizzes' : 'mock_quizzes';
             await deleteDoc(doc(db, col, id));
          }}
          notifications={notifications}
        />
      ) : (
        <MainLayout 
          user={user!} 
          history={history} 
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
