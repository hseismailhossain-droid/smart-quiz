
import { Bell, BookOpen, Trophy, Flame, Star, LogOut, Edit3, Share2, Wallet, PlusCircle, ArrowUpRight, X, BarChart3, Users, CheckCircle2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Notification, UserProfile, Poll, AdminNotice, QuizResult, Question, AdPlacement, Lesson } from '../types';
import { db, auth } from '../services/firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, arrayUnion, getDocs, increment } from 'firebase/firestore';
import AdRenderer from './AdRenderer';

interface HomeTabProps {
  user: UserProfile;
  history: any;
  notifications: Notification[];
  lessons: Lesson[];
  onShowNotifications: () => void;
  onLogout: () => void;
  onSubjectSelect: (subject: string, isLive?: boolean, isPaid?: boolean, fee?: number, quizId?: string, collectionName?: string) => void;
  onLessonSelect: (lesson: Lesson) => void;
  onEditProfile: (view?: any) => void;
  onSubmitDeposit: (amount: number, method: any, trxId: string) => void;
  onSubmitWithdraw: (amount: number, method: any, accountNumber: string) => void;
}

const HomeTab: React.FC<HomeTabProps> = ({ 
  user, history, notifications, lessons, onShowNotifications, onLogout, onSubjectSelect, onLessonSelect, onEditProfile, onSubmitDeposit, onSubmitWithdraw 
}) => {
  const [specialQuizzes, setSpecialQuizzes] = useState<any[]>([]);
  const [adminNotices, setAdminNotices] = useState<AdminNotice[]>([]);
  const [activePolls, setActivePolls] = useState<Poll[]>([]);
  const [ads, setAds] = useState<Record<string, AdPlacement>>({});
  const [votingId, setVotingId] = useState<string | null>(null);

  useEffect(() => {
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
      await updateDoc(pollRef, { options: newOptions, votedBy: arrayUnion(auth.currentUser.uid) });
    } catch (e) { console.error(e); } finally { setVotingId(null); }
  };

  return (
    <div className="p-5 space-y-8 animate-in fade-in duration-500 font-['Hind_Siliguri']">
      {/* Header */}
      <div className="flex justify-between items-center px-1 pt-4">
          <button onClick={() => onEditProfile('profile')} className="flex items-center gap-4 text-left group">
            <div className="relative">
              <img src={user?.avatarUrl} alt="avatar" className="w-14 h-14 rounded-[22px] border-4 border-white shadow-xl object-cover transition-transform group-active:scale-95" />
              <div className="absolute -bottom-1 -right-1 bg-emerald-600 p-1.5 rounded-xl shadow-lg border-2 border-white">
                <Edit3 size={10} className="text-white" />
              </div>
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-800 leading-tight">স্বাগতম, {user?.name?.split(' ')[0]}!</h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{user?.category}</p>
            </div>
          </button>
          <div className="flex gap-2">
            <button onClick={onShowNotifications} className="p-3.5 bg-white text-slate-600 rounded-2xl relative shadow-sm border border-slate-100 active:scale-90 transition-all">
              <Bell size={20} />
              {notifications.length > 0 && <span className="absolute top-3 right-3 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">{notifications.length}</span>}
            </button>
            <button onClick={onLogout} className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 active:scale-90 transition-all"><LogOut size={20}/></button>
          </div>
      </div>

      {/* Premium Balance Card */}
      <div className="bg-emerald-900 p-10 rounded-[48px] text-white shadow-[0_20px_50px_rgba(4,120,87,0.3)] relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl transition-transform group-hover:scale-150 duration-700"></div>
         <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-400/10 rounded-full -ml-16 -mb-16 blur-2xl"></div>
         
         <div className="relative z-10">
            <p className="text-[10px] font-black text-emerald-300 uppercase tracking-[0.2em] mb-2">আপনার ওয়ালেট ব্যালেন্স</p>
            <div className="flex justify-between items-end mb-8">
               <h2 className="text-5xl font-black flex items-center gap-2">৳{user.balance || 0} <span className="text-sm font-bold text-emerald-400/60 uppercase tracking-widest">BDT</span></h2>
               <div className="p-4 bg-white/10 rounded-[24px] backdrop-blur-md border border-white/10 shadow-inner">
                  <Wallet size={32} className="text-emerald-400" />
               </div>
            </div>
            <div className="flex gap-3">
               <button onClick={() => onEditProfile('wallet')} className="flex-1 py-4 bg-white text-emerald-900 rounded-[22px] font-black text-xs uppercase shadow-xl hover:bg-emerald-50 active:scale-95 transition-all">রিচার্জ</button>
               <button onClick={() => onEditProfile('wallet')} className="flex-1 py-4 bg-white/10 text-white rounded-[22px] font-black text-xs uppercase border border-white/20 hover:bg-white/20 active:scale-95 transition-all">উত্তোলন</button>
            </div>
         </div>
      </div>

      {/* Notice Slider */}
      {adminNotices.length > 0 && (
        <div className="px-1">
          <h4 className="font-black text-slate-800 text-xl flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><Bell size={20} /></div> নোটিশ বোর্ড
          </h4>
          <div className="flex gap-5 overflow-x-auto pb-4 -mx-5 px-5 snap-x no-scrollbar">
            {adminNotices.map(notice => (
              <div key={notice.id} className="min-w-[300px] bg-white rounded-[40px] border border-slate-100 shadow-sm p-5 snap-center relative overflow-hidden group">
                {notice.image && <img src={notice.image} className="w-full h-36 rounded-[32px] object-cover mb-4 transition-transform group-hover:scale-105 duration-500 shadow-sm" alt="Notice" />}
                <div className="px-2">
                  <h5 className="font-black text-slate-800 text-sm leading-tight line-clamp-1">{notice.title}</h5>
                  <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed font-medium">{notice.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Poll Section */}
      {activePolls.length > 0 && (
        <div className="px-1">
          <div className="bg-slate-900 p-10 rounded-[48px] text-white shadow-2xl relative overflow-hidden">
             <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]"></div>
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6 bg-white/5 w-max px-4 py-1.5 rounded-full border border-white/5">
                   <BarChart3 size={16} className="text-emerald-400" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">জনমত যাচাই</span>
                </div>
                {activePolls.map(poll => {
                  const hasVoted = poll.votedBy?.includes(auth.currentUser?.uid || '');
                  const totalVotes = poll.options.reduce((acc, curr) => acc + curr.votes, 0);
                  return (
                    <div key={poll.id} className="space-y-6">
                       <h5 className="text-xl font-black leading-snug">{poll.question}</h5>
                       <div className="space-y-3">
                          {poll.options.map((opt, idx) => {
                            const percent = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                            return (
                              <button 
                                key={idx} disabled={hasVoted || !!votingId} onClick={() => handleVote(poll.id, idx)}
                                className={`w-full relative overflow-hidden rounded-[24px] border transition-all ${hasVoted ? 'bg-white/5 border-white/10' : 'bg-white/10 border-white/5 active:scale-95 hover:bg-white/15'}`}
                              >
                                {hasVoted && <div className="absolute inset-y-0 left-0 bg-emerald-500/20 transition-all duration-1000" style={{ width: `${percent}%` }}></div>}
                                <div className="relative z-10 p-5 flex justify-between items-center">
                                   <span className={`text-[13px] font-bold ${hasVoted ? 'text-white' : 'text-slate-300'}`}>{opt.text}</span>
                                   {hasVoted && <span className="text-xs font-black text-emerald-400">{percent}%</span>}
                                </div>
                              </button>
                            );
                          })}
                       </div>
                       {hasVoted && <p className="text-[10px] font-black text-center text-slate-500 uppercase tracking-widest">মতামত দেওয়ার জন্য ধন্যবাদ!</p>}
                    </div>
                  );
                })}
             </div>
          </div>
        </div>
      )}

      {/* Special Quiz */}
      <div className="px-1">
        <h4 className="font-black text-slate-800 text-xl flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500"><Star size={20} fill="currentColor" /></div> স্পেশাল কুইজ
        </h4>
        <div className="flex gap-5 overflow-x-auto pb-6 -mx-5 px-5 snap-x no-scrollbar">
          {specialQuizzes.map((q) => (
            <button key={q.id} onClick={() => onSubjectSelect(q.title, false, false, 0, q.id, 'admin_special_quizzes')} className="min-w-[280px] bg-gradient-to-br from-emerald-700 to-emerald-900 p-8 rounded-[44px] text-white text-left snap-center shadow-2xl relative overflow-hidden active:scale-95 transition-all group">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-all"></div>
              <h5 className="text-2xl font-black mb-3 leading-tight relative z-10 line-clamp-2">{q.title}</h5>
              <div className="flex items-center gap-3 relative z-10">
                 <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-4 py-2 rounded-full border border-white/20">{q.questionsCount || 10}টি প্রশ্ন</span>
                 <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/40 px-4 py-2 rounded-full border border-white/10">Special</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lessons List */}
      {lessons && lessons.length > 0 && (
        <div className="px-1">
          <h4 className="font-black text-slate-800 text-xl flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><BookOpen size={20} /></div> আজকের পাঠ
          </h4>
          <div className="grid grid-cols-1 gap-4">
            {lessons.map(lesson => (
              <button 
                key={lesson.id} onClick={() => onLessonSelect(lesson)}
                className="w-full bg-white p-6 rounded-[36px] border border-slate-100 shadow-sm flex items-center gap-5 text-left active:scale-[0.98] transition-all hover:border-indigo-200"
              >
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                  <BookOpen size={28} />
                </div>
                <div>
                  <h5 className="font-black text-slate-800 text-[15px] leading-tight line-clamp-1">{lesson.title}</h5>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.1em] mt-1.5 bg-indigo-50/50 w-max px-2.5 py-1 rounded-md">{lesson.category}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer Ad */}
      <AdRenderer placement={ads['home_bottom']} />
      
      <div className="pt-10 text-center pb-10">
         <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Smart Quiz Pro v2.5</p>
      </div>
    </div>
  );
};

export default HomeTab;
