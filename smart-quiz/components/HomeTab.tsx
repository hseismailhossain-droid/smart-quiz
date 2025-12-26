
import { Bell, BookOpen, Trophy, Flame, Star, LogOut, Edit3, Share2, Wallet, PlusCircle, ArrowUpRight, X, Image as ImageIcon, CheckCircle2, BarChart3, Users } from 'lucide-react';
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
  onSubjectSelect: (subject: string, isLive?: boolean, isPaid?: boolean, fee?: number, quizId?: string, collectionName?: string) => void;
  onLessonSelect: (lesson: Lesson) => void;
  onEditProfile: (view?: 'profile' | 'report' | 'privacy') => void;
  onSubmitDeposit: (amount: number, method: 'bkash' | 'nagad', trxId: string) => void;
  onSubmitWithdraw: (amount: number, method: 'bkash' | 'nagad', accountNumber: string) => void;
}

const HomeTab: React.FC<HomeTabProps> = ({ 
  user, notifications, onShowNotifications, onLogout, onSubjectSelect, onEditProfile, onSubmitDeposit, onSubmitWithdraw 
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [specialQuizzes, setSpecialQuizzes] = useState<any[]>([]);
  const [adminNotices, setAdminNotices] = useState<AdminNotice[]>([]);
  const [activePolls, setActivePolls] = useState<Poll[]>([]);
  
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletView, setWalletView] = useState<'recharge' | 'withdraw'>('recharge');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [trxId, setTrxId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  useEffect(() => {
    let unsubs: (() => void)[] = [];
    if (auth.currentUser) {
      unsubs.push(onSnapshot(query(collection(db, 'admin_special_quizzes'), orderBy('timestamp', 'desc'), limit(10)), 
        (snap) => setSpecialQuizzes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))));

      unsubs.push(onSnapshot(query(collection(db, 'admin_notices'), orderBy('timestamp', 'desc'), limit(5)), 
        (snap) => setAdminNotices(snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminNotice)))));

      unsubs.push(onSnapshot(query(collection(db, 'admin_polls'), orderBy('timestamp', 'desc'), limit(1)), 
        (snap) => setActivePolls(snap.docs.map(d => ({ id: d.id, ...d.data() } as Poll)))));
    }
    return () => unsubs.forEach(u => u());
  }, []);

  const handleShareApp = async () => {
    const shareData = {
      title: 'Smart Quiz Pro',
      text: `🚀 বিসিএস ও ভর্তি প্রস্তুতির জন্য সেরা অ্যাপ 'Smart Quiz Pro' আজই ব্যবহার শুরু করুন! ডাউনলোড লিঙ্ক: ${window.location.origin}`,
      url: window.location.origin,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.text);
        alert('অ্যাপ লিঙ্ক কপি করা হয়েছে!');
      }
    } catch (err) {
      console.log('Error sharing:', err);
    }
  };

  const handleVote = async (pollId: string, optionIdx: number) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const pollRef = doc(db, 'admin_polls', pollId);
    const poll = activePolls.find(p => p.id === pollId);
    
    if (poll?.votedBy?.includes(uid)) return alert("আপনি ইতিমধ্যে ভোট দিয়েছেন!");

    const updatedOptions = [...poll!.options];
    updatedOptions[optionIdx].votes += 1;

    await updateDoc(pollRef, {
      options: updatedOptions,
      votedBy: arrayUnion(uid)
    });
  };

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

  return (
    <div className="p-4 space-y-6 bg-white pb-24 font-['Hind_Siliguri']">
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
          <button onClick={handleShareApp} className="p-3 bg-slate-50 text-emerald-600 rounded-2xl active:scale-90 transition-all">
            <Share2 size={20} />
          </button>
          <button onClick={onShowNotifications} className="p-3 bg-slate-50 text-slate-600 rounded-2xl active:scale-90 transition-all relative">
            <Bell size={20} />
            {notifications.length > 0 && <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">{notifications.length}</span>}
          </button>
          <button onClick={() => setShowLogoutConfirm(true)} className="p-3 bg-rose-50 text-rose-600 rounded-2xl active:scale-90 transition-all"><LogOut size={20} /></button>
        </div>
      </div>

      <div className="bg-emerald-900 p-8 rounded-[48px] text-white shadow-2xl relative overflow-hidden group">
         <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
               <div>
                  <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1">ব্যালেন্স</p>
                  <h2 className="text-4xl font-black">৳{user.balance || 0}</h2>
               </div>
               <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <Wallet size={28} className="text-emerald-400" />
               </div>
            </div>
            <div className="flex gap-3">
               <button onClick={() => { setWalletView('recharge'); setShowWalletModal(true); }} className="flex-1 bg-white text-emerald-900 py-4 rounded-2xl font-black text-xs uppercase shadow-xl"><PlusCircle size={16} className="inline mr-1"/> রিচার্জ</button>
               <button onClick={() => { setWalletView('withdraw'); setShowWalletModal(true); }} className="flex-1 bg-emerald-800 text-white py-4 rounded-2xl font-black text-xs uppercase border border-white/10"><ArrowUpRight size={16} className="inline mr-1"/> উইথড্র</button>
            </div>
         </div>
      </div>

      {adminNotices.length > 0 && (
        <div className="px-1">
          <h4 className="font-black text-gray-900 text-xl flex items-center gap-2 mb-4">
            <Bell size={24} className="text-emerald-700" /> নোটিশ বোর্ড
          </h4>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1 snap-x no-scrollbar">
            {adminNotices.map(notice => (
              <div key={notice.id} className="min-w-[280px] max-w-[280px] bg-white rounded-[40px] border border-slate-100 shadow-sm p-4 snap-center flex flex-col gap-4">
                {notice.image && (
                  <div className="w-full h-32 rounded-[28px] overflow-hidden">
                    <img src={notice.image} className="w-full h-full object-cover" alt="Notice" />
                  </div>
                )}
                <div className="px-2">
                  <h5 className="font-black text-slate-800 text-sm line-clamp-1">{notice.title}</h5>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{notice.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3 bg-gray-50 p-6 rounded-[44px] border border-gray-100 mx-1">
        <StatItem icon={<Trophy className="text-yellow-500" size={18}/>} value={user.totalPoints?.toString() || "0"} label="পয়েন্ট" />
        <StatItem icon={<BookOpen className="text-blue-500" size={18}/>} value={user.playedQuizzes?.length.toString() || "0"} label="পরীক্ষা" />
        <StatItem icon={<Star className="text-emerald-500" size={18}/>} value="৫ম" label="র‍্যাংক" />
        <StatItem icon={<Flame className="text-orange-500" size={18}/>} value={user.streak?.toString() || "0"} label="স্ট্রিক" />
      </div>

      <div className="px-1">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-[48px] text-white shadow-xl relative overflow-hidden group active:scale-[0.98] transition-all cursor-pointer" onClick={handleShareApp}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-16 h-16 bg-white/20 rounded-[24px] flex items-center justify-center backdrop-blur-md shrink-0">
              <Users size={32} className="text-blue-100" />
            </div>
            <div>
              <h4 className="font-black text-xl mb-1">বন্ধুদের আমন্ত্রণ জানান!</h4>
              <p className="text-blue-100 text-xs font-bold">অ্যাপটি শেয়ার করে সবাইকে কুইজে চ্যালেঞ্জ করুন।</p>
            </div>
            <div className="ml-auto">
              <div className="w-10 h-10 bg-white text-blue-700 rounded-full flex items-center justify-center shadow-lg">
                <Share2 size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {activePolls.length > 0 && (
        <div className="px-1">
          {activePolls.map(poll => {
            const hasVoted = poll.votedBy?.includes(auth.currentUser?.uid || '');
            const totalVotes = poll.options.reduce((acc, opt) => acc + opt.votes, 0);

            return (
              <div key={poll.id} className="bg-slate-900 p-8 rounded-[48px] text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                  <h4 className="font-black text-xl mb-6 leading-tight flex items-center gap-3">
                    <BarChart3 className="text-emerald-400" size={24} /> {poll.question}
                  </h4>
                  <div className="space-y-3">
                    {poll.options.map((opt, idx) => {
                      const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                      return (
                        <button 
                          key={idx} 
                          onClick={() => !hasVoted && handleVote(poll.id, idx)}
                          disabled={hasVoted}
                          className={`w-full p-4 rounded-2xl font-bold text-xs relative overflow-hidden transition-all border ${hasVoted ? 'bg-white/5 border-white/10' : 'bg-white/10 border-white/10 hover:bg-white/20'}`}
                        >
                          <div className="relative z-10 flex justify-between items-center">
                            <span>{opt.text}</span>
                            {hasVoted && <span>{percentage}%</span>}
                          </div>
                          {hasVoted && (
                            <div className="absolute inset-y-0 left-0 bg-emerald-500/30 transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {hasVoted && <p className="text-[9px] font-black text-emerald-400 mt-4 text-center uppercase tracking-widest">ভোট দেওয়ার জন্য ধন্যবাদ!</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="px-1">
        <h4 className="font-black text-gray-900 text-xl flex items-center gap-2 mb-6">
          <Star size={24} className="text-amber-500 fill-amber-500" /> স্পেশাল কুইজ
        </h4>
        <div className="flex gap-5 overflow-x-auto pb-6 -mx-1 px-1 snap-x no-scrollbar">
          {specialQuizzes.length > 0 ? specialQuizzes.map((q) => (
            <button key={q.id} onClick={() => onSubjectSelect(q.title, false, false, 0, q.id, 'admin_special_quizzes')} className={`min-w-[280px] bg-gradient-to-br ${q.color || 'from-emerald-700 to-emerald-900'} p-8 rounded-[44px] text-white text-left snap-center shadow-2xl relative overflow-hidden group`}>
              <h5 className="text-2xl font-black mb-2 leading-tight pr-4">{q.title}</h5>
              <p className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-4 py-2 rounded-full border border-white/20 inline-block">{q.questionsCount || 10}টি প্রশ্ন</p>
            </button>
          )) : <div className="text-slate-300 font-black text-xs p-10">কোনো স্পেশাল কুইজ নেই</div>}
        </div>
      </div>

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
