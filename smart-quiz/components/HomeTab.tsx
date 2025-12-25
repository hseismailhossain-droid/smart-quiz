
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
  const [showPWAHint, setShowPWAHint] = useState(false);
  
  // Wallet States
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletView, setWalletView] = useState<'recharge' | 'withdraw'>('recharge');
  const [paymentNumbers, setPaymentNumbers] = useState<any>({});
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [trxId, setTrxId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  
  // Admin Management States
  const [adminNotices, setAdminNotices] = useState<AdminNotice[]>([]);
  
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (!isStandalone) {
      const timer = setTimeout(() => setShowPWAHint(true), 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    let unsubs: (() => void)[] = [];
    if (auth.currentUser) {
      unsubs.push(onSnapshot(doc(db, 'settings', 'payment_numbers'), 
        (snap) => snap.exists() && setPaymentNumbers(snap.data())));

      unsubs.push(onSnapshot(query(collection(db, 'winners'), orderBy('timestamp', 'desc'), limit(5)), 
        (snap) => setWinners(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))));

      unsubs.push(onSnapshot(query(collection(db, 'admin_special_quizzes'), orderBy('timestamp', 'desc'), limit(10)), 
        (snap) => setSpecialQuizzes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))));

      unsubs.push(onSnapshot(query(collection(db, 'admin_notices'), orderBy('timestamp', 'desc'), limit(5)), 
        (snap) => setAdminNotices(snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminNotice)))));
    }
    return () => unsubs.forEach(u => u());
  }, [user.email]);

  const handleWalletAction = () => {
    if (!amount || Number(amount) <= 0) return alert("সঠিক পরিমাণ লিখুন");
    if (walletView === 'recharge') {
      const config = paymentNumbers[method];
      if (!config?.active) return alert("এই পেমেন্ট মেথডটি বর্তমানে বন্ধ আছে।");
      if (!trxId) return alert("Trx ID লিখুন");
      onSubmitDeposit(Number(amount), method, trxId);
      alert("রিচার্জ রিকোয়েস্ট পাঠানো হয়েছে!");
    } else {
      if (!accountNumber) return alert("একাউন্ট নাম্বার লিখুন");
      if (Number(amount) > user.balance) return alert("পর্যাপ্ত ব্যালেন্স নেই");
      onSubmitWithdraw(Number(amount), method, accountNumber);
      alert("উইথড্র রিকোয়েস্ট পাঠানো হয়েছে!");
    }
    setShowWalletModal(false);
    setAmount(''); setTrxId(''); setAccountNumber('');
  };

  const handleShare = async () => {
    const shareText = `🚀 GEN Z Learning - কুইজ খেলে জ্ঞান অর্জন করুন! জয়েন করুন: ${window.location.origin}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'GEN Z Learning', text: shareText, url: window.location.origin });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(shareText);
      alert('লিঙ্ক কপি করা হয়েছে!');
    }
  };

  const currentPaymentConfig = paymentNumbers[method];

  return (
    <div className="p-4 space-y-6 bg-white pb-24 font-['Hind_Siliguri']">
      {/* Header */}
      <div className="flex justify-between items-center px-1 py-2">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 bg-slate-100 rounded-[24px] border-2 border-emerald-500 overflow-hidden shadow-sm">
              <img src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="avatar" className="w-full h-full object-cover" />
            </div>
            <button onClick={() => onEditProfile('profile')} className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-700 text-white rounded-xl flex items-center justify-center border-2 border-white shadow-lg">
              <Edit3 size={14} />
            </button>
          </div>
          <div>
            <h3 className="font-black text-xl text-gray-900 leading-tight truncate max-w-[160px]">{user?.name || 'ইউজার'}</h3>
            <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">{user?.category || 'STUDENT'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowLogoutConfirm(true)} className="p-3 bg-rose-50 text-rose-600 rounded-2xl active:scale-90 transition-all"><LogOut size={20} /></button>
          <button onClick={onShowNotifications} className="p-3 bg-gray-50 text-slate-600 rounded-2xl relative active:scale-90 transition-all">
            <Bell size={22} />
            {notifications.filter(n => !n.isRead).length > 0 && <span className="absolute top-2 right-2 w-4.5 h-4.5 bg-red-500 text-white text-[9px] font-black rounded-full border-2 border-white flex items-center justify-center shadow-lg">{notifications.filter(n => !n.isRead).length}</span>}
          </button>
        </div>
      </div>

      {/* Wallet Card */}
      <div className="bg-emerald-900 p-8 rounded-[48px] text-white shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-800/50 rounded-full -mr-24 -mt-24 blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
         <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
               <div>
                  <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1">বর্তমান ব্যালেন্স</p>
                  <h2 className="text-4xl font-black">৳{user.balance || 0}</h2>
               </div>
               <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                  <Wallet size={28} className="text-emerald-400" />
               </div>
            </div>
            <div className="flex gap-3">
               <button 
                onClick={() => { setWalletView('recharge'); setShowWalletModal(true); }}
                className="flex-1 bg-white text-emerald-900 py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"
               >
                 <PlusCircle size={16}/> রিচার্জ
               </button>
               <button 
                onClick={() => { setWalletView('withdraw'); setShowWalletModal(true); }}
                className="flex-1 bg-emerald-800 text-white py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 border border-white/10 active:scale-95 transition-all"
               >
                 <ArrowUpRight size={16}/> উত্তোলন
               </button>
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

            {walletView === 'recharge' && (
              <div className={`mb-6 p-5 rounded-[28px] border ${currentPaymentConfig?.active ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                <p className={`text-[10px] font-black uppercase mb-2 ${currentPaymentConfig?.active ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {currentPaymentConfig?.active ? 'এই নাম্বারে টাকা পাঠান (Send Money)' : 'পেমেন্ট মেথড এলার্ট'}
                </p>
                <p className={`text-xl font-black ${currentPaymentConfig?.active ? 'text-slate-800' : 'text-rose-600'}`}>
                  {currentPaymentConfig?.active ? currentPaymentConfig?.number : 'এই মেথডটি বর্তমানে বন্ধ আছে।'}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase px-2">টাকার পরিমাণ</label>
                <input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  placeholder="যেমন: ৫০" 
                  className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-black text-slate-800 border border-slate-100 focus:bg-white transition-all"
                />
              </div>

              {walletView === 'recharge' ? (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase px-2">Transaction ID (Trx ID)</label>
                  <input 
                    type="text" 
                    value={trxId} 
                    onChange={(e) => setTrxId(e.target.value)} 
                    placeholder="8XJ5..." 
                    className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-black text-slate-800 border border-slate-100 focus:bg-white transition-all"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase px-2">একাউন্ট নাম্বার</label>
                  <input 
                    type="text" 
                    value={accountNumber} 
                    onChange={(e) => setAccountNumber(e.target.value)} 
                    placeholder="017XXXXXXXX" 
                    className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-black text-slate-800 border border-slate-100 focus:bg-white transition-all"
                  />
                </div>
              )}

              <button 
                onClick={handleWalletAction}
                className="w-full bg-emerald-700 text-white py-6 rounded-[28px] font-black text-lg shadow-xl shadow-emerald-700/20 active:scale-95 transition-all mt-4"
              >
                {walletView === 'recharge' ? 'রিকোয়েস্ট পাঠান' : 'উইথড্র করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Notices Section */}
      {adminNotices.length > 0 && (
        <div className="space-y-4 px-1">
          {adminNotices.map((notice) => (
            <div key={notice.id} className="bg-white rounded-[44px] border border-slate-100 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-500">
              {notice.image && (
                <div className="w-full h-48 bg-slate-50 relative">
                  <img src={notice.image} className="w-full h-full object-cover" alt="Notice" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                </div>
              )}
              <div className="p-8">
                <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">
                  <ImageIcon size={14}/> বিশেষ আপডেট
                </div>
                <h4 className="text-xl font-black text-slate-900 mb-2 leading-tight">{notice.title}</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6 line-clamp-3">{notice.content}</p>
                <button className="w-full py-4 bg-blue-50 text-blue-700 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all">বিস্তারিত দেখুন</button>
              </div>
            </div>
          ))}
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
            <button key={q.id} onClick={() => onSubjectSelect(q.title, false, false, 0, q.id)} className={`min-w-[280px] bg-gradient-to-br ${q.color || 'from-emerald-700 to-emerald-900'} p-8 rounded-[44px] text-white text-left snap-center shadow-2xl active:scale-95 transition-all relative overflow-hidden group`}>
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
              <h5 className="text-2xl font-black mb-2 leading-tight pr-4">{q.title}</h5>
              <p className="text-xs opacity-80 mb-8 font-medium line-clamp-2">{q.description || 'সেরা প্রশ্ন নিয়ে প্রস্তুতি শুরু করুন'}</p>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-4 py-2 rounded-full border border-white/20">{q.questionsCount || 10}টি প্রশ্ন</span>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-lg border border-white/20"><Zap size={20} fill="currentColor" /></div>
              </div>
            </button>
          )) : (
            <div className="w-full py-12 text-center bg-gray-50 rounded-[44px] border border-dashed border-gray-200 opacity-50">
               <Zap size={32} className="mx-auto mb-2 text-gray-300" />
               <p className="text-[10px] font-black uppercase">শীঘ্রই আসছে</p>
            </div>
          )}
        </div>
      </div>

      {/* Winners List */}
      <div className="px-1">
        <h4 className="font-black text-gray-900 text-xl flex items-center gap-2 mb-6">
          <Trophy size={24} className="text-amber-500" /> সেরা বিজয়ীরা
        </h4>
        <div className="space-y-4">
          {winners.length > 0 ? winners.map(w => (
            <div key={w.id} className="bg-white p-6 rounded-[36px] border border-gray-100 flex items-center justify-between shadow-sm transition-all group hover:border-emerald-200">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <img src={w.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${w.userName}`} className="w-14 h-14 rounded-[22px] object-cover shadow-sm bg-slate-50 border border-slate-100" alt={w.userName} />
                  <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-lg border-2 border-white shadow-md"><Medal size={12} /></div>
                </div>
                <div>
                  <h5 className="font-black text-slate-900 text-base leading-tight">{w.userName}</h5>
                  <p className="text-[10px] text-amber-700 font-black uppercase tracking-widest mt-1">{w.quizTitle}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-base font-black text-emerald-700">৳{w.prize || '৫০'}</p>
                <p className="text-[10px] text-slate-300 font-black uppercase mt-1">RANK #{w.rank || 1}</p>
              </div>
            </div>
          )) : (
            <p className="text-center text-slate-300 py-10 font-black uppercase text-[10px] tracking-widest">এখনো ফলাফল প্রকাশ হয়নি</p>
          )}
        </div>
      </div>
    </div>
  );
};

const StatItem = ({ icon, value, label }: any) => (
  <div className="flex flex-col items-center gap-2">
    <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-50">{icon}</div>
    <span className="font-black text-lg text-gray-900 leading-none">{value}</span>
    <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider">{label}</span>
  </div>
);

export default HomeTab;
