
import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Star, ChevronUp, Loader2 } from 'lucide-react';
import { db, auth } from '../services/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

const LeaderboardTab: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub = () => {};
    if (auth.currentUser) {
      const q = query(collection(db, 'users'), orderBy('totalPoints', 'desc'), limit(50));
      unsub = onSnapshot(q, (snap) => {
        const list = snap.docs.map((doc, idx) => ({
          rank: idx + 1,
          ...doc.data()
        }));
        setUsers(list);
        setLoading(false);
      }, (e) => {
        console.warn("Leaderboard permission denied:", e.message);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
    return () => unsub();
  }, []);

  if (loading) return (
    <div className="min-h-full bg-emerald-700 flex items-center justify-center">
      <Loader2 className="text-white animate-spin" size={48} />
    </div>
  );

  const topThree = users.slice(0, 3);
  const others = users.slice(3);

  return (
    <div className="min-h-full bg-emerald-700 flex flex-col font-['Hind_Siliguri']">
      <div className="p-6 text-white text-center">
        <h2 className="text-2xl font-black mb-8">লিডারবোর্ড</h2>
        
        {/* Top 3 Podium */}
        <div className="flex justify-center items-end gap-2 mb-8 h-48">
          {topThree[1] && <PodiumItem user={topThree[1]} order={1} height="h-24" medalColor="text-gray-300" />}
          {topThree[0] && <PodiumItem user={topThree[0]} order={2} height="h-32" medalColor="text-yellow-400" isWinner />}
          {topThree[2] && <PodiumItem user={topThree[2]} order={3} height="h-20" medalColor="text-orange-400" />}
        </div>
      </div>

      <div className="flex-grow bg-white rounded-t-[48px] p-6 shadow-2xl overflow-y-auto no-scrollbar pb-24">
        <div className="space-y-4">
          {others.map((user) => (
            <div 
              key={user.rank} 
              className="flex items-center gap-4 p-4 rounded-[24px] border border-gray-50 bg-white hover:border-emerald-200 transition-all shadow-sm"
            >
              <span className="w-8 font-black text-sm text-gray-400">#{user.rank}</span>
              <img src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} className="w-10 h-10 rounded-xl border-2 border-white shadow-sm object-cover" alt={user.name} />
              <div className="flex-grow">
                <h4 className="font-black text-sm text-gray-900 truncate">{user.name}</h4>
                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase">
                  <Star size={10} fill="currentColor" /> {user.totalPoints || 0} পয়েন্ট
                </div>
              </div>
              <div className="text-emerald-600 text-xs font-black">
                <ChevronUp size={14} className="inline mr-0.5" /> 
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <div className="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-xs">
              লিডারবোর্ড লোড করা সম্ভব হচ্ছে না
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PodiumItem = ({ user, order, height, medalColor, isWinner }: any) => (
  <div className={`flex flex-col items-center ${order === 2 ? 'z-10' : 'opacity-90'}`}>
    <div className={`relative mb-2 ${isWinner ? 'scale-110' : 'scale-95'}`}>
      <img src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} className="w-16 h-16 rounded-[20px] border-4 border-white shadow-lg object-cover bg-white" alt={user.name} />
      <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center ${medalColor}`}>
        <Medal size={16} fill="currentColor" />
      </div>
    </div>
    <div className={`${height} w-20 bg-white/20 rounded-t-2xl backdrop-blur-md flex flex-col items-center justify-center p-2 text-white`}>
      <span className="text-[10px] font-black uppercase truncate w-full text-center mb-1">{user.name}</span>
      <span className="text-xs font-black">{user.totalPoints || 0}</span>
    </div>
  </div>
);

export default LeaderboardTab;
