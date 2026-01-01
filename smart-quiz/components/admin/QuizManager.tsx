
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
        mediaType: q.mediaType || (q.mediaUrl ? "image" : "none")
      }));

      setManualQuestions([...manualQuestions, ...validated]);
      setBulkJson('');
      setShowBulkModal(false);
      alert(`${validated.length}টি প্রশ্ন সফলভাবে যোগ হয়েছে!`);
    } catch (e) {
      alert("JSON ফরম্যাট সঠিক নয়! উদাহরণ: [{\"question\": \"...\", \"options\": [\"...\"], \"correctAnswer\": 0}]");
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
  };

  const handlePublish = async () => {
    if (!title.trim()) return alert("টাইটেল দিন।");
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
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 px-4">
        <h2 className="text-3xl font-black text-slate-900">{editingId ? 'এডিট মোড 🛠️' : 'কন্টেন্ট ম্যানেজার 📝'}</h2>
        <div className="flex bg-slate-100 p-1.5 rounded-[22px] shadow-inner">
          <button onClick={() => { setActiveMode('create'); if(!editingId) resetEditor(); }} className={`px-10 py-3 rounded-[18px] font-black text-sm transition-all ${activeMode === 'create' ? 'bg-emerald-800 text-white shadow-lg' : 'text-slate-500'}`}>তৈরি</button>
          <button onClick={() => { setActiveMode('list'); resetEditor(); }} className={`px-10 py-3 rounded-[18px] font-black text-sm transition-all ${activeMode === 'list' ? 'bg-emerald-800 text-white shadow-lg' : 'text-slate-500'}`}>ম্যানেজ</button>
        </div>
      </div>

      {activeMode === 'create' ? (
        <div className="space-y-8 px-4">
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase px-2">টাইটেল</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase px-2">ক্যাটাগরি</label>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full bg-slate-50 p-5 rounded-2xl font-bold outline-none">
                  <option value="">সিলেক্ট করুন</option>
                  {dynamicCategories.map(c => <option key={c.id} value={c.label}>{c.label}</option>)}
                </select>
              </div>
            </div>

            {quizType !== 'lesson' && (
              <div id="question-builder-box" className="pt-10 border-t border-slate-50">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black text-slate-900">প্রশ্ন যোগ করুন ({manualQuestions.length})</h3>
                  <button onClick={() => setShowBulkModal(true)} className="px-5 py-2 bg-slate-900 text-white rounded-xl font-black text-xs uppercase flex items-center gap-2">
                    <FileCode size={16}/> বাল্ক JSON
                  </button>
                </div>
                
                <div className="space-y-6 bg-slate-50 p-8 rounded-[36px] border border-slate-100">
                  <textarea value={currentQ} onChange={(e) => setCurrentQ(e.target.value)} placeholder="প্রশ্ন লিখুন..." className="w-full bg-white p-6 rounded-2xl font-bold outline-none h-24 shadow-sm" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-slate-400 uppercase px-2">মিডিয়া লিঙ্ক (URL)</label>
                       <input type="text" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="Image/Video URL" className="w-full p-4 rounded-xl border-none font-bold" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black text-slate-400 uppercase px-2">মিডিয়া টাইপ</label>
                       <select value={mediaType} onChange={(e) => setMediaType(e.target.value as any)} className="w-full p-4 rounded-xl border-none font-bold">
                         <option value="none">নেই</option>
                         <option value="image">ছবি</option>
                         <option value="video">ভিডিও (Youtube)</option>
                       </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {opts.map((o, i) => (
                      <div key={i} className={`flex items-center gap-2 p-2 bg-white rounded-2xl border-2 transition-all ${correctIdx === i ? 'border-emerald-500' : 'border-transparent'}`}>
                        <button onClick={() => setCorrectIdx(i)} className={`w-10 h-10 rounded-full font-black ${correctIdx === i ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{i+1}</button>
                        <input type="text" value={o} onChange={(e) => { const n = [...opts]; n[i] = e.target.value; setOpts(n); }} placeholder="অপশন..." className="w-full p-2 outline-none font-bold" />
                      </div>
                    ))}
                  </div>
                  <button onClick={addQuestionToList} className="w-full py-4 bg-emerald-700 text-white rounded-2xl font-black text-sm uppercase shadow-lg">লিস্টে যোগ করুন</button>
                </div>
              </div>
            )}

            <button onClick={handlePublish} disabled={isPublishing} className="w-full py-6 bg-slate-900 text-white rounded-[28px] font-black text-lg active:scale-95 transition-all disabled:opacity-50">
              {isPublishing ? <Loader2 className="animate-spin mx-auto" /> : (editingId ? 'আপডেট করুন' : 'পাবলিশ করুন')}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
          {quizzes.map((q) => (
            <div key={q.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <h5 className="font-black text-slate-800 text-lg line-clamp-1">{q.title}</h5>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{q.category} • {q.questionsCount || 0}টি প্রশ্ন</p>
              </div>
              <div className="flex gap-2 mt-6">
                <button onClick={() => setSelectedDetail(q)} className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl font-black text-xs">বিস্তারিত</button>
                <button onClick={() => handleEditInit(q)} className="p-3 bg-emerald-50 text-emerald-700 rounded-xl"><Edit3 size={18}/></button>
                <button onClick={() => onDeleteQuiz(q.id, quizType)} className="p-3 bg-rose-50 text-rose-500 rounded-xl"><Trash2 size={18}/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bulk Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[5000] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-2xl rounded-[44px] p-8 shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-black">বাল্ক JSON আপলোড</h3>
                 <button onClick={() => setShowBulkModal(false)} className="p-2 text-slate-400"><X/></button>
              </div>
              <textarea 
                value={bulkJson}
                onChange={(e) => setBulkJson(e.target.value)}
                placeholder='[{"question": "What is 2+2?", "options": ["1","2","3","4"], "correctAnswer": 3}]'
                className="w-full h-80 bg-slate-50 p-6 rounded-[32px] font-mono text-xs outline-none"
              />
              <button onClick={handleBulkUpload} className="w-full bg-emerald-700 text-white py-5 rounded-2xl font-black text-sm mt-6 shadow-xl">ইম্পোর্ট করুন</button>
           </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[5000] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-2xl max-h-[80vh] rounded-[44px] overflow-hidden flex flex-col shadow-2xl">
              <div className="p-6 border-b flex justify-between items-center">
                 <h3 className="font-black truncate pr-4">{selectedDetail.title}</h3>
                 <button onClick={() => setSelectedDetail(null)}><X/></button>
              </div>
              <div className="flex-grow overflow-y-auto p-6 space-y-4">
                 {(selectedDetail.manualQuestions || []).map((q: any, i: number) => (
                   <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="font-black text-sm mb-3">{i+1}. {q.question}</p>
                      {q.mediaUrl && <img src={q.mediaUrl} className="w-full h-32 object-cover rounded-xl mb-3" alt=""/>}
                      <div className="grid grid-cols-2 gap-2">
                         {q.options.map((o: string, idx: number) => (
                           <div key={idx} className={`p-2 rounded-lg text-[10px] font-bold ${idx === q.correctAnswer ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-400'}`}>{o}</div>
                         ))}
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default QuizManager;
