
import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Loader2, ListOrdered, BookOpen, Clock, Calendar, ChevronRight, Zap, Coins, Target, Star, AlertTriangle, X, FileText, LayoutGrid, RefreshCw, ArrowRight, Edit3, FileJson, CopyPlus, Gift, Timer } from 'lucide-react';
import { db } from '../../services/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { SUBJECTS } from '../../constants';
import { Question, ExamCategory } from '../../types';

interface QuizManagerProps {
  onDeleteQuiz: (id: string, type: 'mock' | 'live' | 'paid' | 'lesson' | 'special') => void;
}

const QuizManager: React.FC<QuizManagerProps> = ({ onDeleteQuiz }) => {
  const [activeMode, setActiveMode] = useState<'single' | 'manage'>('single');
  const [quizType, setQuizType] = useState<'mock' | 'live' | 'paid' | 'special' | 'lesson'>('mock');
  const [isPublishing, setIsPublishing] = useState(false);

  // States
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [dynamicCategories, setDynamicCategories] = useState<ExamCategory[]>([]);
  const [subject, setSubject] = useState(SUBJECTS[0].title);
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [customSubjectName, setCustomSubjectName] = useState('');
  
  const [entryFee, setEntryFee] = useState('20');
  const [prizePool, setPrizePool] = useState('100');
  const [duration, setDuration] = useState('15');
  
  // Date & Time States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Lesson Content State
  const [lessonContent, setLessonContent] = useState('');
  
  // Question States
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [manualQuestions, setManualQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState('');
  const [opts, setOpts] = useState(['', '', '', '']);
  const [correctIdx, setCorrectIdx] = useState<number | null>(null);

  const [quizzes, setQuizzes] = useState<any>({ mock: [], live: [], paid: [], special: [], lessons: [] });
  const [isLoadingList, setIsLoadingList] = useState(true);

  useEffect(() => {
    const unsubCats = onSnapshot(query(collection(db, 'exam_categories'), orderBy('timestamp', 'asc')), (s) => {
      setDynamicCategories(s.docs.map(d => ({ id: d.id, ...d.data() } as ExamCategory)));
    });
    const unsubMock = onSnapshot(query(collection(db, 'mock_quizzes'), orderBy('timestamp', 'desc')), (s) => setQuizzes((p: any) => ({ ...p, mock: s.docs.map(d => ({ id: d.id, ...d.data() })) })));
    const unsubLive = onSnapshot(query(collection(db, 'live_quizzes'), orderBy('timestamp', 'desc')), (s) => setQuizzes((p: any) => ({ ...p, live: s.docs.map(d => ({ id: d.id, ...d.data() })) })));
    const unsubPaid = onSnapshot(query(collection(db, 'paid_quizzes'), orderBy('timestamp', 'desc')), (s) => setQuizzes((p: any) => ({ ...p, paid: s.docs.map(d => ({ id: d.id, ...d.data() })) })));
    const unsubSpecial = onSnapshot(query(collection(db, 'admin_special_quizzes'), orderBy('timestamp', 'desc')), (s) => setQuizzes((p: any) => ({ ...p, special: s.docs.map(d => ({ id: d.id, ...d.data() })) })));
    const unsubLessons = onSnapshot(query(collection(db, 'lessons'), orderBy('timestamp', 'desc')), (s) => {
      setQuizzes((p: any) => ({ ...p, lessons: s.docs.map(d => ({ id: d.id, ...d.data() })) }));
      setIsLoadingList(false);
    });
    return () => { unsubCats(); unsubMock(); unsubLive(); unsubPaid(); unsubSpecial(); unsubLessons(); };
  }, []);

  const addQuestionToList = () => {
    if (!currentQ.trim() || opts.some(o => !o.trim()) || correctIdx === null) return alert("সবগুলো ফিল্ড সঠিকভাবে পূরণ করুন!");
    const newQ: Question = { question: currentQ.trim(), options: [...opts], correctAnswer: correctIdx };
    setManualQuestions([...manualQuestions, newQ]);
    setCurrentQ(''); setOpts(['', '', '', '']); setCorrectIdx(null);
  };

  const handlePublish = async () => {
    if (!title.trim() || !selectedCategory) return alert("টাইটেল এবং ক্যাটাগরি অবশ্যই দিন।");
    if (quizType !== 'lesson' && manualQuestions.length === 0) return alert("অন্তত একটি প্রশ্ন যোগ করুন।");
    if (quizType === 'lesson' && !lessonContent.trim()) return alert("লিসন কন্টেন্ট লিখুন।");
    
    setIsPublishing(true);
    try {
      const finalSubject = isCustomSubject ? customSubjectName.trim() : subject;
      const collectionName = 
        quizType === 'paid' ? 'paid_quizzes' : 
        quizType === 'live' ? 'live_quizzes' : 
        quizType === 'lesson' ? 'lessons' :
        quizType === 'special' ? 'admin_special_quizzes' : 'mock_quizzes';
      
      const data: any = {
        title: title.trim(),
        category: selectedCategory,
        subject: finalSubject,
        timestamp: serverTimestamp(),
        startDate: startDate || null,
        endDate: endDate || null
      };

      if (quizType === 'lesson') {
        data.content = lessonContent.trim();
      } else {
        data.durationMinutes = parseInt(duration);
        data.questionsCount = manualQuestions.length;
        data.manualQuestions = manualQuestions;
        data.status = 'active';
        if (quizType === 'paid') {
          data.entryFee = parseInt(entryFee);
          data.prizePool = parseInt(prizePool);
        }
      }

      await addDoc(collection(db, collectionName), data);
      alert("সফলভাবে পাবলিশ হয়েছে!");
      setTitle(''); setManualQuestions([]); setLessonContent(''); setActiveMode('manage');
    } catch (e) {
      alert("পাবলিশ ব্যর্থ হয়েছে।");
    } finally { setIsPublishing(false); }
  };

  return (
    <div className="space-y-10 pb-20 font-['Hind_Siliguri']">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-3xl font-black text-slate-900 leading-tight">কুইজ ও লিসন মাস্টার</h2>
           <p className="text-slate-400 font-bold text-sm">নতুন কন্টেন্ট তৈরি ও সময় নির্ধারণ করুন</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border shadow-sm">
          <button onClick={() => setActiveMode('single')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeMode === 'single' ? 'bg-emerald-700 text-white shadow-lg' : 'text-slate-400'}`}>তৈরি করুন</button>
          <button onClick={() => setActiveMode('manage')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeMode === 'manage' ? 'bg-emerald-700 text-white shadow-lg' : 'text-slate-400'}`}>ম্যানেজ</button>
        </div>
      </div>

      {activeMode === 'single' ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="bg-white p-8 rounded-[44px] border border-slate-100 shadow-sm space-y-8">
             <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {[
                  { id: 'mock', label: 'মক কুইজ', icon: <Target size={14}/> },
                  { id: 'paid', label: 'পেইড কন্টেস্ট', icon: <Coins size={14}/> },
                  { id: 'live', label: 'লাইভ ইভেন্ট', icon: <Zap size={14}/> },
                  { id: 'lesson', label: 'নতুন লিসন', icon: <BookOpen size={14}/> },
                  { id: 'special', label: 'স্পেশাল কুইজ', icon: <Star size={14}/> }
                ].map(t => (
                  <button 
                    key={t.id} 
                    onClick={() => setQuizType(t.id as any)} 
                    className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase border transition-all flex items-center gap-2 whitespace-nowrap ${quizType === t.id ? 'bg-emerald-700 text-white shadow-lg' : 'bg-white text-slate-400 hover:border-emerald-200'}`}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase px-2">টাইটেল / নাম</label>
                   <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="যেমন: বিসিএস মডেল টেস্ট" className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-black border border-slate-100 focus:bg-white" />
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-emerald-700 uppercase px-2">মেইন ক্যাটাগরি কার্ড</label>
                   <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full p-5 rounded-2xl font-black border border-slate-100 bg-slate-50 outline-none">
                     <option value="">কার্ড পছন্দ করুন</option>
                     {dynamicCategories.map(cat => <option key={cat.id} value={cat.label}>{cat.label}</option>)}
                   </select>
                </div>

                <div className="space-y-2">
                   <div className="flex justify-between items-center px-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase">বিষয় (Subject)</label>
                      <button onClick={() => setIsCustomSubject(!isCustomSubject)} className="text-[9px] font-black text-emerald-600 uppercase">{isCustomSubject ? 'সিলেক্ট করুন' : 'EXTRA বিষয় লিখুন'}</button>
                   </div>
                   {isCustomSubject ? (
                     <input type="text" value={customSubjectName} onChange={(e) => setCustomSubjectName(e.target.value)} placeholder="নতুন বিষয়ের নাম লিখুন..." className="w-full bg-emerald-50 p-5 rounded-2xl outline-none font-black border border-emerald-100 focus:bg-white" />
                   ) : (
                     <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full p-5 rounded-2xl font-black border border-slate-100 bg-slate-50 outline-none">
                       {SUBJECTS.map(s => <option key={s.id} value={s.title}>{s.title}</option>)}
                     </select>
                   )}
                </div>

                {quizType !== 'lesson' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase px-2">সময়কাল (মিনিট)</label>
                    <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-black border border-slate-100 focus:bg-white" />
                  </div>
                )}

                {quizType === 'paid' && (
                  <>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-amber-600 uppercase px-2">এন্ট্রি ফি (৳)</label>
                       <input type="number" value={entryFee} onChange={(e) => setEntryFee(e.target.value)} className="w-full bg-amber-50 p-5 rounded-2xl outline-none font-black border border-amber-100" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-emerald-600 uppercase px-2">পুরস্কারের পরিমাণ (৳)</label>
                       <input type="number" value={prizePool} onChange={(e) => setPrizePool(e.target.value)} className="w-full bg-emerald-50 p-5 rounded-2xl outline-none font-black border border-emerald-100" />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-rose-600 uppercase px-2">শুরু হওয়ার সময় (Start Date & Time)</label>
                   <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-black border border-slate-100" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase px-2">শেষ হওয়ার সময় (End Date & Time)</label>
                   <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-black border border-slate-100" />
                </div>
             </div>
          </div>

          {quizType === 'lesson' ? (
            <div className="bg-white p-8 rounded-[44px] border border-slate-100 shadow-sm space-y-4">
               <h3 className="font-black text-lg flex items-center gap-3 text-slate-800"><FileText className="text-emerald-700" size={24} /> লিসন কন্টেন্ট</h3>
               <textarea value={lessonContent} onChange={(e) => setLessonContent(e.target.value)} className="w-full h-64 bg-slate-50 p-6 rounded-[32px] font-bold border border-slate-100 outline-none focus:bg-white leading-relaxed" placeholder="এখানে লিসনের বিস্তারিত কন্টেন্ট লিখুন..." />
               <button onClick={handlePublish} disabled={isPublishing} className="w-full py-6 bg-emerald-700 text-white rounded-[32px] font-black text-lg shadow-xl active:scale-95 transition-all">
                  {isPublishing ? <Loader2 className="animate-spin" /> : 'লিসন পাবলিশ করুন'}
               </button>
            </div>
          ) : (
            <>
              <div className="bg-white p-8 rounded-[44px] border border-slate-100 shadow-sm space-y-6">
                 <div className="flex justify-between items-center">
                    <h3 className="font-black text-lg flex items-center gap-3 text-slate-800"><Plus className="text-emerald-700" size={24} /> প্রশ্ন যুক্ত করুন</h3>
                    <button onClick={() => setIsBulkMode(!isBulkMode)} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${isBulkMode ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                      {isBulkMode ? 'ক্যানসেল' : 'বাল্ক আপলোড'}
                    </button>
                 </div>

                 {isBulkMode ? (
                   <div className="space-y-4">
                      <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} className="w-full h-48 bg-slate-50 p-6 rounded-[24px] font-mono text-xs border border-slate-100" placeholder='[{"question": "Example?", "options": ["A", "B", "C", "D"], "correctAnswer": 0}]'/>
                      <button onClick={() => { try { setManualQuestions([...manualQuestions, ...JSON.parse(bulkText)]); setBulkText(''); setIsBulkMode(false); } catch(e) { alert('ভুল JSON ফরম্যাট!'); } }} className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black">বাল্ক ডাটা ইমপোর্ট করুন</button>
                   </div>
                 ) : (
                   <div className="space-y-6">
                      <textarea value={currentQ} onChange={(e) => setCurrentQ(e.target.value)} className="w-full bg-slate-50 p-6 rounded-[24px] font-bold border border-slate-100 h-28 outline-none focus:bg-white shadow-inner" placeholder="প্রশ্ন লিখুন..." />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {opts.map((opt, i) => (
                            <div key={i} className="flex gap-3">
                              <button onClick={() => setCorrectIdx(i)} className={`w-14 h-14 rounded-2xl border-2 font-black transition-all ${correctIdx === i ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-300 border-slate-100'}`}>{i+1}</button>
                              <input type="text" value={opt} onChange={(e) => { const n = [...opts]; n[i] = e.target.value; setOpts(n); }} placeholder={`অপশন ${i+1}`} className="flex-grow bg-slate-50 p-4 rounded-2xl font-bold border border-slate-100 outline-none" />
                            </div>
                          ))}
                      </div>
                      <button onClick={addQuestionToList} className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"><Plus size={22} /> লিস্টে যোগ করুন</button>
                   </div>
                 )}
              </div>

              {manualQuestions.length > 0 && (
                <div className="bg-slate-900 p-8 rounded-[44px] shadow-2xl space-y-8 relative overflow-hidden">
                   <div className="flex justify-between items-center relative z-10">
                      <h3 className="font-black text-white text-xl">প্রশ্ন লিস্ট ({manualQuestions.length})</h3>
                      <button onClick={handlePublish} disabled={isPublishing} className="px-10 py-4 bg-emerald-500 text-white rounded-[20px] font-black flex items-center gap-3 shadow-xl active:scale-95 transition-all">
                        {isPublishing ? <Loader2 className="animate-spin" /> : <><Save size={20} /> কুইজ পাবলিশ করুন</>}
                      </button>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                      {manualQuestions.map((q, i) => (
                        <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center">
                          <span className="text-white text-xs font-bold truncate pr-4">{i+1}. {q.question}</span>
                          <button onClick={() => setManualQuestions(manualQuestions.filter((_, idx) => idx !== i))} className="text-rose-400 p-1 hover:bg-rose-500/10 rounded-lg"><Trash2 size={14}/></button>
                        </div>
                      ))}
                   </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
          {isLoadingList ? (
            <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-emerald-700" /></div>
          ) : (
            <>
              {Object.entries(quizzes).map(([type, list]: any) => (
                <div key={type} className="space-y-4 mb-10">
                  <h3 className="flex items-center gap-2 font-black text-slate-800 text-sm uppercase tracking-widest px-2">
                    {type.toUpperCase()} ({list.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {list.map((item: any) => (
                      <div key={item.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-emerald-700">
                              {type === 'lessons' ? <BookOpen size={20}/> : item.questionsCount}
                            </div>
                            <div>
                              <h4 className="font-black text-slate-900 text-sm leading-tight mb-1">{item.title}</h4>
                              <p className="text-[9px] text-emerald-600 font-black uppercase bg-emerald-50 px-2 py-0.5 rounded-md inline-block">{item.category}</p>
                              {item.startDate && <p className="text-[8px] text-rose-500 font-black mt-1">Starts: {new Date(item.startDate).toLocaleString('bn-BD')}</p>}
                            </div>
                          </div>
                          <button onClick={() => onDeleteQuiz(item.id, type.slice(0, -1) as any)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizManager;
