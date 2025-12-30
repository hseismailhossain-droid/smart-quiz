
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
    <div className={`bg-white shadow-sm border rounded-xl overflow-hidden mb-4 transition-all ${post.isAnonymous ? 'border-indigo-100 bg-indigo-50/5' : 'border-gray-100'}`}>
      <div className="p-4 flex justify-between items-start">
        <div className="flex items-center gap-3">
          <img src={displayAvatar} loading="lazy" className="w-10 h-10 rounded-full border bg-gray-50 object-cover shadow-sm" alt="" />
          <div>
            <h4 className="font-bold text-[15px] font-hind flex items-center gap-1.5">
              {displayName}
              {post.isAnonymous && <Ghost size={12} className="text-indigo-400" />}
            </h4>
            <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5 font-hind uppercase tracking-widest">
              {post.time} • <Globe size={10} /> • <Eye size={10} /> {post.views || 0}
            </p>
          </div>
        </div>
        {isOwner && (
          <button onClick={() => onDeletePost(post.id)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-full"><Trash2 size={18} /></button>
        )}
      </div>

      <div className="px-4 pb-3 text-[14px] leading-relaxed font-hind text-gray-800 whitespace-pre-wrap">
        {post.content}
      </div>

      {post.image && (
        <div className="bg-gray-50 border-y max-h-[350px] overflow-hidden flex justify-center">
          <img src={post.image} loading="lazy" className="w-full object-contain" alt="Post" />
        </div>
      )}

      {post.video && (
        <div className="bg-black border-y flex justify-center">
          <video src={post.video} preload="metadata" controls className="w-full max-h-[350px]" />
        </div>
      )}

      <div className="px-4 py-3 flex justify-between text-gray-500 text-[10px] border-b mx-2 font-hind font-bold">
        <div className="flex items-center gap-1">
          <div className="bg-blue-600 p-0.5 rounded-full">
            <ThumbsUp size={8} fill="white" className="text-white" />
          </div>
          <span>{post.likes || 0}</span>
        </div>
        <button onClick={() => setShowComments(!showComments)} className="hover:underline">
          {post.comments?.length || 0} মতামত
        </button>
      </div>

      <div className="flex px-2 py-0.5">
        <button onClick={() => onLike(post.id)} className={`flex-1 flex justify-center items-center gap-2 py-2 hover:bg-gray-50 rounded-lg font-bold text-xs transition-colors ${isLiked ? 'text-blue-600' : 'text-gray-500'}`}>
          <ThumbsUp size={16} fill={isLiked ? 'currentColor' : 'none'} /> লাইক
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex-1 flex justify-center items-center gap-2 py-2 hover:bg-gray-50 rounded-lg text-gray-500 font-bold text-xs">
          <MessageCircle size={16} /> মতামত
        </button>
        <button onClick={() => onShare(post)} className="flex-1 flex justify-center items-center gap-2 py-2 hover:bg-gray-50 rounded-lg text-gray-500 font-bold text-xs">
          <Share2 size={16} /> শেয়ার
        </button>
      </div>

      {showComments && (
        <div className="px-4 pb-4 bg-slate-50/50 border-t">
          <div className="pt-4 space-y-4 max-h-60 overflow-y-auto no-scrollbar">
            {post.comments?.map((comment: any) => (
              <div key={comment.id} className="flex gap-3">
                <img src={post.isAnonymous ? "https://api.dicebear.com/7.x/bottts/svg?seed=anon" : (comment.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.userName}`)} className="w-7 h-7 rounded-full border" alt=""/>
                <div className="flex-1 min-w-0">
                  <div className="bg-white border border-gray-100 rounded-2xl px-3 py-1.5 inline-block shadow-sm max-w-full">
                    <p className="font-black text-[10px] text-blue-900">{post.isAnonymous ? 'ইউজার' : comment.userName}</p>
                    <p className="text-xs text-gray-700 leading-tight">{comment.text}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-1 mt-1 text-[9px] font-black text-gray-400 uppercase">
                    <span>{comment.time || 'এখন'}</span>
                    <button onClick={() => setReplyTo(comment)} className="text-blue-600">রিপ্লাই</button>
                    {(comment.uid === currentUserId || isOwner) && (
                      <button onClick={() => onDeleteComment(post.id, comment)} className="text-rose-500">ডিলিট</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <form onSubmit={(e) => { e.preventDefault(); if(commentText.trim()) { onAddComment(post.id, commentText, replyTo); setCommentText(''); setReplyTo(null); } }} className="flex flex-col gap-2 mt-4">
            {replyTo && (
              <div className="flex items-center justify-between bg-blue-50 px-3 py-1.5 rounded-xl text-[9px] text-blue-600 font-black">
                <span>রিপ্লাই: {post.isAnonymous ? 'ইউজার' : replyTo.userName}</span>
                <button type="button" onClick={() => setReplyTo(null)}><X size={10}/></button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="উত্তর লিখুন..." className="flex-1 bg-white border rounded-full py-2 px-4 outline-none text-xs font-bold" />
              <button type="submit" className="text-blue-600 p-2"><Send size={16} /></button>
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
    const unsubStories = onSnapshot(query(collection(db, 'stories'), where('timestamp_ms', '>', dayAgo), limit(15)), (snap) => {
      setStories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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
      replyTo: replyToObj ? { uid: replyToObj.uid, userName: isAnon ? 'ইউজার' : replyToObj.userName } : null
    };
    await updateDoc(doc(db, 'posts', postId), { comments: arrayUnion(comment) });
  };

  const handleShare = async (post: Post) => {
    // Normalizing the URL to ensure it's a standard web URL
    const shareUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    const shareText = `${post.isAnonymous ? 'বেনামী ইউজার' : post.userName} এর একটি পোস্ট:\n"${post.content.substring(0, 150)}..."\n\nSmart Quiz Pro অ্যাপ থেকে শেয়ার করা হয়েছে।`;

    if (navigator.share) {
      try {
        const shareData: any = {
          title: 'Smart Quiz Pro',
          text: shareText
        };
        // Only include URL if it's potentially valid for the browser
        if (shareUrl.startsWith('http')) {
          shareData.url = shareUrl;
        }
        await navigator.share(shareData);
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
      setToast("সফলভাবে ডিলিট হয়েছে!");
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
    <div className="min-h-screen pb-32 font-hind bg-slate-50 transition-all">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[4000] bg-emerald-800 text-white px-6 py-3 rounded-full text-xs font-black shadow-2xl animate-in slide-in-from-top-10 duration-300">
           {toast}
        </div>
      )}

      <div className="fixed inset-0 bg-black/60 z-[3000] flex items-center justify-center p-6 backdrop-blur-sm" style={{ display: confirmDelete?.show ? 'flex' : 'none' }}>
        <div className="bg-white w-full max-w-xs rounded-[32px] p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6"><Trash2 size={32}/></div>
          <h4 className="text-xl font-black mb-2">মুছে ফেলবেন?</h4>
          <p className="text-xs text-slate-400 font-bold mb-8">এটি আর ফিরে পাওয়া যাবে না।</p>
          <div className="flex flex-col gap-3">
            <button onClick={executeDelete} className="w-full bg-rose-600 text-white py-4 rounded-2xl font-bold text-sm">হ্যাঁ, ডিলিট করুন</button>
            <button onClick={() => setConfirmDelete(null)} className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold text-sm">বাতিল</button>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b flex h-14 shadow-sm">
        <button onClick={() => setActiveTab('public')} className={`flex-1 flex items-center justify-center gap-2 font-black text-xs transition-all border-b-2 ${activeTab === 'public' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>
          <Globe size={16} /> পাবলিক
        </button>
        <button onClick={() => setActiveTab('anonymous')} className={`flex-1 flex items-center justify-center gap-2 font-black text-xs transition-all border-b-2 ${activeTab === 'anonymous' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}>
          <Ghost size={16} /> বেনামী
        </button>
        <button onClick={() => setActiveTab('messages')} className={`flex-1 flex items-center justify-center gap-2 font-black text-xs transition-all border-b-2 ${activeTab === 'messages' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>
          <MessageSquare size={16} /> চ্যাট
        </button>
      </div>

      {activeTab === 'messages' ? (
        <div className="flex flex-col h-[calc(100vh-140px)]">
           <div className="flex-grow overflow-y-auto p-4 space-y-6 no-scrollbar">
              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex gap-2 ${msg.uid === auth.currentUser?.uid ? 'flex-row-reverse' : ''}`}>
                   <img src={msg.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.userName}`} className="w-7 h-7 rounded-xl border object-cover shrink-0" alt=""/>
                   <div className={`max-w-[75%] ${msg.uid === auth.currentUser?.uid ? 'items-end text-right' : ''}`}>
                      <div className={`p-3 rounded-2xl text-[12px] font-bold ${msg.uid === auth.currentUser?.uid ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border shadow-sm'}`}>
                         {msg.text}
                      </div>
                   </div>
                </div>
              ))}
           </div>
           <div className="p-4 bg-white border-t sticky bottom-0 z-10">
              <div className="flex gap-2">
                 <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="মেসেজ..." className="flex-grow bg-slate-50 border p-3 rounded-2xl font-bold text-xs outline-none" />
                 <button onClick={handleSendChat} className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Send size={20}/></button>
              </div>
           </div>
        </div>
      ) : (
        <div className="max-w-md mx-auto">
          {activeTab === 'anonymous' && (
            <div className="mx-4 mt-4 p-4 bg-indigo-900 rounded-2xl text-white flex items-center gap-4 border border-indigo-700/50 shadow-lg">
               <Ghost size={24} className="text-indigo-200" />
               <div>
                 <h4 className="font-black text-xs uppercase tracking-wider">ইনকগনিটো মোড</h4>
                 <p className="text-[9px] opacity-70 font-bold">এখানে পরিচয় গোপন থাকবে।</p>
               </div>
            </div>
          )}

          {activeTab === 'public' && (
            <div className="bg-white p-4 flex gap-3 overflow-x-auto no-scrollbar border-b">
               <button onClick={() => storyInput.current?.click()} className="shrink-0 w-16 h-24 rounded-xl bg-slate-100 border relative flex items-center justify-center">
                  <Plus size={16} className="text-blue-600"/>
               </button>
               {stories.map(s => (
                 <button key={s.id} onClick={() => setActiveStory(s)} className="shrink-0">
                    <div className="w-16 h-24 rounded-xl border-2 border-blue-500 overflow-hidden bg-slate-200">
                       <img src={s.media} loading="lazy" className="w-full h-full object-cover" alt=""/>
                    </div>
                 </button>
               ))}
               <input type="file" ref={storyInput} className="hidden" accept="image/*,video/*" onChange={(e) => {
                 const file = e.target.files?.[0]; if (!file) return;
                 const r = new FileReader(); r.onloadend = async () => {
                    await addDoc(collection(db, 'stories'), { uid: auth.currentUser?.uid, userName: user?.name, userAvatar: user?.avatarUrl, media: r.result, mediaType: file.type.startsWith('video') ? 'video' : 'image', timestamp_ms: Date.now() });
                    setToast("স্টোরি আপলোড হয়েছে!");
                 }; r.readAsDataURL(file);
               }} />
            </div>
          )}

          <div className="mx-4 mt-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm flex gap-3 items-center">
             <img src={activeTab === 'anonymous' ? "https://api.dicebear.com/7.x/bottts/svg?seed=anon" : user?.avatarUrl} className="w-9 h-9 rounded-full border object-cover" alt=""/>
             <button onClick={() => setShowComposer(true)} className="flex-grow text-left py-3 px-5 bg-slate-50 text-slate-400 rounded-full text-[11px] font-bold">মনে কিছু চলছে?</button>
             <button onClick={() => postInput.current?.click()} className="p-2 text-emerald-500"><Camera size={20}/></button>
             <input type="file" ref={postInput} className="hidden" accept="image/*,video/*" onChange={(e) => {
              const file = e.target.files?.[0]; if (!file) return;
              const r = new FileReader(); r.onloadend = () => { setMediaFile({ type: file.type.startsWith('video') ? 'video' : 'image', url: r.result as string }); setShowComposer(true); };
              r.readAsDataURL(file);
            }} />
          </div>

          <div className="px-4 mt-6 space-y-4">
            {posts.map(post => (
              <PostCard 
                key={post.id} post={post} currentUserId={auth.currentUser?.uid || ''}
                onLike={handleLike} onAddComment={handleAddComment}
                onDeletePost={(id: string) => setConfirmDelete({ show: true, type: 'post', id })}
                onDeleteComment={(postId: string, comment: any) => setConfirmDelete({ show: true, type: 'comment', id: comment, postId })}
                onShare={handleShare}
              />
            ))}
            {loading && <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={32}/></div>}
            {!loading && posts.length === 0 && <div className="py-24 text-center text-slate-300 font-black text-xs">কোনো পোস্ট নেই</div>}
          </div>
        </div>
      )}

      {activeStory && (
        <div className="fixed inset-0 bg-black z-[5000] flex flex-col items-center justify-center">
           <button onClick={() => setActiveStory(null)} className="absolute top-6 right-6 p-2 bg-white/20 rounded-full text-white"><X size={24}/></button>
           {activeStory.mediaType === 'video' ? <video src={activeStory.media} autoPlay controls className="max-w-full max-h-full" /> : <img src={activeStory.media} className="max-w-full max-h-full object-contain" alt=""/>}
        </div>
      )}

      {showComposer && (
        <div className="fixed inset-0 bg-white z-[5000] flex flex-col">
           <div className="p-4 border-b flex items-center justify-between">
              <button onClick={() => { setShowComposer(false); setMediaFile(null); }} className="p-2 text-slate-500"><X size={24}/></button>
              <h3 className="font-black text-sm">পোস্ট তৈরি করুন</h3>
              <button onClick={handlePublishPost} disabled={isPosting} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-xs font-black disabled:opacity-50">
                {isPosting ? '...' : 'পাবলিশ'}
              </button>
           </div>
           <div className="p-6 flex-grow overflow-y-auto">
              <textarea value={postContent} onChange={(e)=>setPostContent(e.target.value)} placeholder="আপনার কথাগুলো এখানে লিখুন..." className="w-full text-lg outline-none resize-none min-h-[150px] font-hind" autoFocus />
              {mediaFile && (
                <div className="relative mt-4 rounded-xl overflow-hidden border">
                   {mediaFile.type === 'image' ? <img src={mediaFile.url} className="w-full" alt=""/> : <video src={mediaFile.url} controls className="w-full" />}
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default CommunityTab;
