
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, BookOpen, Star, Zap, Image as ImageIcon, Video, X, ChevronRight, LayoutGrid, FileText, Clock, Calendar, Sparkles, Eye, CheckCircle2, Info, Edit3, Save, RotateCcw, PenTool, Pencil, FileCode } from 'lucide-react';
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
  
  // Subject States
  const [subject, setSubject] = useState(SUBJECTS[0].title);
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [customSubjectName, setCustomSubjectName] = useState('');

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

  const handleBulkUpload = () => {
    try {
      const parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed)) throw new Error("JSON must be an array");
      
      const validated: Question[] = parsed.map(q => ({
        question: q.question || "Untitled Question",
        options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ["Option 1", "Option 2", "Option 3", "Option 4"],
        correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
        explanation: q.explanation || "",
        mediaUrl: q.mediaUrl || "",
        mediaType: q.mediaType || "none"
      }));

      setManualQuestions([...manualQuestions, ...validated]);
      setBulkJson('');
      setShowBulkModal(false);
      alert(`${validated.length}টি প্রশ্ন সফলভাবে যোগ হয়েছে!`);
    } catch (e) {
      alert("JSON ফরম্যাট সঠিক নয়! উদাহরণ: [{question: '...', options: ['...', ...], correctAnswer: 0}]");
    }
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditSpecificQuestion = (quiz: any, qIdx: number) => {
    handleEditInit(quiz);
    const targetQ = quiz.manualQuestions[qIdx];
    setCurrentQ(targetQ.question);
    setOpts([...targetQ.options]);
    setCorrectIdx(targetQ.correctAnswer);
    setExplanation(targetQ.explanation || '');
    setMediaUrl(targetQ.mediaUrl || '');
    setMediaType(targetQ.mediaType || 'none');
    setManualQuestions(quiz.manualQuestions.filter((_: any, i: number) => i !== qIdx));
    setSelectedDetail(null);
    setActiveMode('create');
    setTimeout(() => {
      const el = document.getElementById('question-builder-box');
      if(el) el.scrollIntoView({ behavior: 'smooth' });
    }, 500);
  };

  const handlePublish = async () => {
    if (!title.trim()) return alert("টাইটেল দিন।");
    const finalSubject = isCustomSubject ? customSubjectName.trim() : subject;
    if (quizType !== 'lesson' && !finalSubject) return alert("বিষয় সিলেক্ট করুন বা কাস্টম নাম দিন।");
    if (quizType !== 'lesson' && (!selectedCategory || manualQuestions.length === 0)) return alert("ক্যাটাগরি এবং অন্তত ১টি প্রশ্ন প্রয়োজন।");
    if (quizType === 'lesson' && !lessonContent.trim()) return alert("লিসন কন্টেন্ট দিন।");

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
      console.error(e);
    } finally { 
      setIsPublishing(false); 
    }
  };

  return (
    <div className="space-y-8 pb-24 font-['Hind_Siliguri'] max-w-5xl mx-auto px-4 md:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">{editingId ? 'এডিট মোড 🛠️' : 'কন্টেন্ট ম্যানেজার 📝'}</h2>
          <p className="text-slate-400 font-bold text-sm">{editingId ? 'বর্তমান কন্টেন্টটি সংশোধন করুন' : 'নতুন কুইজ বা লিসন তৈরি করুন'}</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-[22px] shadow-inner border border-slate-200">
          <button onClick={() => { setActiveMode('create'); if(!editingId) resetEditor(); }} className={`px-10 py-3 rounded-[18px] font-black text-sm transition-all ${activeMode === 'create' ? 'bg-emerald-800 text-white shadow-lg' : 'text-slate-500'}`}>
            {editingId ? 'এডিট করুন' : 'তৈরি করুন'}
          </button>
          <button onClick={() => { setActiveMode('list'); resetEditor(); }} className={`px-10 py-3 rounded-[18px] font-black text-sm transition-all ${activeMode === 'list' ? 'bg-emerald-800 text-white shadow-lg' : 'text-slate-500'}`}>ম্যানেজ</button>
        </div>
      </div>

      {activeMode === 'create' ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {!editingId && (
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {[
                { id: 'mock', label: 'মক কুইজ', icon: <BookOpen size={16}/> },
                { id: 'paid', label: 'পেইড কুইজ', icon: <Star size={16}/> },
                { id: 'live', label: 'লাইভ কুইজ', icon: <Zap size={16}/> },
                { id: 'lesson', label: 'নতুন লিসন', icon: <FileText size={16}/> },
                { id: 'special', label: 'স্পেশাল কুইজ', icon: <Sparkles size={16}/> }
              ].map(t => (
                <button 
                  key={t.id} 
                  onClick={() => { setQuizType(t.id as any); setManualQuestions([]); }} 
                  className={`flex items-center gap-2.5 px-8 py-4 rounded-[30px] font-black text-[11px] uppercase tracking-widest border-2 transition-all shrink-0 ${quizType === t.id ? 'bg-emerald-50 border-emerald-700 text-emerald-800 shadow-xl shadow-emerald-700/5' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          )}

          <div className="bg-white p-8 md:p-12 rounded-[50px] shadow-sm border border-slate-100 space-y-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-slate-50 rounded-bl-[120px] -mr-12 -mt-12 opacity-50"></div>
            
            {editingId && (
              <div className="flex items-center justify-between bg-amber-50 p-6 rounded-[32px] border border-amber-100 relative z-10">
                 <div className="flex items-center gap-3">
                    <Edit3 className="text-amber-600" />
                    <span className="font-black text-amber-900">আপনি একটি বিদ্যমান {quizType} এডিট করছেন।</span>
                 </div>
                 <button onClick={resetEditor} className="flex items-center gap-2 text-[10px] font-black uppercase text-amber-700 bg-white px-4 py-2 rounded-xl shadow-sm"><RotateCcw size={14}/> বাতিল করুন</button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 relative z-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase px-2 tracking-[0.2em]">টাইটেল / নাম</label>
                <input 
                  type="text" value={title} onChange={(e) => setTitle(e.target.value)} 
                  placeholder="যেমন: বিসিএস প্রস্তুতির সেরা টিপস" 
                  className="w-full bg-slate-50 border-2 border-slate-50 p-6 rounded-[32px] font-black outline-none focus:bg-white focus:border-emerald-100 transition-all shadow-inner" 
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase px-2 tracking-[0.2em]">কার্ড ক্যাটাগরি</label>
                <select 
                  value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} 
                  className="w-full bg-slate-50 border-2 border-slate-50 p-6 rounded-[32px] font-black outline-none appearance-none shadow-inner"
                >
                  <option value="">কার্ড পছন্দ করুন</option>
                  {dynamicCategories.map(c => <option key={c.id} value={c.label}>{c.label}</option>)}
                </select>
              </div>
            </div>

            {quizType !== 'lesson' && (
              <div className="bg-emerald-50/50 p-8 rounded-[40px] border-2 border-dashed border-emerald-100 space-y-6 relative z-10">
                <div className="flex items-center justify-between">
                   <label className="text-[11px] font-black text-emerald-800 uppercase tracking-widest px-2">বিষয়ের তথ্য (Subject Info)</label>
                   <button 
                    onClick={() => setIsCustomSubject(!isCustomSubject)}
                    className="flex items-center gap-2 text-[10px] font-black text-emerald-700 bg-white px-4 py-2 rounded-xl shadow-sm border border-emerald-100"
                   >
                     {isCustomSubject ? <LayoutGrid size={14}/> : <PenTool size={14}/>}
                     {isCustomSubject ? 'লিস্ট থেকে নিন' : 'কাস্টম বিষয় লিখুন'}
                   </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase px-2">বিষয় নির্বাচন</label>
                    {isCustomSubject ? (
                      <input 
                        type="text" value={customSubjectName} onChange={(e) => setCustomSubjectName(e.target.value)} 
                        placeholder="বিষয়ের নাম লিখুন (যেমন: ফিজিক্স)" 
                        className="w-full bg-white p-5 rounded-[24px] font-black border-2 border-emerald-200 outline-none focus:bg-white shadow-sm" 
                      />
                    ) : (
                      <select 
                        value={subject} onChange={(e) => setSubject(e.target.value)} 
                        className="w-full bg-white p-5 rounded-[24px] font-black border-2 border-emerald-100 outline-none appearance-none shadow-sm"
                      >
                        {SUBJECTS.map(s => <option key={s.id} value={s.title}>{s.title}</option>)}
                      </select>
                    )}
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase px-2 tracking-[0.2em]">সময়কাল (মিনিট)</label>
                    <input 
                      type="number" value={duration} onChange={(e) => setDuration(e.target.value)} 
                      className="w-full bg-white border-2 border-emerald-100 p-5 rounded-[24px] font-black outline-none focus:bg-white shadow-sm" 
                    />
                  </div>
                </div>
              </div>
            )}

            {quizType === 'lesson' && (
              <div className="space-y-10 animate-in slide-in-from-top-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/50 p-8 rounded-[40px] border-2 border-dashed border-slate-200">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-emerald-700 uppercase px-2 tracking-widest">লিসন মিডিয়া লিঙ্ক (ছবি/ভিডিও)</label>
                    <input 
                      type="text" value={lessonMediaUrl} onChange={(e) => setLessonMediaUrl(e.target.value)} 
                      placeholder="https://image-url-or-youtube-link" 
                      className="w-full p-5 rounded-[24px] border-2 border-slate-100 bg-white font-bold outline-none focus:border-emerald-200 transition-all shadow-sm" 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-emerald-700 uppercase px-2 tracking-widest">মিডিয়া টাইপ</label>
                    <select 
                      value={lessonMediaType} onChange={(e) => setLessonMediaType(e.target.value as any)} 
                      className="w-full p-5 rounded-[24px] border-2 border-slate-100 bg-white font-black outline-none appearance-none shadow-sm"
                    >
                      <option value="none">কোনো মিডিয়া নেই</option>
                      <option value="image">ছবি (Direct Link)</option>
                      <option value="video">ভিডিও (YouTube Link)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase px-2 tracking-[0.2em]">লিসন কন্টেন্ট (বিস্তারিত বর্ণনা)</label>
                  <textarea 
                    value={lessonContent} onChange={(e) => setLessonContent(e.target.value)} 
                    placeholder="এখানে টপিকের বিস্তারিত আলোচনা লিখুন..."
                    className="w-full h-80 bg-slate-50 border-2 border-slate-50 p-8 rounded-[44px] font-bold outline-none focus:bg-white focus:border-emerald-100 transition-all shadow-inner leading-relaxed"
                  />
                </div>
              </div>
            )}

            {quizType !== 'lesson' && (quizType === 'paid' || quizType === 'live' || quizType === 'special') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 relative z-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-rose-500 uppercase px-2 tracking-[0.2em]">শুরু হওয়ার সময়</label>
                    <input 
                      type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} 
                      className="w-full bg-slate-50 border-2 border-slate-50 p-6 rounded-[32px] font-black outline-none focus:bg-white focus:border-rose-100 transition-all shadow-inner" 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-rose-500 uppercase px-2 tracking-[0.2em]">শেষ হওয়ার সময়</label>
                    <input 
                      type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} 
                      className="w-full bg-slate-50 border-2 border-slate-50 p-6 rounded-[32px] font-black outline-none focus:bg-white focus:border-rose-100 transition-all shadow-inner" 
                    />
                  </div>
                  {(quizType === 'paid' || quizType === 'live') && (
                    <>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-amber-600 uppercase px-2 tracking-[0.2em]">পুরস্কার (৳)</label>
                        <input 
                          type="number" value={prizePool} onChange={(e) => setPrizePool(e.target.value)} 
                          className="w-full bg-amber-50/40 border-2 border-transparent p-6 rounded-[32px] font-black outline-none focus:bg-white focus:border-amber-100 transition-all shadow-inner text-amber-900" 
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-amber-600 uppercase px-2 tracking-[0.2em]">এন্ট্রি ফি (৳)</label>
                        <input 
                          type="number" value={entryFee} onChange={(e) => setEntryFee(e.target.value)} 
                          className="w-full bg-amber-50/40 border-2 border-transparent p-6 rounded-[32px] font-black outline-none focus:bg-white focus:border-amber-100 transition-all shadow-inner text-amber-900" 
                        />
                      </div>
                    </>
                  )}
              </div>
            )}
          </div>

          {quizType !== 'lesson' && (
            <div id="question-builder-box" className="bg-white p-8 md:p-12 rounded-[50px] shadow-sm border border-slate-100 space-y-10">
              <div className="flex justify-between items-center border-b border-slate-50 pb-8">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-700 shadow-sm"><Plus size={24} strokeWidth={3}/></div>
                   <h3 className="text-2xl font-black text-slate-900">প্রশ্ন যুক্ত করুন</h3>
                </div>
                <button 
                  onClick={() => setShowBulkModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all"
                >
                  <FileCode size={18}/> বাল্ক আপলোড
                </button>
              </div>

              <div className="space-y-8">
                <textarea 
                  value={currentQ} onChange={(e) => setCurrentQ(e.target.value)} 
                  placeholder="এখানে আপনার প্রশ্নটি লিখুন..." 
                  className="w-full bg-slate-50 p-8 rounded-[44px] font-black text-xl h-44 outline-none border-2 border-transparent focus:bg-white focus:border-emerald-100 transition-all shadow-inner" 
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/50 p-10 rounded-[50px] border-2 border-dashed border-slate-200">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-emerald-700 uppercase px-2 tracking-widest">প্রশ্ন মিডিয়া লিঙ্ক</label>
                    <input 
                      type="text" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} 
                      placeholder="https://image-or-video-url" 
                      className="w-full p-5 rounded-[24px] border-2 border-slate-100 bg-white font-bold outline-none focus:border-emerald-200 transition-all shadow-sm" 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-emerald-700 uppercase px-2 tracking-widest">মিডিয়া টাইপ</label>
                    <select 
                      value={mediaType} onChange={(e) => setMediaType(e.target.value as any)} 
                      className="w-full p-5 rounded-[24px] border-2 border-slate-100 bg-white font-black outline-none appearance-none shadow-sm"
                    >
                      <option value="none">কোনো মিডিয়া নেই</option>
                      <option value="image">ছবি</option>
                      <option value="video">ভিডিও</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {opts.map((o, i) => (
                    <div key={i} className={`flex items-center gap-4 p-3 bg-slate-50 rounded-[36px] border-2 transition-all shadow-inner ${correctIdx === i ? 'border-emerald-500 bg-white' : 'border-transparent'}`}>
                      <button onClick={() => setCorrectIdx(i)} className={`w-14 h-14 rounded-full font-black text-xl shrink-0 transition-all shadow-md flex items-center justify-center ${correctIdx === i ? 'bg-emerald-600 text-white shadow-emerald-500/30' : 'bg-white text-slate-300 hover:text-emerald-300'}`}>
                        {i + 1}
                      </button>
                      <input type="text" value={o} onChange={(e) => { const n = [...opts]; n[i] = e.target.value; setOpts(n); }} placeholder={`অপশন ${i + 1} লিখুন...`} className="w-full bg-transparent p-4 font-black outline-none" />
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase px-2 tracking-widest">ব্যাখ্যা (ঐচ্ছিক)</label>
                  <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="সঠিক উত্তরের ব্যাখ্যা..." className="w-full bg-slate-50 p-6 rounded-[32px] font-bold outline-none border border-slate-100"/>
                </div>

                <button onClick={addQuestionToList} className="w-full py-6 bg-emerald-900 text-white rounded-[40px] font-black text-xl flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all">
                  <Plus size={28} strokeWidth={4} /> লিস্টে যোগ করুন
                </button>

                {manualQuestions.length > 0 && (
                   <div className="pt-10 border-t border-slate-50">
                      <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">সংযুক্ত প্রশ্নসমূহ ({manualQuestions.length})</h4>
                      <div className="space-y-4">
                         {manualQuestions.map((mq, idx) => (
                           <div key={idx} className="p-6 bg-slate-50 rounded-[30px] border border-slate-100 flex justify-between items-center group">
                              <div className="flex items-center gap-4">
                                 <span className="w-8 h-8 bg-emerald-700 text-white rounded-lg flex items-center justify-center font-black text-xs">{idx + 1}</span>
                                 <p className="font-black text-slate-800 text-sm line-clamp-1">{mq.question}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => {
                                    setCurrentQ(mq.question);
                                    setOpts([...mq.options]);
                                    setCorrectIdx(mq.correctAnswer);
                                    setExplanation(mq.explanation || '');
                                    setMediaUrl(mq.mediaUrl || '');
                                    setMediaType(mq.mediaType || 'none');
                                    setManualQuestions(manualQuestions.filter((_, i) => i !== idx));
                                    window.scrollTo({ top: document.getElementById('question-builder-box')?.offsetTop || 0, behavior: 'smooth' });
                                  }} 
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                >
                                  <Pencil size={18}/>
                                </button>
                                <button onClick={() => setManualQuestions(manualQuestions.filter((_, i) => i !== idx))} className="p-2 text-rose-300 hover:text-rose-500 transition-colors"><Trash2 size={18}/></button>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                )}
              </div>
            </div>
          )}

          {(manualQuestions.length > 0 || quizType === 'lesson') && (
            <div className="bg-slate-900 p-10 md:p-14 rounded-[60px] text-white space-y-10 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[120px] -mr-40 -mt-40"></div>
               <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                  <div className="flex items-center gap-6">
                    {quizType !== 'lesson' && <div className="w-16 h-16 bg-emerald-500 rounded-[24px] flex items-center justify-center font-black text-3xl text-slate-900 shadow-xl">{manualQuestions.length}</div>}
                    <div>
                       <h4 className="text-2xl font-black">{editingId ? 'আপডেট প্রস্তুত' : (quizType === 'lesson' ? 'লিসন প্রস্তুত' : 'প্রশ্ন তালিকা প্রস্তুত')}</h4>
                       <p className="text-slate-400 font-bold text-sm">{title}</p>
                    </div>
                  </div>
                  <button onClick={handlePublish} disabled={isPublishing} className="w-full md:w-auto bg-emerald-500 text-slate-900 px-16 py-6 rounded-[30px] font-black text-xl shadow-2xl active:scale-95 transition-all disabled:opacity-50">
                    {isPublishing ? <Loader2 className="animate-spin mx-auto" /> : (editingId ? <><Save size={24} className="mr-2"/> আপডেট করুন</> : 'সব পাবলিশ করুন')}
                  </button>
               </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {quizzes.map((q) => (
            <div key={q.id} className="bg-white p-8 rounded-[50px] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-emerald-200 transition-all relative overflow-hidden">
              <div className="mb-8 relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-5 py-2 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-emerald-100">{quizType}</span>
                  <div className="flex gap-1">
                    <button onClick={() => handleEditInit(q)} className="p-3 text-slate-300 hover:text-emerald-500 transition-all hover:bg-emerald-50 rounded-2xl"><Edit3 size={20}/></button>
                    <button onClick={() => onDeleteQuiz(q.id, quizType)} className="p-3 text-slate-300 hover:text-rose-500 transition-all hover:bg-rose-50 rounded-2xl"><Trash2 size={20}/></button>
                  </div>
                </div>
                <h5 className="font-black text-slate-800 text-2xl leading-tight line-clamp-2">{q.title}</h5>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-4">{q.category} • {q.subject}</p>
              </div>
              <button 
                onClick={() => setSelectedDetail(q)}
                className="w-full py-5 bg-slate-900 text-white rounded-[28px] font-black text-xs uppercase tracking-[0.3em] active:scale-95 transition-all"
              >
                বিস্তারিত দেখুন
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal & Bulk Modal Logic */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[5000] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-2xl rounded-[50px] p-10 shadow-2xl animate-in zoom-in-95 duration-200 border border-white/20 relative">
              <button onClick={() => setShowBulkModal(false)} className="absolute top-8 right-8 text-slate-400 hover:text-rose-500 transition-all"><X/></button>
              <div className="flex items-center gap-4 mb-8">
                 <div className="p-4 bg-emerald-50 text-emerald-700 rounded-3xl"><FileCode size={32}/></div>
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 leading-tight">বাল্ক JSON আপলোড</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">প্রশ্নের তালিকা সরাসরি পেস্ট করুন</p>
                 </div>
              </div>
              <textarea 
                value={bulkJson}
                onChange={(e) => setBulkJson(e.target.value)}
                placeholder='[{"question": "What is 2+2?", "options": ["3","4","5","6"], "correctAnswer": 1}]'
                className="w-full h-72 bg-slate-50 border-2 border-slate-50 p-8 rounded-[40px] font-mono text-sm outline-none focus:bg-white focus:border-emerald-100 transition-all shadow-inner"
              />
              <div className="mt-8 flex flex-col gap-4">
                 <button onClick={handleBulkUpload} className="w-full bg-emerald-700 text-white py-6 rounded-[30px] font-black text-lg shadow-xl shadow-emerald-700/20 active:scale-95 transition-all">প্রশ্নের লিস্ট ইম্পোর্ট করুন</button>
                 <div className="p-5 bg-amber-50 rounded-[28px] border border-amber-100 flex gap-3">
                    <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-800 font-bold leading-relaxed">JSON ফরম্যাট অবশ্যই একটি Array হতে হবে এবং প্রতিটি অবজেক্টে question, options (৪টি), correctAnswer (০-৩) প্রপার্টি থাকতে হবে।</p>
                 </div>
              </div>
           </div>
        </div>
      )}

      {selectedDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[5000] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-4xl max-h-[85vh] rounded-[50px] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900">{selectedDetail.title}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{selectedDetail.category} • {selectedDetail.subject} • {quizType.toUpperCase()}</p>
                 </div>
                 <div className="flex gap-3">
                    <button onClick={() => handleEditInit(selectedDetail)} className="flex items-center gap-2 px-6 py-3 bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-emerald-700/20 active:scale-95 transition-all"><Edit3 size={16}/> এডিট</button>
                    <button onClick={() => setSelectedDetail(null)} className="p-3 bg-white rounded-2xl text-slate-400 hover:text-rose-500 transition-all shadow-sm border border-slate-100"><X/></button>
                 </div>
              </div>

              <div className="flex-grow overflow-y-auto p-8 no-scrollbar bg-white">
                 {quizType === 'lesson' ? (
                   <div className="space-y-8">
                      {selectedDetail.mediaUrl && selectedDetail.mediaType !== 'none' && (
                        <div className="rounded-[40px] overflow-hidden border-4 border-slate-50 shadow-xl max-h-[400px] flex justify-center bg-black">
                           {selectedDetail.mediaType === 'image' ? (
                             <img src={selectedDetail.mediaUrl} className="max-w-full object-contain" alt="Lesson Media"/>
                           ) : (
                             <iframe className="w-full aspect-video" src={`https://www.youtube.com/embed/${selectedDetail.mediaUrl.includes('v=') ? selectedDetail.mediaUrl.split('v=')[1]?.split('&')[0] : selectedDetail.mediaUrl.split('/').pop()}`} frameBorder="0" allowFullScreen></iframe>
                           )}
                        </div>
                      )}
                      <div className="bg-slate-50/50 p-10 rounded-[44px] border border-slate-100">
                         <p className="text-slate-700 whitespace-pre-wrap leading-loose text-lg font-medium">{selectedDetail.content}</p>
                      </div>
                   </div>
                 ) : (
                   <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                         <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-center gap-4">
                            <div className="p-3 bg-white rounded-2xl text-emerald-700 shadow-sm"><Eye size={20}/></div>
                            <div>
                               <p className="text-[10px] font-black text-emerald-600 uppercase">মোট প্রশ্ন</p>
                               <p className="text-xl font-black text-emerald-900">{(selectedDetail.manualQuestions || []).length}টি</p>
                            </div>
                         </div>
                         <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-center gap-4">
                            <div className="p-3 bg-white rounded-2xl text-blue-700 shadow-sm"><Clock size={20}/></div>
                            <div>
                               <p className="text-[10px] font-black text-blue-600 uppercase">সময়</p>
                               <p className="text-xl font-black text-blue-900">{selectedDetail.duration || 15} মিনিট</p>
                            </div>
                         </div>
                      </div>

                      <h4 className="font-black text-slate-400 text-xs uppercase tracking-widest mb-6">প্রশ্নসমূহ:</h4>
                      <div className="space-y-6">
                         {(selectedDetail.manualQuestions || []).map((q: any, i: number) => (
                           <div key={i} className="p-8 bg-white border border-slate-100 rounded-[36px] shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-all">
                              <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 opacity-20 group-hover:opacity-100 transition-all"></div>
                              <div className="flex gap-4 items-start">
                                 <span className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm shrink-0">{i+1}</span>
                                 <div className="flex-grow space-y-5">
                                    <div className="flex justify-between items-start gap-4">
                                       <h5 className="text-lg font-black text-slate-800 leading-relaxed">{q.question}</h5>
                                       <button 
                                        onClick={() => handleEditSpecificQuestion(selectedDetail, i)}
                                        className="p-3 bg-slate-50 text-emerald-700 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm flex items-center gap-2 font-black text-[10px] uppercase tracking-widest shrink-0"
                                       >
                                         <Pencil size={14}/> এডিট
                                       </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                       {q.options.map((opt: string, idx: number) => (
                                          <div key={idx} className={`p-4 rounded-2xl text-sm font-black flex items-center justify-between border ${idx === q.correctAnswer ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-50 text-slate-400'}`}>
                                             {opt} {idx === q.correctAnswer && <CheckCircle2 size={16}/>}
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                 )}
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/30 flex justify-end">
                 <button onClick={() => setSelectedDetail(null)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase shadow-xl active:scale-95 transition-all">বন্ধ করুন</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default QuizManager;
