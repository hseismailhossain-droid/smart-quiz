
import React, { useState, useEffect } from 'react';
import { Wallet, Loader2, Zap, ChevronRight, GraduationCap, School, Briefcase, Moon, Sparkles, Star, LayoutGrid, ArrowLeft, Send, AlertCircle, Cpu, BookOpen, PlusCircle, ArrowUpRight, X, CheckCircle2, Clock, Calendar, PenTool, Brain } from 'lucide-react';
import { UserProfile, ExamCategory } from '../types';
import { db, auth } from '../services/firebase';
import { collection, onSnapshot, query, doc, where, orderBy, limit } from 'firebase/firestore';
import PuzzlesTab from './PuzzlesTab';

interface ExamTabProps {
  user: UserProfile;
  onSubjectSelect: (subject: string, isLive: boolean, isPaid?: boolean, entryFee?: number, quizId?: string, collectionName?: string) => void;
  onSubmitDeposit: (amount: number, method: 'bkash' | 'nagad', trxId: string) => void;
  onSubmitWithdraw: (amount: number, method: 'bkash' | 'nagad', accountNumber: string) => void;
}

const ExamTab: React.FC<ExamTabProps> = ({ user, onSubjectSelect, onSubmitDeposit, onSubmitWithdraw }) => {
  const [examMode, setExamMode] = useState<'mock' | 'live' | 'paid' | 'special' | 'fun'>('mock');
  const [selectedMockCategory, setSelectedMockCategory] = useState<string | null>(null);
  const [dynamicCategories, setDynamicCategories] = useState<ExamCategory[]>([]);
  
  // Custom Quiz States
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [customTopic, setCustomTopic] = useState('');

  const [paidQuizzes, setPaidQuizzes] = useState<any[]>([]);
  const [liveQuizzes, setLiveQuizzes] = useState<any[]>([]);
  const [specialQuizzes, setSpecialQuizzes] = useState<any[]>([]);
  const [adminMockQuizzes, setAdminMockQuizzes] = useState<any[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubs = [
      onSnapshot(query(collection(db, 'exam_categories'), orderBy('timestamp', 'asc')), (snap) => setDynamicCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as ExamCategory)))),
      onSnapshot(query(collection(db, 'paid_quizzes'), where('status', '==', 'active'), limit(10)), (snap) => setPaidQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, 'live_quizzes'), where('status', '==', 'active'), limit(10)), (snap) => setLiveQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, 'admin_special_quizzes'), orderBy('timestamp', 'desc'), limit(10)), (snap) => setSpecialQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, 'mock_quizzes'), orderBy('timestamp', 'desc'), limit(15)), (snap) => setAdminMockQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    ];

    return () => unsubs.forEach(u => u());
  }, []);

  const getLucideIcon = (name: string) => {
    switch (name) {
      case 'GraduationCap': return <GraduationCap size={20} />;
      case 'BookOpen': return <BookOpen size={20} />;
      case 'School': return <School size={20} />;
      case 'Briefcase': return <Briefcase size={20} />;
      case 'Moon': return <Moon size={20} />;
      case 'Star': return <Star size={20} />;
      default: return <LayoutGrid size={20} />;
    }
  };

  const handleStartCustomQuiz = () => {
    if (!customTopic.trim()) return alert("টপিকের নাম লিখুন");
    onSubjectSelect(customTopic.trim(), false);
    setShowCustomPrompt(false);
    setCustomTopic('');
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-32 font-hind">
      <div className="bg-emerald-800 pt-10 pb-20 px-6 rounded-b-[40px] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <h2 className="text-2xl font-black text-white mb-6">পরীক্ষা কেন্দ্র</h2>
        <div className="flex bg-black/20 p-1 rounded-2xl overflow-x-auto no-scrollbar gap-1">
          {['mock', 'live', 'paid', 'special', 'fun'].map((mode) => (
            <button key={mode} onClick={() => { setExamMode(mode as any); setSelectedMockCategory(null); }} className={`flex-1 min-w-[75px] py-2.5 rounded-xl font-black text-[10px] uppercase transition-all ${examMode === mode ? 'bg-white text-emerald-800 shadow-lg' : 'text-white/50'}`}>{mode}</button>
          ))}
        </div>
      </div>

      <div className="px-5 -mt-8 relative z-10">
        {examMode === 'mock' && (
           <div className="space-y-6">
             {!selectedMockCategory ? (
                <div className="grid grid-cols-2 gap-4">
                  {/* Custom Subject AI Card */}
                  <button 
                    onClick={() => setShowCustomPrompt(true)}
                    className="col-span-2 bg-gradient-to-br from-indigo-600 to-emerald-700 p-6 rounded-[36px] shadow-xl text-white text-left relative overflow-hidden group active:scale-95 transition-all"
                  >
                     <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-all"></div>
                     <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md"><PenTool size={24}/></div>
                        <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/30 px-3 py-1.5 rounded-full border border-white/20">AI Magic</span>
                     </div>
                     <h3 className="text-lg font-black leading-tight">AI কাস্টম কুইজ</h3>
                     <p className="text-[10px] opacity-70 font-bold mt-1 uppercase tracking-widest">পছন্দমতো যেকোনো বিষয়ে পরীক্ষা দিন</p>
                  </button>

                  {dynamicCategories.map((cat) => (
                    <button key={cat.id} onClick={() => setSelectedMockCategory(cat.label)} className="bg-white p-5 rounded-[32px] shadow-sm border border-slate-100 flex flex-col items-center gap-3 group active:scale-95 transition-all">
                       <div className={`w-14 h-14 ${cat.color} text-white rounded-2xl flex items-center justify-center shadow-md group-hover:rotate-6 transition-all`}>
                         {getLucideIcon(cat.iconName)}
                       </div>
                       <span className="font-black text-slate-800 text-[11px] text-center">{cat.label}</span>
                    </button>
                  ))}
                </div>
             ) : (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                   <button onClick={() => setSelectedMockCategory(null)} className="flex items-center gap-2 text-emerald-700 font-black text-xs mb-2 bg-emerald-50 px-4 py-2 rounded-full w-max"><ArrowLeft size={14}/> ফিরে যান</button>
                   <div className="grid grid-cols-1 gap-3">
                      {adminMockQuizzes.filter(q => q.category === selectedMockCategory).map(quiz => (
                        <button key={quiz.id} onClick={() => onSubjectSelect(quiz.title, false, false, 0, quiz.id, 'mock_quizzes')} className="w-full p-6 bg-white rounded-[28px] border border-slate-50 text-left font-black shadow-sm flex justify-between items-center group hover:border-emerald-200 transition-all active:scale-95">
                           <div>
                              <p className="text-xs text-slate-800 mb-0.5">{quiz.title}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{quiz.subject}</p>
                           </div>
                           <ChevronRight size={18} className="text-emerald-700 group-hover:translate-x-1 transition-all" />
                        </button>
                      ))}
                      {adminMockQuizzes.filter(q => q.category === selectedMockCategory).length === 0 && (
                        <div className="py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                           <p className="text-slate-300 font-black uppercase text-[10px] tracking-widest">এই ক্যাটাগরিতে কোনো কুইজ নেই</p>
                        </div>
                      )}
                   </div>
                </div>
             )}
           </div>
        )}

        {(examMode === 'paid' || examMode === 'live' || examMode === 'special') && (
           <div className="space-y-4 animate-in fade-in duration-500">
             {(examMode === 'paid' ? paidQuizzes : examMode === 'live' ? liveQuizzes : specialQuizzes).map(quiz => (
                <div key={quiz.id} className="bg-white p-8 rounded-[40px] shadow-md border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-[40px] -mr-8 -mt-8 opacity-40"></div>
                    <div className="flex justify-between items-start mb-6">
                       <div>
                          <h3 className="text-xl font-black text-slate-900 leading-tight mb-1">{quiz.title}</h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{quiz.subject}</p>
                       </div>
                       <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600"><Star size={20} fill="currentColor"/></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-8">
                       <div className="bg-slate-50 p-4 rounded-[22px] border border-slate-100 text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">পুরস্কার</p>
                          <p className="text-lg font-black text-emerald-700">৳{quiz.prizePool}</p>
                       </div>
                       <div className="bg-slate-50 p-4 rounded-[22px] border border-slate-100 text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">এন্ট্রি ফি</p>
                          <p className="text-lg font-black text-slate-800">৳{quiz.entryFee}</p>
                       </div>
                    </div>

                    <button onClick={() => onSubjectSelect(quiz.title, examMode === 'live', examMode === 'paid', quiz.entryFee, quiz.id, examMode === 'paid' ? 'paid_quizzes' : 'live_quizzes')} className="w-full bg-slate-900 text-white py-4 rounded-[24px] font-black text-sm uppercase shadow-xl active:scale-95 transition-all">অংশ নিন</button>
                </div>
             ))}
             {(examMode === 'paid' ? paidQuizzes : examMode === 'live' ? liveQuizzes : specialQuizzes).length === 0 && (
                <div className="py-32 text-center">
                   <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300"><Zap size={40}/></div>
                   <p className="text-slate-300 font-black uppercase text-[10px] tracking-[0.3em]">কোনো সক্রিয় কুইজ নেই</p>
                </div>
             )}
           </div>
        )}

        {examMode === 'fun' && <PuzzlesTab />}
      </div>

      {/* Custom Topic Modal */}
      {showCustomPrompt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[2000] flex items-center justify-center p-6 font-hind">
           <div className="bg-white w-full max-w-sm rounded-[48px] p-10 animate-in zoom-in-95 duration-200 shadow-2xl relative border border-white/20">
              <button onClick={() => setShowCustomPrompt(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors"><X/></button>
              
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[28px] flex items-center justify-center mx-auto mb-8 shadow-inner">
                 <Brain size={40}/>
              </div>

              <h3 className="text-2xl font-black text-slate-900 text-center mb-2">AI কাস্টম কুইজ</h3>
              <p className="text-xs text-slate-400 font-bold text-center mb-10 px-4 leading-relaxed">যেকোনো একটি বিষয়ের নাম লিখুন, AI আপনার জন্য মুহূর্তেই কুইজ তৈরি করবে!</p>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">বিষয়ের নাম</label>
                    <input 
                      type="text" value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} 
                      placeholder="যেমন: ফুটবল ইতিহাস বা স্পেস সায়েন্স"
                      className="w-full bg-slate-50 border-2 border-slate-50 p-5 rounded-[24px] font-black outline-none focus:bg-white focus:border-indigo-200 transition-all shadow-inner"
                      autoFocus
                    />
                 </div>
                 <button 
                  onClick={handleStartCustomQuiz}
                  className="w-full bg-indigo-600 text-white py-5 rounded-[28px] font-black text-lg shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                 >
                   কুইজ শুরু করুন <ChevronRight size={20}/>
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ExamTab;
