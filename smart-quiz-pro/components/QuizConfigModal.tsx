
import React, { useState } from 'react';
import { X, Settings, Clock, Hash, Zap, HelpCircle, Play, Wallet, Smartphone, ShieldCheck, CheckCircle2, Timer, Edit3 } from 'lucide-react';

interface QuizConfigModalProps {
  subject: string;
  isLive?: boolean;
  isPaid?: boolean;
  entryFee?: number;
  onClose: () => void;
  onStart: (config: { numQuestions: number; timePerQuestion: number; payoutNumber?: string }) => void;
}

const QuizConfigModal: React.FC<QuizConfigModalProps> = ({ subject, isLive, isPaid, entryFee, onClose, onStart }) => {
  const [numQuestions, setNumQuestions] = useState(isLive || isPaid ? 25 : 10);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [timePerQuestion, setTimePerQuestion] = useState(isLive || isPaid ? 15 : 20);
  const [payoutNumber, setPayoutNumber] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const accentColor = isPaid ? 'text-amber-600' : isLive ? 'text-rose-600' : 'text-emerald-700';
  const bgColor = isPaid ? 'bg-amber-500' : isLive ? 'bg-rose-600' : 'bg-emerald-700';
  const shadowColor = isPaid ? 'shadow-amber-500/20' : isLive ? 'shadow-rose-600/20' : 'shadow-emerald-700/20';

  const timeOptions = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

  const handleStart = () => {
    if (isPaid && !payoutNumber.trim()) return alert("পুরস্কার পাওয়ার জন্য একটি মোবাইল নাম্বার দিন।");
    if (numQuestions <= 0) return alert("সঠিক প্রশ্নের সংখ্যা দিন।");
    
    if (isPaid && !showConfirm) {
      setShowConfirm(true);
      return;
    }
    onStart({ numQuestions, timePerQuestion, payoutNumber });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[1000] flex items-end justify-center p-4 sm:p-0">
      <div className="bg-white w-full max-w-md rounded-t-[50px] sm:rounded-[50px] p-8 pb-10 animate-in slide-in-from-bottom-24 duration-500 shadow-2xl relative overflow-y-auto max-h-[90vh] no-scrollbar">
        <div className="sticky top-0 bg-white z-10 pb-4">
          <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 rounded-full"></div>
          
          {showConfirm ? (
            <div className="py-6 space-y-8 text-center animate-in zoom-in-95">
              <div className="w-24 h-24 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <ShieldCheck size={48} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">পেমেন্ট কনফার্ম করুন</h3>
                <p className="text-slate-400 font-bold leading-relaxed px-4">আপনার একাউন্ট থেকে <span className="text-amber-600">৳{entryFee}</span> এন্ট্রি ফি হিসেবে কেটে নেওয়া হবে।</p>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 text-left">
                 <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">পুরস্কার পাওয়ার নাম্বার</span>
                    <span className="text-slate-900 font-black">{payoutNumber}</span>
                 </div>
                 <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">এন্ট্রি ফি</span>
                    <span className="text-amber-600 font-black">৳{entryFee}</span>
                 </div>
              </div>

              <div className="flex flex-col gap-3">
                 <button onClick={handleStart} className="w-full bg-emerald-700 text-white py-6 rounded-[28px] font-black text-lg shadow-xl active:scale-95 transition-all">ফি প্রদান ও শুরু করুন</button>
                 <button onClick={() => setShowConfirm(false)} className="w-full bg-slate-100 text-slate-400 py-4 rounded-[28px] font-black text-xs uppercase">পিছনে যান</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-start mb-6 pt-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Settings size={22} className={accentColor} />
                    <h3 className="text-xl font-black text-gray-900">
                      মক কুইজ সেটআপ
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 font-medium">বিষয়: <span className={`${accentColor} font-bold`}>{subject}</span></p>
                </div>
                <button onClick={onClose} className="p-2.5 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-colors">
                  <X size={22} />
                </button>
              </div>

              <div className="space-y-8">
                {isPaid && (
                  <div className="space-y-4">
                    <div className="bg-amber-50 p-6 rounded-[32px] border border-amber-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Wallet className="text-amber-600" size={24} />
                        <div>
                          <p className="text-[10px] font-black text-amber-600 uppercase">এন্ট্রি ফি</p>
                          <p className="text-xl font-black text-amber-900">৳{entryFee}</p>
                        </div>
                      </div>
                      <span className="bg-white px-3 py-1 rounded-full text-[10px] font-black text-amber-700 uppercase">Paid Mode</span>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase px-2 flex items-center gap-2">
                        <Smartphone size={12}/> পুরস্কার পাওয়ার নাম্বার (বিকাশ/নগদ)
                      </label>
                      <input 
                        type="text" 
                        value={payoutNumber} 
                        onChange={(e) => setPayoutNumber(e.target.value)} 
                        placeholder="017XXXXXXXX"
                        className="w-full bg-slate-50 p-4 rounded-2xl outline-none font-black text-slate-800 border border-slate-100 focus:bg-white focus:border-amber-400 transition-all"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <Hash size={18} className="text-slate-400" />
                      <span className="text-sm font-black text-slate-800 uppercase tracking-widest">কয়টি প্রশ্ন চান?</span>
                    </div>
                    {showCustomInput && <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter bg-emerald-50 px-2 py-1 rounded-md">কাস্টম মোড</span>}
                  </div>
                  
                  <div className="grid grid-cols-4 gap-3">
                    {[10, 25, 50, 100].map((num) => (
                      <button
                        key={num}
                        onClick={() => { setNumQuestions(num); setShowCustomInput(false); }}
                        className={`py-4 rounded-[20px] font-black text-sm transition-all shadow-sm ${
                          numQuestions === num && !showCustomInput
                            ? `${bgColor} text-white shadow-lg` 
                            : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      onClick={() => setShowCustomInput(true)}
                      className={`py-4 rounded-[20px] font-black text-[10px] uppercase transition-all shadow-sm ${
                        showCustomInput
                          ? `${bgColor} text-white shadow-lg` 
                          : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'
                      }`}
                    >
                      কাস্টম
                    </button>
                  </div>

                  {showCustomInput && (
                    <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                      <div className="relative group">
                        <Edit3 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={16} />
                        <input 
                          type="number" 
                          inputMode="numeric"
                          value={numQuestions} 
                          onChange={(e) => setNumQuestions(Math.max(1, parseInt(e.target.value) || 0))} 
                          placeholder="প্রশ্নের সংখ্যা লিখুন..."
                          className="w-full bg-slate-50 p-4 pl-12 rounded-2xl outline-none font-black text-slate-800 border border-slate-100 focus:bg-white focus:border-emerald-300 transition-all text-sm"
                        />
                      </div>
                      <p className="text-[9px] text-slate-400 font-bold mt-2 px-2 uppercase tracking-widest">আপনি চাইলে ১০ থেকে ২০০ পর্যন্ত দিতে পারেন</p>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Timer size={18} className="text-slate-400" />
                    <span className="text-sm font-black text-slate-800 uppercase tracking-widest">কত সময় (প্রতি প্রশ্ন)?</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {timeOptions.map((sec) => (
                      <button
                        key={sec}
                        onClick={() => setTimePerQuestion(sec)}
                        className={`py-4 rounded-[20px] font-black text-xs transition-all shadow-sm ${
                          timePerQuestion === sec 
                            ? `${bgColor} text-white shadow-lg` 
                            : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'
                        }`}
                      >
                        {sec === 60 ? '1m' : `${sec}s`}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleStart}
                  className={`w-full ${bgColor} ${shadowColor} text-white py-5 rounded-[24px] font-black text-lg shadow-2xl active:scale-95 transition-all mt-4 flex items-center justify-center gap-3`}
                >
                  <Play size={22} fill="currentColor" />
                  কুইজ শুরু করুন
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizConfigModal;
