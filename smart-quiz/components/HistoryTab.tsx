
import React from 'react';
import { Bookmark, AlertCircle, CheckCircle2, Trophy, Clock, ChevronRight } from 'lucide-react';
import { QuizResult, Question } from '../types';

interface HistoryTabProps {
  history: { exams: QuizResult[], mistakes: Question[], marked: Question[] };
}

const HistoryTab: React.FC<HistoryTabProps> = ({ history }) => {
  const [activeSubTab, setActiveSubTab] = React.useState<'marked' | 'mistakes' | 'exams'>('exams');

  const exams = history?.exams || [];
  const mistakes = history?.mistakes || [];
  const marked = history?.marked || [];

  const renderContent = () => {
    if (activeSubTab === 'exams') {
      return exams.length > 0 ? (
        <div className="space-y-4 p-4 animate-in fade-in duration-500">
          {exams.map((res) => (
            <div key={res.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex justify-between items-center group hover:border-emerald-200 transition-all">
              <div className="flex gap-5 items-center">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner">
                   <Trophy size={28} />
                </div>
                <div>
                  <h4 className="font-black text-slate-800 text-sm leading-tight mb-1">{res.subject}</h4>
                  <div className="flex items-center gap-2">
                     <Clock size={12} className="text-slate-300" />
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{res.date}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-emerald-700 leading-none">{res.score}/{res.total}</p>
                <p className="text-[9px] text-slate-400 font-black uppercase mt-1">পয়েন্ট: +{res.score * 10}</p>
              </div>
            </div>
          ))}
        </div>
      ) : <EmptyState label="আপনি এখনো কোনো পরীক্ষা দেননি" />;
    }

    if (activeSubTab === 'mistakes') {
      return mistakes.length > 0 ? (
        <div className="space-y-4 p-4 pb-24 animate-in fade-in duration-500">
          {mistakes.map((q, idx) => (
            <div key={idx} className="bg-white p-6 rounded-[32px] border border-rose-100 shadow-sm">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm"><AlertCircle size={20} /></div>
                <h4 className="font-black text-slate-800 text-sm leading-relaxed pt-1">{q.question}</h4>
              </div>
              <div className="space-y-3">
                <div className="p-4 bg-emerald-50 rounded-2xl flex items-center gap-3 border border-emerald-100">
                  <CheckCircle2 size={18} className="text-emerald-700" />
                  <span className="text-xs font-black text-emerald-900">{q.options?.[q.correctAnswer] || 'সঠিক উত্তর'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : <EmptyState label="এখনো কোনো ভুল উত্তর নেই" />;
    }

    if (activeSubTab === 'marked') {
      return marked.length > 0 ? (
        <div className="space-y-4 p-4 pb-24 animate-in fade-in duration-500">
          {marked.map((q, idx) => (
            <div key={idx} className="bg-white p-6 rounded-[32px] border border-emerald-100 shadow-sm">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center shrink-0 shadow-sm"><Bookmark size={20} fill="currentColor" /></div>
                <h4 className="font-black text-slate-800 text-sm leading-relaxed pt-1">{q.question}</h4>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {q.options?.map((opt, i) => (
                  <div key={i} className={`p-4 rounded-2xl text-xs font-black transition-all border ${i === q.correctAnswer ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-slate-50 text-slate-400 border-slate-50'}`}>
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : <EmptyState label="বুকমার্ক করা কোনো প্রশ্ন নেই" />;
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-[#fdfdff] font-['Hind_Siliguri']">
      <div className="bg-white px-4 pt-4 sticky top-0 z-20 shadow-sm border-b border-slate-50 rounded-b-[40px]">
        <h2 className="text-2xl font-black text-slate-900 mb-6 px-4 pt-2">হিস্ট্রি ও প্র্যাকটিস</h2>
        <div className="flex justify-around bg-slate-50 p-1.5 rounded-[28px] mx-2 mb-4">
          <HistorySubTab label="পরীক্ষা" active={activeSubTab === 'exams'} onClick={() => setActiveSubTab('exams')} />
          <HistorySubTab label="ভুল প্রশ্ন" active={activeSubTab === 'mistakes'} onClick={() => setActiveSubTab('mistakes')} />
          <HistorySubTab label="বুকমার্ক" active={activeSubTab === 'marked'} onClick={() => setActiveSubTab('marked')} />
        </div>
      </div>

      <div className="flex-grow overflow-y-auto no-scrollbar">
        {renderContent()}
      </div>
    </div>
  );
};

const HistorySubTab = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-[22px] transition-all duration-300 ${active ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
  >
    {label}
  </button>
);

const EmptyState = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center justify-center text-center p-12 mt-20 opacity-80">
    <div className="bg-white w-40 h-40 rounded-[50px] flex items-center justify-center mb-8 shadow-inner border border-slate-100">
      <AlertCircle size={64} className="text-slate-100" />
    </div>
    <p className="text-slate-300 font-black text-xs uppercase tracking-widest px-10 leading-relaxed">{label}</p>
  </div>
);

export default HistoryTab;
