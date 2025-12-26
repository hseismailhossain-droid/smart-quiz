
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
import { X, ArrowLeft, BellOff } from 'lucide-react';
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
    switch (activeTab) {
      case 'home': 
        return (
          <HomeTab 
            user={user} 
            notifications={notifications} 
            lessons={lessons} 
            onShowNotifications={() => setShowNotifications(true)} 
            onLogout={onLogout} 
            onSubjectSelect={handleSubjectClick} 
            onLessonSelect={(l) => setActiveLesson(l)} 
            onEditProfile={(tab = 'profile') => setProfileModal({show: true, tab})}
            onSubmitDeposit={onSubmitDeposit}
            onSubmitWithdraw={onSubmitWithdraw}
          />
        );
      case 'community': return <CommunityTab user={user} />;
      case 'exam': return <ExamTab user={user} onSubjectSelect={handleSubjectClick} onSubmitDeposit={onSubmitDeposit} onSubmitWithdraw={onSubmitWithdraw} />;
      case 'progress': return <ProgressTab user={user} history={history} />;
      case 'leaderboard': return <LeaderboardTab />;
      case 'history': return <HistoryTab history={history} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto relative border-x border-gray-100 shadow-xl overflow-hidden">
      <div className="flex-grow overflow-y-auto pb-24">
        {renderTab()}
      </div>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {showConfig && selectedSubject && (
        <QuizConfigModal 
          subject={selectedSubject} 
          isLive={isLiveMode}
          isPaid={isPaidMode}
          entryFee={entryFee}
          onClose={() => setShowConfig(false)} 
          onStart={(config) => {
            setShowConfig(false);
            onSubjectSelect(selectedSubject, { 
              ...config, 
              isLive: isLiveMode, 
              isPaid: isPaidMode,
              entryFee: entryFee,
              quizId: selectedQuizId || undefined,
              collection: selectedCollection
            });
          }}
        />
      )}

      {profileModal.show && (
        <EditProfileModal 
          user={user} 
          initialTab={profileModal.tab} 
          onClose={() => setProfileModal({...profileModal, show: false})} 
          onUpdate={onUpdateProfile} 
        />
      )}

      {activeLesson && (
        <div className="fixed inset-0 bg-white z-[300] flex flex-col">
           <div className="p-5 flex items-center justify-between border-b bg-white">
              <button onClick={() => setActiveLesson(null)} className="p-2.5 bg-gray-50 rounded-2xl"><ArrowLeft size={24} /></button>
              <span className="font-black text-gray-800">লিসন মোড</span>
              <div className="w-10"></div>
           </div>
           <div className="flex-grow overflow-y-auto p-6 no-scrollbar">
              <h2 className="text-2xl font-black text-gray-900 mb-4">{activeLesson.title}</h2>
              <div className="prose text-gray-700 whitespace-pre-wrap">{activeLesson.content}</div>
           </div>
        </div>
      )}

      {showNotifications && (
        <div className="fixed inset-0 bg-black/60 z-[2000] backdrop-blur-md flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-[40px] p-8 animate-in slide-in-from-bottom-24 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-900">নোটিফিকেশন</h3>
              <button onClick={() => setShowNotifications(false)} className="p-3 bg-gray-100 rounded-full text-slate-400"><X size={20} /></button>
            </div>
            <div className="flex-grow overflow-y-auto space-y-4 no-scrollbar pb-10">
              {notifications.map(n => (
                <div key={n.id} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-600"></div>
                  <h4 className="font-black text-emerald-800 text-sm">{n.title}</h4>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{n.message}</p>
                  <p className="text-[8px] font-black text-gray-400 mt-2 uppercase tracking-widest">{n.time || 'JUST NOW'}</p>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="py-20 text-center flex flex-col items-center">
                   <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4"><BellOff size={32}/></div>
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
