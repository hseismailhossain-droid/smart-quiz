
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
      alert("à¦ªà§‡à¦®à§‡à¦¨à§à¦Ÿ à¦¸à§‡à¦Ÿà¦¿à¦‚à¦¸ à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦¸à§‡à¦­ à¦•à¦°à¦¾ à¦¹à§Ÿà§‡à¦›à§‡!");
    } catch (e) {
      alert("à¦¸à§‡à¦­ à¦•à¦°à¦¤à§‡ à¦¸à¦®à¦¸à§à¦¯à¦¾ à¦¹à§Ÿà§‡à¦›à§‡à¥¤");
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
    if (!notifTitle.trim() || !notifMessage.trim()) return alert("à¦Ÿà¦¾à¦‡à¦Ÿà§‡à¦² à¦“ à¦®à§‡à¦¸à§‡à¦œ à¦¦à¦¿à¦¨");
    setIsSending(true);
    try {
      await onSendNotification(notifTitle, notifMessage);
      setShowSuccess(true);
      setNotifTitle('');
      setNotifMessage('');
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (e) {
      alert("à¦¨à§‹à¦Ÿà¦¿à¦«à¦¿à¦•à§‡à¦¶à¦¨ à¦ªà¦¾à¦ à¦¾à¦¨à§‹ à¦¯à¦¾à§Ÿà¦¨à¦¿à¥¤");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20 font-['Hind_Siliguri']">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">à¦¸à¦¿à¦¸à§à¦Ÿà§‡à¦® à¦¸à§‡à¦Ÿà¦¿à¦‚à¦¸</h2>
          <p className="text-slate-400 font-bold text-sm">à¦…à§à¦¯à¦¾à¦ªà§‡à¦° à¦ªà§‡à¦®à§‡à¦¨à§à¦Ÿ à¦“ à¦¨à§‹à¦Ÿà¦¿à¦«à¦¿à¦•à§‡à¦¶à¦¨ à¦¨à¦¿à§Ÿà¦¨à§à¦¤à§à¦°à¦£ à¦•à¦°à§à¦¨</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Settings */}
        <div className="space-y-8">
          <div className="bg-white p-8 md:p-10 rounded-[44px] shadow-sm border border-slate-100 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-10">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-700 shadow-sm"><Smartphone size={24} /></div>
              <div>
                <h3 className="text-xl font-black text-slate-900">à¦ªà§‡à¦®à§‡à¦¨à§à¦Ÿ à¦®à§‡à¦¥à¦¡à¦¸à¦®à§‚à¦¹</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Payment Gateway Config</p>
              </div>
            </div>

            <div className="space-y-6 flex-grow">
               <PaymentInput 
                 label="à¦¬à¦¿à¦•à¦¾à¦¶ (bKash)" 
                 value={payments.bkash.number} 
                 active={payments.bkash.active} 
                 onNumberChange={(v) => updatePaymentNumber('bkash', v)}
                 onToggle={() => togglePaymentActive('bkash')}
               />
               <PaymentInput 
                 label="à¦¨à¦—à¦¦ (Nagad)" 
                 value={payments.nagad.number} 
                 active={payments.nagad.active} 
                 onNumberChange={(v) => updatePaymentNumber('nagad', v)}
                 onToggle={() => togglePaymentActive('nagad')}
               />
               <PaymentInput 
                 label="à¦°à¦•à§‡à¦Ÿ (Rocket)" 
                 value={payments.rocket.number} 
                 active={payments.rocket.active} 
                 onNumberChange={(v) => updatePaymentNumber('rocket', v)}
                 onToggle={() => togglePaymentActive('rocket')}
               />
               <PaymentInput 
                 label="à¦‰à¦ªà¦¾à¦¯à¦¼ (Upay)" 
                 value={payments.upay.number} 
                 active={payments.upay.active} 
                 onNumberChange={(v) => updatePaymentNumber('upay', v)}
                 onToggle={() => togglePaymentActive('upay')}
               />
            </div>

            <div className="mt-8">
              <button 
                onClick={handleSaveSettings} 
                disabled={isSaving} 
                className="w-full bg-emerald-700 text-white py-6 rounded-[28px] font-black text-lg shadow-xl active:scale-95 transition-all"
              >
                {isSaving ? <Loader2 className="animate-spin mx-auto" /> : 'à¦¸à§‡à¦­ à¦•à¦°à§à¦¨'}
              </button>
            </div>
          </div>
        </div>

        {/* Notifications Management */}
        <div className="space-y-8">
           <div className="bg-white p-8 md:p-10 rounded-[44px] shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-700 shadow-sm"><Bell size={24} /></div>
                <h3 className="text-xl font-black text-slate-900">à¦¨à§‹à¦Ÿà¦¿à¦«à¦¿à¦•à§‡à¦¶à¦¨ à¦ªà¦¾à¦ à¦¾à¦¨</h3>
              </div>
              
              <div className="space-y-6 mb-10">
                 <input 
                  type="text" 
                  value={notifTitle} 
                  onChange={(e) => setNotifTitle(e.target.value)} 
                  placeholder="à¦¨à§‹à¦Ÿà¦¿à¦«à¦¿à¦•à§‡à¦¶à¦¨ à¦Ÿà¦¾à¦‡à¦Ÿà§‡à¦²" 
                  className="w-full bg-slate-50 border border-slate-100 p-5 rounded-[24px] font-bold outline-none" 
                 />
                 <textarea 
                  value={notifMessage} 
                  onChange={(e) => setNotifMessage(e.target.value)} 
                  placeholder="à¦†à¦ªà¦¨à¦¾à¦° à¦®à§‡à¦¸à§‡à¦œ..." 
                  className="w-full bg-slate-50 border border-slate-100 p-6 rounded-[32px] font-bold h-32 outline-none" 
                 />
                 <button 
                  onClick={handleSendNotification} 
                  disabled={isSending || !notifTitle.trim()} 
                  className="w-full py-5 bg-blue-600 text-white rounded-[28px] font-black text-lg flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all"
                 >
                    {isSending ? <Loader2 className="animate-spin" /> : <><Send size={22} /> à¦ªà¦¾à¦ à¦¾à¦¨</>}
                 </button>
              </div>

              {/* Sent Notifications List */}
              <div className="pt-8 border-t border-slate-100">
                <h4 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2">
                   <Clock size={16} /> à¦ªà¦¾à¦ à¦¾à¦¨à§‹ à¦¨à§‹à¦Ÿà¦¿à¦«à¦¿à¦•à§‡à¦¶à¦¨ à¦²à¦¿à¦¸à§à¦Ÿ
                </h4>
                <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                  {notifications.map(n => (
                    <div key={n.id} className="p-4 bg-slate-50 rounded-3xl border border-slate-100 group relative">
                       <button 
                        onClick={() => onDeleteNotification(n.id)}
                        className="absolute top-4 right-4 p-2 bg-white text-rose-500 rounded-xl shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
                       >
                         <Trash2 size={16} />
                       </button>
                       <h5 className="font-black text-slate-900 text-xs pr-8">{n.title}</h5>
                       <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                       <p className="text-[8px] font-black text-slate-300 mt-2 uppercase">{n.time || 'à¦ªà¦¾à¦ à¦¾à¦¨à§‹ à¦¹à§Ÿà§‡à¦›à§‡'}</p>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="text-center py-10 text-slate-300 font-bold text-xs uppercase tracking-widest">
                       à¦•à§‹à¦¨à§‹ à¦¨à§‹à¦Ÿà¦¿à¦«à¦¿à¦•à§‡à¦¶à¦¨ à¦ªà¦¾à¦“à§Ÿà¦¾ à¦¯à¦¾à§Ÿà¦¨à¦¿
                    </div>
                  )}
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
        className={`p-1.5 rounded-lg transition-colors ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-300'}`}
      >
        {active ? <Eye size={14}/> : <EyeOff size={14}/>}
      </button>
    </div>
    <input 
      type="text" 
      value={value} 
      onChange={(e) => onNumberChange(e.target.value)} 
      placeholder="01XXXXXXXXX" 
      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none" 
    />
  </div>
);

export default SettingsManager;
