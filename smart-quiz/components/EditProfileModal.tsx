
import React, { useState, useRef } from 'react';
import { X, Camera, Check, Loader2, User, ShieldAlert, Send, FileText, MessageSquare, Info, ShieldCheck, Wallet, ArrowUpCircle, ArrowDownCircle, Smartphone } from 'lucide-react';
import { Category, UserProfile } from '../types';
import { db, auth } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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

  const compressAndSetImage = (file: File) => {
    const MAX_SIZE = 1 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError("ছবিটি ১ এমবি এর বেশি বড়!");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setSelectedAvatar(e.target?.result as string);
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

  const handleSubmitReport = async () => {
    if (!reportMsg.trim()) return;
    setIsSendingRequest(true);
    try {
      await addDoc(collection(db, 'user_reports'), {
        uid: auth.currentUser?.uid,
        userName: user.name,
        category: user.category,
        message: reportMsg.trim(),
        status: 'pending',
        timestamp: serverTimestamp()
      });
      alert("রিপোর্ট পাঠানো হয়েছে। অ্যাডমিন শীঘ্রই যোগাযোগ করবেন।");
      onClose();
    } catch (e) {
      alert("রিপোর্ট পাঠানো যায়নি।");
    } finally { setIsSendingRequest(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[1000] flex items-end justify-center font-['Hind_Siliguri'] p-4 sm:p-0">
      <div className="bg-white w-full max-w-md rounded-t-[50px] sm:rounded-[50px] p-8 animate-in slide-in-from-bottom-24 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar relative">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-100 rounded-full mb-8"></div>
        
        <div className="flex justify-between items-center mb-6 pt-4">
          <h3 className="text-2xl font-black text-slate-900 uppercase">
            {tab === 'profile' ? 'সেটিং' : tab === 'wallet' ? 'ওয়ালেট' : tab === 'report' ? 'অভিযোগ' : 'নীতিমালা'}
          </h3>
          <button onClick={onClose} className="p-3 bg-slate-50 rounded-full text-slate-400 hover:text-rose-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-8 overflow-x-auto no-scrollbar">
           <button onClick={() => setTab('profile')} className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${tab === 'profile' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400'}`}>প্রোফাইল</button>
           <button onClick={() => setTab('wallet')} className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${tab === 'wallet' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400'}`}>ওয়ালেট</button>
           <button onClick={() => setTab('report')} className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${tab === 'report' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400'}`}>রিপোর্ট</button>
           <button onClick={() => setTab('privacy')} className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${tab === 'privacy' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400'}`}>প্রাইভেসি</button>
        </div>

        {tab === 'profile' && (
          <div className="animate-in fade-in">
            <div className="flex flex-col items-center mb-10">
              <div className="relative mb-6">
                <div className="w-28 h-28 rounded-[36px] border-4 border-emerald-500 overflow-hidden bg-slate-100 shadow-xl">
                  <img src={selectedAvatar} alt="preview" className="w-full h-full object-cover" />
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-700 text-white rounded-2xl flex items-center justify-center border-4 border-white shadow-lg"
                >
                  <Camera size={18} />
                </button>
                <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && compressAndSetImage(e.target.files[0])} accept="image/*" className="hidden" />
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 w-full justify-center">
                {PRESET_AVATARS.map((av, idx) => (
                  <button key={idx} onClick={() => setSelectedAvatar(av)} className={`shrink-0 w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${selectedAvatar === av ? 'border-emerald-500 scale-110' : 'border-transparent opacity-50'}`}>
                    <img src={av} className="w-full h-full object-cover" alt="preset" />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-6 mb-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase px-2">আপনার নাম</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 p-5 rounded-[24px] font-black border border-slate-100 outline-none focus:bg-white" />
              </div>
            </div>
            <button onClick={handleSave} disabled={isSaving || !name.trim()} className="w-full bg-emerald-700 text-white py-6 rounded-[28px] font-black text-lg shadow-xl active:scale-95 transition-all">
              {isSaving ? <Loader2 className="animate-spin mx-auto" /> : 'সব আপডেট করুন'}
            </button>
          </div>
        )}

        {tab === 'wallet' && (
          <div className="animate-in slide-in-from-right-4">
             <div className="bg-emerald-900 p-8 rounded-[40px] text-white shadow-xl relative overflow-hidden mb-8">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12"></div>
                <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1">বর্তমান ব্যালেন্স</p>
                <h2 className="text-4xl font-black">৳{user.balance || 0}</h2>
             </div>

             <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
                <button onClick={() => setWalletMode('deposit')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${walletMode === 'deposit' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400'}`}>রিচার্জ করুন</button>
                <button onClick={() => setWalletMode('withdraw')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${walletMode === 'withdraw' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400'}`}>উইথড্র করুন</button>
             </div>

             <div className="space-y-6 mb-10">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase px-2">টাকার পরিমাণ (৳)</label>
                   <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="যেমন: ১০০" className="w-full bg-slate-50 p-5 rounded-[24px] font-black border border-slate-100 outline-none" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase px-2">মেথড নির্বাচন</label>
                   <select value={method} onChange={(e) => setMethod(e.target.value as any)} className="w-full bg-slate-50 p-5 rounded-[24px] font-black border border-slate-100 outline-none">
                      <option value="bkash">bKash (বিকাশ)</option>
                      <option value="nagad">Nagad (নগদ)</option>
                   </select>
                </div>
                {walletMode === 'deposit' ? (
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase px-2">ট্রানজেকশন আইডি (TrxID)</label>
                      <input type="text" value={trxId} onChange={(e) => setTrxId(e.target.value)} placeholder="8XJ5..." className="w-full bg-slate-50 p-5 rounded-[24px] font-black border border-slate-100 outline-none" />
                   </div>
                ) : (
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase px-2">অ্যাকাউন্ট নাম্বার</label>
                      <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="017XXXXXXXX" className="w-full bg-slate-50 p-5 rounded-[24px] font-black border border-slate-100 outline-none" />
                   </div>
                )}
             </div>

             <button onClick={handleWalletSubmit} disabled={isSendingRequest} className={`w-full py-6 rounded-[28px] font-black text-lg text-white shadow-xl active:scale-95 transition-all ${walletMode === 'deposit' ? 'bg-emerald-700 shadow-emerald-700/20' : 'bg-rose-600 shadow-rose-600/20'}`}>
                {isSendingRequest ? <Loader2 className="animate-spin mx-auto" /> : (walletMode === 'deposit' ? 'রিচার্জ রিকোয়েস্ট পাঠান' : 'উইথড্র রিকোয়েস্ট পাঠান')}
             </button>
          </div>
        )}

        {tab === 'report' && (
          <div className="animate-in slide-in-from-right-4">
             <div className="bg-amber-50 p-6 rounded-[32px] border border-amber-100 mb-6 flex gap-3">
                <MessageSquare className="text-amber-600 shrink-0" />
                <p className="text-xs text-amber-800 font-bold leading-relaxed">অ্যাডমিনকে সরাসরি সমস্যা লিখে পাঠান।</p>
             </div>
             <textarea value={reportMsg} onChange={(e) => setReportMsg(e.target.value)} placeholder="আপনার অভিযোগ এখানে লিখুন..." className="w-full bg-slate-50 p-6 rounded-[32px] h-44 font-bold border border-slate-100 outline-none mb-8" />
             <button onClick={handleSubmitReport} disabled={isSendingRequest || !reportMsg.trim()} className="w-full bg-slate-900 text-white py-6 rounded-[28px] font-black text-lg active:scale-95 transition-all">
                {isSendingRequest ? <Loader2 className="animate-spin mx-auto" /> : 'মেসেজ পাঠান'}
             </button>
          </div>
        )}

        {tab === 'privacy' && (
          <div className="animate-in slide-in-from-right-4 pb-10">
             <div className="bg-emerald-50 p-6 rounded-[32px] mb-6 flex gap-3">
                <ShieldCheck className="text-emerald-700 shrink-0" />
                <p className="text-xs text-emerald-800 font-bold leading-relaxed">আমাদের প্ল্যাটফর্মে আপনার ডেটা ১০০% নিরাপদ।</p>
             </div>
             <div className="space-y-6 text-sm text-slate-600 leading-relaxed no-scrollbar max-h-60 overflow-y-auto pr-2">
                <p>১. আমরা কেবল আপনার মেধা যাচাইয়ের প্রয়োজনে তথ্য সংগ্রহ করি।</p>
                <p>২. ট্রানজেকশন তথ্য কেবল ভেরিফিকেশনের জন্য ব্যবহৃত হয়।</p>
                <p>৩. কুইজ ও লিসন প্রতিনিয়ত আপডেট করা হয়।</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditProfileModal;
