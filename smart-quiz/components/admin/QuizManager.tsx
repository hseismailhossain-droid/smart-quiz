
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, BookOpen, Star, Zap, Image as ImageIcon, Video, X, ChevronRight, LayoutGrid, FileText, Clock, Calendar, Sparkles, Eye, CheckCircle2, Info, Edit3, Save, RotateCcw, PenTool, Pencil, FileCode, CheckSquare } from 'lucide-react';
import { db } from '../../services/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, doc, deleteDoc, limit, updateDoc } from 'firebase/firestore';
import { SUBJECTS } from '../../constants';
import { Question, ExamCategory } from '../../types';

const QuizManager: React.FC<{ onDeleteQuiz: any }> = ({ onDeleteQuiz }) => {
  const [activeMode, setActiveMode] = useState<'create' | 'list'>('create');
  const [quizType, setQuizType] = useState<'mock' | 'paid' | 'live' | 'lesson' | 'special'>('mock');
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkJson, setBulkJson] = useState('');

  // General States
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [dynamicCategories, setDynamicCategories] = useState<ExamCategory[]>([]);
  
  // Subject States (New: Custom Subject Support)
  const [subject, setSubject] = useState(SUBJECTS[0].title);
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [customSubjectName, setCustomSubjectName] = useState('');

  // Date/Time States
  const [duration, setDuration] = useState('15');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [prizePool, setPrizePool] = useState('100');
  const [entryFee, setEntryFee] = useState('10');
  
  // Lesson Specific
  const [lessonContent, setLessonContent] = useState('');
  const [lessonMediaUrl, setLessonMediaUrl] = useState('');
  const [lessonMediaType, setLessonMediaType] = useState<'image' | 'video' | 'none'>('none');

  // Question Builder States
  const [manualQuestions, setManualQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState('');
  const [opts, setOpts] = useState(['', '', '', '']);
  const [correctIdx, setCorrectIdx] = useState<number | null>(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'none'>('none');
  const [explanation, setExplanation] = useState('');

  const [quizzes, setQuizzes] = useState<any[]>([]);

  useEffect(() => {
    const unsubCats = onSnapshot(query(collection(db, 'exam_categories'), orderBy('timestamp', 'asc')), (s) => {
      setDynamicCategories(s.docs.map(d => ({ id: d.id, ...d.data() } as ExamCategory)));
    });

    const colName = 
      quizType === 'paid' ? 'paid_quizzes' : 
      quizType === 'live' ? 'live_quizzes' : 
      quizType === 'special' ? 'admin_special_quizzes' : 
      quizType === 'lesson' ? 'lessons' : 'mock_quizzes';

    const unsubList = onSnapshot(query(collection(db, colName), orderBy('timestamp', 'desc'), limit(30)), (s) => {
      setQuizzes(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubCats(); unsubList(); };
  }, [quizType]);

  const addQuestionToList = () => {
    if (!currentQ.trim() || opts.some(o => !o.trim()) || correctIdx === null) return alert("সবগুলো ফিল্ড সঠিকভাবে পূরণ করুন!");
    const newQ: Question = { 
      question: currentQ.trim(), 
      options: [...opts], 
      correctAnswer: correctIdx,
      explanation: explanation.trim() || undefined,
      mediaUrl: mediaUrl.trim() || undefined,
      mediaType: mediaUrl.trim() ? mediaType : 'none'
    };
    setManualQuestions([...manualQuestions, newQ]);
    setCurrentQ(''); setOpts(['', '', '', '']); setCorrectIdx(null); setMediaUrl(''); setMediaType('none'); setExplanation('');
  };

  const resetEditor = () => {
    setTitle('');
    setManualQuestions([]);
    setLessonContent('');
    setLessonMediaUrl('');
    setLessonMediaType('none');
    setEditingId(null);
    setDuration('15');
    setPrizePool('100');
    setEntryFee('10');
    setStartTime('');
    setEndTime('');
    setIsCustomSubject(false);
    setCustomSubjectName('');
    setCurrentQ(''); setOpts(['', '', '', '']); setCorrectIdx(null); setMediaUrl(''); setMediaType('none'); setExplanation('');
  };

  const handleEditInit = (item: any) => {
    setEditingId(item.id);
    setTitle(item.title || '');
    setSelectedCategory(item.category || '');
    
    if (quizType === 'lesson') {
      setLessonContent(item.content || '');
      setLessonMediaUrl(item.mediaUrl || '');
      setLessonMediaType(item.mediaType || 'none');
    } else {
      const existingSubject = SUBJECTS.find(s => s.title === item.subject);
      if (existingSubject) {
        setSubject(item.subject);
        setIsCustomSubject(false);
      } else {
        setIsCustomSubject(true);
        setCustomSubjectName(item.subject || '');
      }
      setDuration(String(item.duration || '15'));
      setManualQuestions(item.manualQuestions || []);
      setPrizePool(String(item.prizePool || '100'));
      setEntryFee(String(item.entryFee || '10'));
      setStartTime(item.startTime || '');
      setEndTime(item.endTime || '');
    }

    setSelectedDetail(null);
    setActiveMode('create');
  };

  const handlePublish = async () => {
    if (!title.trim()) return alert("টাইটেল দিন।");
    if (quizType === 'lesson' && !lessonContent.trim()) return alert("লিসন কন্টেন্ট দিন।");
    if (quizType !== 'lesson' && manualQuestions.length === 0) return alert("অন্তত একটি প্রশ্ন যোগ করুন।");

    const finalSubject = isCustomSubject ? customSubjectName.trim() : subject;
    
    setIsPublishing(true);
    const colName = 
      quizType === 'paid' ? 'paid_quizzes' : 
      quizType === 'live' ? 'live_quizzes' : 
      quizType === 'special' ? 'admin_special_quizzes' : 
      quizType === 'lesson' ? 'lessons' : 'mock_quizzes';

    try {
      const data: any = {
        title,
        updatedAt: serverTimestamp()
      };

      if (quizType === 'lesson') {
        data.content = lessonContent;
        data.category = selectedCategory;
        data.mediaUrl = lessonMediaUrl.trim() || null;
        data.mediaType = lessonMediaUrl.trim() ? lessonMediaType : 'none';
      } else {
        data.category = selectedCategory;
        data.subject = finalSubject;
        data.duration = Number(duration);
        data.manualQuestions = manualQuestions;
        data.questionsCount = manualQuestions.length;
        data.status = 'active';

        if (quizType === 'paid' || quizType === 'live' || quizType === 'special') {
          data.startTime = startTime || null;
          data.endTime = endTime || null;
          data.prizePool = Number(prizePool);
          data.entryFee = Number(entryFee);
        }
      }

      if (editingId) {
        await updateDoc(doc(db, colName, editingId), data);
        alert("সফলভাবে আপডেট হয়েছে!");
      } else {
        data.timestamp = serverTimestamp();
        await addDoc(collection(db, colName), data);
        alert("সফলভাবে পাবলিশ হয়েছে!");
      }
      
      resetEditor();
      setActiveMode('list');
    } catch (e) { 
      alert("অ্যাকশন ব্যর্থ হয়েছে!"); 
    } finally { 
      setIsPublishing(false); 
    }
  };

  return (
    <div className="space-y-8 pb-24 font-['Hind_Siliguri'] max-w-5xl mx-auto">
      {/* Type Selector */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 mb-8">
        <label className="text-[10px] font-black text-slate-400 uppercase px-2 mb-4 block">কন্টেন্ট টাইপ</label>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'mock', label: 'মক কুইজ', icon: <PenTool size={16}/> },
            { id: 'paid', label: 'পেইড কুইজ', icon: <Zap size={16}/> },
            { id: 'live', label: 'লাইভ এক্সাম', icon: <Clock size={16}/> },
            { id: 'lesson', label: 'লিসন', icon: <FileText size={16}/> },
            { id: 'special', label: 'স্পেশাল', icon: <Star size={16}/> },
          ].map(type => (
            <button 
              key={type.id} 
              onClick={() => { setQuizType(type.id as any); resetEditor(); setActiveMode('list'); }}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs transition-all ${quizType === type.id ? 'bg-slate-900 text-white shadow-xl' : 'bg-white border border-slate-100 text-slate-400 hover:border-slate-300'}`}
            >
              {type.icon} {type.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center gap-6 px-4">
        <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
           {editingId ? <Pencil size={28}/> : <Plus size={28}/>}
           {editingId ? 'এডিট করুন' : 'নতুন যোগ করুন'}
        </h2>
        <div className="flex bg-slate-100 p-1.5 rounded-[22px]">
          <button onClick={() => { setActiveMode('create'); }} className={`px-10 py-3 rounded-[18px] font-black text-sm transition-all ${activeMode === 'create' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500'}`}>তৈরি</button>
          <button onClick={() => { setActiveMode('list'); resetEditor(); }} className={`px-10 py-3 rounded-[18px] font-black text-sm transition-all ${activeMode === 'list' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500'}`}>ম্যানেজ</button>
        </div>
      </div>

      {activeMode === 'create' ? (
        <div className="space-y-8 px-4 animate-in fade-in duration-500">
          <div className="bg-white p-10 rounded-[44px] shadow-sm border border-slate-100 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase px-2">টাইটেল (Title)</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="যেমন: বিসিএস স্পেশাল কুইজ" className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-bold focus:bg-white border border-slate-100 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase px-2">কার্ড ক্যাটাগরি (Category)</label>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full bg-slate-50 p-5 rounded-2xl font-bold outline-none border border-slate-100">
                  <option value="">সিলেক্ট করুন</option>
                  {dynamicCategories.map(c => <option key={c.id} value={c.label}>{c.label}</option>)}
                </select>
              </div>
            </div>

            {quizType !== 'lesson' && (
              <div className="space-y-6 bg-indigo-50/30 p-8 rounded-[36px] border border-indigo-100">
                 <div className="flex items-center justify-between mb-4">
                    <label className="text-[10px] font-black text-indigo-400 uppercase px-2">সাবজেক্ট ম্যানেজমেন্ট</label>
                    <button 
                      onClick={() => setIsCustomSubject(!isCustomSubject)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] transition-all ${isCustomSubject ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-indigo-600 border border-indigo-200'}`}
                    >
                       <CheckSquare size={14}/> কাস্টম সাবজেক্ট লিখুন
                    </button>
                 </div>
                 
                 {isCustomSubject ? (
                   <div className="animate-in slide-in-from-top-2">
                     <input 
                       type="text" 
                       value={customSubjectName} 
                       onChange={(e) => setCustomSubjectName(e.target.value)} 
                       placeholder="সাবজেক্টের নাম লিখুন..." 
                       className="w-full bg-white p-5 rounded-2xl outline-none font-bold border border-indigo-200 shadow-sm"
                     />
                   </div>
                 ) : (
                   <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-white p-5 rounded-2xl font-bold outline-none border border-indigo-100 shadow-sm">
                      {SUBJECTS.map(s => <option key={s.id} value={s.title}>{s.title}</option>)}
                   </select>
                 )}
              </div>
            )}

            {quizType === 'lesson' ? (
              <div className="space-y-4 animate-in slide-in-from-bottom-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase px-2">লিসন কন্টেন্ট</label>
                    <textarea 
                      value={lessonContent} 
                      onChange={(e) => setLessonContent(e.target.value)} 
                      placeholder="এখানে বিস্তারিত পড়ার বিষয়বস্তু লিখুন..."
                      className="w-full h-80 bg-slate-50 p-8 rounded-[36px] font-bold outline-none focus:bg-white shadow-inner leading-relaxed"
                    />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase px-2">মিডিয়া লিঙ্ক (URL)</label>
                       <input type="text" value={lessonMediaUrl} onChange={(e) => setLessonMediaUrl(e.target.value)} placeholder="https://..." className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-bold border border-slate-100" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase px-2">মিডিয়া টাইপ</label>
                       <select value={lessonMediaType} onChange={(e) => setLessonMediaType(e.target.value as any)} className="w-full bg-slate-50 p-5 rounded-2xl font-bold outline-none border border-slate-100">
                         <option value="none">নেই</option>
                         <option value="image">ছবি</option>
                         <option value="video">ভিডিও</option>
                       </select>
                    </div>
                 </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t pt-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase px-2 flex items-center gap-2"><Clock size={12}/> কুইজ স্থায়িত্ব (মিনিট)</label>
                      <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full bg-slate-50 p-5 rounded-2xl font-black outline-none border border-slate-100 focus:bg-white" />
                   </div>
                   
                   {(quizType === 'paid' || quizType === 'special' || quizType === 'live') && (
                     <>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase px-2 flex items-center gap-2"><Calendar size={12}/> শুরু (Start Time)</label>
                          <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full bg-slate-50 p-5 rounded-2xl font-bold outline-none border border-slate-100" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase px-2 flex items-center gap-2"><Calendar size={12}/> শেষ (End Time)</label>
                          <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full bg-slate-50 p-5 rounded-2xl font-bold outline-none border border-slate-100" />
                        </div>
                     </>
                   )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                   {(quizType === 'paid' || quizType === 'special' || quizType === 'live') && (
                     <>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase px-2">পুরস্কারের পরিমাণ (৳)</label>
                          <input type="number" value={prizePool} onChange={(e) => setPrizePool(e.target.value)} className="w-full bg-emerald-50 text-emerald-900 p-5 rounded-2xl font-black outline-none border border-emerald-100" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase px-2">এন্ট্রি ফি (৳)</label>
                          <input type="number" value={entryFee} onChange={(e) => setEntryFee(e.target.value)} className="w-full bg-rose-50 text-rose-900 p-5 rounded-2xl font-black outline-none border border-rose-100" />
                        </div>
                     </>
                   )}
                </div>

                <div id="question-builder" className="pt-10 border-t border-slate-50">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                       <LayoutGrid className="text-indigo-600" /> প্রশ্ন যোগ করুন ({manualQuestions.length})
                    </h3>
                    <button onClick={() => setShowBulkModal(true)} className="px-6 py-2.5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 shadow-lg active:scale-90 transition-all">
                      <FileCode size={16}/> বাল্ক JSON
                    </button>
                  </div>
                  
                  <div className="space-y-6 bg-slate-50 p-8 rounded-[44px] border border-slate-100">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase px-2">প্রশ্নের টেক্সট</label>
                       <textarea value={currentQ} onChange={(e) => setCurrentQ(e.target.value)} placeholder="এখানে প্রশ্নটি লিখুন..." className="w-full bg-white p-6 rounded-3xl font-bold outline-none h-24 shadow-sm border border-transparent focus:border-indigo-200" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {opts.map((o, i) => (
                        <div key={i} className={`flex items-center gap-3 p-3 bg-white rounded-2xl border-2 transition-all ${correctIdx === i ? 'border-emerald-500 shadow-md' : 'border-transparent'}`}>
                          <button 
                            onClick={() => setCorrectIdx(i)} 
                            className={`w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center transition-all ${correctIdx === i ? 'bg-emerald-500 text-white rotate-6' : 'bg-slate-100 text-slate-400'}`}
                          >
                             {i+1}
                          </button>
                          <input type="text" value={o} onChange={(e) => { const n = [...opts]; n[i] = e.target.value; setOpts(n); }} placeholder={`অপশন ${i+1}`} className="flex-grow p-2 outline-none font-bold text-sm bg-transparent" />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase px-2">ব্যাখ্যা (Explanation)</label>
                       <input type="text" value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="সঠিক উত্তরের কারণ..." className="w-full bg-white p-4 rounded-2xl font-bold shadow-sm outline-none border border-transparent focus:border-indigo-100" />
                    </div>

                    <button onClick={addQuestionToList} className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-sm uppercase shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">তালিকায় যোগ করুন</button>
                  </div>
                  
                  {manualQuestions.length > 0 && (
                    <div className="mt-8 space-y-3">
                       <div className="max-h-60 overflow-y-auto no-scrollbar space-y-2">
                          {manualQuestions.map((q, idx) => (
                            <div key={idx} className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center border border-slate-100">
                               <div className="flex gap-3 items-center">
                                  <span className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-black">{idx+1}</span>
                                  <p className="text-xs font-bold text-slate-700 truncate max-w-[250px]">{q.question}</p>
                               </div>
                               <button onClick={() => setManualQuestions(manualQuestions.filter((_, i) => i !== idx))} className="text-rose-500 p-2"><Trash2 size={16}/></button>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="pt-6">
               <button onClick={handlePublish} disabled={isPublishing} className="w-full py-6 bg-slate-900 text-white rounded-[32px] font-black text-xl shadow-2xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-4">
                 {isPublishing ? <Loader2 className="animate-spin" /> : editingId ? <><Save size={24}/> আপডেট করুন</> : <><Sparkles size={24}/> পাবলিশ করুন</>}
               </button>
               {editingId && <button onClick={resetEditor} className="w-full py-4 text-slate-400 font-black text-sm uppercase mt-2">বাতিল করুন</button>}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 animate-in fade-in duration-500">
          {quizzes.map((q) => (
            <div key={q.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-xl hover:translate-y-[-4px] transition-all group">
              <div>
                <div className="flex justify-between items-start mb-4">
                   <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{quizType}</span>
                   </div>
                   {(q.startTime) && (
                     <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl border border-indigo-100">
                        <Calendar size={12}/>
                        <span className="text-[9px] font-black">{new Date(q.startTime).toLocaleDateString('bn-BD')}</span>
                     </div>
                   )}
                </div>
                <h5 className="font-black text-slate-800 text-xl leading-tight line-clamp-2 mb-2">{q.title}</h5>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <LayoutGrid size={12}/> {q.category} • {q.subject}
                </p>
                {q.duration && (
                   <p className="text-[10px] font-bold text-emerald-600 mt-2 flex items-center gap-2">
                      <Clock size={12}/> স্থায়িত্ব: {q.duration} মিনিট
                   </p>
                )}
              </div>
              <div className="flex gap-2 mt-8">
                <button onClick={() => setSelectedDetail(q)} className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors">বিস্তারিত</button>
                <button onClick={() => handleEditInit(q)} className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm"><Edit3 size={20}/></button>
                <button onClick={() => onDeleteQuiz(q.id, quizType)} className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"><Trash2 size={20}/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bulk JSON Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[5000] flex items-center justify-center p-6 font-['Hind_Siliguri']">
           <div className="bg-white w-full max-w-2xl rounded-[50px] p-10 shadow-2xl animate-in zoom-in-95 duration-200 relative">
              <button onClick={() => setShowBulkModal(false)} className="absolute top-10 right-10 p-2 bg-slate-50 text-slate-400 rounded-full hover:text-rose-500 transition-all"><X size={24}/></button>
              <h3 className="text-2xl font-black text-slate-900 mb-6">বাল্ক JSON আপলোড</h3>
              <textarea 
                value={bulkJson}
                onChange={(e) => setBulkJson(e.target.value)}
                placeholder='[{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0}]'
                className="w-full h-80 bg-slate-50 p-8 rounded-[40px] font-mono text-xs outline-none border border-slate-100 focus:bg-white transition-all"
              />
              <button onClick={() => {
                try {
                  const parsed = JSON.parse(bulkJson);
                  setManualQuestions([...manualQuestions, ...parsed]);
                  setShowBulkModal(false);
                  setBulkJson('');
                } catch(e) { alert("Invalid JSON format"); }
              }} className="w-full bg-emerald-700 text-white py-6 rounded-[28px] font-black text-lg mt-6 shadow-xl active:scale-95 transition-all">ইম্পোর্ট করুন</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default QuizManager;
