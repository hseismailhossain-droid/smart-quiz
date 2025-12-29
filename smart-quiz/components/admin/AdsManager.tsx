
import React, { useState, useEffect } from 'react';
// Added missing ChevronRight import
import { LayoutGrid, Save, Loader2, Power, Code, Hash, Image as ImageIcon, ExternalLink, Trash2, Video, MonitorPlay, Link as LinkIcon, Info, Settings, ChevronRight } from 'lucide-react';
import { db } from '../../services/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { AdPlacement } from '../../types';

const PLACEMENTS = [
  { id: 'home_top', label: 'হোম পেজ (উপরে)' },
  { id: 'home_middle', label: 'হোম পেজ (মাঝখানে)' },
  { id: 'home_bottom', label: 'হোম পেজ (নিচে)' },
  { id: 'quiz_start', label: 'কুইজ স্ক্রিন (উপরে)' },
  { id: 'quiz_question_bottom', label: 'কুইজ প্রশ্ন (নিচে)' },
  { id: 'quiz_end', label: 'ফলাফল পেজ (বিজয়ীর উপরে)' },
  { id: 'feed_top', label: 'কমিউনিটি ফিড (শুরুতে)' },
  { id: 'feed_between_posts', label: 'ফিড (প্রতি ৫ পোস্ট অন্তর)' },
  { id: 'history_top', label: 'হিস্ট্রি পেজ (উপরে)' }
];

const AdsManager: React.FC = () => {
  const [configs, setConfigs] = useState<Record<string, AdPlacement>>({});
  const [loading, setLoading] = useState(true);
  const [selectedPid, setSelectedPid] = useState(PLACEMENTS[0].id);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [network, setNetwork] = useState<any>('custom');
  const [adType, setAdType] = useState<any>('image');
  const [content, setContent] = useState('');
  const [link, setLink] = useState('');
  const [active, setActive] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'ad_placements'), (snap) => {
      const data: any = {};
      snap.docs.forEach(d => data[d.id] = d.data());
      setConfigs(data);
      setLoading(false);
      
      const current = data[selectedPid];
      if (current) {
        setNetwork(current.network);
        setAdType(current.adType);
        setContent(current.content);
        setLink(current.link || "");
        setActive(current.active);
      } else {
        // Reset if no config found for this slot
        setNetwork('custom');
        setAdType('image');
        setContent('');
        setLink('');
        setActive(true);
      }
    });
    return unsub;
  }, [selectedPid]);

  const handleSave = async () => {
    if (!content.trim() && active) return alert("বিজ্ঞাপনের কন্টেন্ট বা কোড দিন।");
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'ad_placements', selectedPid), {
        id: selectedPid,
        network,
        adType,
        content: content.trim(),
        link: link.trim(),
        active,
        updatedAt: Date.now()
      });
      alert("বিজ্ঞাপন সেটিংস সফলভাবে সেভ হয়েছে!");
    } catch (e) {
      alert("সেভ করতে সমস্যা হয়েছে।");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-10 pb-20 font-['Hind_Siliguri'] max-w-6xl mx-auto">
      <div className="px-2">
        <h2 className="text-4xl font-black text-slate-900 leading-tight">Elite Ad Manager 🚀</h2>
        <p className="text-slate-400 font-bold text-sm">AdSense, Adsterra বা নিজের পছন্দের বিজ্ঞাপন যেখানে খুশি সেট করুন</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Placement Selection */}
        <div className="space-y-3 px-2">
          <h3 className="text-[10px] font-black text-slate-400 uppercase px-4 tracking-[0.2em] mb-4">প্লেসমেন্ট সিলেক্ট করুন</h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto no-scrollbar pr-1">
            {PLACEMENTS.map(p => (
              <button 
                key={p.id}
                onClick={() => setSelectedPid(p.id)}
                className={`w-full p-6 rounded-[32px] text-left font-black border-2 transition-all flex items-center justify-between group ${selectedPid === p.id ? 'border-emerald-700 bg-emerald-50 text-emerald-900 shadow-xl shadow-emerald-700/5' : 'border-slate-50 bg-white text-slate-400 hover:border-slate-200'}`}
              >
                <div className="flex items-center gap-4">
                   <div className={`w-3 h-3 rounded-full ${configs[p.id]?.active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-200'}`}></div>
                   <span className="text-sm">{p.label}</span>
                </div>
                <ChevronRight size={16} className={`transition-all ${selectedPid === p.id ? 'translate-x-1 text-emerald-700' : 'opacity-20'}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Configuration Editor */}
        <div className="lg:col-span-2 px-2">
          <div className="bg-white p-8 md:p-12 rounded-[60px] shadow-sm border border-slate-100 space-y-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-bl-[120px] -mr-16 -mt-16 opacity-30"></div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10 border-b pb-8 border-slate-50">
               <div>
                  <h3 className="text-2xl font-black text-slate-900">{PLACEMENTS.find(p => p.id === selectedPid)?.label}</h3>
                  <p className="text-xs text-slate-400 font-bold mt-1">এই নির্দিষ্ট স্লটের জন্য সেটিংস পরিবর্তন করুন</p>
               </div>
               <button 
                onClick={() => setActive(!active)}
                className={`flex items-center gap-3 px-8 py-4 rounded-[22px] font-black text-[11px] uppercase transition-all shadow-sm ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-50 text-rose-500'}`}
               >
                 <Power size={14} strokeWidth={3}/> {active ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Disabled)'}
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase px-2 tracking-[0.2em]">অ্যাড নেটওয়ার্ক</label>
                <select 
                  value={network} 
                  onChange={(e) => setNetwork(e.target.value)} 
                  className="w-full p-6 rounded-[28px] font-black border-2 border-slate-50 bg-slate-50 outline-none focus:bg-white focus:border-emerald-100 transition-all appearance-none shadow-inner text-slate-800"
                >
                  <option value="custom">নিজের বিজ্ঞাপন (Image/Video)</option>
                  <option value="adsense">Google AdSense</option>
                  <option value="admob">Google AdMob (IDs Only)</option>
                  <option value="adsterra">Adsterra / Others</option>
                  <option value="none">কোনো অ্যাড নেই</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase px-2 tracking-[0.2em]">বিজ্ঞাপন ধরন (Type)</label>
                <select 
                  value={adType} 
                  onChange={(e) => setAdType(e.target.value)} 
                  className="w-full p-6 rounded-[28px] font-black border-2 border-slate-50 bg-slate-50 outline-none focus:bg-white focus:border-emerald-100 transition-all appearance-none shadow-inner text-slate-800"
                >
                  <option value="image">ব্যানার ছবি (Link)</option>
                  <option value="video">ভিডিও (MP4/Youtube)</option>
                  <option value="script">HTML/JS কোড (Script)</option>
                  <option value="id">স্লট আইডি (Slot ID)</option>
                </select>
              </div>
            </div>

            <div className="space-y-4 relative z-10 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 px-2">
                 <Settings size={14} className="text-emerald-700" />
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {adType === 'script' ? 'স্ক্রিপ্ট কোড পেস্ট করুন' : adType === 'id' ? 'Slot/Unit ID দিন' : 'মিডিয়া লিঙ্ক (URL)'}
                 </label>
              </div>
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={adType === 'script' ? '<script src="..."></script>' : adType === 'id' ? '1234567890' : 'https://image-url-here.jpg'}
                className="w-full h-48 bg-slate-50 p-8 rounded-[44px] font-mono text-sm border-2 border-slate-50 outline-none focus:bg-white focus:border-emerald-100 transition-all resize-none shadow-inner text-slate-700"
              />
            </div>

            {(adType === 'image' || adType === 'video') && (
              <div className="space-y-4 relative z-10 animate-in slide-in-from-top-4">
                <div className="flex items-center gap-2 px-2">
                   <LinkIcon size={14} className="text-slate-400" />
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">টার্গেট লিঙ্ক (ক্লিক করলে যেখানে যাবে)</label>
                </div>
                <input 
                  type="text" 
                  value={link} 
                  onChange={(e) => setLink(e.target.value)} 
                  placeholder="https://example.com" 
                  className="w-full p-6 rounded-[28px] border-2 border-slate-50 bg-slate-50 font-black outline-none focus:bg-white focus:border-emerald-100 transition-all shadow-inner text-slate-800" 
                />
              </div>
            )}

            <div className="pt-6 relative z-10">
              <button 
                onClick={handleSave} 
                disabled={isSaving} 
                className="w-full bg-emerald-700 text-white py-6 rounded-[32px] font-black text-xl flex items-center justify-center gap-4 shadow-2xl shadow-emerald-700/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={24} /> সেটিংস আপডেট করুন</>}
              </button>
            </div>
            
            <div className="bg-amber-50 p-6 rounded-[32px] border border-amber-100 flex gap-4 mt-6">
               <Info className="text-amber-600 shrink-0" />
               <p className="text-[11px] text-amber-800 font-bold leading-relaxed">
                 Adsterra বা অন্য নেটওয়ার্ক ব্যবহার করলে 'Script' টাইপ সিলেক্ট করে পুরো কোডটি কন্টেন্ট বক্সে দিন। AdSense এর জন্য 'ID' অথবা 'Script' যেকোনোটি ব্যবহার করা যাবে।
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdsManager;
