
import React from 'react';
import { Home, Users, Edit, Bookmark, Trophy, Activity } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'home' | 'community' | 'exam' | 'progress' | 'leaderboard' | 'history';
  setActiveTab: (tab: any) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'home', label: 'হোম', icon: Home },
    { id: 'community', label: 'ফিড', icon: Users },
    { id: 'exam', label: 'পরীক্ষা', icon: Edit },
    { id: 'progress', label: 'প্রোগ্রেস', icon: Activity },
    { id: 'leaderboard', label: 'র‍্যাংক', icon: Trophy },
    { id: 'history', label: 'হিস্ট্রি', icon: Bookmark },
  ];

  return (
    <div className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-100 flex justify-around items-center py-2 px-1 z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] rounded-t-[32px]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className="flex flex-col items-center gap-1 transition-all flex-1 py-1"
          >
            <div className={`p-2 rounded-[16px] transition-all duration-300 ${isActive ? 'bg-emerald-700 text-white shadow-lg shadow-emerald-700/30' : 'text-gray-400'}`}>
              <Icon size={18} className={isActive ? 'fill-white/10' : ''} />
            </div>
            <span className={`text-[8px] font-black ${isActive ? 'text-emerald-800' : 'text-gray-400'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;
