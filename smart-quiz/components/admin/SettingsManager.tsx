
import React, { useState, useEffect } from 'react';
import { Smartphone, Bell, Save, Send, CheckCircle2, Clock, Palette, Sparkles, Loader2, Info, Trash2, BellOff, AlertTriangle, X, Eye, EyeOff, CreditCard } from 'lucide-react';
import { db } from '../../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Notification } from '../../types';

interface PaymentConfig {
  number: string;
  active: boolean;
}

interface PaymentSettings {
  bkash: PaymentConfig;
  nagad: PaymentConfig;
  rocket: PaymentConfig;
  upay: PaymentConfig;
}

interface SettingsManagerProps {
  onSendNotification: (title: string, message: string) => void;
  onDeleteNotification: (id: string) => void;
  notifications: Notification[];
}

const SettingsManager: React.FC<SettingsManagerProps> = ({ onSendNotification, onDeleteNotification, notifications }) => {
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Payment States
  const [payments, setPayments] = useState<PaymentSettings>({
    bkash: { number: '', active: true },
    nagad: { number: '', active: true },
    rocket: { number: '', active: false },
    upay: { number: '', active: false }
  });
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'payment_numbers'));
        if (snap.exists()) {
          const data = snap.data();
          setPayments({
            bkash: data.bkash || { number: '', active: true },
            nagad: data.nagad || { number: '', active: true },
            rocket: data.rocket || { number: '', active: false },
            upay: data.upay || { number: '', active: false }
          });
        }
      } catch (e) {
        console.error("Error fetching settings:", e);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'payment_numbers'), {
        ...payments,
        lastUpdated: Date.now()
      });
      alert("পেমেন্ট সেটিংস সফলভাবে সেভ করা হয়েছে!");
    } catch (e) {
      alert("সেভ করতে সমস্যা হয়েছে।");
    } finally {
      setIsSaving(false);
    }
  };

  const togglePaymentActive = (method: keyof PaymentSettings) => {
    setPayments(prev => ({
      ...prev,
      [method]: { ...prev[method], active: !prev[method].active }
    }));
  };

  const updatePaymentNumber = (method: keyof PaymentSettings, num: string) => {
    setPayments(prev => ({
      ...prev,
      [method]: { ...prev[method], number: num }
    }));
  };

  const handleSendNotification = async () => {
    if (!notifTitle.trim() || !notifMessage.trim()) return alert("টাইটেল ও মেসেজ দিন");
    setIsSending(true);
    try {
      await onSendNotification(notifTitle, notifMessage);
      setShowSuccess(true);
      setNotifTitle('');
      setNotifMessage('');
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (e) {
      alert("নোটিফিকেশন পাঠানো যায়নি।");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20 font-['Hind_Siliguri']">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">সিস্টেম সেটিংস</h2>
          <p className="text-slate-400 font-bold text-sm">অ্যাপের পেমেন্ট ও নোটিফিকেশন নিয়ন্ত্রণ করুন</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="bg-white p-8 md:p-10 rounded-[44px] shadow-sm border border-slate-100 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-10">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-700 shadow-sm"><Smartphone size={24} /></div>
              <div>
                <h3 className="text-xl font-black text-slate-900">পেমেন্ট মেথডসমূহ</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Payment Gateway Config</p>
              </div>
            </div>

            <div className="space-y-6 flex-grow">
               <PaymentInput 
                 label="বিকাশ (bKash)" 
                 value={payments.bkash.number} 
                 active={payments.bkash.active} 
                 onNumberChange={(v) => updatePaymentNumber('bkash', v)}
                 onToggle={() => togglePaymentActive('bkash')}
               />
               <PaymentInput 
                 label="নগদ (Nagad)" 
                 value={payments.nagad.number} 
                 active={payments.nagad.active} 
                 onNumberChange={(v) => updatePaymentNumber('nagad', v)}
                 onToggle={() => togglePaymentActive('nagad')}
               />
               <PaymentInput 
                 label="রকেট (Rocket)" 
                 value={payments.rocket.number} 
                 active={payments.rocket.active} 
                 onNumberChange={(v) => updatePaymentNumber('rocket', v)}
                 onToggle={() => togglePaymentActive('rocket')}
               />
               <PaymentInput 
                 label="উপায় (Upay)" 
                 value={payments.upay.number} 
                 active={payments.upay.active} 
                 onNumberChange={(v) => updatePaymentNumber('upay', v)}
                 onToggle={() => togglePaymentActive('upay')}
               />

               <div className="bg-blue-50 p-6 rounded-[28px] border border-blue-100/50 flex items-start gap-3 mt-4">
                  <Info size={16} className="text-blue-700 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-blue-800 font-bold leading-relaxed">
                    যে মেথডগুলো <b>Active (চোখ খোলা)</b> রাখবেন, সেগুলোই কেবল ইউজার অ্যাপে পেমেন্টের জন্য দেখা যাবে।
                  </p>
               </div>
            </div>

            <div className="mt-8">
              <button 
                onClick={handleSaveSettings} 
                disabled={isSaving} 
                className="w-full bg-emerald-700 text-white py-6 rounded-[28px] font-black text-lg shadow-xl shadow-emerald-700/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={22} /> পেমেন্ট সেটিংস সেভ করুন</>}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-8">
           <div className="bg-white p-8 md:p-10 rounded-[44px] shadow-sm border border-slate-100 flex flex-col">
              <div className="flex items-center gap-3 mb-10">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-700 shadow-sm"><Bell size={24} /></div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">পুশ নোটিফিকেশন পাঠান</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global Broadcast</p>
                </div>
              </div>
              <div className="space-y-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase px-2">টাইটেল</label>
                   <input 
                    type="text" 
                    value={notifTitle} 
                    onChange={(e) => setNotifTitle(e.target.value)} 
                    placeholder="যেমন: নতুন কুইজ এলার্ট!" 
                    className="w-full bg-slate-50 border border-slate-100 p-5 rounded-[24px] font-bold outline-none focus:bg-white focus:border-blue-200 transition-all" 
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase px-2">মেসেজ বডি</label>
                   <textarea 
                    value={notifMessage} 
                    onChange={(e) => setNotifMessage(e.target.value)} 
                    placeholder="আপনার ইউজারদের জন্য জরুরি মেসেজ লিখুন..." 
                    className="w-full bg-slate-50 border border-slate-100 p-6 rounded-[32px] font-bold h-32 outline-none resize-none leading-relaxed focus:bg-white focus:border-blue-200 transition-all" 
                   />
                 </div>
                 
                 <div className="pt-2">
                  {showSuccess && (
                    <div className="mb-4 p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 font-black text-xs flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
                      <CheckCircle2 size={16} /> নোটিফিকেশন পাঠানো হয়েছে
                    </div>
                  )}
                  <button 
                    onClick={handleSendNotification} 
                    disabled={isSending || !notifTitle.trim() || !notifMessage.trim()} 
                    className="w-full py-5 bg-blue-600 text-white rounded-[28px] font-black text-lg shadow-xl shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isSending ? <Loader2 className="animate-spin" /> : <><Send size={22} /> সব ইউজারকে পাঠান</>}
                  </button>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

interface PaymentInputProps {
  label: string;
  value: string;
  active: boolean;
  onNumberChange: (v: string) => void;
  onToggle: () => void;
}

const PaymentInput: React.FC<PaymentInputProps> = ({ label, value, active, onNumberChange, onToggle }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center px-2">
      <label className="text-[10px] font-black text-slate-400 uppercase">{label}</label>
      <button 
        type="button"
        onClick={onToggle}
        className={`flex items-center gap-1 text-[10px] font-black uppercase transition-colors px-3 py-1 rounded-lg ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}
      >
        {active ? <><Eye size={12}/> Active</> : <><EyeOff size={12}/> Hidden</>}
      </button>
    </div>
    <div className="relative group">
       <input 
        type="text" 
        value={value} 
        onChange={(e) => onNumberChange(e.target.value)} 
        placeholder="01XXXXXXXXX" 
        className={`w-full p-5 rounded-[22px] outline-none font-black text-base border-2 transition-all ${active ? 'bg-slate-50 border-slate-100 focus:bg-white focus:border-emerald-200' : 'bg-slate-50/50 border-slate-50 text-slate-300'}`} 
       />
    </div>
  </div>
);

export default SettingsManager;
