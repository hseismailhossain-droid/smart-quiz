
import React, { useState, useEffect } from 'react';
import { UserProfile, QuizResult, Question, Notification, Lesson } from '../types';
import { Bell, Edit3, Wallet, CreditCard, Megaphone, BarChart3, Star, ChevronRight, Zap, CheckCircle2 } from 'lucide-react';
import AdRenderer from './AdRenderer';
import { db, auth } from '../services/firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, arrayUnion, increment } from 'firebase/firestore';

interface HomeTabProps {
  user: UserProfile;
  history: { exams: QuizResult[], mistakes: Question[], marked: Question[] };
  notifications: Notification[];
  lessons: Lesson[];
  onShowNotifications: () => void;
  onLogout: () => void;
  onSubjectSelect: (subject: string, isLive?: boolean, isPaid?: boolean, entryFee?: number, quizId?: string, collectionName?: string) => void;
  onLessonSelect: (lesson: Lesson) => void;
  onEditProfile: (tab?: 'profile' | 'report' | 'privacy' | 'wallet') => void;
  onSubmitDeposit: (amount: number, method: 'bkash' | 'nagad', trxId: string) => void;
  onSubmitWithdraw: (amount: number, method: 'bkash' | 'nagad', accountNumber: string) => void;
}

const HomeTab: React.FC<HomeTabProps> = ({ 
  user, history, notifications, lessons, onShowNotifications, onLogout, 
  onSubjectSelect, onLessonSelect, onEditProfile, onSubmitDeposit, onSubmitWithdraw 
}) => {
  const [notices, setNotices] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [specialQuizzes, setSpecialQuizzes] = useState<any[]>([]);

  useEffect(() => {
    // Fetch active notice
    const unsubNotices = onSnapshot(query(collection(db, 'admin_notices'), orderBy('timestamp', 'desc'), limit(1)), (snap) => {
      setNotices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Fetch active poll
    const unsubPolls = onSnapshot(query(collection(db, 'admin_polls'), orderBy('timestamp', 'desc'), limit(1)), (snap) => {
      setPolls(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Fetch special quizzes
    const unsubSpecial = onSnapshot(query(collection(db, 'admin_special_quizzes'), orderBy('timestamp', 'desc'), limit(5)), (snap) => {
      setSpecialQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubNotices(); unsubPolls(); unsubSpecial(); };
  }, []);

  const handleVote = async (pollId: string, optionIndex: number) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const poll = polls.find(p => p.id === pollId);
    
    if (poll.votedBy?.includes(uid)) return alert("আপনি ইতিমধ্যে ভোট দিয়েছেন।");

    const updatedOptions = [...poll.options];
    updatedOptions[optionIndex].votes += 1;

    await updateDoc(doc(db, 'admin_polls', pollId), {
      options: updatedOptions,
      votedBy: arrayUnion(uid)
    });
  };

  return (
    <div className="p-5 space-y-8 animate-in fade-in duration-500 font-['Hind_Siliguri'] pb-20">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-700 flex items-center justify-center text-white font-black text-xl shadow-lg">SQ</div>
          <div>
            <h2 className="text-xl font-black text-slate-800">স্বাগতম, {user.name.split(' ')[0]}</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{user.category}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onShowNotifications} className="relative p-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-400 active:scale-90 transition-all">
            <Bell size={20} />
            {notifications.filter(n => !n.isRead).length > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>}
          </button>
          <button onClick={() => onEditProfile('profile')} className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-400 active:scale-90 transition-all">
            <Edit3 size={20} />
          </button>
        </div>
      </div>

      {/* Balance Card */}
      <div className="bg-emerald-800 p-8 rounded-[44px] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <p className="text-emerald-300 text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">বর্তমান ব্যালেন্স</p>
            <h3 className="text-4xl font-black tracking-tight">৳{user.balance}</h3>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onEditProfile('wallet')} className="bg-white/20 p-4 rounded-[24px] backdrop-blur-md active:scale-95 transition-all"><Wallet size={20}/></button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => onEditProfile('wallet')} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4 active:scale-95 transition-all">
           <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Wallet size={20}/></div>
           <span className="font-black text-xs">রিচার্জ</span>
        </button>
        <button onClick={() => onEditProfile('wallet')} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4 active:scale-95 transition-all">
           <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center"><CreditCard size={20}/></div>
           <span className="font-black text-xs">উত্তোলন</span>
        </button>
      </div>

      {/* Notice Board Section */}
      {notices.length > 0 && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 px-2">
            <Megaphone size={18} className="text-rose-500" />
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">নোটিশ বোর্ড</h3>
          </div>
          {notices.map(notice => (
            <div key={notice.id} className="bg-white p-6 rounded-[36px] border border-slate-100 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-[40px] -mr-8 -mt-8 opacity-40"></div>
               <h4 className="font-black text-slate-900 mb-2 leading-tight">{notice.title}</h4>
               <p className="text-xs text-slate-500 leading-relaxed font-medium line-clamp-3">{notice.content}</p>
               {notice.image && <img src={notice.image} className="mt-4 w-full h-32 object-cover rounded-2xl" alt=""/>}
            </div>
          ))}
        </div>
      )}

      {/* Poll Section */}
      {polls.length > 0 && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500 delay-100">
           <div className="flex items-center gap-2 px-2">
            <BarChart3 size={18} className="text-indigo-600" />
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">জনমত জরিপ (Poll)</h3>
          </div>
          {polls.map(poll => {
            const hasVoted = poll.votedBy?.includes(auth.currentUser?.uid);
            const totalVotes = poll.options.reduce((sum: number, opt: any) => sum + opt.votes, 0);
            
            return (
              <div key={poll.id} className="bg-white p-8 rounded-[40px] border border-indigo-50 shadow-sm space-y-6">
                 <h4 className="font-black text-slate-900 text-sm leading-relaxed">{poll.question}</h4>
                 <div className="space-y-3">
                    {poll.options.map((opt: any, idx: number) => {
                      const percentage = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
                      return (
                        <button 
                          key={idx} 
                          disabled={hasVoted}
                          onClick={() => handleVote(poll.id, idx)}
                          className={`w-full relative h-14 rounded-2xl overflow-hidden border transition-all ${hasVoted ? 'border-transparent' : 'border-slate-100 hover:border-indigo-300'}`}
                        >
                           {hasVoted && (
                             <div className="absolute inset-0 bg-indigo-50 transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                           )}
                           <div className="absolute inset-0 px-5 flex justify-between items-center z-10">
                              <span className={`text-xs font-black ${hasVoted ? 'text-indigo-900' : 'text-slate-600'}`}>{opt.text}</span>
                              {hasVoted && <span className="text-[10px] font-black text-indigo-500">{percentage}%</span>}
                           </div>
                        </button>
                      );
                    })}
                 </div>
                 {hasVoted && <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">ভোট দেওয়ার জন্য ধন্যবাদ!</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Special Quiz Section */}
      <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500 delay-200">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Star size={18} className="text-amber-500" fill="currentColor" />
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">স্পেশাল কুইজ</h3>
          </div>
        </div>
        
        <div className="space-y-4">
          {specialQuizzes.map((quiz) => (
            <div key={quiz.id} className="bg-white p-6 rounded-[36px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-amber-200 transition-all active:scale-95" onClick={() => onSubjectSelect(quiz.title, false, true, quiz.entryFee, quiz.id, 'admin_special_quizzes')}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                   <Zap size={28} fill="currentColor" />
                </div>
                <div>
                  <h4 className="font-black text-slate-800 text-sm leading-tight">{quiz.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">পুরস্কার: ৳{quiz.prizePool}</span>
                     <span className="text-[9px] font-black text-slate-400 uppercase">এন্ট্রি: ৳{quiz.entryFee}</span>
                  </div>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
            </div>
          ))}
          
          {specialQuizzes.length === 0 && (
            <div className="py-12 text-center bg-white rounded-[36px] border-2 border-dashed border-slate-100">
               <p className="text-slate-300 font-black uppercase text-[10px] tracking-widest">বর্তমানে কোনো স্পেশাল কুইজ নেই</p>
            </div>
          )}
        </div>
      </div>

      <AdRenderer placementId="home_bottom" />
      
      <div className="pt-10 text-center pb-10">
         <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Smart Quiz Pro v2.5</p>
      </div>
    </div>
  );
};

export default HomeTab;
