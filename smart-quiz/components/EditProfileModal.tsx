import React, { useState, useRef } from 'react';
import { X, Camera, Check, Loader2, User, ShieldAlert, ShieldCheck, FileText } from 'lucide-react';
import { Category, UserProfile } from '../types';

interface EditProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  onUpdate: (data: Partial<UserProfile>) => Promise<void>;
}

const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Milo",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna"
];

const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onUpdate }) => {
  const [name, setName] = useState(user.name);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatarUrl || PRESET_AVATARS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressAndSetImage = (file: File) => {
    // 1MB STRIKT CHECK
    const MAX_SIZE = 1 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError("ছবিটি ১ এমবি এর বেশি বড়! অনুগ্রহ করে ছোট ছবি (১ এমবি-র নিচে) ব্যবহার করুন।");
      return;
    }
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 512;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setSelectedAvatar(canvas.toDataURL('image/jpeg', 0.8));
        }
      };
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
      console.error(e);
      setError("সেভ করতে সমস্যা হয়েছে। আপনার ইন্টারনেট কানেকশন চেক করুন।");
    } finally { setIsSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[1000] flex items-end justify-center font-['Hind_Siliguri'] p-4 sm:p-0">
      <div className="bg-white w-full max-w-md rounded-t-[50px] sm:rounded-[50px] p-8 animate-in slide-in-from-bottom-24 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar relative">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-100 rounded-full mb-8"></div>
        
        <div className="flex justify-between items-center mb-8 pt-4">
          <h3 className="text-2xl font-black text-slate-900">প্রোফাইল সেটিং</h3>
          <button onClick={onClose} className="p-3 bg-slate-50 rounded-full text-slate-400 hover:text-rose-500 transition-colors shadow-sm">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-6">
            <div className="w-28 h-28 rounded-[36px] border-4 border-emerald-500 overflow-hidden bg-slate-100 shadow-xl">
              <img src={selectedAvatar} alt="preview" className="w-full h-full object-cover" />
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-700 text-white rounded-2xl flex items-center justify-center border-4 border-white shadow-lg active:scale-90 transition-all"
            >
              <Camera size={18} />
            </button>
            <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && compressAndSetImage(e.target.files[0])} accept="image/*" className="hidden" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">একটি অবতার পছন্দ করুন অথবা নতুন ছবি দিন (১ এমবি লিমিট)</p>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 w-full justify-center">
            {PRESET_AVATARS.map((av, idx) => (
              <button key={idx} onClick={() => setSelectedAvatar(av)} className={`shrink-0 w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${selectedAvatar === av ? 'border-emerald-500 scale-110 shadow-md' : 'border-transparent grayscale opacity-50'}`}>
                <img src={av} className="w-full h-full object-cover" alt="preset" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6 mb-10">
          {error && (
            <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl text-[11px] font-black flex items-center gap-2 border border-rose-100 animate-in fade-in zoom-in-95">
               <ShieldAlert size={16} /> {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase px-2">আপনার নাম</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="নাম লিখুন..." 
              className="w-full bg-slate-50 p-5 rounded-[24px] font-black border border-slate-100 outline-none focus:bg-white focus:border-emerald-200 transition-all shadow-inner" 
            />
          </div>
        </div>

        <button 
          onClick={handleSave} 
          disabled={isSaving || !name.trim()} 
          className="w-full bg-emerald-700 text-white py-6 rounded-[28px] font-black text-lg shadow-2xl shadow-emerald-700/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSaving ? <Loader2 className="animate-spin" size={24} /> : 'পরিবর্তন সেভ করুন'}
        </button>
      </div>
    </div>
  );
};

export default EditProfileModal;
            
