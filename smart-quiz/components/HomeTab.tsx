
import { Bell, BookOpen, Trophy, Flame, Star, LogOut, Edit3, Share2, Wallet, PlusCircle, ArrowUpRight, X, BarChart3, Users, CheckCircle2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Notification, UserProfile, Poll, AdminNotice, QuizResult, Question, AdPlacement } from '../types';
import { db, auth } from '../services/firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, arrayUnion, getDocs, increment } from 'firebase/firestore';
import AdRenderer from './AdRenderer';

interface HomeTabProps {
  user: UserProfile;
  history: any;
  notifications: Notification[];
  onShowNotifications: () => void;
  onLogout: () => void;
  onSubjectSelect: (subject: string, isLive?: boolean, isPaid?: boolean, fee?: number, quizId?: string, collectionName?: string) => void;
  onEditProfile: (view?: any) => void;
  onSubmitDeposit: (amount: number, method: any, trxId: string) => void;
  onSubmitWithdraw: (amount: number, method: any, accountNumber: string) => void;
}

const HomeTab: React.FC<HomeTabProps> = ({ 
  user, history, notifications, onShowNotifications, onLogout, onSubjectSelect, onEditProfile, onSubmitDeposit, onSubmitWithdraw 
}) => {
  const [specialQuizzes, setSpecialQuizzes] = useState<any[]>([]);
  const [adminNotices, setAdminNotices] = useState<AdminNotice[]>([]);
  const [activePolls, setActivePolls] = useState<Poll[]>([]);
  const [ads, setAds] = useState<Record<string, AdPlacement>>({});
  const [votingId, setVotingId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch Ads Real-time
    const unsubAds = onSnapshot(collection(db, 'ad_placements'), (snap) => {
      const data: any = {};
      snap.docs.forEach(d => data[d.id] = d.data());
      setAds(data);
    });

    const unsubSpecial = onSnapshot(query(collection(db, 'admin_special_quizzes'), orderBy('timestamp', 'desc'), limit(5)), 
        (snap) => setSpecialQuizzes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));

    const unsubNotice = onSnapshot(query(collection(db, 'admin_notices'), orderBy('timestamp', 'desc'), limit(5)), 
        (snap) => setAdminNotices(snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminNotice))));

    const unsubPoll = onSnapshot(query(collection(db, 'admin_polls'), orderBy('timestamp', 'desc'), limit(1)), 
        (snap) => setActivePolls(snap.docs.map(d => ({ id: d.id, ...d.data() } as Poll))));

    return () => { unsubAds(); unsubSpecial(); unsubNotice(); unsubPoll(); };
  }, []);

  const handleVote = async (pollId: string, optionIndex: number) => {
    if (!auth.currentUser || votingId) return;
    const poll = activePolls.find(p => p.id === pollId);
    if (!poll || poll.votedBy?.includes(auth.currentUser.uid)) return;

    setVotingId(pollId);
    try {
      const pollRef = doc(db, 'admin_polls', pollId);
      const newOptions = [...poll.options];
      newOptions[optionIndex].votes += 1;
      
      await updateDoc(pollRef, {
        options: newOptions,
        votedBy: arrayUnion(auth.currentUser.uid)
      });
    } catch (e) {
      console.error(e);
    } finally {
      setVotingId(null);
    }
  };

  return (
    <div className="p-4 space-y-6 bg-white pb-24 font-['Hind_Siliguri']">
      {/* Header */}
      <div className="flex justify-between items-center px-1">
          <button onClick={() => onEditProfile('profile')} className="flex items-center gap-4 text-left group">
            <div className="relative">
              <img src={user?.avatarUrl} alt="avatar" className="w-14 h-14 rounded-2xl border-2 border-emerald-500 object-cover transition-transform group-active:scale-95" />
              <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-lg shadow-sm border border-slate-100">
                <Edit3 size={10} className="text-emerald-600" />
              </div>
            </div>
            <div>
              <h3 className="font-black text-lg text-gray-900 leading-tight truncate max-w-[120px]">{user?.name}</h3>
              <p className="text-[9px] font-bold text-gray-400 uppercase">{user?.category?.split(' ')[0]}</p>
            </div>
          </button>
          <div className="flex gap-2">
            <button onClick={onShowNotifications} className="p-3 bg-slate-50 text-slate-600 rounded-2xl relative transition-all active:scale-90">
              <Bell size={20} />
              {notifications.length > 0 && <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">{notifications.length}</span>}
            </button>
            <button onClick={onLogout} className="p-3 bg-rose-50 text-rose-600 rounded-2xl active:scale-90 transition-all"><LogOut size={20}/></button>
          </div>
      </div>

      {/* Dynamic Ad: Home Top */}
      <AdRenderer placement={ads['home_top']} />

      {/* Balance Card */}
      <div className="bg-emerald-900 p-8 rounded-[48px] text-white shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 blur-2xl"></div>
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
            <div className="flex gap-2">
               <button onClick={() => onEditProfile('report')} className="flex-1 py-3 bg-white text-emerald-900 rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all">রিচার্জ</button>
               <button onClick={() => onEditProfile('report')} className="flex-1 py-3 bg-white/10 text-white rounded-2xl font-black text-xs uppercase border border-white/20 active:scale-95 transition-all">উত্তোলন</button>
            </div>
         </div>
      </div>

      {/* Notice Board */}
      {adminNotices.length > 0 && (
        <div className="px-1">
          <h4 className="font-black text-gray-900 text-xl flex items-center gap-2 mb-4">
            <Bell size={24} className="text-emerald-700" /> নোটিশ বোর্ড
          </h4>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1 snap-x no-scrollbar">
            {adminNotices.map(notice => (
              <div key={notice.id} className="min-w-[280px] bg-white rounded-[40px] border border-slate-100 shadow-sm p-4 snap-center group">
                {notice.image && <img src={notice.image} className="w-full h-32 rounded-[28px] object-cover mb-4 group-hover:scale-105 transition-all" alt="Notice" />}
                <h5 className="font-black text-slate-800 text-sm line-clamp-1 px-2">{notice.title}</h5>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 px-2 leading-relaxed">{notice.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Poll Section */}
      {activePolls.length > 0 && (
        <div className="px-1">
          <div className="bg-slate-900 p-8 rounded-[48px] text-white shadow-2xl relative overflow-hidden">
             <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
             <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                   <BarChart3 size={20} className="text-emerald-400" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">মতামত দিন</span>
                </div>
                {activePolls.map(poll => {
                  const hasVoted = poll.votedBy?.includes(auth.currentUser?.uid || '');
                  const totalVotes = poll.options.reduce((acc, curr) => acc + curr.votes, 0);
                  
                  return (
                    <div key={poll.id} className="space-y-6">
                       <h5 className="text-lg font-black leading-tight">{poll.question}</h5>
                       <div className="space-y-3">
                          {poll.options.map((opt, idx) => {
                            const percent = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                            return (
                              <button 
                                key={idx} 
                                disabled={hasVoted || !!votingId}
                                onClick={() => handleVote(poll.id, idx)}
                                className={`w-full group relative overflow-hidden rounded-2xl transition-all ${hasVoted ? 'bg-white/5 cursor-default' : 'bg-white/10 hover:bg-white/20 active:scale-[0.98]'}`}
                              >
                                {hasVoted && (
                                   <div 
                                    className="absolute inset-y-0 left-0 bg-emerald-500/20 transition-all duration-1000" 
                                    style={{ width: `${percent}%` }}
                                   ></div>
                                )}
                                <div className="relative z-10 p-4 flex justify-between items-center">
                                   <span className={`text-xs font-bold ${hasVoted ? 'text-white' : 'text-slate-300'}`}>{opt.text}</span>
                                   {hasVoted && <span className="text-[10px] font-black text-emerald-400">{percent}%</span>}
                                </div>
                              </button>
                            );
                          })}
                       </div>
                       {hasVoted && <p className="text-[9px] font-bold text-center text-slate-500 uppercase tracking-widest">ভোট দেওয়ার জন্য ধন্যবাদ!</p>}
                    </div>
                  );
                })}
             </div>
          </div>
        </div>
      )}

      {/* Dynamic Ad: Home Middle */}
      <AdRenderer placement={ads['home_middle']} />

      {/* Special Quiz Section */}
      <div className="px-1">
        <h4 className="font-black text-gray-900 text-xl flex items-center gap-2 mb-6">
          <Star size={24} className="text-amber-500 fill-amber-500" /> স্পেশাল কুইজ
        </h4>
        <div className="flex gap-5 overflow-x-auto pb-6 -mx-1 px-1 snap-x no-scrollbar">
          {specialQuizzes.map((q) => (
            <button key={q.id} onClick={() => onSubjectSelect(q.title, false, false, 0, q.id, 'admin_special_quizzes')} className="min-w-[280px] bg-gradient-to-br from-emerald-700 to-emerald-900 p-8 rounded-[44px] text-white text-left snap-center shadow-2xl relative overflow-hidden active:scale-95 transition-all group">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl transition-all group-hover:scale-150"></div>
              <h5 className="text-2xl font-black mb-2 leading-tight relative z-10">{q.title}</h5>
              <p className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-4 py-2 rounded-full border border-white/20 inline-block relative z-10">{q.questionsCount || 10}টি প্রশ্ন</p>
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Ad: Home Bottom */}
      <AdRenderer placement={ads['home_bottom']} />
    </div>
  );
};

export default HomeTab;
