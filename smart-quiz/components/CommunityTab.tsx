
import React, { useState, useRef, useEffect } from 'react';
import { 
  Heart, MessageCircle, Globe, Send, Trash2, Edit3, Eye, X, 
  Ghost, Camera, Plus, Loader2, Share2, Youtube, Facebook, 
  Link as LinkIcon, Smile, MoreHorizontal, Image as ImageIcon,
  CheckCircle2, PlayCircle, MessageSquare, Sparkles, LayoutGrid,
  AtSign, Reply, ShieldAlert, MoreVertical
} from 'lucide-react';
import { Post, UserProfile, Comment as CommentType, Story } from '../types';
import { db, auth } from '../services/firebase';
import { 
  collection, query, onSnapshot, addDoc, serverTimestamp, 
  deleteDoc, doc, updateDoc, arrayUnion, where, limit, 
  increment, arrayRemove, orderBy, getDoc
} from 'firebase/firestore';

// --- Reusable Confirm Modal ---
const ConfirmModal = ({ show, title, message, onConfirm, onCancel }: any) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-[3000] flex items-center justify-center p-6 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xs rounded-[32px] p-8 text-center animate-in zoom-in-95 duration-200 shadow-2xl">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6"><Trash2 size={32}/></div>
        <h4 className="text-xl font-black text-slate-900 mb-2">{title}</h4>
        <p className="text-xs text-slate-400 font-bold mb-8 leading-relaxed">{message}</p>
        <div className="flex flex-col gap-3">
          <button onClick={onConfirm} className="w-full bg-rose-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-all">হ্যাঁ, মুছে ফেলুন</button>
          <button onClick={onCancel} className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold text-sm active:scale-95 transition-all">বাতিল</button>
        </div>
      </div>
    </div>
  );
};

// --- PostCard Component ---
const PostCard = ({ post, onLike, onAddComment, onDeletePost, onDeleteComment, currentUserId }: any) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<any>(null);

  useEffect(() => {
    const viewPost = async () => {
      if (auth.currentUser && !post.viewedBy?.includes(currentUserId)) {
        try {
          await updateDoc(doc(db, 'posts', post.id), {
            views: increment(1),
            viewedBy: arrayUnion(currentUserId)
          });
        } catch (e) { console.warn(e); }
      }
    };
    viewPost();
  }, [post.id]);

  const isLiked = post.likedBy?.includes(currentUserId);
  const isOwner = post.uid === currentUserId;

  const displayName = post.isAnonymous ? 'বেনামী ইউজার' : post.userName;
  const displayAvatar = post.isAnonymous ? "https://api.dicebear.com/7.x/bottts/svg?seed=anon" : (post.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.userName}`);

  return (
    <div className={`bg-white shadow-sm border rounded-xl overflow-hidden mb-4 transition-all ${post.isAnonymous ? 'border-indigo-200 bg-indigo-50/10' : 'border-gray-100'}`}>
      <div className="p-4 flex justify-between items-start">
        <div className="flex items-center gap-3">
          <img src={displayAvatar} className="w-10 h-10 rounded-full border bg-gray-50 object-cover shadow-sm" alt="" />
          <div>
            <h4 className="font-bold text-[15px] font-hind flex items-center gap-1.5">
              {displayName}
              {post.isAnonymous && <Ghost size={12} className="text-indigo-400" />}
            </h4>
            <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5 font-hind uppercase tracking-widest">
              {post.time} • <Globe size={10} /> • <Eye size={10} /> {post.views || 0} ভিউ
            </p>
          </div>
        </div>
        {isOwner && (
          <button onClick={() => onDeletePost(post.id)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-full transition-colors"><Trash2 size={18} /></button>
        )}
      </div>

      <div className="px-4 pb-3 text-[14px] leading-relaxed font-hind text-gray-800 whitespace-pre-wrap">
        {post.content}
      </div>

      {post.image && (
        <div className="bg-gray-50 border-y max-h-[450px] overflow-hidden flex justify-center">
          <img src={post.image} className="w-full object-contain" alt="Post" />
        </div>
      )}

      {post.video && (
        <div className="bg-black border-y relative group flex justify-center">
          <video src={post.video} controls className="w-full max-h-[450px]" />
        </div>
      )}

      <div className="px-4 py-3 flex justify-between text-gray-500 text-xs border-b mx-2 font-hind font-bold">
        <div className="flex items-center gap-1">
          <div className="bg-blue-600 p-1 rounded-full shadow-sm">
            <Heart size={10} fill="white" className="text-white" />
          </div>
          <span>{post.likes || 0}</span>
        </div>
        <button onClick={() => setShowComments(!showComments)} className="hover:underline">
          {post.comments?.length || 0} টি মতামত
        </button>
      </div>

      <div className="flex px-2 py-1">
        <button onClick={() => onLike(post.id)} className={`flex-1 flex justify-center items-center gap-2 py-2.5 hover:bg-gray-50 rounded-lg font-bold text-xs transition-colors font-hind ${isLiked ? 'text-blue-600' : 'text-gray-500'}`}>
          <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} /> লাইক
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex-1 flex justify-center items-center gap-2 py-2.5 hover:bg-gray-50 rounded-lg text-gray-500 font-bold text-xs font-hind">
          <MessageCircle size={18} /> মতামত
        </button>
      </div>

      {showComments && (
        <div className="px-4 pb-4 bg-slate-50/50 border-t animate-in slide-in-from-top-2">
          <div className="pt-4 space-y-4">
            {post.comments?.map((comment: any) => (
              <div key={comment.id} className="flex gap-3">
                <img src={post.isAnonymous ? "https://api.dicebear.com/7.x/bottts/svg?seed=anon" : (comment.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.userName}`)} className="w-8 h-8 rounded-full border shadow-sm" alt=""/>
                <div className="flex-1">
                  <div className="bg-white border border-gray-100 rounded-2xl px-4 py-2 inline-block shadow-sm">
                    <p className="font-black text-xs font-hind text-blue-900">{post.isAnonymous ? 'ইউজার' : comment.userName}</p>
                    {comment.replyTo && <p className="text-[10px] text-blue-500 font-bold mb-1">@{post.isAnonymous ? 'ইউজার' : comment.replyTo.userName}</p>}
                    <p className="text-[13px] font-hind text-gray-700 leading-tight">{comment.text}</p>
                  </div>
                  <div className="flex items-center gap-4 ml-2 mt-1 text-[10px] font-black text-gray-400 font-hind uppercase">
                    <span>{comment.time || 'এইমাত্র'}</span>
                    <button onClick={() => setReplyTo(comment)} className="text-blue-600">রিপ্লাই</button>
                    {(comment.uid === currentUserId || isOwner) && (
                      <button onClick={() => onDeleteComment(post.id, comment)} className="text-rose-500">ডিলিট</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <form onSubmit={(e) => { e.preventDefault(); if(commentText.trim()) { onAddComment(post.id, commentText, replyTo); setCommentText(''); setReplyTo(null); } }} className="flex flex-col gap-2 mt-6">
            {replyTo && (
              <div className="flex items-center justify-between bg-blue-50 px-4 py-2 rounded-xl text-[10px] text-blue-600 border border-blue-100 font-black">
                <span>রিপ্লাই: <b>{post.isAnonymous ? 'ইউজার' : replyTo.userName}</b></span>
                <button type="button" onClick={() => setReplyTo(null)} className="p-1"><X size={12}/></button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <img src={post.isAnonymous ? "https://api.dicebear.com/7.x/bottts/svg?seed=anon" : (auth.currentUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.currentUser?.email}`)} className="w-8 h-8 rounded-full border shadow-sm" alt=""/>
              <div className="relative flex-1">
                <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="উত্তর দিন..." className="w-full bg-white border border-gray-200 rounded-full py-2.5 px-5 pr-12 outline-none font-hind text-xs font-bold" />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 p-2"><Send size={16} /></button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// --- Main CommunityTab UI ---
const CommunityTab: React.FC<{ user?: UserProfile }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'public' | 'anonymous' | 'messages'>('public');
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showComposer, setShowComposer] = useState(false);
  const [activeStory, setActiveStory] = useState<any | null>(null);
  const [postContent, setPostContent] = useState('');
  const [mediaFile, setMediaFile] = useState<{type: 'image' | 'video', url: string} | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{show: boolean, type: 'post' | 'story' | 'comment' | 'chat_everyone' | 'chat_me', id: any, postId?: string} | null>(null);
  
  const [chatInput, setChatInput] = useState('');
  const [chatReplyTo, setChatReplyTo] = useState<any>(null);
  const [selectedChatMsg, setSelectedChatMsg] = useState<any | null>(null);

  const storyInput = useRef<HTMLInputElement>(null);
  const postInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const trackStoryView = async () => {
      if (!activeStory || !auth.currentUser) return;
      const currentInList = stories.find(s => s.id === activeStory.id);
      if (currentInList && !currentInList.viewers?.includes(auth.currentUser.uid)) {
        try {
          await updateDoc(doc(db, 'stories', activeStory.id), { viewers: arrayUnion(auth.currentUser.uid) });
        } catch (e) { console.warn(e); }
      }
    };
    trackStoryView();
  }, [activeStory?.id]);

  useEffect(() => {
    setLoading(true);
    const isAnon = activeTab === 'anonymous';
    
    const qPosts = query(collection(db, 'posts'), where('isAnonymous', '==', isAnon), limit(40));
    const unsubPosts = onSnapshot(qPosts, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
      docs.sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0));
      setPosts(docs);
      setLoading(false);
    });
    
    const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const qStories = query(collection(db, 'stories'), where('timestamp_ms', '>', dayAgo));
    const unsubStories = onSnapshot(qStories, (snap) => {
      setStories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    let unsubChat: any = null;
    if (activeTab === 'messages') {
      const qChat = query(collection(db, 'global_chat'), orderBy('timestamp', 'desc'), limit(60));
      unsubChat = onSnapshot(qChat, (snap) => {
        const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Filter out messages hidden for me
        const visibleMsgs = msgs.filter((m: any) => !m.hiddenFor?.includes(auth.currentUser?.uid));
        setChatMessages(visibleMsgs.reverse());
      });
    }

    return () => {
      unsubPosts(); unsubStories();
      if (unsubChat) unsubChat();
    };
  }, [activeTab]);

  const handleLike = async (id: string) => {
    const uid = auth.currentUser?.uid; if (!uid) return;
    const post = posts.find(p => p.id === id); if (!post) return;
    const isLiked = post.likedBy?.includes(uid);
    await updateDoc(doc(db, 'posts', id), { 
      likedBy: isLiked ? arrayRemove(uid) : arrayUnion(uid), 
      likes: increment(isLiked ? -1 : 1) 
    });
  };

  const handleAddComment = async (postId: string, text: string, replyToObj?: any) => {
    if (!auth.currentUser) return;
    const isAnon = activeTab === 'anonymous';
    const comment = { 
      id: Math.random().toString(36).substr(2, 9), 
      uid: auth.currentUser.uid, 
      userName: isAnon ? "বেনামী ইউজার" : (user?.name || "ইউজার"), 
      userAvatar: isAnon ? "" : (user?.avatarUrl || ""), 
      text, 
      time: "এইমাত্র",
      timestamp: Date.now(),
      replyTo: replyToObj ? { uid: replyToObj.uid, userName: isAnon ? 'বেনামী' : replyToObj.userName } : null
    };
    await updateDoc(doc(db, 'posts', postId), { comments: arrayUnion(comment) });
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    const { type, id, postId } = confirmDelete;
    try {
      if (type === 'post') await deleteDoc(doc(db, 'posts', id));
      if (type === 'story') await deleteDoc(doc(db, 'stories', id));
      if (type === 'comment' && postId) {
        await updateDoc(doc(db, 'posts', postId), { comments: arrayRemove(id) });
      }
      if (type === 'chat_everyone') {
        await deleteDoc(doc(db, 'global_chat', id));
      }
      if (type === 'chat_me') {
        await updateDoc(doc(db, 'global_chat', id), {
          hiddenFor: arrayUnion(auth.currentUser?.uid)
        });
      }
    } catch (e) {
      console.error(e);
    }
    setConfirmDelete(null);
    setActiveStory(null);
    setSelectedChatMsg(null);
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !auth.currentUser) return;
    await addDoc(collection(db, 'global_chat'), {
      uid: auth.currentUser.uid,
      userName: user?.name || "ইউজার",
      userAvatar: user?.avatarUrl || "",
      text: chatInput.trim(),
      replyTo: chatReplyTo ? { id: chatReplyTo.id, userName: chatReplyTo.userName, text: chatReplyTo.text } : null,
      hiddenFor: [],
      timestamp: serverTimestamp()
    });
    setChatInput(''); setChatReplyTo(null);
  };

  return (
    <div className="min-h-screen pb-32 font-hind bg-slate-50 transition-all">
      <ConfirmModal 
        show={confirmDelete?.show} 
        title="ডিলিট নিশ্চিত করুন" 
        message={confirmDelete?.type === 'chat_everyone' ? "এই মেসেজটি সবার জন্য ডিলিট হয়ে যাবে।" : "আপনি কি এটি মুছে ফেলতে চান?"} 
        onConfirm={executeDelete} 
        onCancel={() => setConfirmDelete(null)} 
      />

      {/* Message Action Sheet */}
      {selectedChatMsg && (
        <div className="fixed inset-0 bg-black/40 z-[3000] flex items-end justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-sm rounded-[32px] p-6 animate-in slide-in-from-bottom-10 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-black text-slate-900">মেসেজ অপশন</h4>
                <button onClick={() => setSelectedChatMsg(null)} className="p-2 bg-slate-50 rounded-full text-slate-400"><X size={20}/></button>
              </div>
              <div className="space-y-2">
                 <button onClick={() => { setChatReplyTo(selectedChatMsg); setChatInput(`@${selectedChatMsg.userName} `); setSelectedChatMsg(null); }} className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors text-slate-700 font-bold">
                    <Reply size={20} className="text-blue-600"/> উত্তর দিন (Reply)
                 </button>
                 <button onClick={() => setConfirmDelete({ show: true, type: 'chat_me', id: selectedChatMsg.id })} className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors text-slate-700 font-bold">
                    <Eye size={20} className="text-slate-400"/> আমার জন্য ডিলিট করুন (Delete for me)
                 </button>
                 {selectedChatMsg.uid === auth.currentUser?.uid && (
                   <button onClick={() => setConfirmDelete({ show: true, type: 'chat_everyone', id: selectedChatMsg.id })} className="w-full flex items-center gap-4 p-4 hover:bg-rose-50 rounded-2xl transition-colors text-rose-600 font-bold">
                      <Trash2 size={20}/> সবার জন্য ডিলিট করুন (Delete for Everyone)
                   </button>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* TABS */}
      <div className="sticky top-0 z-50 bg-white border-b flex h-14 shadow-sm">
        <button onClick={() => setActiveTab('public')} className={`flex-1 flex items-center justify-center gap-2 font-black text-xs transition-all border-b-2 ${activeTab === 'public' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>
          <Globe size={16} /> পাবলিক
        </button>
        <button onClick={() => setActiveTab('anonymous')} className={`flex-1 flex items-center justify-center gap-2 font-black text-xs transition-all border-b-2 ${activeTab === 'anonymous' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}>
          <Ghost size={16} /> বেনামী
        </button>
        <button onClick={() => setActiveTab('messages')} className={`flex-1 flex items-center justify-center gap-2 font-black text-xs transition-all border-b-2 ${activeTab === 'messages' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>
          <MessageSquare size={16} /> মেসেজ
        </button>
      </div>

      {activeTab === 'messages' ? (
        <div className="flex flex-col h-[calc(100vh-140px)]">
           <div className="flex-grow overflow-y-auto p-4 space-y-6 no-scrollbar">
              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex gap-3 ${msg.uid === auth.currentUser?.uid ? 'flex-row-reverse' : ''}`}>
                   <img src={msg.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.userName}`} className="w-8 h-8 rounded-xl border shadow-sm object-cover" alt=""/>
                   <div className={`max-w-[75%] space-y-1 ${msg.uid === auth.currentUser?.uid ? 'items-end' : ''}`}>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mx-1">{msg.userName}</p>
                      <div 
                        onClick={() => setSelectedChatMsg(msg)}
                        className={`p-4 rounded-2xl shadow-sm text-[13px] font-bold relative cursor-pointer active:scale-[0.98] transition-all ${msg.uid === auth.currentUser?.uid ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'}`}
                      >
                         {msg.replyTo && (
                           <div className={`mb-2 p-2 rounded-lg text-[10px] border-l-4 ${msg.uid === auth.currentUser?.uid ? 'bg-blue-700/50 border-white text-blue-50' : 'bg-slate-100 border-blue-500 text-slate-500'}`}>
                             <p className="font-black">@{msg.replyTo.userName}</p>
                             <p className="line-clamp-1">{msg.replyTo.text}</p>
                           </div>
                         )}
                         {msg.text}
                      </div>
                   </div>
                </div>
              ))}
           </div>
           <div className="p-4 bg-white border-t sticky bottom-0 z-10 shadow-2xl">
              {chatReplyTo && (
                <div className="mb-2 p-3 bg-blue-50 rounded-xl flex justify-between items-center animate-in slide-in-from-bottom-2">
                   <div className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">রিপ্লাই: <b>{chatReplyTo.userName}</b></div>
                   <button onClick={() => setChatReplyTo(null)}><X size={14}/></button>
                </div>
              )}
              <div className="flex gap-2">
                 <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="মেসেজ লিখুন..." className="flex-grow bg-slate-50 border p-4 rounded-2xl font-bold text-sm outline-none focus:bg-white transition-all shadow-inner" />
                 <button onClick={handleSendChat} className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90"><Send size={24}/></button>
              </div>
           </div>
        </div>
      ) : (
        <>
          {activeTab === 'anonymous' && (
            <div className="mx-4 mt-4 p-4 bg-indigo-900 rounded-3xl text-white flex items-center gap-4 shadow-xl shadow-indigo-900/20 border border-indigo-700/50 animate-in fade-in duration-500">
               <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                 <Ghost size={28} className="text-indigo-200" />
               </div>
               <div>
                 <h4 className="font-black text-sm uppercase tracking-wider">ইনকগনিটো মোড অন</h4>
                 <p className="text-[10px] opacity-70 font-bold">এখানে সবার প্রোফাইল পরিচয় হাইড থাকবে।</p>
               </div>
            </div>
          )}

          {/* STORIES */}
          {activeTab === 'public' && (
            <div className="bg-white p-4 flex gap-3 overflow-x-auto no-scrollbar border-b">
               <div className="shrink-0">
                  <button onClick={() => storyInput.current?.click()} className="w-16 h-24 rounded-xl bg-slate-100 border relative overflow-hidden flex items-center justify-center group">
                     <img src={user?.avatarUrl} className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale" alt=""/>
                     <div className="relative z-10 bg-blue-600 rounded-full p-1.5 border-2 border-white shadow-lg animate-pulse"><Plus size={16} className="text-white"/></div>
                  </button>
               </div>
               {stories.map(s => (
                 <button key={s.id} onClick={() => setActiveStory(s)} className="shrink-0">
                    <div className={`w-16 h-24 rounded-xl border-2 ${s.viewers?.includes(auth.currentUser?.uid) ? 'border-slate-200' : 'border-blue-500'} relative overflow-hidden bg-slate-200 p-0.5 shadow-sm`}>
                       {s.mediaType === 'video' ? <div className="w-full h-full bg-slate-800 flex items-center justify-center"><PlayCircle size={20} className="text-white/30"/></div> : <img src={s.media} className="w-full h-full object-cover rounded-lg" alt=""/>}
                       <div className="absolute top-1 left-1 w-6 h-6 rounded-full border border-blue-500 overflow-hidden bg-white"><img src={s.userAvatar} className="w-full h-full object-cover" alt=""/></div>
                       <div className="absolute bottom-1 left-1 right-1 text-center"><p className="text-[7px] font-black text-white truncate drop-shadow-md uppercase">{s.userName}</p></div>
                    </div>
                 </button>
               ))}
               <input type="file" ref={storyInput} className="hidden" accept="image/*,video/*" onChange={(e) => {
                 const file = e.target.files?.[0]; if (!file) return;
                 const r = new FileReader(); r.onloadend = async () => {
                    await addDoc(collection(db, 'stories'), { uid: auth.currentUser?.uid, userName: user?.name, userAvatar: user?.avatarUrl, media: r.result, mediaType: file.type.startsWith('video') ? 'video' : 'image', viewers: [], timestamp_ms: Date.now(), timestamp: serverTimestamp() });
                    alert("স্টোরি আপলোড হয়েছে!");
                 }; r.readAsDataURL(file);
               }} />
            </div>
          )}

          {/* COMPOSER BOX */}
          <div className="mx-4 mt-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="flex gap-3 items-center mb-4">
               <img src={activeTab === 'anonymous' ? "https://api.dicebear.com/7.x/bottts/svg?seed=anon" : user?.avatarUrl} className="w-10 h-10 rounded-full border object-cover shadow-sm" alt=""/>
               <button onClick={() => setShowComposer(true)} className="flex-grow text-left py-3 px-5 bg-slate-50 text-slate-400 rounded-full text-xs font-bold">মনে কিছু চলছে?</button>
            </div>
            <div className="flex justify-around border-t pt-3">
               <button onClick={() => postInput.current?.click()} className="flex items-center gap-2 text-xs font-black text-slate-500"><Camera size={18} className="text-emerald-500"/> মিডিয়া</button>
               <button className="flex items-center gap-2 text-xs font-black text-slate-500"><Smile size={18} className="text-amber-500"/> অনুভূতি</button>
            </div>
            <input type="file" ref={postInput} className="hidden" accept="image/*,video/*" onChange={(e) => {
              const file = e.target.files?.[0]; if (!file) return;
              const r = new FileReader(); r.onloadend = () => { setMediaFile({ type: file.type.startsWith('video') ? 'video' : 'image', url: r.result as string }); setShowComposer(true); };
              r.readAsDataURL(file);
            }} />
          </div>

          {/* FEED LIST */}
          <div className="px-4 mt-6 max-w-md mx-auto space-y-4">
            {posts.map(post => (
              <PostCard 
                key={post.id} post={post} currentUserId={auth.currentUser?.uid || ''}
                onLike={handleLike} onAddComment={handleAddComment}
                onDeletePost={(id: string) => setConfirmDelete({ show: true, type: 'post', id })}
                onDeleteComment={(postId: string, comment: any) => setConfirmDelete({ show: true, type: 'comment', id: comment, postId })}
              />
            ))}
            {loading && <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={32}/></div>}
            {!loading && posts.length === 0 && (
              <div className="py-24 text-center text-slate-300 font-black text-[10px] uppercase tracking-widest">
                 {activeTab === 'anonymous' ? 'কোনো গোপন পোস্ট নেই' : 'কোনো পাবলিক পোস্ট নেই'}
              </div>
            )}
          </div>
        </>
      )}

      {/* MODALS */}
      {activeStory && (
        <div className="fixed inset-0 bg-black z-[2000] flex flex-col animate-in fade-in duration-300">
           <div className="absolute top-0 left-0 right-0 p-6 z-10 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-3">
                 <img src={activeStory.userAvatar} className="w-10 h-10 rounded-full border-2 border-white shadow-lg" alt=""/>
                 <div className="text-white">
                    <p className="font-black text-sm">{activeStory.userName}</p>
                    <p className="text-[10px] opacity-70 uppercase font-black flex items-center gap-1"><Eye size={10}/> {activeStory.viewers?.length || 0} ভিউ</p>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 {activeStory.uid === auth.currentUser?.uid && <button onClick={() => setConfirmDelete({ show: true, type: 'story', id: activeStory.id })} className="p-2.5 bg-rose-500/20 text-rose-500 rounded-full backdrop-blur-md"><Trash2 size={20}/></button>}
                 <button onClick={() => setActiveStory(null)} className="p-2.5 bg-white/20 rounded-full text-white backdrop-blur-md"><X size={24}/></button>
              </div>
           </div>
           <div className="flex-grow flex items-center justify-center p-2">
              {activeStory.mediaType === 'video' ? <video src={activeStory.media} autoPlay controls className="max-w-full max-h-full rounded-2xl shadow-2xl" /> : <img src={activeStory.media} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" alt="story"/>}
           </div>
        </div>
      )}

      {showComposer && (
        <div className="fixed inset-0 bg-white z-[1500] flex flex-col animate-in slide-in-from-bottom duration-300">
           <div className="p-4 border-b flex items-center justify-between bg-white shadow-sm">
              <button onClick={() => { setShowComposer(false); setMediaFile(null); }} className="p-2 text-slate-500"><X size={24}/></button>
              <h3 className="font-black text-lg">পোস্ট করুন</h3>
              <button 
                onClick={async () => {
                  if (!postContent.trim() && !mediaFile) return;
                  const isAnon = activeTab === 'anonymous';
                  await addDoc(collection(db, 'posts'), { 
                    uid: auth.currentUser?.uid, 
                    userName: isAnon ? "বেনামী ইউজার" : (user?.name || "ইউজার"), 
                    userAvatar: isAnon ? "" : (user?.avatarUrl || ""), 
                    content: postContent, 
                    image: mediaFile?.type === 'image' ? mediaFile.url : null, 
                    video: mediaFile?.type === 'video' ? mediaFile.url : null, 
                    isAnonymous: isAnon, 
                    likes: 0, likedBy: [], comments: [], views: 0, viewedBy: [], 
                    timestamp: serverTimestamp(), 
                    time: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) 
                  });
                  setPostContent(''); setMediaFile(null); setShowComposer(false);
                }} 
                className={`px-8 py-2 rounded-xl font-black text-sm shadow-md ${postContent.trim() || mediaFile ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
              >পাবলিশ</button>
           </div>
           <div className="p-6 flex-grow overflow-y-auto">
              <textarea value={postContent} onChange={(e)=>setPostContent(e.target.value)} placeholder={activeTab === 'anonymous' ? "পরিচয় গোপন রেখে কিছু বলুন..." : "আপনার মনের না বলা কথা..."} className="w-full text-xl outline-none resize-none min-h-[200px] font-hind" autoFocus />
              {mediaFile && (
                <div className="relative mt-4 rounded-2xl overflow-hidden border-4 border-slate-50 shadow-lg">
                   {mediaFile.type === 'image' ? <img src={mediaFile.url} className="w-full" alt=""/> : <video src={mediaFile.url} controls className="w-full" />}
                   <button onClick={() => setMediaFile(null)} className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full"><X size={16}/></button>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default CommunityTab;
