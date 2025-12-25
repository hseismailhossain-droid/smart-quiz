
import React, { useState, useEffect } from 'react';
import { BarChart3, Image as ImageIcon, Plus, Trash2, Save, Loader2, X, AlertTriangle, Eye, Send, CheckCircle2, Camera } from 'lucide-react';
import { db } from '../../services/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import ConfirmModal from './ConfirmModal';

const HomeManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'poll' | 'notice'>('poll');
  const [isSaving, setIsSaving] = useState(false);
  
  // Poll States
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [polls, setPolls] = useState<any[]>([]);

  // Notice States
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeImage, setNoticeImage] = useState<string | null>(null);
  const [notices, setNotices] = useState<any[]>([]);

  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, type: 'poll' | 'notice', id: string, title: string}>({
    show: false, type: 'poll', id: '', title: ''
  });

  useEffect(() => {
    const unsubPolls = onSnapshot(query(collection(db, 'admin_polls'), orderBy('timestamp', 'desc')), (snap) => {
      setPolls(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubNotices = onSnapshot(query(collection(db, 'admin_notices'), orderBy('timestamp', 'desc')), (snap) => {
      setNotices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubPolls(); unsubNotices(); };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) return alert("১ এমবি-র ছোট ছবি দিন।");
      const reader = new FileReader();
      reader.onloadend = () => setNoticeImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSavePoll = async () => {
    if (!pollQuestion.trim() || pollOptions.some(o => !o.trim())) return alert("সব তথ্য দিন");
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'admin_polls'), {
        question: pollQuestion.trim(),
        options: pollOptions.map(o => ({ text: o.trim(), votes: 0 })),
        active: true,
        votedBy: [],
        timestamp: serverTimestamp()
      });
      setPollQuestion(''); setPollOptions(['', '']);
      alert("পোল সফলভাবে তৈরি হয়েছে!");
    } catch (e) { alert("ব্যর্থ হয়েছে।"); }
    finally { setIsSaving(false); }
  };

  const handleSaveNotice = async () => {
    if (!noticeTitle.trim() || !noticeContent.trim()) return alert("টাইটেল ও কন্টেন্ট দিন");
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'admin_notices'), {
        title: noticeTitle.trim(),
        content: noticeContent.trim(),
        image: noticeImage,
        active: true,
        timestamp: serverTimestamp()
      });
      setNoticeTitle(''); setNoticeContent(''); setNoticeImage(null);
      alert("পোস্টটি সফলভাবে পাবলিশ হয়েছে!");
    } catch (e) { alert("ব্যর্থ হয়েছে।"); }
    finally { setIsSaving(false); }
  };

  const executeDelete = async () => {
    try {
      const col = deleteConfirm.type === 'poll' ? 'admin_polls' : 'admin_notices';
      await deleteDoc(doc(db, col, deleteConfirm.id));
      setDeleteConfirm({ show: false, type: 'poll', id: '', title: '' });
    } catch (e) { alert("মুছে ফেলা যায়নি।"); }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20 font-['Hind_Siliguri']">
      <ConfirmModal 
        show={deleteConfirm.show}
        title="ডিলিট নিশ্চিত করুন"
        message={`আপনি কি নিশ্চিতভাবে "${deleteConfirm.title}" মুছে ফেলতে চান?`}
        onConfirm={executeDelete}
        onCancel={() => setDeleteConfirm({ show: false, type: 'poll', id: '', title: '' })}
      />

      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">হোম ম্যানেজমেন্ট</h2>
          <p className="text-slate-400 font-bold text-sm">হোম স্ক্রিনের পোল ও নোটিশ নিয়ন্ত্রণ করুন</p>
        </div>
        <div className="flex bg-white p-2 rounded-[24px] border border-slate-100 shadow-sm overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('poll')} className={`px-8 py-3 rounded-[18px] font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'poll' ? 'bg-emerald-700 text-white shadow-lg' : 'text-slate-400'}`}>পোল তৈরি</button>
          <button onClick={() => setActiveTab('notice')} className={`px-8 py-3 rounded-[18px] font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'notice' ? 'bg-emerald-700 text-white shadow-lg' : 'text-slate-400'}`}>নোটিশ/পোস্ট</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          {activeTab === 'poll' ? (
            <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm space-y-8 animate-in slide-in-from-left duration-300">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl"><BarChart3 size={24}/></div>
                  <h3 className="text-xl font-black text-slate-900">নতুন পোল তৈরি করুন</h3>
               </div>
               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase px-2">পোলের প্রশ্ন</label>
                    <textarea 
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      placeholder="যেমন: আপনি কি প্রতিদিন লাইভ কুইজ চান?"
                      className="w-full bg-slate-50 border border-slate-100 p-6 rounded-[32px] font-bold outline-none h-24 focus:bg-white focus:border-emerald-200 transition-all"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase px-2">ভোটের অপশনসমূহ</label>
                    {pollOptions.map((opt, i) => (
                      <div key={i} className="flex gap-2">
                        <input 
                          type="text" 
                          value={opt}
                          onChange={(e) => {
                            const n = [...pollOptions]; n[i] = e.target.value; setPollOptions(n);
                          }}
                          placeholder={`অপশন ${i+1}`}
                          className="flex-grow bg-slate-50 border border-slate-100 p-5 rounded-2xl font-bold outline-none focus:bg-white"
                        />
                        {pollOptions.length > 2 && (
                          <button onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))} className="p-4 bg-rose-50 text-rose-500 rounded-2xl"><X size={18}/></button>
                        )}
                      </div>
                    ))}
                    {pollOptions.length < 4 && (
                      <button onClick={() => setPollOptions([...pollOptions, ''])} className="w-full py-3 border-2 border-dashed border-slate-100 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:border-emerald-200 hover:text-emerald-700 transition-all">+ অপশন যোগ করুন</button>
                    )}
                  </div>
                  <button 
                    onClick={handleSavePoll}
                    disabled={isSaving}
                    className="w-full bg-emerald-700 text-white py-6 rounded-[32px] font-black text-lg shadow-xl shadow-emerald-700/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
                  >
                    {isSaving ? <Loader2 className="animate-spin" /> : <><Send size={20}/> পোল পাবলিশ করুন</>}
                  </button>
               </div>
            </div>
          ) : (
            <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm space-y-8 animate-in slide-in-from-left duration-300">
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl"><ImageIcon size={24}/></div>
                  <h3 className="text-xl font-black text-slate-900">ছবিসহ নোটিশ পোস্ট করুন</h3>
               </div>
               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase px-2">নোটিশ টাইটেল</label>
                    <input 
                      type="text" 
                      value={noticeTitle}
                      onChange={(e) => setNoticeTitle(e.target.value)}
                      placeholder="যেমন: ১০% বোনাস অফার!"
                      className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl font-bold outline-none focus:bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase px-2">নোটিশ কন্টেন্ট</label>
                    <textarea 
                      value={noticeContent}
                      onChange={(e) => setNoticeContent(e.target.value)}
                      placeholder="বিস্তারিত এখানে লিখুন..."
                      className="w-full bg-slate-50 border border-slate-100 p-6 rounded-[32px] font-bold h-32 outline-none focus:bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase px-2">ছবি আপলোড (অপশনাল)</label>
                    <div 
                      onClick={() => document.getElementById('notice-img')?.click()}
                      className="w-full h-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all overflow-hidden"
                    >
                      {noticeImage ? (
                        <img src={noticeImage} className="w-full h-full object-cover" alt="Upload" />
                      ) : (
                        <>
                          <Camera className="text-slate-300 mb-2" size={32}/>
                          <p className="text-[10px] font-black text-slate-400 uppercase">ক্লিক করে ছবি নির্বাচন করুন</p>
                        </>
                      )}
                    </div>
                    <input type="file" id="notice-img" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </div>
                  <button 
                    onClick={handleSaveNotice}
                    disabled={isSaving}
                    className="w-full bg-blue-600 text-white py-6 rounded-[32px] font-black text-lg shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
                  >
                    {isSaving ? <Loader2 className="animate-spin" /> : <><Send size={20}/> পোস্ট পাবলিশ করুন</>}
                  </button>
               </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
           <h4 className="font-black text-slate-900 text-lg flex items-center gap-2 px-2">সক্রিয় আইটেমসমূহ</h4>
           <div className="space-y-4 max-h-[700px] overflow-y-auto no-scrollbar pr-1">
              {activeTab === 'poll' ? (
                polls.map(p => (
                  <div key={p.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group">
                     <div className="flex justify-between items-start mb-4">
                        <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center"><BarChart3 size={16}/></div>
                        <button onClick={() => setDeleteConfirm({show: true, type: 'poll', id: p.id, title: p.question})} className="p-2 text-rose-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                     </div>
                     <p className="font-black text-slate-800 text-sm leading-tight mb-2">{p.question}</p>
                     <p className="text-[10px] text-slate-400 font-bold uppercase">{p.votedBy?.length || 0} ভোট পড়েছে</p>
                  </div>
                ))
              ) : (
                notices.map(n => (
                  <div key={n.id} className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm group overflow-hidden">
                     {n.image && <img src={n.image} className="w-full h-24 object-cover rounded-2xl mb-4" alt="Notice" />}
                     <div className="flex justify-between items-start mb-2">
                        <h5 className="font-black text-slate-900 text-sm">{n.title}</h5>
                        <button onClick={() => setDeleteConfirm({show: true, type: 'notice', id: n.id, title: n.title})} className="p-2 text-rose-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                     </div>
                     <p className="text-[10px] text-slate-500 line-clamp-2">{n.content}</p>
                  </div>
                ))
              )}
              {(activeTab === 'poll' ? polls : notices).length === 0 && (
                <div className="p-10 text-center opacity-30">
                   <p className="text-[10px] font-black uppercase tracking-widest">খালি রয়েছে</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default HomeManagement;
