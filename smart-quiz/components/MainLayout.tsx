
import React, { useState } from 'react';
import BottomNav from './BottomNav';
import HomeTab from './HomeTab';
import ExamTab from './ExamTab';
import HistoryTab from './HistoryTab';
import LeaderboardTab from './LeaderboardTab';
import CommunityTab from './CommunityTab';
import ProgressTab from './ProgressTab';
import QuizConfigModal from './QuizConfigModal';
import EditProfileModal from './EditProfileModal';
import { UserProfile, QuizResult, Question, Notification, Lesson } from '../types';
import { X, ArrowLeft, BellOff, BookOpen, Clock, PlayCircle } from 'lucide-react';
import { Language } from '../services/translations';

interface MainLayoutProps {
  user: UserProfile;
  history: { exams: QuizResult[], mistakes: Question[], marked: Question[] };
  notifications: Notification[];
  lessons: Lesson[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  onSubjectSelect: (subject: string, config: { 
    numQuestions: number; 
    timePerQuestion: number; 
    isLive?: boolean; 
    isPaid?: boolean;
    entryFee?: number;
    quizId?: string;
    collection?: string;
  }) => void;
  onUpdateProfile: (data: Partial<UserProfile>) => Promise<void>;
  onSubmitDeposit: (amount: number, method: 'bkash' | 'nagad', trxId: string) => void;
  onSubmitWithdraw: (amount: number, method: 'bkash' | 'nagad', accountNumber: string) => void;
  onLogout: () => void | Promise<void>;
  lang: Language;
  toggleLanguage: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  user, history, notifications, lessons, setNotifications, onSubjectSelect, onUpdateProfile, onSubmitDeposit, onSubmitWithdraw, onLogout, lang, toggleLanguage 
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'community' | 'exam' | 'progress' | 'leaderboard' | 'history'>('home');
  const [showConfig, setShowConfig] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [profileModal, setProfileModal] = useState<{show: boolean, tab: 'profile' | 'report' | 'privacy'}>({show: false, tab: 'profile'});
  
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isPaidMode, setIsPaidMode] = useState(false);
  const [entryFee, setEntryFee] = useState<number>(0);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | undefined>(undefined);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  const handleSubjectClick = (subject: string, isLive: boolean = false, isPaid: boolean = false, fee: number = 0, quizId?: string, collectionName?: string) => {
    setSelectedSubject(subject);
    setIsLiveMode(isLive);
    setIsPaidMode(isPaid);
    setEntryFee(fee);
    setSelectedQuizId(quizId || null);
    setSelectedCollection(collectionName);
    setShowConfig(true);
  };

  const renderTab = () => {
    return (
      <div key={activeTab} className="page-transition h-full overflow-y-auto no-scrollbar">
        {activeTab === 'home' && (
          <HomeTab 
            user={user} history={history} notifications={notifications} lessons={lessons} 
            onShowNotifications={() => setShowNotifications(true)} onLogout={onLogout} 
            onSubjectSelect={handleSubjectClick} onLessonSelect={(l) => setActiveLesson(l)} 
            onEditProfile={(tab = 'profile') => setProfileModal({show: true, tab})}
            onSubmitDeposit={onSubmitDeposit} onSubmitWithdraw={onSubmitWithdraw}
          />
        )}
        {activeTab === 'community' && <CommunityTab user={user} />}
        {activeTab === 'exam' && <ExamTab user={user} onSubjectSelect={handleSubjectClick} onSubmitDeposit={onSubmitDeposit} onSubmitWithdraw={onSubmitWithdraw} />}
        {activeTab === 'progress' && <ProgressTab user={user} history={history} />}
        {activeTab === 'leaderboard' && <LeaderboardTab />}
        {activeTab === 'history' && <HistoryTab history={history} />}
      </div>
    );
  };

  return (
    <div className="h-full w-full bg-slate-50 flex flex-col max-w-md mx-auto relative border-x border-gray-100 overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-grow overflow-hidden pb-[88px]">
        {renderTab()}
      </div>
      
      {/* Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Config Modal */}
      {showConfig && selectedSubject && (
        <QuizConfigModal 
          subject={selectedSubject} isLive={isLiveMode} isPaid={isPaidMode} entryFee={entryFee}
          onClose={() => setShowConfig(false)} 
          onStart={(config) => {
            setShowConfig(false);
            onSubjectSelect(selectedSubject, { 
              ...config, isLive: isLiveMode, isPaid: isPaidMode, entryFee: entryFee,
              quizId: selectedQuizId || undefined, collection: selectedCollection
            });
          }}
        />
      )}

      {/* Profile Modal */}
      {profileModal.show && (
        <EditProfileModal 
          user={user} initialTab={profileModal.tab} 
          onClose={() => setProfileModal({...profileModal, show: false})} 
          onUpdate={onUpdateProfile} 
        />
      )}

      {/* Lesson Reader */}
      {activeLesson && (
        <div className="fixed inset-0 bg-[#F8FAFC] z-[2000] flex flex-col font-['Hind_Siliguri'] animate-in slide-in-from-bottom duration-500">
           <div className="p-6 flex items-center justify-between border-b bg-white/90 backdrop-blur-xl sticky top-0 z-10 safe-pt">
              <button onClick={() => setActiveLesson(null)} className="p-3 bg-slate-50 rounded-2xl active:scale-90"><ArrowLeft size={24} /></button>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-4 py-1.5 rounded-full">{activeLesson.category}</span>
              <div className="w-10"></div>
           </div>
           
           <div className="flex-grow overflow-y-auto p-8 no-scrollbar pb-32">
              <h2 className="text-3xl font-black text-slate-900 mb-8 leading-tight">{activeLesson.title}</h2>
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 text-slate-700 whitespace-pre-wrap leading-loose text-lg font-medium">
                {activeLesson.content}
              </div>
           </div>
           
           <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-[340px] px-4 z-20 safe-pb">
              <button 
                onClick={() => { handleSubjectClick(activeLesson.title, false, false, 0, undefined, 'lessons'); setActiveLesson(null); }}
                className="w-full bg-slate-900 text-white py-6 rounded-[32px] font-black text-lg shadow-2xl active:scale-95 transition-all"
              >
                 কুইজ শুরু করুন
              </button>
           </div>
        </div>
      )}

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black/60 z-[3000] backdrop-blur-md flex items-end justify-center animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-t-[50px] p-8 animate-in slide-in-from-bottom-24 max-h-[85vh] flex flex-col shadow-2xl border-t border-white/20 safe-pb">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900">নোটিফিকেশন</h3>
              <button onClick={() => setShowNotifications(false)} className="p-3 bg-slate-50 rounded-full text-slate-400 active:scale-90"><X size={20} /></button>
            </div>
            <div className="flex-grow overflow-y-auto space-y-4 no-scrollbar pb-10">
              {notifications.map(n => (
                <div key={n.id} className="p-6 bg-slate-50/50 rounded-[32px] border border-slate-100 relative overflow-hidden group hover:bg-white transition-all">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600"></div>
                  <h4 className="font-black text-slate-800 text-sm">{n.title}</h4>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">{n.message}</p>
                  <p className="text-[9px] font-black text-slate-300 mt-3 uppercase tracking-widest">{n.time || 'এইমাত্র'}</p>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="py-24 text-center">
                   <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-6"><BellOff size={40}/></div>
                   <p className="text-slate-300 font-black uppercase text-[10px] tracking-widest">কোনো নোটিফিকেশন নেই</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
