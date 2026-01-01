
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

  const formatDateTime = (dtStr?: string) => {
    if (!dtStr) return null;
    const dt = new Date(dtStr);
    return dt.toLocaleString('bn-BD', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-32 font-hind">
      <div className="bg-emerald-800 pt-10 pb-20 px-6 rounded-b-[40px] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <h2 className="text-2xl font-black text-white mb-6 tracking-tight">পরীক্ষা কেন্দ্র</h2>
        <div className="flex bg-black/20 p-1 rounded-2xl overflow-x-auto no-scrollbar gap-1 backdrop-blur-md">
          {['mock', 'live', 'paid', 'special', 'fun'].map((mode) => (
            <button key={mode} onClick={() => { setExamMode(mode as any); setSelectedMockCategory(null); }} className={`flex-1 min-w-[75px] py-2.5 rounded-xl font-black text-[10px] uppercase transition-all ${examMode === mode ? 'bg-white text-emerald-800 shadow-lg scale-105' : 'text-white/50 hover:text-white'}`}>{mode}</button>
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
                    className="col-span-2 bg-gradient-to-br from-indigo-600 to-emerald-700 p-7 rounded-[40px] shadow-xl text-white text-left relative overflow-hidden group active:scale-95 transition-all"
                  >
                     <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-all duration-700"></div>
                     <div className="flex justify-between items-start mb-4">
                        <div className="p-3.5 bg-white/20 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner"><Brain size={28}/></div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-white/20 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-sm">AI Mode</span>
                     </div>
                     <h3 className="text-xl font-black leading-tight">কাস্টম টপিকে কুইজ</h3>
                     <p className="text-[10px] opacity-70 font-bold mt-1 uppercase tracking-widest">আপনার পছন্দমতো টপিক লিখে দিন</p>
                  </button>

                  {dynamicCategories.map((cat) => (
                    <button key={cat.id} onClick={() => setSelectedMockCategory(cat.label)} className="bg-white p-6 rounded-[36px] shadow-sm border border-slate-100 flex flex-col items-center gap-4 group active:scale-95 transition-all hover:border-emerald-200">
                       <div className={`w-14 h-14 ${cat.color} text-white rounded-[20px] flex items-center justify-center shadow-lg group-hover:rotate-6 transition-all`}>
                         {getLucideIcon(cat.iconName)}
                       </div>
                       <span className="font-black text-slate-800 text-[11px] text-center leading-tight">{cat.label}</span>
                    </button>
                  ))}
                </div>
             ) : (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                   <button onClick={() => setSelectedMockCategory(null)} className="flex items-center gap-2 text-emerald-700 font-black text-[10px] uppercase tracking-widest mb-2 bg-emerald-50 px-5 py-2.5 rounded-full w-max shadow-sm active:scale-90 transition-all"><ArrowLeft size={14}/> ফিরে যান</button>
                   <div className="grid grid-cols-1 gap-3">
                      {adminMockQuizzes.filter(q => q.category === selectedMockCategory).map(quiz => (
                        <button key={quiz.id} onClick={() => onSubjectSelect(quiz.title, false, false, 0, quiz.id, 'mock_quizzes')} className="w-full p-7 bg-white rounded-[32px] border border-slate-50 text-left font-black shadow-sm flex justify-between items-center group hover:border-emerald-200 transition-all active:scale-95">
                           <div className="min-w-0 flex-grow pr-4">
                              <p className="text-sm text-slate-800 mb-1 leading-tight truncate">{quiz.title}</p>
                              <div className="flex flex-wrap items-center gap-3">
                                 <span className="text-[9px] text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md uppercase font-black">{quiz.subject}</span>
                                 {quiz.duration && (
                                   <div className="flex items-center gap-1 text-[9px] text-slate-400 uppercase tracking-tighter">
                                      <Clock size={10}/> {quiz.duration} মিনিট
                                   </div>
                                 )}
                              </div>
                           </div>
                           <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all">
                              <ChevronRight size={18}/>
                           </div>
                        </button>
                      ))}
                      {adminMockQuizzes.filter(q => q.category === selectedMockCategory).length === 0 && (
                        <div className="py-24 text-center bg-white rounded-[44px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center">
                           <LayoutGrid size={40} className="text-slate-100 mb-4" />
                           <p className="text-slate-300 font-black uppercase text-[10px] tracking-[0.4em]">কোনো কুইজ পাওয়া যায়নি</p>
                        </div>
                      )}
                   </div>
                </div>
             )}
           </div>
        )}

        {(examMode === 'paid' || examMode === 'live' || examMode === 'special') && (
           <div className="space-y-5 animate-in fade-in duration-500">
             {(examMode === 'paid' ? paidQuizzes : examMode === 'live' ? liveQuizzes : specialQuizzes).map(quiz => (
                <div key={quiz.id} className="bg-white p-8 rounded-[44px] shadow-lg border border-slate-100 relative overflow-hidden group hover:border-emerald-200 transition-all">
                    <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-50 rounded-bl-[50px] -mr-8 -mt-8 opacity-40 group-hover:scale-110 transition-transform"></div>
                    <div className="flex justify-between items-start mb-6">
                       <div className="min-w-0 pr-10">
                          <h3 className="text-xl font-black text-slate-900 leading-tight mb-2 truncate">{quiz.title}</h3>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-tighter">{quiz.subject}</span>
                             {quiz.duration && <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest"><Clock size={10} className="inline mr-1"/> {quiz.duration}m</span>}
                          </div>
                       </div>
                       <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600 shadow-sm border border-emerald-100"><Star size={20} fill="currentColor"/></div>
                    </div>
                    
                    <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 space-y-4 mb-8">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">পুরস্কার</p>
                             <p className="text-lg font-black text-emerald-700">৳{quiz.prizePool}</p>
                          </div>
                          <div className="text-center border-l border-slate-200">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">এন্ট্রি ফি</p>
                             <p className="text-lg font-black text-slate-800">৳{quiz.entryFee}</p>
                          </div>
                       </div>
                       
                       {(quiz.startTime || quiz.endTime) && (
                         <div className="pt-4 border-t border-slate-200 space-y-2">
                            {quiz.startTime && (
                               <div className="flex justify-between items-center text-[10px] font-bold">
                                  <span className="text-slate-400 uppercase tracking-tighter">শুরু হবে:</span>
                                  <span className="text-slate-800">{formatDateTime(quiz.startTime)}</span>
                               </div>
                            )}
                            {quiz.endTime && (
                               <div className="flex justify-between items-center text-[10px] font-bold">
                                  <span className="text-slate-400 uppercase tracking-tighter">শেষ হবে:</span>
                                  <span className="text-rose-500">{formatDateTime(quiz.endTime)}</span>
                               </div>
                            )}
                         </div>
                       )}
                    </div>

                    <button onClick={() => onSubjectSelect(quiz.title, examMode === 'live', examMode === 'paid', quiz.entryFee, quiz.id, examMode === 'paid' ? 'paid_quizzes' : examMode === 'live' ? 'live_quizzes' : 'admin_special_quizzes')} className="w-full bg-slate-900 text-white py-4.5 rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-900/10 active:scale-95 transition-all">অংশ নিন</button>
                </div>
             ))}
             {(examMode === 'paid' ? paidQuizzes : examMode === 'live' ? liveQuizzes : specialQuizzes).length === 0 && (
                <div className="py-32 text-center flex flex-col items-center justify-center bg-white rounded-[50px] border-2 border-dashed border-slate-100">
                   <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-6"><Zap size={40}/></div>
                   <p className="text-slate-300 font-black uppercase text-[10px] tracking-[0.4em]">বর্তমানে কোনো লাইভ কুইজ নেই</p>
                </div>
             )}
           </div>
        )}

        {examMode === 'fun' && <PuzzlesTab />}
      </div>

      {/* Custom Topic Prompt */}
      {showCustomPrompt && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[2000] flex items-center justify-center p-6 font-hind">
           <div className="bg-white w-full max-w-sm rounded-[50px] p-10 animate-in zoom-in-95 duration-300 shadow-2xl relative border border-white/20">
              <button onClick={() => setShowCustomPrompt(false)} className="absolute top-10 right-10 text-slate-300 hover:text-slate-900 transition-colors p-1"><X size={24}/></button>
              
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[30px] flex items-center justify-center mx-auto mb-8 shadow-inner ring-4 ring-indigo-50/50">
                 <Brain size={40} className="animate-pulse" />
              </div>

              <h3 className="text-2xl font-black text-slate-900 text-center mb-3">AI কুইজ ম্যাজিক</h3>
              <p className="text-[11px] text-slate-400 font-bold text-center mb-10 px-4 leading-relaxed uppercase tracking-widest">টপিকের নাম লিখুন, AI প্রশ্ন তৈরি করবে!</p>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 block">সাবজেক্ট / টপিক</label>
                    <input 
                      type="text" value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} 
                      placeholder="যেমন: বিশ্বকাপ ফুটবল বা মহাকাশ"
                      className="w-full bg-slate-50 border-2 border-slate-50 p-5.5 rounded-[28px] font-black outline-none focus:bg-white focus:border-indigo-200 transition-all shadow-inner text-slate-800"
                      autoFocus
                    />
                 </div>
                 <button 
                  onClick={handleStartCustomQuiz}
                  className="w-full bg-indigo-600 text-white py-5.5 rounded-[28px] font-black text-lg shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                 >
                   কুইজ শুরু করুন <ChevronRight size={22}/>
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ExamTab;
