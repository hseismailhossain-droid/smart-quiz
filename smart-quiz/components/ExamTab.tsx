
import React, { useState, useEffect } from 'react';
import { BCS_SUBJECTS, PRIMARY_SUBJECTS, JUNIOR_SUBJECTS, SSC_SUBJECTS, HSC_SUBJECTS, ADMISSION_SUBJECTS, ISLAMIC_SUBJECTS, JOB_PREP_SUBJECTS } from '../constants';
import { Wallet, Loader2, Zap, ChevronRight, GraduationCap, School, Briefcase, Moon, Sparkles, Star, LayoutGrid, ArrowLeft, Send, AlertCircle, Cpu, BookOpen, PlusCircle, ArrowUpRight, X, CheckCircle2, Clock, Calendar } from 'lucide-react';
import { UserProfile, ExamCategory, Subject } from '../types';
import { db, auth } from '../services/firebase';
import { collection, onSnapshot, query, doc, where, orderBy } from 'firebase/firestore';
import PuzzlesTab from './PuzzlesTab';

interface ExamTabProps {
  user: UserProfile;
  onSubjectSelect: (subject: string, isLive: boolean, isPaid?: boolean, entryFee?: number, quizId?: string, collectionName?: string) => void;
  onSubmitDeposit: (amount: number, method: 'bkash' | 'nagad', trxId: string) => void;
  onSubmitWithdraw: (amount: number, method: 'bkash' | 'nagad', accountNumber: string) => void;
}

const ExamTab: React.FC<ExamTabProps> = ({ user, onSubjectSelect, onSubmitDeposit, onSubmitWithdraw }) => {
  const [examMode, setExamMode] = useState<'mock' | 'live' | 'paid' | 'special' | 'fun'>('mock');
  const [mockType, setMockType] = useState<'official' | 'ai'>('official');
  const [selectedMockCategory, setSelectedMockCategory] = useState<string | null>(null);
  
  const [aiSubjects, setAiSubjects] = useState<string[]>([]);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  
  const [paymentNumbers, setPaymentNumbers] = useState<any>({});
  const [paidQuizzes, setPaidQuizzes] = useState<any[]>([]);
  const [liveQuizzes, setLiveQuizzes] = useState<any[]>([]);
  const [specialQuizzes, setSpecialQuizzes] = useState<any[]>([]);
  const [adminMockQuizzes, setAdminMockQuizzes] = useState<any[]>([]);
  const [dynamicCategories, setDynamicCategories] = useState<ExamCategory[]>([]);

  // Wallet Modal States
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletView, setWalletView] = useState<'recharge' | 'withdraw'>('recharge');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [trxId, setTrxId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  useEffect(() => {
    let unsubs: (() => void)[] = [];
    const handleErr = (e: any) => console.warn("Exam listener blocked:", e.message);

    if (auth.currentUser) {
      unsubs.push(onSnapshot(doc(db, 'settings', 'payment_numbers'), 
        (snap) => snap.exists() && setPaymentNumbers(snap.data()), handleErr));
      
      unsubs.push(onSnapshot(query(collection(db, 'exam_categories'), orderBy('timestamp', 'asc')), 
        (snap) => setDynamicCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as ExamCategory))), handleErr));

      unsubs.push(onSnapshot(query(collection(db, 'paid_quizzes'), where('status', '==', 'active')), 
        (snap) => setPaidQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() }))), handleErr));

      unsubs.push(onSnapshot(query(collection(db, 'live_quizzes'), where('status', '==', 'active')), 
        (snap) => setLiveQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() }))), handleErr));

      unsubs.push(onSnapshot(query(collection(db, 'admin_special_quizzes'), orderBy('timestamp', 'desc')), 
        (snap) => setSpecialQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() }))), handleErr));

      unsubs.push(onSnapshot(query(collection(db, 'mock_quizzes'), orderBy('timestamp', 'desc')), 
        (snap) => setAdminMockQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() }))), handleErr));
    }

    return () => unsubs.forEach(u => u());
  }, [user.email]);

  const handleWalletAction = () => {
    if (!amount || Number(amount) <= 0) return alert("সঠিক পরিমাণ লিখুন");
    if (walletView === 'recharge') {
      const config = paymentNumbers[method];
      if (!config?.active) return alert("এই মেথডটি বর্তমানে বন্ধ আছে।");
      if (!trxId) return alert("Trx ID লিখুন");
      onSubmitDeposit(Number(amount), method, trxId);
      alert("রিচার্জ রিকোয়েস্ট পাঠানো হয়েছে!");
    } else {
      if (!accountNumber) return alert("একাউন্ট নাম্বার লিখুন");
      if (Number(amount) > user.balance) return alert("পর্যাপ্ত ব্যালেন্স নেই");
      onSubmitWithdraw(Number(amount), method, accountNumber);
    }
    setShowWalletModal(false);
    setAmount(''); setTrxId(''); setAccountNumber('');
  };

  const getQuizTimeStatus = (quiz: any) => {
    if (!quiz.startDate) return 'active';
    const now = Date.now();
    const start = new Date(quiz.startDate).getTime();
    const end = quiz.endDate ? new Date(quiz.endDate).getTime() : Infinity;

    if (now < start) return 'upcoming';
    if (now > end) return 'expired';
    return 'active';
  };

  const handleQuizSelection = (quiz: any, isLive: boolean, isPaid: boolean, collectionName?: string) => {
    const status = getQuizTimeStatus(quiz);
    if (status === 'upcoming') {
      return alert(`এই কুইজটি শুরু হবে: ${new Date(quiz.startDate).toLocaleString('bn-BD')}`);
    }
    if (status === 'expired') {
      return alert("এই কুইজটির সময় শেষ হয়ে গেছে!");
    }
    onSubjectSelect(quiz.title, isLive, isPaid, quiz.entryFee || 0, quiz.id, collectionName);
  };

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

  return (
    <div className="bg-slate-50 min-h-screen pb-32 font-['Hind_Siliguri']">
      {/* Top Header Section */}
      <div className="bg-emerald-800 pt-12 pb-24 px-6 rounded-b-[60px] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-700/30 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-black text-white">পরীক্ষা কেন্দ্র</h2>
            <button 
              onClick={() => setShowWalletModal(true)}
              className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl text-white font-black flex items-center gap-2 border border-white/20 active:scale-95 transition-all"
            >
              <Wallet size={18} /> ৳{user.balance}
              <PlusCircle size={14} className="text-emerald-300" />
            </button>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => { setWalletView('recharge'); setShowWalletModal(true); }}
              className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/40 py-4 rounded-3xl text-white font-black text-xs uppercase flex items-center justify-center gap-2 border border-white/10 transition-all"
            >
              <PlusCircle size={16}/> রিচার্জ
            </button>
            <button 
              onClick={() => { setWalletView('withdraw'); setShowWalletModal(true); }}
              className="flex-1 bg-white/10 hover:bg-white/20 py-4 rounded-3xl text-white font-black text-xs uppercase flex items-center justify-center gap-2 border border-white/10 transition-all"
            >
              <ArrowUpRight size={16}/> উইথড্র
            </button>
          </div>
        </div>

        <div className="relative z-10 flex p-1.5 bg-black/20 backdrop-blur-md rounded-[32px] overflow-x-auto no-scrollbar gap-1 mt-8">
          {['mock', 'live', 'paid', 'special', 'fun'].map((mode) => (
            <button 
              key={mode} 
              onClick={() => { setExamMode(mode as any); setSelectedMockCategory(null); }} 
              className={`flex-1 min-w-[85px] py-3.5 rounded-[24px] font-black text-[11px] uppercase transition-all ${examMode === mode ? 'bg-white text-emerald-800 shadow-lg' : 'text-white/60'}`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Wallet Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-end justify-center">
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
              <div className={`mb-6 p-5 rounded-[28px] border ${paymentNumbers[method]?.active ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">এই নাম্বারে টাকা পাঠান (Send Money)</p>
                <p className="text-xl font-black text-slate-800">{paymentNumbers[method]?.active ? paymentNumbers[method]?.number : 'এই মেথডটি বর্তমানে বন্ধ আছে।'}</p>
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

      {/* Exam Selection Content */}
      <div className="px-6 -mt-10 relative z-20">
        {examMode === 'mock' && (
           <div className="space-y-6">
             <div className="flex bg-white p-2 rounded-[28px] border border-emerald-100 shadow-lg">
                <button onClick={() => { setMockType('official'); setSelectedMockCategory(null); }} className={`flex-1 py-3.5 rounded-[22px] font-black text-xs transition-all ${mockType === 'official' ? 'bg-emerald-700 text-white shadow-md' : 'text-slate-400'}`}>অফিসিয়াল</button>
                <button onClick={() => { setMockType('ai'); setSelectedMockCategory(null); }} className={`flex-1 py-3.5 rounded-[22px] font-black text-xs transition-all ${mockType === 'ai' ? 'bg-emerald-700 text-white shadow-md' : 'text-slate-400'}`}>AI কুইজ</button>
             </div>

             {!selectedMockCategory ? (
                <div className="grid grid-cols-2 gap-4">
                  {dynamicCategories.map((cat) => (
                    <button key={cat.id} onClick={() => setSelectedMockCategory(cat.label)} className="bg-white p-6 rounded-[36px] border border-slate-50 shadow-sm flex flex-col items-center gap-3 active:scale-95 transition-all group">
                       <div className={`w-14 h-14 ${cat.color} text-white rounded-[22px] flex items-center justify-center shadow-lg group-hover:scale-110 transition-all`}>
                         {getLucideIcon(cat.iconName)}
                       </div>
                       <span className="font-black text-slate-800 text-xs text-center leading-tight">{cat.label}</span>
                    </button>
                  ))}
                </div>
             ) : (
                <div className="space-y-4">
                   <div className="flex justify-between items-center mb-4">
                      <button onClick={() => setSelectedMockCategory(null)} className="flex items-center gap-2 text-emerald-700 font-black text-xs p-2 hover:bg-emerald-50 rounded-xl transition-all"><ArrowLeft size={16}/> ফিরে যান</button>
                   </div>
                   
                   {mockType === 'ai' && (
                     <div className="bg-emerald-900 p-6 rounded-[32px] shadow-xl mb-6 border border-emerald-700">
                        <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-3">নিজস্ব টপিকে কুইজ খেলুন</p>
                        <div className="flex gap-2">
                           <input 
                             type="text" 
                             value={customTopic}
                             onChange={(e) => setCustomTopic(e.target.value)}
                             placeholder="যেকোনো টপিক লিখুন..." 
                             className="flex-grow bg-white/10 border border-white/20 p-4 rounded-2xl text-white font-black text-sm outline-none focus:bg-white/20 transition-all placeholder:text-white/30"
                           />
                           <button 
                             onClick={() => customTopic.trim() && onSubjectSelect(customTopic, false, false, 0, 'mock')}
                             className="p-4 bg-white text-emerald-800 rounded-2xl shadow-lg active:scale-95 transition-all"
                           >
                             <Send size={20} />
                           </button>
                        </div>
                     </div>
                   )}

                   <div className="grid grid-cols-1 gap-3">
                      {mockType === 'official' ? (
                        adminMockQuizzes.filter(q => q.category === selectedMockCategory).map(quiz => {
                          const timeStatus = getQuizTimeStatus(quiz);
                          return (
                            <button 
                              key={quiz.id} 
                              onClick={() => handleQuizSelection(quiz, false, false, 'mock_quizzes')}
                              className="w-full p-6 bg-white rounded-[32px] border border-slate-100 text-left font-black shadow-sm flex justify-between items-center group active:scale-95 transition-all relative overflow-hidden"
                            >
                              <div className="flex-grow">
                                <p className="text-slate-900 text-sm leading-tight">{quiz.title}</p>
                                <div className="flex items-center gap-3 mt-1.5">
                                  <p className="text-[10px] text-slate-400 uppercase font-bold">{quiz.questionsCount}টি প্রশ্ন • {quiz.durationMinutes} মি.</p>
                                  {timeStatus === 'upcoming' && <span className="text-[9px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1"><Clock size={10}/> Coming Soon</span>}
                                  {timeStatus === 'expired' && <span className="text-[9px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md flex items-center gap-1"><X size={10}/> Expired</span>}
                                </div>
                              </div>
                              <ChevronRight size={18} className="text-emerald-700" />
                            </button>
                          );
                        })
                      ) : (
                        <>
                          {isGeneratingAi ? (
                            <div className="py-20 text-center bg-white rounded-[40px] border border-slate-100 flex flex-col items-center">
                               <Loader2 className="animate-spin text-emerald-700 mb-4" size={32} />
                               <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">AI বিষয় খুঁজে বের করছে...</p>
                            </div>
                          ) : (
                            aiSubjects.map((subTitle, i) => (
                              <button 
                                key={i} 
                                onClick={() => onSubjectSelect(subTitle, false, false, 0, 'mock')} 
                                className="w-full p-6 bg-white rounded-[32px] border border-slate-100 text-left font-black shadow-sm flex justify-between items-center group active:scale-95 transition-all"
                              >
                                <div className="flex items-center gap-4">
                                   <div className="p-3 bg-slate-50 rounded-2xl text-emerald-700 group-hover:bg-emerald-50 transition-colors">
                                      <Sparkles size={20} />
                                   </div>
                                   <span className="text-sm">{subTitle}</span>
                                </div>
                                <ChevronRight size={18} className="text-emerald-700" />
                              </button>
                            ))
                          )}
                        </>
                      )}
                   </div>
                </div>
             )}
           </div>
        )}

        {(examMode === 'paid' || examMode === 'live' || examMode === 'special') && (
           <div className="space-y-6">
             {(examMode === 'paid' ? paidQuizzes : examMode === 'live' ? liveQuizzes : specialQuizzes).length > 0 ? (
               (examMode === 'paid' ? paidQuizzes : examMode === 'live' ? liveQuizzes : specialQuizzes).map(quiz => {
                 const timeStatus = getQuizTimeStatus(quiz);
                 const col = examMode === 'paid' ? 'paid_quizzes' : examMode === 'live' ? 'live_quizzes' : 'admin_special_quizzes';
                 return (
                  <div key={quiz.id} className="bg-white p-8 rounded-[48px] border border-slate-100 shadow-xl overflow-hidden group relative">
                      <div className="flex items-center gap-3 mb-4">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${examMode === 'paid' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
                          {examMode === 'paid' ? 'Entry: ৳'+quiz.entryFee : (examMode === 'live' ? 'LIVE' : 'SPECIAL')}
                        </span>
                        {timeStatus === 'upcoming' && <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[9px] font-black flex items-center gap-1"><Calendar size={10}/> Upcoming</span>}
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 mb-2">{quiz.title}</h3>
                      <div className="flex justify-between items-center border-t border-slate-50 pt-6 mt-4">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">পুরস্কার</p>
                            <p className="font-black text-emerald-700 text-xl">৳{quiz.prizePool || 0}</p>
                        </div>
                        <button 
                          onClick={() => handleQuizSelection(quiz, examMode === 'live', examMode === 'paid', col)} 
                          className={`px-8 py-4 rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg ${timeStatus === 'active' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}
                        >
                          {timeStatus === 'upcoming' ? 'অপেক্ষা করুন' : timeStatus === 'expired' ? 'সময় শেষ' : (examMode === 'paid' ? 'ফি দিয়ে অংশ নিন' : 'অংশ নিন')}
                        </button>
                      </div>
                  </div>
                 );
               })
             ) : (
                <div className="py-24 text-center bg-white rounded-[50px] border border-dashed border-slate-200 opacity-50">
                   <Zap size={40} className="mx-auto mb-4 text-slate-300" />
                   <p className="font-black uppercase text-[10px] tracking-widest text-slate-400">বর্তমানে কোনো কুইজ নেই</p>
                </div>
             )}
           </div>
        )}

        {examMode === 'fun' && <PuzzlesTab />}
      </div>
    </div>
  );
};

export default ExamTab;
