
import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Check, Loader2, User, ShieldAlert, Send, FileText, MessageSquare, Info, ShieldCheck, Wallet, ArrowUpCircle, ArrowDownCircle, Smartphone, Copy } from 'lucide-react';
import { Category, UserProfile } from '../types';
import { db, auth } from '../services/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';

interface EditProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  onUpdate: (data: Partial<UserProfile>) => Promise<void>;
  initialTab?: 'profile' | 'report' | 'privacy' | 'wallet';
}

const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Milo",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna"
];

const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onUpdate, initialTab = 'profile' }) => {
  const [tab, setTab] = useState<'profile' | 'report' | 'privacy' | 'wallet'>(initialTab);
  const [name, setName] = useState(user.name);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatarUrl || PRESET_AVATARS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wallet/Report States
  const [reportMsg, setReportMsg] = useState('');
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [walletMode, setWalletMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [trxId, setTrxId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [paymentNumbers, setPaymentNumbers] = useState<any>(null);

  useEffect(() => {
    const fetchAdminNumbers = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'payment_numbers'));
        if (snap.exists()) setPaymentNumbers(snap.data());
      } catch (e) { console.error("Error fetching payment numbers:", e); }
    };
    fetchAdminNumbers();
  }, []);

  const compressAndSetImage = (file: File) => {
    if (file.size > 2 * 1024 * 1024) return alert("২ এমবি এর চেয়ে ছোট ছবি আপলোড করুন।");
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setSelectedAvatar(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await onUpdate({ name: name.trim(), avatarUrl: selectedAvatar });
      onClose();
    } catch (e: any) {
      setError("সেভ করতে সমস্যা হয়েছে।");
    } finally { setIsSaving(false); }
  };

  const handleReportSubmit = async () => {
    if (!reportMsg.trim()) return alert("আপনার অভিযোগটি লিখুন।");
    setIsSendingRequest(true);
    try {
      await addDoc(collection(db, 'user_reports'), {
        uid: auth.currentUser?.uid,
        userName: user.name,
        category: user.category || 'General',
        message: reportMsg.trim(),
        status: 'pending',
        timestamp: serverTimestamp()
      });
      alert("রিপোর্ট পাঠানো হয়েছে! এডমিন শীঘ্রই আপনার সাথে যোগাযোগ করবে।");
      setReportMsg('');
      onClose();
    } catch (e) {
      alert("রিপোর্ট পাঠানো সম্ভব হয়নি। পুনরায় চেষ্টা করুন।");
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleWalletSubmit = async () => {
    if (!amount || Number(amount) <= 0) return alert("সঠিক পরিমাণ দিন।");
    if (walletMode === 'deposit' && !trxId.trim()) return alert("TrxID দিন।");
    if (walletMode === 'withdraw' && (!accountNumber.trim() || Number(amount) > user.balance)) return alert("ব্যালেন্স অপর্যাপ্ত বা অ্যাকাউন্ট নাম্বার ভুল।");

    setIsSendingRequest(true);
    try {
      if (walletMode === 'deposit') {
        await addDoc(collection(db, 'deposit_requests'), {
          uid: auth.currentUser?.uid,
          userName: user.name,
          amount: Number(amount),
          method,
          trxId: trxId.trim(),
          status: 'pending',
          timestamp: serverTimestamp()
        });
        alert("রিচার্জ রিকোয়েস্ট পাঠানো হয়েছে। ভেরিফিকেশনের পর ব্যালেন্স যোগ হবে।");
      } else {
        await addDoc(collection(db, 'withdraw_requests'), {
          uid: auth.currentUser?.uid,
          userName: user.name,
          amount: Number(amount),
          method,
          accountNumber: accountNumber.trim(),
          status: 'pending',
          timestamp: serverTimestamp()
        });
        alert("উইথড্র রিকোয়েস্ট পাঠানো হয়েছে। ২৪ ঘন্টার মধ্যে পেমেন্ট সম্পন্ন হবে।");
      }
      onClose();
    } catch (e) {
      alert("রিকোয়েস্ট ব্যর্থ হয়েছে।");
    } finally { setIsSendingRequest(false); }
  };

  const activeAdminNumber = paymentNumbers?.[method]?.number || 'লোড হচ্ছে...';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[1000] flex items-end justify-center font-['Hind_Siliguri']">
      <div className="bg-white w-full max-w-md rounded-t-[44px] p-8 animate-in slide-in-from-bottom-24 shadow-2xl overflow-y-auto max-h-[95vh] no-scrollbar relative">
        <div className="flex justify-between items-center mb-6 pt-4">
          <h3 className="text-xl font-black text-slate-900 uppercase">
            {tab === 'profile' ? 'সেটিং' : tab === 'wallet' ? 'ওয়ালেট' : tab === 'report' ? 'অভিযোগ' : 'নীতিমালা'}
          </h3>
          <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all"><X size={24} /></button>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl mb-8 overflow-x-auto no-scrollbar">
           {['profile', 'wallet', 'report', 'privacy'].map((t) => (
             <button key={t} onClick={() => setTab(t as any)} className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${tab === t ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400'}`}>
               {t === 'profile' ? 'প্রোফাইল' : t === 'wallet' ? 'ওয়ালেট' : t === 'report' ? 'রিপোর্ট' : 'প্রাইভেসি'}
             </button>
           ))}
        </div>

        {tab === 'profile' && (
          <div className="space-y-8 animate-in fade-in pb-10">
            <div className="flex flex-col items-center">
              <div className="relative mb-8">
                <div className="w-32 h-32 rounded-[44px] border-4 border-emerald-500 overflow-hidden bg-slate-100 shadow-xl transition-transform hover:scale-105 duration-300">
                  <img src={selectedAvatar} alt="avatar" className="w-full h-full object-cover" />
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 bg-emerald-700 text-white p-3 rounded-2xl border-4 border-white shadow-lg active:scale-90 transition-all hover:bg-emerald-800"
                  aria-label="Upload profile picture"
                >
                  <Camera size={18}/>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) compressAndSetImage(file);
                  }}
                />
              </div>
              
              <div className="w-full">
                <p className="text-[10px] font-black text-slate-400 uppercase text-center mb-4 tracking-widest">অথবা প্রিসেট সিলেক্ট করুন</p>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 w-full justify-center">
                  {PRESET_AVATARS.map((av, idx) => (
                    <button key={idx} onClick={() => setSelectedAvatar(av)} className={`shrink-0 w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all ${selectedAvatar === av ? 'border-emerald-500 scale-110 shadow-lg ring-4 ring-emerald-50' : 'border-transparent opacity-50 hover:opacity-100'}`}>
                      <img src={av} className="w-full h-full object-cover" alt="preset" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase px-2 tracking-widest">আপনার নাম</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="w-full bg-slate-50 p-5 rounded-[24px] font-black outline-none border border-slate-100 focus:bg-white focus:border-emerald-100 transition-all shadow-inner" 
              />
            </div>

            <button onClick={handleSave} disabled={isSaving} className="w-full bg-emerald-700 text-white py-6 rounded-[28px] font-black text-lg shadow-xl shadow-emerald-700/20 active:scale-95 transition-all flex items-center justify-center gap-3">
              {isSaving ? <Loader2 className="animate-spin" /> : 'সব আপডেট করুন'}
            </button>
          </div>
        )}

        {tab === 'wallet' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 pb-10">
             <div className="bg-emerald-900 p-8 rounded-[40px] text-white shadow-xl relative overflow-hidden mb-4">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12"></div>
                <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1">বর্তমান ব্যালেন্স</p>
                <h2 className="text-4xl font-black">৳{user.balance || 0}</h2>
             </div>

             <div className="flex bg-slate-100 p-1 rounded-2xl mb-4">
                <button onClick={() => setWalletMode('deposit')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${walletMode === 'deposit' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400'}`}>রিচার্জ</button>
                <button onClick={() => setWalletMode('withdraw')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${walletMode === 'withdraw' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400'}`}>উইথড্র</button>
             </div>

             {walletMode === 'deposit' && (
               <div className="bg-emerald-50 p-6 rounded-[32px] border border-emerald-100 space-y-3 shadow-inner">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">এডমিন {method} নাম্বার</span>
                    <button onClick={() => { navigator.clipboard.writeText(activeAdminNumber); alert("নাম্বার কপি হয়েছে!"); }} className="p-2 bg-white rounded-xl shadow-sm text-emerald-700 active:scale-90 transition-all"><Copy size={14}/></button>
                  </div>
                  <p className="text-2xl font-black text-emerald-900 tracking-wider font-mono">{activeAdminNumber}</p>
                  <p className="text-[9px] text-emerald-500 font-bold leading-relaxed">এই নাম্বারে টাকা পাঠিয়ে নিচে ট্রানজেকশন আইডি (TrxID) দিন।</p>
               </div>
             )}

             <div className="space-y-4">
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase px-2">টাকার পরিমাণ (৳)</label>
                   <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="১০০" className="w-full bg-slate-50 p-4 rounded-xl font-bold outline-none" />
                </div>
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-400 uppercase px-2">পেমেন্ট মেথড</label>
                   <select value={method} onChange={(e) => setMethod(e.target.value as any)} className="w-full bg-slate-50 p-4 rounded-xl font-bold outline-none">
                      <option value="bkash">bKash (বিকাশ)</option>
                      <option value="nagad">Nagad (নগদ)</option>
                   </select>
                </div>
                {walletMode === 'deposit' ? (
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase px-2">ট্রানজেকশন আইডি (TrxID)</label>
                      <input type="text" value={trxId} onChange={(e) => setTrxId(e.target.value)} placeholder="8XJ5..." className="w-full bg-slate-50 p-4 rounded-xl font-bold outline-none border border-slate-100" />
                   </div>
                ) : (
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase px-2">অ্যাকাউন্ট নাম্বার</label>
                      <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="017XXXXXXXX" className="w-full bg-slate-50 p-4 rounded-xl font-bold outline-none border border-slate-100" />
                   </div>
                )}
             </div>

             <button onClick={handleWalletSubmit} disabled={isSendingRequest} className={`w-full py-6 rounded-2xl font-black text-lg text-white shadow-xl ${walletMode === 'deposit' ? 'bg-emerald-700 shadow-emerald-700/20' : 'bg-rose-600 shadow-rose-600/20'}`}>
                {isSendingRequest ? <Loader2 className="animate-spin mx-auto" /> : (walletMode === 'deposit' ? 'রিচার্জ রিকোয়েস্ট পাঠান' : 'উইথড্র রিকোয়েস্ট পাঠান')}
             </button>
          </div>
        )}

        {tab === 'report' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 pb-10">
             <textarea 
              value={reportMsg} 
              onChange={(e) => setReportMsg(e.target.value)} 
              placeholder="আপনার অভিযোগ এখানে বিস্তারিত লিখুন..." 
              className="w-full bg-slate-50 p-6 rounded-[32px] h-48 font-bold border border-slate-100 outline-none focus:bg-white focus:border-rose-100 transition-all" 
             />
             <button 
              onClick={handleReportSubmit} 
              disabled={isSendingRequest}
              className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-lg shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-3"
             >
                {isSendingRequest ? <Loader2 className="animate-spin" /> : <><Send size={20} /> মেসেজ পাঠান</>}
             </button>
          </div>
        )}

        {tab === 'privacy' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 pb-10">
             <div className="bg-blue-50 p-6 rounded-[32px] text-blue-800 text-xs font-bold leading-loose">
               ১. আপনার সকল তথ্য নিরাপদ।<br/>
               ২. পেমেন্ট ভেরিফিকেশনের জন্য TrxID ব্যবহার করা হয়।<br/>
               ৩. কোনো প্রকার জালিয়াতি করলে আইডি ব্যান করা হবে।
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditProfileModal;
