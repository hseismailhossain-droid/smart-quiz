
import React, { useState, useRef } from 'react';
import { X, Camera, Check, Loader2, User, ShieldAlert, Send, FileText, MessageSquare, Info, ShieldCheck } from 'lucide-react';
import { Category, UserProfile } from '../types';
import { db, auth } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface EditProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  onUpdate: (data: Partial<UserProfile>) => Promise<void>;
  initialTab?: 'profile' | 'report' | 'privacy';
}

const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Milo",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna"
];

const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onUpdate, initialTab = 'profile' }) => {
  const [tab, setTab] = useState<'profile' | 'report' | 'privacy'>(initialTab);
  const [name, setName] = useState(user.name);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatarUrl || PRESET_AVATARS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Report States
  const [reportMsg, setReportMsg] = useState('');
  const [isSendingReport, setIsSendingReport] = useState(false);

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

  const handleSubmitReport = async () => {
    if (!reportMsg.trim()) return;
    setIsSendingReport(true);
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
      setReportMsg('');
      onClose();
    } catch (e) {
      alert("রিপোর্ট পাঠানো যায়নি।");
    } finally { setIsSendingReport(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[1000] flex items-end justify-center font-['Hind_Siliguri'] p-4 sm:p-0">
      <div className="bg-white w-full max-w-md rounded-t-[50px] sm:rounded-[50px] p-8 animate-in slide-in-from-bottom-24 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar relative">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-100 rounded-full mb-8"></div>
        
        <div className="flex justify-between items-center mb-6 pt-4">
          <h3 className="text-2xl font-black text-slate-900">
            {tab === 'profile' ? 'সেটিং' : tab === 'report' ? 'অভিযোগ' : 'নীতিমালা'}
          </h3>
          <button onClick={onClose} className="p-3 bg-slate-50 rounded-full text-slate-400 hover:text-rose-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
           <button onClick={() => setTab('profile')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${tab === 'profile' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400'}`}>প্রোফাইল</button>
           <button onClick={() => setTab('report')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${tab === 'report' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400'}`}>রিপোর্ট</button>
           <button onClick={() => setTab('privacy')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${tab === 'privacy' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400'}`}>প্রাইভেসি</button>
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
              {error && <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl text-[11px] font-black">{error}</div>}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase px-2">নাম আপডেট করুন</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 p-5 rounded-[24px] font-black border border-slate-100 outline-none" />
              </div>
            </div>

            <button onClick={handleSave} disabled={isSaving || !name.trim()} className="w-full bg-emerald-700 text-white py-6 rounded-[28px] font-black text-lg shadow-xl active:scale-95 transition-all">
              {isSaving ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'সেভ করুন'}
            </button>
          </div>
        )}

        {tab === 'report' && (
          <div className="animate-in slide-in-from-right-4">
             <div className="bg-amber-50 p-6 rounded-[32px] border border-amber-100 mb-6 flex gap-3">
                <MessageSquare className="text-amber-600 shrink-0" />
                <p className="text-xs text-amber-800 font-bold leading-relaxed">অ্যাডমিনকে আপনার সমস্যা সরাসরি লিখে পাঠান। দ্রুত সমাধানের চেষ্টা করা হবে।</p>
             </div>
             <div className="space-y-4 mb-8">
                <label className="text-[10px] font-black text-slate-400 uppercase px-2">আপনার অভিযোগ</label>
                <textarea 
                  value={reportMsg} 
                  onChange={(e) => setReportMsg(e.target.value)} 
                  placeholder="যেমন: পেমেন্ট অ্যাড হয়নি বা অ্যাপে বাগ আছে..." 
                  className="w-full bg-slate-50 p-6 rounded-[32px] h-40 font-bold border border-slate-100 outline-none focus:bg-white transition-all"
                />
             </div>
             <button onClick={handleSubmitReport} disabled={isSendingReport || !reportMsg.trim()} className="w-full bg-slate-900 text-white py-6 rounded-[28px] font-black text-lg flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl">
                {isSendingReport ? <Loader2 className="animate-spin" /> : <><Send size={20} /> অ্যাডমিনকে পাঠান</>}
             </button>
          </div>
        )}

        {tab === 'privacy' && (
          <div className="animate-in slide-in-from-right-4 pb-10">
             <div className="bg-emerald-50 p-6 rounded-[32px] mb-6 flex gap-3">
                <ShieldCheck className="text-emerald-700 shrink-0" />
                <p className="text-xs text-emerald-800 font-bold leading-relaxed">Smart Quiz Pro আপনার তথ্যের নিরাপত্তাকে সর্বোচ্চ গুরুত্ব দেয়।</p>
             </div>
             <div className="space-y-6 text-sm text-slate-600 leading-relaxed max-h-[350px] overflow-y-auto pr-2 no-scrollbar">
                <div>
                  <p className="font-black text-slate-900 mb-1">১. তথ্য সুরক্ষা</p>
                  <p>আপনার নাম ও ইমেইল কেবল আপনার র‍্যাঙ্কিং ট্র্যাকিংয়ের জন্য ব্যবহার করা হয়।</p>
                </div>
                <div>
                  <p className="font-black text-slate-900 mb-1">২. পেমেন্ট ভেরিফিকেশন</p>
                  <p>আপনার Trx ID কেবল আপনার রিচার্জ রিকোয়েস্ট ভেরিফিকেশনের জন্য ব্যবহার হয়।</p>
                </div>
                <div>
                  <p className="font-black text-slate-900 mb-1">৩. কন্টেন্ট নীতিমালা</p>
                  <p>অ্যাপের সব প্রশ্ন শিক্ষামূলক এবং মেধা বিকাশের উদ্দেশ্যে তৈরি করা হয়েছে।</p>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditProfileModal;
