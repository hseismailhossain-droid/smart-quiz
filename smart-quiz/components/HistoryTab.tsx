
import React from 'react';
import { Bookmark, AlertCircle, CheckCircle2, Trophy, Clock, HelpCircle, ArrowRight } from 'lucide-react';
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
        <div className="space-y-4 p-5 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
          {exams.map((res) => (
            <div key={res.id || Math.random()} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex justify-between items-center group hover:border-emerald-200 transition-all">
              <div className="flex gap-5 items-center">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner group-hover:scale-110 transition-transform">
                   <Trophy size={28} />
                </div>
                <div>
                  <h4 className="font-black text-slate-800 text-sm leading-tight mb-1 truncate max-w-[120px]">{res.subject}</h4>
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
      ) : <EmptyState label="আপনি এখনো কোনো পরীক্ষা দেননি" icon={<HelpCircle size={32} />} />;
    }

    if (activeSubTab === 'mistakes') {
      return mistakes.length > 0 ? (
        <div className="space-y-4 p-5 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {mistakes.map((q, idx) => (
            <div key={idx} className="bg-white p-6 rounded-[32px] border border-rose-100 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 w-12 h-12 bg-rose-50 rounded-bl-[24px] flex items-center justify-center text-rose-300">
                <AlertCircle size={18} />
              </div>
              <div className="flex items-start gap-4 mb-5">
                <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm"><AlertCircle size={20} /></div>
                <h4 className="font-black text-slate-800 text-sm leading-relaxed pt-1 pr-8">{q.question}</h4>
              </div>
              <div className="space-y-3">
                <div className="p-4 bg-emerald-50 rounded-2xl flex items-center gap-3 border border-emerald-100">
                  <CheckCircle2 size={18} className="text-emerald-700" />
                  <div>
                    <p className="text-[9px] font-black text-emerald-600 uppercase">সঠিক উত্তর</p>
                    <span className="text-xs font-black text-emerald-900">{q.options?.[q.correctAnswer] || 'ডাটা পাওয়া যায়নি'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : <EmptyState label="এখনো কোনো ভুল উত্তর নেই" icon={<AlertCircle size={32} />} />;
    }

    if (activeSubTab === 'marked') {
      return marked.length > 0 ? (
        <div className="space-y-4 p-5 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {marked.map((q, idx) => (
            <div key={idx} className="bg-white p-6 rounded-[32px] border border-emerald-100 shadow-sm">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                  <Bookmark size={20} fill="currentColor" />
                </div>
                <h4 className="font-black text-slate-800 text-sm leading-relaxed pt-1">{q.question}</h4>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {q.options?.map((opt, i) => (
                  <div key={i} className={`p-4 rounded-2xl text-xs font-black transition-all border flex items-center justify-between ${i === q.correctAnswer ? 'bg-emerald-700 text-white border-emerald-700 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-50'}`}>
                    {opt}
                    {i === q.correctAnswer && <CheckCircle2 size={16} />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : <EmptyState label="বুকমার্ক করা কোনো প্রশ্ন নেই" icon={<Bookmark size={32} />} />;
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-white font-['Hind_Siliguri']">
      <div className="bg-white px-4 pt-6 sticky top-0 z-20">
        <h2 className="text-2xl font-black text-slate-900 mb-6 px-4">হিস্ট্রি ও প্র্যাকটিস</h2>
        <div className="flex justify-around bg-slate-50 p-1.5 rounded-[28px] mx-2 mb-4 shadow-sm border border-slate-100">
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

const EmptyState = ({ label, icon }: { label: string, icon: React.ReactNode }) => (
  <div className="flex flex-col items-center justify-center text-center p-12 mt-20 opacity-80 animate-in fade-in zoom-in duration-500">
    <div className="bg-slate-50 w-24 h-24 rounded-[36px] flex items-center justify-center mb-8 shadow-inner border border-slate-100 text-slate-200">
      {icon}
    </div>
    <p className="text-slate-300 font-black text-[11px] uppercase tracking-[0.2em] px-10 leading-relaxed max-w-xs">{label}</p>
  </div>
);

export default HistoryTab;
