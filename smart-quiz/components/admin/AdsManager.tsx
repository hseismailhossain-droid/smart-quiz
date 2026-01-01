
import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, Save, Loader2, Power, Code, Hash, 
  ImageIcon, ExternalLink, Trash2, Video, 
  MonitorPlay, Link as LinkIcon, Info, Settings, 
  ChevronRight, Eye, PlayCircle, Sparkles, AlertCircle, Plus, List, ArrowDownNarrowWide, CheckCircle2, XCircle
} from 'lucide-react';
import { db } from '../../services/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, serverTimestamp, addDoc } from 'firebase/firestore';
import { AdUnit } from '../../types';
import ConfirmModal from './ConfirmModal';

const PLACEMENT_OPTIONS = [
  { id: 'home_top', label: 'হোম পেজ (উপরে)' },
  { id: 'home_middle', label: 'হোম পেজ (মাঝখানে)' },
  { id: 'home_bottom', label: 'হোম পেজ (নিচে)' },
  { id: 'quiz_start', label: 'কুইজ শুরুর আগে' },
  { id: 'quiz_question_bottom', label: 'প্রশ্নের নিচে' },
  { id: 'quiz_end', label: 'ফলাফল পেজ' },
  { id: 'feed_top', label: 'ফিড (টপ)' },
  { id: 'feed_middle', label: 'ফিড (মাঝখানে)' },
  { id: 'history_top', label: 'হিস্ট্রি পেজ' }
];

const AdsManager: React.FC = () => {
  const [ads, setAds] = useState<AdUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingAd, setEditingAd] = useState<Partial<AdUnit> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, id: string, label: string}>({
    show: false, id: '', label: ''
  });

  // Form State
  const [formData, setFormData] = useState<Partial<AdUnit>>({
    label: '',
    placementId: 'home_middle',
    network: 'custom',
    adType: 'image',
    content: '',
    link: '',
    active: true,
    order: 1
  });

  useEffect(() => {
    const q = query(collection(db, 'ad_units'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as AdUnit));
      data.sort((a, b) => {
        const pCompare = (a.placementId || '').localeCompare(b.placementId || '');
        if (pCompare !== 0) return pCompare;
        return (a.order || 0) - (b.order || 0);
      });
      setAds(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleToggleStatus = async (adId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'ad_units', adId), { active: !currentStatus });
    } catch (e) {
      alert("স্টেটাস পরিবর্তন করা যায়নি।");
    }
  };

  const handleSave = async () => {
    if (!formData.label?.trim() || !formData.content?.trim()) return alert("সব তথ্য সঠিকভাবে পূরণ করুন।");
    setIsSaving(true);
    try {
      const finalData = {
        ...formData,
        order: Number(formData.order) || 0,
        updatedAt: Date.now()
      };

      if (view === 'edit' && editingAd?.id) {
        await updateDoc(doc(db, 'ad_units', editingAd.id), finalData);
        alert("বিজ্ঞাপন আপডেট হয়েছে!");
      } else {
        await addDoc(collection(db, 'ad_units'), {
          ...finalData,
          timestamp: serverTimestamp()
        });
        alert("নতুন বিজ্ঞাপন যোগ হয়েছে!");
      }
      setView('list');
      resetForm();
    } catch (e) {
      alert("সেভ করতে সমস্যা হয়েছে।");
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      label: '',
      placementId: 'home_middle',
      network: 'custom',
      adType: 'image',
      content: '',
      link: '',
      active: true,
      order: 1
    });
    setEditingAd(null);
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'ad_units', deleteConfirm.id));
      setDeleteConfirm({ show: false, id: '', label: '' });
    } catch (e) { alert("ডিলিট ব্যর্থ হয়েছে।"); }
  };

  const startEdit = (ad: AdUnit) => {
    setEditingAd(ad);
    setFormData(ad);
    setView('edit');
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-emerald-700" /></div>;

  return (
    <div className="space-y-10 pb-20 font-['Hind_Siliguri'] max-w-6xl mx-auto px-4">
      <ConfirmModal 
        show={deleteConfirm.show}
        title="বিজ্ঞাপন ডিলিট"
        message={`আপনি কি নিশ্চিতভাবে "${deleteConfirm.label}" বিজ্ঞাপনটি মুছে ফেলতে চান?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, id: '', label: '' })}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-4xl font-black text-slate-900 leading-tight">Elite Ad Manager Pro</h2>
            <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">PREMIUM CONTROL</div>
          </div>
          <p className="text-slate-400 font-bold text-sm italic">সরাসরি এখান থেকে বিজ্ঞাপন অ্যাক্টিভ বা ডিঅ্যাক্টিভ করুন</p>
        </div>
        
        {view === 'list' ? (
          <button 
            onClick={() => { resetForm(); setView('create'); }}
            className="flex items-center gap-2 bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-emerald-700/20 active:scale-95 transition-all"
          >
            <Plus size={20} /> নতুন বিজ্ঞাপন
          </button>
        ) : (
          <button 
            onClick={() => setView('list')}
            className="flex items-center gap-2 bg-slate-100 text-slate-600 px-8 py-4 rounded-2xl font-black text-sm active:scale-95 transition-all"
          >
            <List size={20} /> লিস্টে ফিরে যান
          </button>
        )}
      </div>

      {view === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
           {ads.map(ad => (
             <div key={ad.id} className={`bg-white p-6 rounded-[40px] border-2 transition-all group relative overflow-hidden ${ad.active ? 'border-emerald-100 shadow-emerald-100/50 shadow-xl' : 'border-slate-100 grayscale-[0.5] opacity-80 shadow-sm'}`}>
                {ad.active && (
                   <div className="absolute top-4 right-4 flex items-center gap-1.5">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live Now</span>
                   </div>
                )}
                
                <div className="flex justify-between items-start mb-6">
                   <div className={`p-3 rounded-2xl flex items-center gap-2 ${ad.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                      {ad.adType === 'image' ? <ImageIcon size={20}/> : ad.adType === 'video' ? <Video size={20}/> : <Code size={20}/>}
                   </div>
                   <div className="flex gap-1.5">
                      <button 
                        onClick={() => handleToggleStatus(ad.id, ad.active)}
                        className={`p-2.5 rounded-xl transition-all shadow-sm active:scale-90 ${ad.active ? 'bg-rose-50 text-rose-500 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                        title={ad.active ? 'বন্ধ করুন' : 'চালু করুন'}
                      >
                         <Power size={16}/>
                      </button>
                      <button onClick={() => startEdit(ad)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-emerald-700 rounded-xl transition-colors"><Settings size={16}/></button>
                      <button onClick={() => setDeleteConfirm({show: true, id: ad.id, label: ad.label})} className="p-2.5 bg-rose-50 text-rose-400 hover:text-rose-600 rounded-xl transition-colors"><Trash2 size={16}/></button>
                   </div>
                </div>

                <div className="space-y-1 mb-4">
                  <h4 className="font-black text-slate-800 text-lg leading-tight truncate pr-16">{ad.label}</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">স্লট: {PLACEMENT_OPTIONS.find(p=>p.id === ad.placementId)?.label || ad.placementId}</p>
                </div>

                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider border-t pt-4">
                   <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-md ${ad.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                        {ad.network}
                      </span>
                      <span className="text-slate-300">Order: {ad.order}</span>
                   </div>
                   <div className={`flex items-center gap-1 ${ad.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {ad.active ? <CheckCircle2 size={12}/> : <XCircle size={12}/>}
                      {ad.active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                   </div>
                </div>
             </div>
           ))}
           {ads.length === 0 && (
             <div className="col-span-full py-32 text-center bg-white rounded-[50px] border-2 border-dashed border-slate-100">
                <AlertCircle size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-300 font-black uppercase text-xs">কোনো বিজ্ঞাপন পাওয়া যায়নি</p>
             </div>
           )}
        </div>
      ) : (
        <div className="bg-white p-8 md:p-12 rounded-[50px] shadow-sm border border-slate-100 space-y-10 animate-in slide-in-from-bottom-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase px-2 tracking-widest">বিজ্ঞাপনের নাম (চেনার জন্য)</label>
                <input 
                  type="text" value={formData.label} 
                  onChange={e => setFormData({...formData, label: e.target.value})} 
                  placeholder="যেমন: হোম পেজ ব্যানার ২"
                  className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border border-slate-100 focus:bg-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase px-2 tracking-widest">কোথায় দেখাবে (Placement)</label>
                <select 
                  value={formData.placementId} 
                  onChange={e => setFormData({...formData, placementId: e.target.value})}
                  className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border border-slate-100"
                >
                  {PLACEMENT_OPTIONS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase px-2 tracking-widest">বিজ্ঞাপনের ক্রম (Order)</label>
                <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-2xl border border-slate-100 focus-within:bg-white transition-all">
                   <div className="p-4 bg-white rounded-xl shadow-sm text-slate-400"><ArrowDownNarrowWide size={20}/></div>
                   <input 
                    type="number" value={formData.order} 
                    onChange={e => setFormData({...formData, order: parseInt(e.target.value)})} 
                    className="flex-grow bg-transparent p-4 font-black outline-none"
                    placeholder="1, 2, 3..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase px-2 tracking-widest">অ্যাড নেটওয়ার্ক</label>
                <select 
                  value={formData.network} 
                  onChange={e => setFormData({...formData, network: e.target.value as any})}
                  className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border border-slate-100"
                >
                  <option value="custom">নিজের বিজ্ঞাপন (Banner)</option>
                  <option value="adsense">Google AdSense</option>
                  <option value="admob">Google AdMob</option>
                  <option value="adsterra">Adsterra</option>
                </select>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase px-2 tracking-widest">ধরন</label>
                <select 
                  value={formData.adType} 
                  onChange={e => setFormData({...formData, adType: e.target.value as any})}
                  className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border border-slate-100"
                >
                  <option value="image">ছবি (URL)</option>
                  <option value="video">ভিডিও (Youtube/MP4)</option>
                  <option value="script">কোড (HTML Script)</option>
                  <option value="id">স্লট আইডি (Slot ID)</option>
                </select>
              </div>

              <div className="flex items-end pb-2">
                 <button 
                  onClick={() => setFormData({...formData, active: !formData.active})}
                  className={`flex-1 py-5 rounded-2xl font-black text-xs uppercase transition-all flex items-center justify-center gap-2 ${formData.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}
                 >
                   <Power size={14}/> {formData.active ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Off)'}
                 </button>
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase px-2 tracking-widest">কন্টেন্ট বা কোড</label>
              <textarea 
                value={formData.content} 
                onChange={e => setFormData({...formData, content: e.target.value})}
                placeholder={formData.adType === 'script' ? '<script>...</script>' : 'https://...'}
                className="w-full h-40 bg-slate-50 p-6 rounded-[32px] font-mono text-xs border border-slate-100 outline-none focus:bg-white transition-all shadow-inner"
              />
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase px-2 tracking-widest">টার্গেট লিঙ্ক (ঐচ্ছিক)</label>
              <input 
                type="text" value={formData.link} 
                onChange={e => setFormData({...formData, link: e.target.value})} 
                placeholder="https://example.com"
                className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border border-slate-100"
              />
           </div>

           <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full bg-slate-900 text-white py-6 rounded-[32px] font-black text-lg flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all disabled:opacity-50"
           >
             {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={24} /> {view === 'edit' ? 'আপডেট করুন' : 'পাবলিশ করুন'}</>}
           </button>
        </div>
      )}
    </div>
  );
};

export default AdsManager;
