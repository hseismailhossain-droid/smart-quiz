
import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Star, ChevronUp, Loader2, User as UserIcon } from 'lucide-react';
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
    <div className="min-h-full bg-emerald-800 flex items-center justify-center">
      <Loader2 className="text-white animate-spin" size={48} />
    </div>
  );

  const topThree = users.slice(0, 3);
  const others = users.slice(3);

  // Sorting for podium display: [2nd, 1st, 3rd]
  const podiumOrder = [];
  if (topThree[1]) podiumOrder.push(topThree[1]);
  if (topThree[0]) podiumOrder.push(topThree[0]);
  if (topThree[2]) podiumOrder.push(topThree[2]);

  return (
    <div className="min-h-full bg-emerald-800 flex flex-col font-['Hind_Siliguri'] overflow-hidden">
      <div className="p-6 text-white text-center pb-12 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-700/50 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="absolute top-20 left-0 w-24 h-24 bg-emerald-700/30 rounded-full blur-2xl -ml-12"></div>
        
        <h2 className="text-2xl font-black mb-10 relative z-10">লিডারবোর্ড</h2>
        
        {/* Top 3 Podium */}
        <div className="flex justify-center items-end gap-2 mb-4 h-64 relative z-10">
          {podiumOrder.map((user, idx) => {
            const isWinner = user.rank === 1;
            const isSecond = user.rank === 2;
            const isThird = user.rank === 3;
            
            let height = "h-24";
            let medalColor = "text-orange-400";
            if (isWinner) {
              height = "h-40";
              medalColor = "text-yellow-400";
            } else if (isSecond) {
              height = "h-32";
              medalColor = "text-gray-300";
            }

            return (
              <PodiumItem 
                key={user.rank}
                user={user} 
                height={height} 
                medalColor={medalColor} 
                isWinner={isWinner} 
              />
            );
          })}
        </div>
      </div>

      <div className="flex-grow bg-white rounded-t-[48px] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] overflow-y-auto no-scrollbar pb-32">
        <div className="space-y-3">
          {others.map((user) => (
            <div 
              key={user.id || user.rank} 
              className="flex items-center gap-4 p-4 rounded-[28px] bg-slate-50/50 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all duration-300 group"
            >
              <div className="w-10 text-center">
                <span className="font-black text-sm text-slate-400 group-hover:text-emerald-600 transition-colors">#{user.rank}</span>
              </div>
              
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden shrink-0 flex items-center justify-center">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} className="w-full h-full object-cover" alt={user.name} onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`;
                  }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                    <UserIcon size={20} />
                  </div>
                )}
              </div>

              <div className="flex-grow">
                <h4 className="font-black text-sm text-slate-800 truncate">{user.name || 'Anonymous'}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center">
                    <Star size={10} className="text-amber-600" fill="currentColor" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{user.totalPoints || 0} পয়েন্ট</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                  <ChevronUp size={14} />
                </div>
              </div>
            </div>
          ))}
          
          {users.length === 0 && (
            <div className="py-24 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <Trophy size={40} className="text-slate-200" />
              </div>
              <p className="text-slate-300 font-black uppercase tracking-widest text-[10px]">লিডারবোর্ড এখনো আপডেট করা হয়নি</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PodiumItem = ({ user, height, medalColor, isWinner }: any) => {
  const avatarSeed = user.name ? encodeURIComponent(user.name) : Math.random().toString();
  const avatarUrl = user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`;

  return (
    <div className={`flex flex-col items-center transition-all duration-500 ${isWinner ? 'z-10' : 'opacity-90'}`}>
      <div className={`relative mb-3 ${isWinner ? 'scale-110 -translate-y-2' : 'scale-90'}`}>
        <div className={`w-16 h-16 md:w-20 md:h-20 rounded-[28px] border-4 border-white shadow-2xl overflow-hidden bg-slate-100 flex items-center justify-center`}>
          <img 
            src={avatarUrl} 
            className="w-full h-full object-cover" 
            alt={user.name}
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`;
            }}
          />
        </div>
        <div className={`absolute -bottom-2 -right-2 w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white shadow-lg flex items-center justify-center ${medalColor} border border-slate-50`}>
          <Medal size={isWinner ? 22 : 18} fill="currentColor" />
        </div>
      </div>
      
      <div className={`${height} w-24 bg-white/10 rounded-t-[32px] backdrop-blur-md flex flex-col items-center justify-center p-3 text-white border-x border-t border-white/20 shadow-[0_-10px_20px_rgba(0,0,0,0.1)]`}>
        <span className="text-[10px] font-black uppercase truncate w-full text-center mb-1 leading-tight">{user.name || 'Anonymous'}</span>
        <div className="flex items-center gap-1">
          <Star size={10} className="text-amber-400" fill="currentColor" />
          <span className="text-xs font-black">{user.totalPoints || 0}</span>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardTab;
