
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, BookOpen, Image as ImageIcon, 
  Users, Settings as SettingsIcon, LogOut, Menu, X, Trophy, LogIn, MessageSquare, CreditCard, LayoutGrid, Home as HomeIcon
} from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import QuizManager from './QuizManager';
import AdsManager from './AdsManager';
import UserWalletManager from './UserWalletManager';
import SettingsManager from './SettingsManager';
import ResultManager from './ResultManager';
import ReportManager from './ReportManager';
import WithdrawManager from './WithdrawManager';
import CategoryManager from './CategoryManager';
import HomeManagement from './HomeManagement';
import { DepositRequest, Notification, UserReport, WithdrawRequest } from '../../types';
import { db } from '../../services/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';

interface AdminLayoutProps {
  onExit: () => void;
  onLogout: () => void;
  onSendNotification: (title: string, message: string) => void;
  onDeleteNotification: (id: string) => void;
  onDeleteQuiz: (id: string, type: 'mock' | 'live' | 'paid' | 'lesson' | 'special') => void;
  notifications: Notification[];
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  onExit, onLogout, onSendNotification, onDeleteNotification, onDeleteQuiz, notifications 
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'quizzes' | 'categories' | 'results' | 'ads' | 'users' | 'settings' | 'reports' | 'withdraws' | 'home_mgmt'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Real-time states
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [userReports, setUserReports] = useState<UserReport[]>([]);

  useEffect(() => {
    const unsubDeposits = onSnapshot(query(collection(db, 'deposit_requests'), orderBy('timestamp', 'desc')), (snap) => {
      setDepositRequests(snap.docs.map(d => ({ id: d.id, ...d.data() } as DepositRequest)));
    });
    const unsubWithdraws = onSnapshot(query(collection(db, 'withdraw_requests'), orderBy('timestamp', 'desc')), (snap) => {
      setWithdrawRequests(snap.docs.map(d => ({ id: d.id, ...d.data() } as WithdrawRequest)));
    });
    const unsubReports = onSnapshot(query(collection(db, 'user_reports'), orderBy('timestamp', 'desc')), (snap) => {
      setUserReports(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserReport)));
    });

    return () => { unsubDeposits(); unsubWithdraws(); unsubReports(); };
  }, []);

  // Handlers
  const handleApproveDeposit = async (id: string) => {
    const req = depositRequests.find(r => r.id === id);
    if (!req) return;
    await updateDoc(doc(db, 'deposit_requests', id), { status: 'approved' });
  };

  const handleRejectDeposit = async (id: string) => {
    await updateDoc(doc(db, 'deposit_requests', id), { status: 'rejected' });
  };

  const handleApproveWithdraw = async (id: string) => {
    await updateDoc(doc(db, 'withdraw_requests', id), { status: 'approved' });
  };

  const handleRejectWithdraw = async (id: string) => {
    await updateDoc(doc(db, 'withdraw_requests', id), { status: 'rejected' });
  };

  const handleDeleteWithdraw = async (id: string) => {
    await deleteDoc(doc(db, 'withdraw_requests', id));
  };

  const handleResolveReport = async (id: string) => {
    await updateDoc(doc(db, 'user_reports', id), { status: 'resolved' });
  };

  const handleDeleteReport = async (id: string) => {
    await deleteDoc(doc(db, 'user_reports', id));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <AdminDashboard onNavigate={setActiveTab} requests={depositRequests} onApprove={handleApproveDeposit} />;
      case 'quizzes': return <QuizManager onDeleteQuiz={onDeleteQuiz} />;
      case 'categories': return <CategoryManager />;
      case 'results': return <ResultManager />;
      case 'home_mgmt': return <HomeManagement />;
      case 'ads': return <AdsManager />;
      case 'users': return <UserWalletManager requests={depositRequests} onApprove={handleApproveDeposit} onReject={handleRejectDeposit} />;
      case 'withdraws': return <WithdrawManager requests={withdrawRequests} onApprove={handleApproveWithdraw} onReject={handleRejectWithdraw} onDelete={handleDeleteWithdraw} />;
      case 'settings': return <SettingsManager onSendNotification={onSendNotification} onDeleteNotification={onDeleteNotification} notifications={notifications} />;
      case 'reports': return <ReportManager reports={userReports} onResolve={handleResolveReport} onDelete={handleDeleteReport} />;
      default: return <AdminDashboard onNavigate={setActiveTab} requests={depositRequests} onApprove={handleApproveDeposit} />;
    }
  };

  const pendingReportsCount = userReports.filter(r => r.status === 'pending').length;
  const pendingWithdrawCount = withdrawRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-50 flex font-['Hind_Siliguri'] overflow-hidden">
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out w-72 bg-emerald-900 text-white flex flex-col p-6 shadow-2xl lg:relative lg:translate-x-0`}>
        <div className="mb-12 px-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-emerald-900 font-black text-xl shadow-lg">SQ</div>
            <h1 className="text-xl font-black tracking-tight">Admin Master</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-emerald-100 hover:text-white"><X size={24} /></button>
        </div>
        <nav className="flex-grow space-y-3 overflow-y-auto no-scrollbar">
          {[
            { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
            { id: 'quizzes', label: 'কুইজ ও লিসন', icon: BookOpen },
            { id: 'categories', label: 'ক্যাটাগরি কার্ড', icon: LayoutGrid },
            { id: 'home_mgmt', label: 'হোম ম্যানেজমেন্ট', icon: HomeIcon },
            { id: 'results', label: 'ফলাফল ও র‍্যাংকিং', icon: Trophy },
            { id: 'ads', label: 'অ্যাড ম্যানেজমেন্ট', icon: ImageIcon },
            { id: 'users', label: 'ইউজার ও ওয়ালেট', icon: Users },
            { id: 'withdraws', label: 'উইথড্র রিকোয়েস্ট', icon: CreditCard, badge: pendingWithdrawCount },
            { id: 'reports', label: 'ইউজার রিপোর্ট', icon: MessageSquare, badge: pendingReportsCount },
            { id: 'settings', label: 'সিস্টেম সেটিংস', icon: SettingsIcon },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button 
                key={item.id} 
                onClick={() => { setActiveTab(item.id as any); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} 
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all relative ${isActive ? 'bg-white text-emerald-900 shadow-xl' : 'text-emerald-100/60 hover:text-emerald-50'}`}
              >
                <Icon size={22} /> 
                <span className="text-sm">{item.label}</span>
                {item.badge ? (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-rose-500 text-white text-[8px] font-black px-1.5 py-1 rounded-full">{item.badge}</span>
                ) : null}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto pt-6 border-t border-white/10">
          <button onClick={onExit} className="w-full flex items-center gap-4 px-5 py-3 text-emerald-100/60 font-bold hover:text-white transition-all group"><LogIn size={20} /><span className="text-sm">ইউজার মোড</span></button>
          <button onClick={onLogout} className="w-full flex items-center gap-4 px-5 py-3 text-rose-300 font-bold hover:text-rose-100 transition-all group"><LogOut size={20} /><span className="text-sm">লগ আউট</span></button>
        </div>
      </div>
      <div className="flex-grow flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between shadow-sm">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-500"><Menu size={24} /></button>
          <div className="flex items-center gap-6 ml-auto">
             <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center font-black text-emerald-700">ADM</div>
          </div>
        </header>
        <div className="flex-grow overflow-y-auto p-6 md:p-10 bg-[#FDFDFF]"><div className="max-w-6xl mx-auto">{renderContent()}</div></div>
      </div>
    </div>
  );
};

export default AdminLayout;
