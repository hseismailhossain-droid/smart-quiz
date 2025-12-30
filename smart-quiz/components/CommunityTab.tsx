
import React, { useState, useRef, useEffect, memo } from 'react';
import { 
  Heart, MessageCircle, Globe, Send, Trash2, Edit3, Eye, X, 
  Ghost, Camera, Plus, Loader2, Share2, Youtube, Facebook, 
  Link as LinkIcon, Smile, MoreHorizontal, ImageIcon,
  CheckCircle2, PlayCircle, MessageSquare, Sparkles, LayoutGrid,
  AtSign, Reply, ShieldAlert, MoreVertical, ThumbsUp
} from 'lucide-react';
import { Post, UserProfile, Comment as CommentType, Story } from '../types';
import { db, auth } from '../services/firebase';
import { 
  collection, query, onSnapshot, addDoc, serverTimestamp, 
  deleteDoc, doc, updateDoc, arrayUnion, where, limit, 
  increment, arrayRemove, orderBy, getDoc
} from 'firebase/firestore';

// --- Memoized PostCard for fast list rendering ---
const PostCard = memo(({ post, onLike, onAddComment, onDeletePost, onDeleteComment, onShare, currentUserId }: any) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<any>(null);

  const isLiked = post.likedBy?.includes(currentUserId);
  const isOwner = post.uid === currentUserId;
  const displayName = post.isAnonymous ? 'বেনামী ইউজার' : post.userName;
  const displayAvatar = post.isAnonymous ? "https://api.dicebear.com/7.x/bottts/svg?seed=anon" : (post.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.userName}`);

  return (
    <div className={`bg-white shadow-sm border rounded-3xl overflow-hidden mb-5 transition-all ${post.isAnonymous ? 'border-indigo-100 bg-indigo-50/5' : 'border-gray-100'}`}>
      <div className="p-5 flex justify-between items-start">
        <div className="flex items-center gap-4">
          <img src={displayAvatar} loading="lazy" className="w-11 h-11 rounded-2xl border bg-gray-50 object-cover shadow-sm ring-2 ring-slate-50" alt="" />
          <div>
            <h4 className="font-black text-[15px] font-hind flex items-center gap-1.5 text-slate-800">
              {displayName}
              {post.isAnonymous && <Ghost size={12} className="text-indigo-400" />}
            </h4>
            <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 font-hind uppercase tracking-widest">
              {post.time} • <Globe size={10} /> • <Eye size={10} /> {post.views || 0}
            </p>
          </div>
        </div>
        {isOwner && (
          <button onClick={() => onDeletePost(post.id)} className="p-2.5 text-rose-400 hover:bg-rose-50 rounded-xl transition-colors"><Trash2 size={18} /></button>
        )}
      </div>

      <div className="px-5 pb-4 text-[14px] leading-relaxed font-hind text-slate-700 whitespace-pre-wrap font-medium">
        {post.content}
      </div>

      {post.image && (
        <div className="bg-slate-50 border-y max-h-[450px] overflow-hidden flex justify-center">
          <img src={post.image} loading="lazy" className="w-full object-contain" alt="Post" />
        </div>
      )}

      {post.video && (
        <div className="bg-black border-y flex justify-center">
          <video src={post.video} preload="metadata" controls className="w-full max-h-[450px]" />
        </div>
      )}

      <div className="px-5 py-4 flex justify-between text-slate-400 text-[10px] border-b mx-2 font-hind font-bold">
        <div className="flex items-center gap-1.5">
          <div className="bg-blue-600 p-1 rounded-full shadow-sm">
            <ThumbsUp size={8} fill="white" className="text-white" />
          </div>
          <span className="text-slate-500">{post.likes || 0} লাইক</span>
        </div>
        <button onClick={() => setShowComments(!showComments)} className="hover:text-blue-600 transition-colors">
          {post.comments?.length || 0} মতামত
        </button>
      </div>

      <div className="flex px-2 py-1.5">
        <button onClick={() => onLike(post.id)} className={`flex-1 flex justify-center items-center gap-2 py-3 hover:bg-slate-50 rounded-2xl font-black text-[11px] transition-all ${isLiked ? 'text-blue-600 bg-blue-50/50' : 'text-slate-500'}`}>
          <ThumbsUp size={16} fill={isLiked ? 'currentColor' : 'none'} /> লাইক
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex-1 flex justify-center items-center gap-2 py-3 hover:bg-slate-50 rounded-2xl text-slate-500 font-black text-[11px] transition-all">
          <MessageCircle size={16} /> মতামত
        </button>
        <button onClick={() => onShare(post)} className="flex-1 flex justify-center items-center gap-2 py-3 hover:bg-slate-50 rounded-2xl text-slate-500 font-black text-[11px] transition-all">
          <Share2 size={16} /> শেয়ার
        </button>
      </div>

      {showComments && (
        <div className="px-5 pb-5 bg-slate-50/30 border-t animate-in slide-in-from-top-2">
          <div className="pt-5 space-y-4 max-h-72 overflow-y-auto no-scrollbar">
            {post.comments?.map((comment: any) => (
              <div key={comment.id} className="flex gap-3 animate-in fade-in">
                <img src={post.isAnonymous ? "https://api.dicebear.com/7.x/bottts/svg?seed=anon" : (comment.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.userName}`)} className="w-8 h-8 rounded-xl border object-cover" alt=""/>
                <div className="flex-1 min-w-0">
                  <div className="bg-white border border-slate-100 rounded-2xl px-4 py-2.5 inline-block shadow-sm max-w-full">
                    <p className="font-black text-[10px] text-blue-900 mb-0.5">{post.isAnonymous ? 'ইউজার' : comment.userName}</p>
                    <p className="text-[13px] text-slate-600 leading-snug">{comment.text}</p>
                  </div>
                  <div className="flex items-center gap-4 ml-1 mt-1 text-[9px] font-black text-slate-400 uppercase">
                    <span>{comment.time || 'এখন'}</span>
                    <button onClick={() => setReplyTo(comment)} className="text-blue-600 hover:underline">রিপ্লাই</button>
                    {(comment.uid === currentUserId || isOwner) && (
                      <button onClick={() => onDeleteComment(post.id, comment)} className="text-rose-500 hover:underline">ডিলিট</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <form onSubmit={(e) => { e.preventDefault(); if(commentText.trim()) { onAddComment(post.id, commentText, replyTo); setCommentText(''); setReplyTo(null); } }} className="flex flex-col gap-2 mt-5">
            {replyTo && (
              <div className="flex items-center justify-between bg-blue-50 px-4 py-2 rounded-xl text-[10px] text-blue-600 font-black animate-in slide-in-from-bottom-2">
                <span>রিপ্লাই: {post.isAnonymous ? 'ইউজার' : replyTo.userName}</span>
                <button type="button" onClick={() => setReplyTo(null)} className="p-1"><X size={12}/></button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="আপনার মতামত লিখুন..." className="flex-1 bg-white border border-slate-200 rounded-2xl py-3 px-5 outline-none text-sm font-medium focus:border-blue-300 transition-all shadow-inner" />
              <button type="submit" className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all"><Send size={18} /></button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
});

const CommunityTab: React.FC<{ user?: UserProfile }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'public' | 'anonymous' | 'messages'>('public');
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  const [showComposer, setShowComposer] = useState(false);
  const [activeStory, setActiveStory] = useState<any | null>(null);
  const [postContent, setPostContent] = useState('');
  const [mediaFile, setMediaFile] = useState<{type: 'image' | 'video', url: string} | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{show: boolean, type: 'post' | 'story' | 'comment' | 'chat_everyone' | 'chat_me', id: any, postId?: string} | null>(null);
  
  const [chatInput, setChatInput] = useState('');
  const [chatReplyTo, setChatReplyTo] = useState<any>(null);

  const storyInput = useRef<HTMLInputElement>(null);
  const postInput = useRef<HTMLInputElement>(null);

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  useEffect(() => {
    setLoading(true);
    const isAnon = activeTab === 'anonymous';
    const qPosts = query(collection(db, 'posts'), where('isAnonymous', '==', isAnon), limit(50));

    const unsubPosts = onSnapshot(qPosts, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Post))
        .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
        .slice(0, 25);
      setPosts(data);
      setLoading(false);
    });
    
    const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const unsubStories = onSnapshot(query(collection(db, 'stories'), where('timestamp_ms', '>', dayAgo), limit(25)), (snap) => {
      const s = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setStories(s.sort((a:any, b:any) => b.timestamp_ms - a.timestamp_ms));
    });

    let unsubChat: any = null;
    if (activeTab === 'messages') {
      unsubChat = onSnapshot(query(collection(db, 'global_chat'), orderBy('timestamp', 'desc'), limit(30)), (snap) => {
        const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const visibleMsgs = msgs.filter((m: any) => !m.hiddenFor?.includes(auth.currentUser?.uid));
        setChatMessages(visibleMsgs.reverse());
      });
    }

    return () => { unsubPosts(); unsubStories(); if (unsubChat) unsubChat(); };
  }, [activeTab]);

  const handleLike = async (id: string) => {
    const uid = auth.currentUser?.uid; if (!uid) return;
    const post = posts.find(p => p.id === id); if (!post) return;
    const isLiked = post.likedBy?.includes(uid);
    setPosts(prev => prev.map(p => p.id === id ? {...p, likes: isLiked ? p.likes - 1 : p.likes + 1, likedBy: isLiked ? p.likedBy.filter(u => u !== uid) : [...p.likedBy, uid]} : p));
    await updateDoc(doc(db, 'posts', id), { likedBy: isLiked ? arrayRemove(uid) : arrayUnion(uid), likes: increment(isLiked ? -1 : 1) });
  };

  const handleAddComment = async (postId: string, text: string, replyToObj?: any) => {
    if (!auth.currentUser) return;
    const isAnon = activeTab === 'anonymous';
    const comment = { 
      id: Math.random().toString(36).substr(2, 9), 
      uid: auth.currentUser.uid, 
      userName: isAnon ? "ইউজার" : (user?.name || "ইউজার"), 
      userAvatar: isAnon ? "" : (user?.avatarUrl || ""), 
      text, time: "এখন", timestamp: Date.now(),
      replyTo: replyToObj ? { uid: replyToObj.uid, userName: replyToObj.userName } : null
    };
    await updateDoc(doc(db, 'posts', postId), { comments: arrayUnion(comment) });
  };

  const handleShare = async (post: Post) => {
    const shareUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    const shareText = `${post.isAnonymous ? 'বেনামী ইউজার' : post.userName} এর একটি পোস্ট:\n"${post.content.substring(0, 150)}..."\n\nSmart Quiz Pro অ্যাপ থেকে শেয়ার করা হয়েছে।`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Smart Quiz Pro', text: shareText, url: shareUrl });
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          navigator.clipboard.writeText(`${shareText}\nLink: ${shareUrl}`);
          setToast("লিঙ্ক কপি করা হয়েছে!");
        }
      }
    } else {
      navigator.clipboard.writeText(`${shareText}\nLink: ${shareUrl}`);
      setToast("লিঙ্ক কপি করা হয়েছে!");
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !auth.currentUser) return;
    const text = chatInput.trim(); setChatInput(''); 
    await addDoc(collection(db, 'global_chat'), { uid: auth.currentUser.uid, userName: user?.name || "ইউজার", userAvatar: user?.avatarUrl || "", text, replyTo: chatReplyTo ? { id: chatReplyTo.id, userName: chatReplyTo.userName, text: chatReplyTo.text } : null, hiddenFor: [], timestamp: serverTimestamp() });
    setChatReplyTo(null);
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    const { type, id, postId } = confirmDelete;
    setConfirmDelete(null); setActiveStory(null);
    try {
      if (type === 'post') { setPosts(prev => prev.filter(p => p.id !== id)); await deleteDoc(doc(db, 'posts', id)); }
      else if (type === 'story') { setStories(prev => prev.filter(s => s.id !== id)); await deleteDoc(doc(db, 'stories', id)); }
      else if (type === 'comment' && postId) { await updateDoc(doc(db, 'posts', postId), { comments: arrayRemove(id) }); }
      else if (type === 'chat_everyone') { await deleteDoc(doc(db, 'global_chat', id)); }
      else if (type === 'chat_me') { await updateDoc(doc(db, 'global_chat', id), { hiddenFor: arrayUnion(auth.currentUser?.uid) }); }
      setToast("সফলভাবে মুছে ফেলা হয়েছে!");
    } catch (e) { console.error(e); }
  };

  const handlePublishPost = async () => {
    if ((!postContent.trim() && !mediaFile) || isPosting) return;
    setIsPosting(true);
    const isAnon = activeTab === 'anonymous';
    try {
      await addDoc(collection(db, 'posts'), { 
        uid: auth.currentUser?.uid, 
        userName: isAnon ? "বেনামী ইউজার" : (user?.name || "ইউজার"), 
        userAvatar: isAnon ? "" : (user?.avatarUrl || ""), 
        content: postContent, 
        image: mediaFile?.type === 'image' ? mediaFile.url : null, 
        video: mediaFile?.type === 'video' ? mediaFile.url : null, 
        isAnonymous: isAnon, likes: 0, likedBy: [], comments: [], views: 0, timestamp: serverTimestamp(), 
        time: "এইমাত্র"
      });
      setPostContent(''); setMediaFile(null); setShowComposer(false);
      setToast("আপনার পোস্টটি লাইভ হয়েছে!");
    } catch (error) { console.error(error); alert("পাবলিশ ব্যর্থ হয়েছে!"); } finally { setIsPosting(false); }
  };

  return (
    <div className="min-h-screen pb-32 font-hind bg-slate-50 transition-all no-scrollbar">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[4000] bg-emerald-800 text-white px-6 py-3.5 rounded-2xl text-[11px] font-black shadow-2xl animate-in slide-in-from-top-10 duration-500 border border-emerald-700/50 backdrop-blur-sm">
           {toast}
        </div>
      )}

      {/* Modern Deletion Confirmation */}
      <div className="fixed inset-0 bg-black/70 z-[6000] flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in duration-300" style={{ display: confirmDelete?.show ? 'flex' : 'none' }}>
        <div className="bg-white w-full max-w-xs rounded-[48px] p-10 text-center shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner"><Trash2 size={40}/></div>
          <h4 className="text-2xl font-black text-slate-900 mb-2">মুছে ফেলবেন?</h4>
          <p className="text-xs text-slate-400 font-bold mb-10 leading-relaxed px-2">এই কন্টেন্টটি চিরতরে মুছে যাবে এবং এটি আর ফিরে পাওয়া সম্ভব নয়।</p>
          <div className="flex flex-col gap-3">
            <button onClick={executeDelete} className="w-full bg-rose-600 text-white py-5 rounded-[24px] font-black text-sm shadow-xl shadow-rose-600/20 active:scale-95 transition-all">হ্যাঁ, ডিলিট করুন</button>
            <button onClick={() => setConfirmDelete(null)} className="w-full bg-slate-100 text-slate-500 py-5 rounded-[24px] font-black text-sm active:scale-95 transition-all hover:bg-slate-200">বাতিল</button>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b flex h-14 shadow-sm">
        <button onClick={() => setActiveTab('public')} className={`flex-1 flex items-center justify-center gap-2 font-black text-xs transition-all border-b-2 ${activeTab === 'public' ? 'border-emerald-600 text-emerald-600 bg-emerald-50/20' : 'border-transparent text-slate-400'}`}>
          <Globe size={16} /> পাবলিক
        </button>
        <button onClick={() => setActiveTab('anonymous')} className={`flex-1 flex items-center justify-center gap-2 font-black text-xs transition-all border-b-2 ${activeTab === 'anonymous' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20' : 'border-transparent text-slate-400'}`}>
          <Ghost size={16} /> বেনামী
        </button>
        <button onClick={() => setActiveTab('messages')} className={`flex-1 flex items-center justify-center gap-2 font-black text-xs transition-all border-b-2 ${activeTab === 'messages' ? 'border-blue-600 text-blue-600 bg-blue-50/20' : 'border-transparent text-slate-400'}`}>
          <MessageSquare size={16} /> চ্যাট
        </button>
      </div>

      {activeTab === 'messages' ? (
        <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-500">
           <div className="flex-grow overflow-y-auto p-5 space-y-6 no-scrollbar">
              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex gap-3 ${msg.uid === auth.currentUser?.uid ? 'flex-row-reverse' : ''} animate-in slide-in-from-bottom-4`}>
                   <img src={msg.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.userName}`} className="w-8 h-8 rounded-xl border object-cover shrink-0 shadow-sm" alt=""/>
                   <div className={`max-w-[80%] ${msg.uid === auth.currentUser?.uid ? 'items-end text-right' : ''}`}>
                      <div className={`p-4 rounded-[24px] text-[13px] font-bold shadow-sm ${msg.uid === auth.currentUser?.uid ? 'bg-emerald-700 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
                         {msg.text}
                      </div>
                      <p className="text-[8px] font-black text-slate-300 mt-1 uppercase tracking-widest">{msg.userName}</p>
                   </div>
                </div>
              ))}
           </div>
           <div className="p-4 bg-white border-t sticky bottom-0 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
              <div className="flex gap-2 bg-slate-50 p-2 rounded-[28px] border border-slate-100">
                 <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="মেসেজ লিখুন..." className="flex-grow bg-transparent px-4 py-2 font-bold text-sm outline-none" />
                 <button onClick={handleSendChat} className="w-12 h-12 bg-emerald-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-700/20 active:scale-90 transition-all"><Send size={18}/></button>
              </div>
           </div>
        </div>
      ) : (
        <div className="max-w-md mx-auto">
          {activeTab === 'anonymous' && (
            <div className="mx-4 mt-6 p-5 bg-indigo-900 rounded-[32px] text-white flex items-center gap-5 border border-indigo-700/50 shadow-xl relative overflow-hidden animate-in slide-in-from-top-4 duration-500">
               <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12"></div>
               <div className="p-3 bg-indigo-800 rounded-2xl shadow-inner"><Ghost size={28} className="text-indigo-200" /></div>
               <div>
                 <h4 className="font-black text-sm uppercase tracking-[0.15em]">গোপন কর্নার</h4>
                 <p className="text-[10px] opacity-70 font-bold mt-0.5">আপনার নাম ও পরিচয় এখানে দৃশ্যমান হবে না।</p>
               </div>
            </div>
          )}

          {activeTab === 'public' && (
            <div className="bg-white p-5 py-8 flex gap-5 overflow-x-auto no-scrollbar border-b">
               <button onClick={() => storyInput.current?.click()} className="shrink-0 w-[72px] flex flex-col items-center gap-2 group">
                  <div className="w-[64px] h-[64px] rounded-[28px] bg-slate-50 border-2 border-dashed border-emerald-200 flex flex-col items-center justify-center group-active:scale-95 transition-all shadow-inner">
                     <Plus size={20} className="text-emerald-600"/>
                  </div>
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mt-1">আপনার</span>
               </button>
               {stories.map(s => (
                 <button key={s.id} onClick={() => setActiveStory(s)} className="shrink-0 flex flex-col items-center gap-2 group animate-in zoom-in-95">
                    <div className="w-[64px] h-[64px] rounded-[28px] p-0.5 border-2 border-emerald-500 overflow-hidden bg-white shadow-md group-active:scale-95 transition-all ring-4 ring-emerald-50">
                       <img src={s.media} loading="lazy" className="w-full h-full object-cover rounded-[24px]" alt=""/>
                    </div>
                    <p className="text-[9px] font-black text-slate-500 truncate w-16 text-center tracking-tight">
                      {s.uid === auth.currentUser?.uid ? 'আমার স্টোরি' : s.userName?.split(' ')[0]}
                    </p>
                 </button>
               ))}
               <input type="file" ref={storyInput} className="hidden" accept="image/*,video/*" onChange={(e) => {
                 const file = e.target.files?.[0]; if (!file) return;
                 const r = new FileReader(); r.onloadend = async () => {
                    await addDoc(collection(db, 'stories'), { uid: auth.currentUser?.uid, userName: user?.name, userAvatar: user?.avatarUrl, media: r.result, mediaType: file.type.startsWith('video') ? 'video' : 'image', timestamp_ms: Date.now() });
                    setToast("আপনার স্টোরি আপলোড হয়েছে!");
                 }; r.readAsDataURL(file);
               }} />
            </div>
          )}

          <div className="mx-4 mt-6 p-4 bg-white rounded-[32px] border border-slate-100 shadow-sm flex gap-4 items-center animate-in slide-in-from-bottom-4 duration-500">
             <img src={activeTab === 'anonymous' ? "https://api.dicebear.com/7.x/bottts/svg?seed=anon" : user?.avatarUrl} className="w-11 h-11 rounded-2xl border-2 border-emerald-50 object-cover shadow-sm shrink-0" alt=""/>
             <button onClick={() => setShowComposer(true)} className="flex-grow text-left py-4 px-6 bg-slate-50 text-slate-400 rounded-2xl text-[12px] font-bold hover:bg-slate-100 transition-colors shadow-inner">আপনার মনে কি চলছে?</button>
             <button onClick={() => postInput.current?.click()} className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl active:scale-90 transition-all shadow-sm"><Camera size={22}/></button>
             <input type="file" ref={postInput} className="hidden" accept="image/*,video/*" onChange={(e) => {
              const file = e.target.files?.[0]; if (!file) return;
              const r = new FileReader(); r.onloadend = () => { setMediaFile({ type: file.type.startsWith('video') ? 'video' : 'image', url: r.result as string }); setShowComposer(true); };
              r.readAsDataURL(file);
            }} />
          </div>

          <div className="px-4 mt-8 space-y-2 pb-10">
            {posts.map(post => (
              <PostCard 
                key={post.id} post={post} currentUserId={auth.currentUser?.uid || ''}
                onLike={handleLike} onAddComment={handleAddComment}
                onDeletePost={(id: string) => setConfirmDelete({ show: true, type: 'post', id })}
                onDeleteComment={(postId: string, comment: any) => setConfirmDelete({ show: true, type: 'comment', id: comment, postId })}
                onShare={handleShare}
              />
            ))}
            {loading && <div className="py-24 text-center"><Loader2 className="animate-spin mx-auto text-emerald-700" size={32}/></div>}
            {!loading && posts.length === 0 && (
              <div className="py-32 text-center text-slate-300">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4"><LayoutGrid size={32}/></div>
                 <p className="font-black text-[10px] uppercase tracking-[0.3em]">কোনো পোস্ট পাওয়া যায়নি</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* High-End Story Viewer */}
      {activeStory && (
        <div className="fixed inset-0 bg-black z-[5000] flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
           <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
              <div className="flex items-center gap-4">
                 <img src={activeStory.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeStory.userName}`} className="w-11 h-11 rounded-2xl border-2 border-white/50 shadow-lg object-cover" alt=""/>
                 <div className="drop-shadow-md">
                    <p className="text-white font-black text-[15px] leading-tight">{activeStory.userName || 'ইউজার'}</p>
                    <p className="text-emerald-400 text-[9px] font-black uppercase tracking-widest mt-0.5">{activeStory.uid === auth.currentUser?.uid ? 'আপনার স্টোরি' : 'Story'}</p>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                {activeStory.uid === auth.currentUser?.uid && (
                  <button 
                    onClick={() => setConfirmDelete({ show: true, type: 'story', id: activeStory.id })}
                    className="p-3.5 bg-rose-600/90 text-white rounded-2xl backdrop-blur-md active:scale-90 transition-all shadow-xl hover:bg-rose-700"
                    aria-label="Delete Story"
                  >
                    <Trash2 size={20}/>
                  </button>
                )}
                <button onClick={() => setActiveStory(null)} className="p-3.5 bg-white/20 text-white rounded-2xl backdrop-blur-md active:scale-90 transition-all hover:bg-white/30">
                  <X size={24}/>
                </button>
              </div>
           </div>
           
           <div className="w-full h-full flex items-center justify-center bg-black/95">
             <div className="absolute top-0 left-0 right-0 h-1 z-30 flex gap-1 p-2">
                <div className="flex-1 h-full bg-white/30 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 w-full animate-progress-story"></div>
                </div>
             </div>
             
             {activeStory.mediaType === 'video' ? (
               <video src={activeStory.media} autoPlay controls={false} className="max-w-full max-h-full shadow-2xl" onEnded={() => setActiveStory(null)} />
             ) : (
               <img src={activeStory.media} className="max-w-full max-h-[85vh] object-contain shadow-2xl animate-in zoom-in-100 duration-1000" alt=""/>
             )}
           </div>

           <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/30 text-[10px] font-black uppercase tracking-[0.5em] flex items-center gap-3 animate-pulse">
              <Sparkles size={14}/> Close View
           </div>
        </div>
      )}

      {showComposer && (
        <div className="fixed inset-0 bg-white z-[5000] flex flex-col animate-in slide-in-from-bottom duration-500">
           <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10 shadow-sm">
              <button onClick={() => { setShowComposer(false); setMediaFile(null); }} className="p-3 bg-slate-50 text-slate-500 rounded-2xl hover:text-rose-500 transition-all active:scale-90"><X size={24}/></button>
              <h3 className="font-black text-slate-800 uppercase tracking-[0.2em] text-[11px]">পোস্ট তৈরি করুন</h3>
              <button onClick={handlePublishPost} disabled={isPosting} className="bg-emerald-700 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-700/20 active:scale-95 disabled:opacity-50 transition-all">
                {isPosting ? 'পাবলিশ হচ্ছে...' : 'পাবলিশ'}
              </button>
           </div>
           <div className="p-8 flex-grow overflow-y-auto no-scrollbar">
              <div className="flex items-center gap-4 mb-8">
                 <img src={activeTab === 'anonymous' ? "https://api.dicebear.com/7.x/bottts/svg?seed=anon" : user?.avatarUrl} className="w-12 h-12 rounded-2xl object-cover shadow-sm" alt=""/>
                 <div>
                    <p className="font-black text-slate-800 text-sm">{activeTab === 'anonymous' ? 'বেনামী ইউজার' : user?.name}</p>
                    <div className="bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1 w-max mt-0.5">
                       <Globe size={10} className="text-slate-400"/>
                       <span className="text-[8px] font-black text-slate-500 uppercase">Public</span>
                    </div>
                 </div>
              </div>
              <textarea 
                value={postContent} 
                onChange={(e)=>setPostContent(e.target.value)} 
                placeholder="আপনার ভাবনাগুলো এখানে লিখুন..." 
                className="w-full text-xl outline-none resize-none min-h-[200px] font-hind text-slate-800 font-medium placeholder:text-slate-200 leading-relaxed" 
                autoFocus 
              />
              {mediaFile && (
                <div className="relative mt-10 rounded-[40px] overflow-hidden border-4 border-slate-50 shadow-2xl animate-in zoom-in-95">
                   {mediaFile.type === 'image' ? <img src={mediaFile.url} className="w-full" alt=""/> : <video src={mediaFile.url} controls className="w-full" />}
                   <button onClick={() => setMediaFile(null)} className="absolute top-6 right-6 p-2.5 bg-black/50 text-white rounded-2xl backdrop-blur-md active:scale-90 transition-all"><X size={18}/></button>
                </div>
              )}
           </div>
        </div>
      )}
      
      <style>{`
        @keyframes progress-story {
          from { width: 0%; }
          to { width: 100%; }
        }
        .animate-progress-story {
          animation: progress-story 10s linear forwards;
        }
      `}</style>
    </div>
  );
};

export default CommunityTab;
