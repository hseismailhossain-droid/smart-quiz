
import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageSquare, Share2, Camera, Film, Send, X, Loader2, Plus, Trash2, ChevronRight, ChevronLeft, MoreHorizontal, ThumbsUp, AlertTriangle, CornerDownRight, Eye, Edit3, Trash } from 'lucide-react';
import { Post, Comment, UserProfile } from '../types';
import { db, auth } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, arrayUnion, where, limit, increment, getDoc, arrayRemove } from 'firebase/firestore';

interface CommunityTabProps {
  user?: UserProfile;
}

const CommunityTab: React.FC<CommunityTabProps> = ({ user }) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newPostContent, setNewPostContent] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showFullComposer, setShowFullComposer] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  
  const [activeStoryGroup, setActiveStoryGroup] = useState<any | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  
  const [activeCommentPost, setActiveCommentPost] = useState<any | null>(null);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [isCommenting, setIsCommenting] = useState(false);

  // Deletion & Menu States
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    type: 'post' | 'story' | 'comment';
    id: string;
    extraData?: any;
  }>({ show: false, type: 'post', id: '' });
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const storyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const qPosts = query(collection(db, 'posts'), orderBy('timestamp', 'desc'), limit(50));
    const unsubPosts = onSnapshot(qPosts, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const qStories = query(collection(db, 'stories'), where('timestamp_ms', '>', oneDayAgo));
    const unsubStories = onSnapshot(qStories, (snap) => {
      const allStories = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const grouped: { [key: string]: any } = {};
      allStories.forEach((s: any) => {
        if (!grouped[s.uid]) {
          grouped[s.uid] = { uid: s.uid, userName: s.userName, userAvatar: s.userAvatar, items: [] };
        }
        grouped[s.uid].items.push(s);
      });
      Object.values(grouped).forEach(group => group.items.sort((a: any, b: any) => a.timestamp_ms - b.timestamp_ms));
      setStories(Object.values(grouped));
    });

    return () => { unsubPosts(); unsubStories(); };
  }, []);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'post-image' | 'story') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("১ এমবি-র নিচের ছবি আপলোড করুন।");
        return;
      }
      setIsProcessingMedia(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        if (target === 'post-image') {
          setSelectedImage(base64);
          setShowFullComposer(true);
        } else if (target === 'story') {
          await addDoc(collection(db, 'stories'), {
            uid: auth.currentUser?.uid,
            userName: user?.name || "ইউজার",
            userAvatar: user?.avatarUrl || "",
            media: base64,
            views: 0,
            viewedBy: [],
            timestamp_ms: Date.now()
          });
        }
        setIsProcessingMedia(false);
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !selectedImage) return;
    setIsPublishing(true);
    try {
      if (editingPostId) {
        await updateDoc(doc(db, 'posts', editingPostId), {
          content: newPostContent.trim(),
          image: selectedImage
        });
      } else {
        await addDoc(collection(db, 'posts'), {
          userName: user?.name || "ইউজার",
          userAvatar: user?.avatarUrl || "",
          uid: auth.currentUser?.uid,
          content: newPostContent.trim(),
          image: selectedImage,
          likes: 0,
          likedBy: [],
          comments: [],
          views: 0,
          viewedBy: [],
          timestamp: serverTimestamp(),
          time: "এইমাত্র"
        });
      }
      setNewPostContent('');
      setSelectedImage(null);
      setEditingPostId(null);
      setShowFullComposer(false);
    } catch (e) {
      alert("পোস্ট করতে সমস্যা হয়েছে।");
    } finally {
      setIsPublishing(false);
    }
  };

  const processDeletion = async () => {
    const { type, id, extraData } = deleteConfirm;
    try {
      if (type === 'post') {
        await deleteDoc(doc(db, 'posts', id));
      } else if (type === 'story') {
        await deleteDoc(doc(db, 'stories', id));
        if (activeStoryGroup && activeStoryGroup.items.length <= 1) {
          setActiveStoryGroup(null);
        } else if (activeStoryGroup) {
          const updatedItems = activeStoryGroup.items.filter((item: any) => item.id !== id);
          setActiveStoryGroup({ ...activeStoryGroup, items: updatedItems });
          setCurrentStoryIndex(Math.max(0, currentStoryIndex - 1));
        }
      } else if (type === 'comment') {
        const postRef = doc(db, 'posts', extraData.postId);
        await updateDoc(postRef, {
          comments: arrayRemove(extraData.commentObj)
        });
        if (activeCommentPost && activeCommentPost.id === extraData.postId) {
          const updatedPost = await getDoc(postRef);
          setActiveCommentPost({ id: updatedPost.id, ...updatedPost.data() });
        }
      }
      setDeleteConfirm({ show: false, type: 'post', id: '' });
    } catch (e) {
      alert("ডিলিট করতে সমস্যা হয়েছে।");
    }
  };

  const handleLike = async (post: any) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const postRef = doc(db, 'posts', post.id);
    const isLiked = post.likedBy?.includes(uid);
    
    await updateDoc(postRef, {
      likedBy: isLiked ? post.likedBy.filter((id: string) => id !== uid) : arrayUnion(uid),
      likes: increment(isLiked ? -1 : 1)
    });
  };

  const handleIncrementPostView = async (postId: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
      const data = postSnap.data();
      if (!data.viewedBy?.includes(uid)) {
        await updateDoc(postRef, {
          viewedBy: arrayUnion(uid),
          views: increment(1)
        });
      }
    }
  };

  const handleIncrementStoryView = async (storyId: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const storyRef = doc(db, 'stories', storyId);
    const storySnap = await getDoc(storyRef);
    if (storySnap.exists()) {
      const data = storySnap.data();
      if (!data.viewedBy?.includes(uid)) {
        await updateDoc(storyRef, {
          viewedBy: arrayUnion(uid),
          views: increment(1)
        });
      }
    }
  };

  const handleShare = async (post: any) => {
    const shareText = `🚀 ${post.userName} এর এই পোস্টটি দেখুন Smart Quiz Pro অ্যাপে:\n\n"${post.content}"\n\nবিস্তারিত জানতে আজই জয়েন করুন: ${window.location.origin}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Smart Quiz Pro',
          text: shareText,
          url: window.location.origin
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        alert('শেয়ার লিঙ্ক কপি করা হয়েছে!');
      } catch (err) {
        console.log('Clipboard error:', err);
      }
    }
  };

  const handleCommentLike = async (post: any, commentId: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    
    const postRef = doc(db, 'posts', post.id);
    const postSnap = await getDoc(postRef);
    
    if (postSnap.exists()) {
      const postData = postSnap.data();
      const updatedComments = postData.comments.map((c: any) => {
        if (c.id === commentId) {
          const isLiked = c.likedBy?.includes(uid);
          const newLikedBy = isLiked ? c.likedBy.filter((id: string) => id !== uid) : [...(c.likedBy || []), uid];
          return {
            ...c,
            likedBy: newLikedBy,
            likes: newLikedBy.length
          };
        }
        return c;
      });
      
      await updateDoc(postRef, { comments: updatedComments });
      
      if (activeCommentPost && activeCommentPost.id === post.id) {
        setActiveCommentPost({ ...activeCommentPost, comments: updatedComments });
      }
    }
  };

  const openStoryGroup = (group: any) => {
    setActiveStoryGroup(group);
    setCurrentStoryIndex(0);
    handleIncrementStoryView(group.items[0].id);
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !activeCommentPost) return;
    setIsCommenting(true);
    try {
      const uid = auth.currentUser?.uid;
      const commentObj: any = {
        userName: user?.name || "ইউজার",
        text: commentText.trim(),
        time: "এইমাত্র",
        uid: uid,
        id: Math.random().toString(36).substr(2, 9),
        likes: 0,
        likedBy: [],
        replies: []
      };

      if (replyingTo) {
        const postRef = doc(db, 'posts', activeCommentPost.id);
        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) {
          const postData = postSnap.data();
          const updatedComments = postData.comments.map((c: any) => {
            if (c.id === replyingTo.id) {
              return { ...c, replies: [...(c.replies || []), commentObj] };
            }
            return c;
          });
          await updateDoc(postRef, { comments: updatedComments });
        }
      } else {
        await updateDoc(doc(db, 'posts', activeCommentPost.id), {
          comments: arrayUnion(commentObj)
        });
      }

      setCommentText('');
      setReplyingTo(null);
      const updatedPost = await getDoc(doc(db, 'posts', activeCommentPost.id));
      setActiveCommentPost({ id: updatedPost.id, ...updatedPost.data() });
    } catch (e) {
      alert("কমেন্ট করা যায়নি।");
    } finally {
      setIsCommenting(false);
    }
  };

  const handleEditPost = (post: any) => {
    setEditingPostId(post.id);
    setNewPostContent(post.content);
    setSelectedImage(post.image);
    setShowFullComposer(true);
  };

  return (
    <div className="bg-[#f0f2f5] min-h-full pb-32 font-['Hind_Siliguri']">
      
      {/* Story Bar */}
      <div className="bg-white p-4 mb-3 flex gap-3 overflow-x-auto no-scrollbar shadow-sm">
        <div className="flex flex-col items-center shrink-0">
          <button 
            onClick={() => storyInputRef.current?.click()} 
            className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border-2 border-blue-500 border-dashed relative overflow-hidden active:scale-95 transition-all"
          >
            {isProcessingMedia ? <Loader2 className="animate-spin text-blue-600" /> : <Plus className="text-blue-600" size={28} />}
          </button>
          <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase">আপনার</span>
          <input type="file" ref={storyInputRef} onChange={(e) => handleMediaUpload(e, 'story')} className="hidden" accept="image/*" />
        </div>
        {stories.map(group => (
          <button key={group.uid} onClick={() => openStoryGroup(group)} className="flex flex-col items-center shrink-0">
            <div className="w-16 h-16 rounded-full border-2 border-blue-500 p-0.5">
              <img src={group.userAvatar} className="w-full h-full rounded-full object-cover bg-slate-200 shadow-inner" alt="avatar" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 mt-1 truncate w-16 text-center">{group.userName}</span>
          </button>
        ))}
      </div>

      {/* Composer */}
      <div className="bg-white p-4 mb-3 shadow-sm md:rounded-xl">
        <div className="flex gap-3 items-center mb-4">
          <img src={user?.avatarUrl} className="w-10 h-10 rounded-full object-cover bg-slate-100 border border-slate-100" alt="user" />
          <button 
            onClick={() => { setEditingPostId(null); setNewPostContent(''); setSelectedImage(null); setShowFullComposer(true); }}
            className="flex-grow bg-[#f0f2f5] hover:bg-slate-200 text-left px-5 py-2.5 rounded-full text-slate-500 text-sm font-medium transition-colors"
          >
            আপনার মনে কী আছে?
          </button>
        </div>
        <div className="flex border-t pt-3">
          <button onClick={() => { setShowFullComposer(true); imageInputRef.current?.click(); }} className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors">
            <Camera className="text-rose-500" size={20} /> <span className="text-xs font-bold">ছবি</span>
          </button>
          <button onClick={() => { setShowFullComposer(true); imageInputRef.current?.click(); }} className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors">
            <Film className="text-blue-600" size={20} /> <span className="text-xs font-bold">ভিডিও</span>
          </button>
        </div>
      </div>

      {/* Post List */}
      <div className="space-y-3 px-0 md:px-4">
        {posts.map(post => (
          <div key={post.id} className="bg-white shadow-sm border-y border-slate-100 md:rounded-xl md:border-x group" onMouseEnter={() => handleIncrementPostView(post.id)}>
            <div className="p-4 flex justify-between items-center">
              <div className="flex gap-3">
                <img src={post.userAvatar} className="w-10 h-10 rounded-full object-cover bg-slate-100 border border-slate-100" alt="avatar" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm leading-tight">{post.userName}</h4>
                  <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                    {post.time} • <ThumbsUp size={10} className="inline" />
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {post.uid === auth.currentUser?.uid && (
                  <div className="flex items-center">
                    <button 
                      onClick={() => handleEditPost(post)}
                      className="p-2 text-slate-400 hover:text-emerald-600 transition-all"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={() => setDeleteConfirm({ show: true, type: 'post', id: post.id })}
                      className="p-2 text-slate-400 hover:text-rose-500 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
                <button className="p-2 text-slate-400"><MoreHorizontal size={20}/></button>
              </div>
            </div>

            <div className="px-4 pb-3">
              <p className="text-slate-800 text-[14px] leading-relaxed whitespace-pre-wrap">{post.content}</p>
            </div>

            {post.image && (
              <div className="bg-slate-100 border-y border-slate-50 flex items-center justify-center overflow-hidden max-h-[500px]">
                <img src={post.image} className="w-full object-contain" alt="post" />
              </div>
            )}

            <div className="px-4 py-3 flex justify-between items-center border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white scale-75">
                    <ThumbsUp size={10} fill="currentColor" />
                  </div>
                  <span className="text-[11px] text-slate-500 font-bold">{post.likes || 0}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Eye size={14} className="text-slate-400" />
                  <span className="text-[11px] text-slate-500 font-bold">{post.views || 0}</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 font-bold">{post.comments?.length || 0} মতামত</div>
            </div>

            <div className="flex p-1">
              <button 
                onClick={() => handleLike(post)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-xs transition-colors ${post.likedBy?.includes(auth.currentUser?.uid) ? 'text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <ThumbsUp size={18} fill={post.likedBy?.includes(auth.currentUser?.uid) ? "currentColor" : "none"} /> লাইক
              </button>
              <button onClick={() => { setActiveCommentPost(post); handleIncrementPostView(post.id); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-xs text-slate-600 hover:bg-slate-50 transition-colors">
                <MessageSquare size={18} /> মতামত
              </button>
              <button onClick={() => handleShare(post)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-xs text-slate-600 hover:bg-slate-50 transition-colors">
                <Share2 size={18} /> শেয়ার
              </button>
            </div>
          </div>
        ))}
        {loading && <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-xs rounded-[32px] p-8 text-center animate-in zoom-in duration-200 shadow-2xl">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h4 className="text-lg font-black text-slate-900 mb-2">আপনি কি নিশ্চিত?</h4>
            <p className="text-xs text-slate-500 font-bold mb-8 leading-relaxed">এই {deleteConfirm.type === 'post' ? 'পোস্টটি' : deleteConfirm.type === 'story' ? 'স্টোরিটি' : 'কমেন্টটি'} ডিলিট করলে আর ফিরে পাওয়া যাবে না।</p>
            <div className="flex flex-col gap-3">
              <button onClick={processDeletion} className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-rose-600/20 active:scale-95 transition-all">হ্যাঁ, ডিলিট করুন</button>
              <button onClick={() => setDeleteConfirm({ show: false, type: 'post', id: '' })} className="w-full bg-slate-100 text-slate-400 py-4 rounded-2xl font-black text-sm active:scale-95 transition-all">বাতিল</button>
            </div>
          </div>
        </div>
      )}

      {/* Story Viewer Overlay */}
      {activeStoryGroup && (
        <div className="fixed inset-0 bg-black z-[1500] flex flex-col items-center">
           <div className="absolute top-0 inset-x-0 p-4 z-[10] bg-gradient-to-b from-black/60 to-transparent">
              <div className="flex gap-1 mb-4">
                 {activeStoryGroup.items.map((_: any, i: number) => (
                    <div key={i} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                       <div className={`h-full bg-white transition-all duration-[5000ms] ease-linear ${i < currentStoryIndex ? 'w-full' : i === currentStoryIndex ? 'w-full' : 'w-0'}`}></div>
                    </div>
                 ))}
              </div>
              <div className="flex justify-between items-center text-white">
                 <div className="flex items-center gap-2">
                    <img src={activeStoryGroup.userAvatar} className="w-8 h-8 rounded-full border border-white/20" alt="" />
                    <span className="font-bold text-sm">{activeStoryGroup.userName}</span>
                 </div>
                 <div className="flex items-center gap-2">
                    {activeStoryGroup.uid === auth.currentUser?.uid && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({ show: true, type: 'story', id: activeStoryGroup.items[currentStoryIndex].id });
                        }} 
                        className="p-2 bg-white/10 rounded-full hover:bg-rose-500 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                    <button onClick={() => setActiveStoryGroup(null)} className="p-2 bg-white/10 rounded-full"><X size={20}/></button>
                 </div>
              </div>
           </div>

           <div className="flex-grow flex items-center justify-center w-full bg-black relative">
              <img src={activeStoryGroup.items[currentStoryIndex].media} className="max-h-full max-w-full object-contain" alt="" />
              
              <div className="absolute inset-0 flex">
                 <div className="flex-1 h-full" onClick={() => setCurrentStoryIndex(Math.max(0, currentStoryIndex - 1))}></div>
                 <div className="flex-1 h-full" onClick={() => {
                    if (currentStoryIndex < activeStoryGroup.items.length - 1) {
                      const nextIdx = currentStoryIndex + 1;
                      setCurrentStoryIndex(nextIdx);
                      handleIncrementStoryView(activeStoryGroup.items[nextIdx].id);
                    } else {
                      setActiveStoryGroup(null);
                    }
                 }}></div>
              </div>

              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 text-white/80">
                 <Eye size={16} />
                 <span className="text-[12px] font-black">{activeStoryGroup.items[currentStoryIndex].views || 0} জন দেখেছেন</span>
              </div>
           </div>
        </div>
      )}

      {/* Comment Bottom Sheet */}
      {activeCommentPost && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-[32px] p-6 animate-in slide-in-from-bottom duration-300 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-5 border-b pb-4">
              <h3 className="font-black text-slate-900">মতামত</h3>
              <button onClick={() => { setActiveCommentPost(null); setReplyingTo(null); }} className="p-1 bg-slate-100 rounded-full text-slate-500"><X size={24}/></button>
            </div>
            
            <div className="flex-grow overflow-y-auto space-y-5 mb-4 no-scrollbar">
              {activeCommentPost.comments?.map((c: any, i: number) => (
                <div key={c.id} className="space-y-3">
                  <div className="flex gap-3 group/comment">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.userName}`} className="w-8 h-8 rounded-full bg-slate-100 border shrink-0" alt="avatar" />
                    <div className="flex-grow">
                      <div className="bg-[#f0f2f5] p-3 px-4 rounded-[20px] relative inline-block max-w-[90%]">
                        <p className="text-[11px] font-black text-slate-900 mb-0.5">{c.userName}</p>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">{c.text}</p>
                        
                        {c.likes > 0 && (
                          <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm border border-slate-100 flex items-center gap-1 scale-75">
                            <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white">
                              <ThumbsUp size={8} fill="currentColor" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500">{c.likes}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 mt-1.5 ml-2">
                        <button 
                          onClick={() => handleCommentLike(activeCommentPost, c.id)}
                          className={`text-[10px] font-black uppercase tracking-wider ${c.likedBy?.includes(auth.currentUser?.uid) ? 'text-blue-600' : 'text-slate-500'}`}
                        >
                          লাইক
                        </button>
                        <button 
                          onClick={() => setReplyingTo(c)}
                          className="text-[10px] font-black uppercase tracking-wider text-slate-500"
                        >
                          রিপ্লাই
                        </button>
                        {c.uid === auth.currentUser?.uid && (
                          <button onClick={() => setDeleteConfirm({ show: true, type: 'comment', id: c.id, extraData: { postId: activeCommentPost.id, commentObj: c } })} className="text-[10px] font-black text-rose-400 uppercase tracking-wider">ডিলিট</button>
                        )}
                        <span className="text-[10px] text-slate-400 font-bold">{c.time}</span>
                      </div>
                    </div>
                  </div>

                  {c.replies?.map((reply: any) => (
                    <div key={reply.id} className="flex gap-3 ml-11">
                       <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.userName}`} className="w-6 h-6 rounded-full bg-slate-100 border shrink-0" alt="avatar" />
                       <div className="flex-grow">
                          <div className="bg-slate-50 p-2.5 px-3.5 rounded-[18px] inline-block max-w-[95%] border border-slate-100">
                            <p className="text-[10px] font-black text-slate-900 mb-0.5">{reply.userName}</p>
                            <p className="text-[11px] text-slate-700 leading-relaxed font-medium">{reply.text}</p>
                          </div>
                          <div className="flex items-center gap-3 mt-1 ml-2">
                            <span className="text-[9px] text-slate-400 font-bold">{reply.time}</span>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
              ))}
              {(!activeCommentPost.comments || activeCommentPost.comments.length === 0) && (
                <div className="py-10 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest">এখনো কোনো মতামত নেই</div>
              )}
            </div>

            <div className="border-t pt-4">
              {replyingTo && (
                <div className="mb-2 flex items-center justify-between bg-blue-50 p-2 px-3 rounded-xl border border-blue-100 animate-in slide-in-from-bottom-2">
                  <p className="text-[10px] font-black text-blue-700">রিপ্লাই দিচ্ছেন: <span className="font-bold">{replyingTo.userName}</span></p>
                  <button onClick={() => setReplyingTo(null)} className="text-blue-700 p-0.5"><X size={14}/></button>
                </div>
              )}
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={commentText} 
                  onChange={(e) => setCommentText(e.target.value)} 
                  placeholder={replyingTo ? "রিপ্লাই লিখুন..." : "কিছু লিখুন..."} 
                  className="flex-grow bg-[#f0f2f5] p-4 rounded-full text-sm outline-none font-medium border-transparent focus:border-blue-200 transition-all" 
                />
                <button 
                  onClick={handleAddComment} 
                  disabled={isCommenting || !commentText.trim()}
                  className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center active:scale-90 transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20"
                >
                  {isCommenting ? <Loader2 className="animate-spin" size={20}/> : <Send size={20}/>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Composer */}
      {showFullComposer && (
        <div className="fixed inset-0 bg-white z-[600] flex flex-col animate-in slide-in-from-bottom duration-300">
           <div className="p-4 border-b flex items-center justify-between">
              <button onClick={() => setShowFullComposer(false)} className="p-2 text-slate-600"><X size={24}/></button>
              <h3 className="font-black text-slate-900">{editingPostId ? 'পোস্ট এডিট করুন' : 'পোস্ট তৈরি করুন'}</h3>
              <button 
                onClick={handleCreatePost}
                disabled={isPublishing || isProcessingMedia || (!newPostContent.trim() && !selectedImage)}
                className="text-blue-600 font-black disabled:opacity-30"
              >
                {isPublishing ? <Loader2 className="animate-spin" size={20}/> : editingPostId ? 'আপডেট' : 'পোস্ট'}
              </button>
           </div>
           
           <div className="p-4 flex-grow overflow-y-auto">
              <div className="flex gap-3 mb-5">
                 <img src={user?.avatarUrl} className="w-12 h-12 rounded-full object-cover border border-slate-100" alt="user" />
                 <div>
                    <h4 className="font-black text-slate-900">{user?.name}</h4>
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-slate-500">Public</span>
                 </div>
              </div>
              
              <textarea 
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="আপনার মনে কী আছে?"
                className="w-full text-lg outline-none resize-none min-h-[150px] placeholder:text-slate-400 font-medium"
              />

              {isProcessingMedia && (
                <div className="mb-4 p-4 bg-blue-50 rounded-xl flex items-center gap-3 animate-pulse">
                  <Loader2 className="animate-spin text-blue-600" size={20}/>
                  <span className="text-xs font-bold text-blue-700">ছবি প্রসেস হচ্ছে...</span>
                </div>
              )}

              {selectedImage && (
                <div className="relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img src={selectedImage} className="w-full" alt="selected" />
                  <button onClick={() => setSelectedImage(null)} className="absolute top-3 right-3 p-1.5 bg-black/50 text-white rounded-full"><X size={16}/></button>
                </div>
              )}
           </div>

           <div className="p-4 border-t flex justify-around">
              <button onClick={() => imageInputRef.current?.click()} className="flex flex-col items-center gap-1 group">
                 <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 group-active:scale-90 transition-transform"><Camera size={24}/></div>
                 <span className="text-[10px] font-black text-slate-500 uppercase">ছবি</span>
              </button>
              <button onClick={() => imageInputRef.current?.click()} className="flex flex-col items-center gap-1 group">
                 <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-active:scale-90 transition-transform"><Film size={24}/></div>
                 <span className="text-[10px] font-black text-slate-500 uppercase">ভিডিও</span>
              </button>
              <input type="file" ref={imageInputRef} onChange={(e) => handleMediaUpload(e, 'post-image')} className="hidden" accept="image/*" />
           </div>
        </div>
      )}
    </div>
  );
};

export default CommunityTab;
