
import { Bell, BookOpen, Trophy, Flame, ChevronRight, Star, ArrowLeft, Medal, Share2, LogOut, Edit3, Smartphone, X, Zap, ShieldCheck, HelpCircle, BarChart3, Info, CheckCircle2, Image as ImageIcon, Wallet, PlusCircle, ArrowUpRight } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Notification, UserProfile, Lesson, Poll, AdminNotice } from '../types';
import { db, auth } from '../services/firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';

interface HomeTabProps {
  user: UserProfile;
  notifications: Notification[];
  lessons: Lesson[];
  onShowNotifications: () => void;
  onLogout: () => void;
  onSubjectSelect: (subject: string, isLive?: boolean, isPaid?: boolean, fee?: number, quizId?: string) => void;
  onLessonSelect: (lesson: Lesson) => void;
  onEditProfile: (view?: 'profile' | 'report' | 'privacy') => void;
  onSubmitDeposit: (amount: number, method: 'bkash' | 'nagad', trxId: string) => void;
  onSubmitWithdraw: (amount: number, method: 'bkash' | 'nagad', accountNumber: string) => void;
}

const HomeTab: React.FC<HomeTabProps> = ({ 
  user, notifications, lessons, onShowNotifications, onLogout, onSubjectSelect, onLessonSelect, onEditProfile, onSubmitDeposit, onSubmitWithdraw 
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [winners, setWinners] = useState<any[]>([]);
  const [specialQuizzes, setSpecialQuizzes] = useState<any[]>([]);
  
  // Wallet States
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletView, setWalletView] = useState<'recharge' | 'withdraw'>('recharge');
  const [paymentNumbers, setPaymentNumbers] = useState<any>({});
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [trxId, setTrxId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  
  const [adminNotices, setAdminNotices] = useState<AdminNotice[]>([]);
  
  useEffect(() => {
    let unsubs: (() => void)[] = [];
    if (auth.currentUser) {
      unsubs.push(onSnapshot(doc(db, 'settings', 'payment_numbers'), 
        (snap) => snap.exists() && setPaymentNumbers(snap.data())));

      unsubs.push(onSnapshot(query(collection(db, 'winners'), orderBy('timestamp', 'desc'), limit(5)), 
        (snap) => setWinners(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))));

      unsubs.push(onSnapshot(query(collection(db, 'admin_special_quizzes'), orderBy('timestamp', 'desc'), limit(10)), 
        // Fixed: changed d.id to doc.id as the parameter name is doc
        (snap) => setSpecialQuizzes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))));

      unsubs.push(onSnapshot(query(collection(db, 'admin_notices'), orderBy('timestamp', 'desc'), limit(5)), 
        (snap) => setAdminNotices(snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminNotice)))));
    }
    return () => unsubs.forEach(u => u());
  }, [user.email]);

  const handleWalletAction = () => {
    if (!amount || Number(amount) <= 0) return alert("সঠিক পরিমাণ লিখুন");
    if (walletView === 'recharge') {
      if (!trxId) return alert("Trx ID লিখুন");
      onSubmitDeposit(Number(amount), method, trxId);
    } else {
      if (!accountNumber) return alert("একাউন্ট নাম্বার লিখুন");
      if (Number(amount) > user.balance) return alert("পর্যাপ্ত ব্যালেন্স নেই");
      onSubmitWithdraw(Number(amount), method, accountNumber);
    }
    setShowWalletModal(false);
    setAmount(''); setTrxId(''); setAccountNumber('');
  };

  const handleShare = async () => {
    const shareText = `🚀 Smart Quiz Pro - কুইজ খেলুন এবং পুরস্কার জিতুন! ডাউনলোড করুন: ${window.location.origin}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Smart Quiz Pro', text: shareText, url: window.location.origin });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(shareText);
      alert('লিঙ্ক কপি করা হয়েছে!');
    }
  };

  const unreadCount = notifications.length;

  return (
    <div className="p-4 space-y-6 bg-white pb-24 font-['Hind_Siliguri']">
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[1000] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-xs rounded-[40px] p-8 text-center animate-in zoom-in duration-200">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6"><LogOut size={32}/></div>
              <h4 className="text-xl font-black text-slate-900 mb-2">লগআউট করবেন?</h4>
              <p className="text-xs text-slate-400 font-bold mb-8">আপনি কি নিশ্চিতভাবে অ্যাকাউন্ট থেকে লগআউট করতে চান?</p>
              <div className="flex flex-col gap-3">
                 <button onClick={onLogout} className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-rose-600/20">হ্যাঁ, লগআউট করুন</button>
                 <button onClick={() => setShowLogoutConfirm(false)} className="w-full bg-slate-100 text-slate-400 py-4 rounded-2xl font-black text-sm">বাতিল</button>
              </div>
           </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center px-1 py-2">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 bg-slate-100 rounded-[22px] border-2 border-emerald-500 overflow-hidden shadow-sm">
              <img src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="avatar" className="w-full h-full object-cover" />
            </div>
            <button onClick={() => onEditProfile()} className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-700 text-white rounded-lg flex items-center justify-center border border-white shadow-lg">
              <Edit3 size={10} />
            </button>
          </div>
          <div>
            <h3 className="font-black text-lg text-gray-900 leading-tight truncate max-w-[120px]">{user?.name || 'ইউজার'}</h3>
            <p className="text-[9px] font-bold text-gray-400 tracking-wider uppercase">{user?.category?.split(' ')[0] || 'PRO'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onShowNotifications} className="p-3 bg-slate-50 text-slate-600 rounded-2xl active:scale-90 transition-all relative">
            <Bell size={20} />
            {unreadCount > 0 && <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">{unreadCount}</span>}
          </button>
          <button onClick={handleShare} className="p-3 bg-slate-50 text-slate-600 rounded-2xl active:scale-90 transition-all"><Share2 size={20} /></button>
          <button onClick={() => setShowLogoutConfirm(true)} className="p-3 bg-rose-50 text-rose-600 rounded-2xl active:scale-90 transition-all"><LogOut size={20} /></button>
        </div>
      </div>

      {/* Wallet Card */}
      <div className="bg-emerald-900 p-8 rounded-[48px] text-white shadow-2xl relative overflow-hidden group">
         <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
               <div>
                  <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1">বর্তমান ব্যালেন্স</p>
                  <h2 className="text-4xl font-black">৳{user.balance || 0}</h2>
               </div>
               <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <Wallet size={28} className="text-emerald-400" />
               </div>
            </div>
            <div className="flex gap-3">
               <button onClick={() => { setWalletView('recharge'); setShowWalletModal(true); }} className="flex-1 bg-white text-emerald-900 py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"><PlusCircle size={16}/> রিচার্জ</button>
               <button onClick={() => { setWalletView('withdraw'); setShowWalletModal(true); }} className="flex-1 bg-emerald-800 text-white py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 border border-white/10 active:scale-95 transition-all"><ArrowUpRight size={16}/> উত্তোলন</button>
            </div>
         </div>
      </div>

      {/* Wallet Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[1000] flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-[44px] p-8 animate-in slide-in-from-bottom duration-300 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-900">{walletView === 'recharge' ? 'ব্যালেন্স রিচার্জ' : 'টাকা উত্তোলন'}</h3>
              <button onClick={() => setShowWalletModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
            </div>
            <div className="flex gap-2 mb-8 bg-slate-50 p-2 rounded-3xl">
              <button onClick={() => setMethod('bkash')} className={`flex-1 py-3 rounded-2xl font-black text-xs transition-all ${method === 'bkash' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-400'}`}>বিকাশ</button>
              <button onClick={() => setMethod('nagad')} className={`flex-1 py-3 rounded-2xl font-black text-xs transition-all ${method === 'nagad' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}>নগদ</button>
            </div>
            <div className="space-y-4">
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="টাকার পরিমাণ" className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-black" />
              {walletView === 'recharge' ? (
                <input type="text" value={trxId} onChange={(e) => setTrxId(e.target.value)} placeholder="Transaction ID" className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-black" />
              ) : (
                <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="একাউন্ট নাম্বার" className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-black" />
              )}
              <button onClick={handleWalletAction} className="w-full bg-emerald-700 text-white py-6 rounded-[28px] font-black text-lg active:scale-95 transition-all">সাবমিট করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-3 bg-gray-50 p-6 rounded-[44px] border border-gray-100 mx-1 shadow-inner">
        <StatItem icon={<Trophy className="text-yellow-500" size={20}/>} value={user.totalPoints?.toString() || "0"} label="পয়েন্ট" />
        <StatItem icon={<BookOpen className="text-blue-500" size={20}/>} value={user.playedQuizzes?.length.toString() || "0"} label="পরীক্ষা" />
        <StatItem icon={<Medal className="text-emerald-500" size={20}/>} value="৫ম" label="র‍্যাংক" />
        <StatItem icon={<Flame className="text-orange-500" size={20}/>} value={user.streak?.toString() || "0"} label="স্ট্রিক" />
      </div>

      {/* Special Quizzes Section */}
      <div className="px-1">
        <h4 className="font-black text-gray-900 text-xl flex items-center gap-2 mb-6">
          <Star size={24} className="text-amber-500 fill-amber-500" /> স্পেশাল কুইজ
        </h4>
        <div className="flex gap-5 overflow-x-auto pb-6 -mx-1 px-1 snap-x no-scrollbar">
          {specialQuizzes.length > 0 ? specialQuizzes.map((q) => (
            <button key={q.id} onClick={() => onSubjectSelect(q.title, false, false, 0, q.id)} className={`min-w-[280px] bg-gradient-to-br ${q.color || 'from-emerald-700 to-emerald-900'} p-8 rounded-[44px] text-white text-left snap-center shadow-2xl relative overflow-hidden group`}>
              <h5 className="text-2xl font-black mb-2 leading-tight pr-4">{q.title}</h5>
              <p className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-4 py-2 rounded-full border border-white/20 inline-block">{q.questionsCount || 10}টি প্রশ্ন</p>
            </button>
          )) : <div className="text-slate-300 font-black text-xs p-10">কোনো স্পেশাল কুইজ নেই</div>}
        </div>
      </div>
    </div>
  );
};

const StatItem = ({ icon, value, label }: any) => (
  <div className="flex flex-col items-center gap-2">
    <div className="p-3 bg-white rounded-2xl shadow-sm">{icon}</div>
    <span className="font-black text-lg text-gray-900 leading-none">{value}</span>
    <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider">{label}</span>
  </div>
);

export default HomeTab;
