
import React, { useState, useRef, useEffect } from 'react';
import { Ghost, MessageSquare, Share2, Camera, Film, Send, X, Loader2, Plus, Trash2, FileText, ThumbsUp, Edit3, Mic, User as UserIcon, Square, Volume2, Shield, File as FileIcon, ExternalLink, Play, Clock, MoreVertical, AlertTriangle, Eye, Download, CornerDownRight } from 'lucide-react';
import { Post, Comment, UserProfile, Story } from '../types';
import { db, auth } from '../services/firebase';
import { collection, query, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, arrayUnion, where, limit, increment, arrayRemove, orderBy, getDoc } from 'firebase/firestore';

interface CommunityTabProps {
  user?: UserProfile;
}

const CommunityTab: React.FC<CommunityTabProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'public' | 'anonymous'>('public');
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States for Modals/Overlays
  const [showComposer, setShowComposer] = useState(false);
  const [activeStoryGroup, setActiveStoryGroup] = useState<any | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showViewersList, setShowViewersList] = useState(false);
  const [viewersData, setViewersData] = useState<{name: string, avatar: string}[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, type: 'post' | 'story', id: string} | null>(null);

  // Composer States
  const [content, setContent] = useState('');
  const [mediaImg, setMediaImg] = useState<string | null>(null);
  const [mediaVid, setMediaVid] = useState<string | null>(null);
  const [mediaAudio, setMediaAudio] = useState<string | null>(null);
  const [mediaPdf, setMediaPdf] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<any>(null);

  // Interaction States
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);

  // Refs
  const imgRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const storyRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    const isAnon = activeTab === 'anonymous';
    const qPosts = query(collection(db, 'posts'), where('isAnonymous', '==', isAnon), limit(50));

    const unsubPosts = onSnapshot(qPosts, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
      docs.sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0));
      setPosts(docs);
      setLoading(false);
    });

    let unsubStories = () => {};
    if (activeTab === 'public') {
      const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
      const qStories = query(collection(db, 'stories'), where('timestamp_ms', '>', dayAgo));
      unsubStories = onSnapshot(qStories, (snap) => {
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Story));
        const grouped: any = {};
        all.forEach((s: Story) => {
          if (!grouped[s.uid]) grouped[s.uid] = { uid: s.uid, userName: s.userName, userAvatar: s.userAvatar, items: [] };
          grouped[s.uid].items.push(s);
        });
        setStories(Object.values(grouped));
      });
    }

    return () => { unsubPosts(); unsubStories(); };
  }, [activeTab]);

  // Track Story View
  useEffect(() => {
    const trackView = async () => {
      if (activeStoryGroup && auth.currentUser) {
        const story = activeStoryGroup.items[currentStoryIndex];
        const uid = auth.currentUser.uid;
        if (story.uid !== uid && !story.viewers?.includes(uid)) {
          try {
            await updateDoc(doc(db, 'stories', story.id), {
              viewers: arrayUnion(uid)
            });
          } catch (e) { console.error("Error tracking view", e); }
        }
      }
    };
    trackView();

    let timer: any;
    if (activeStoryGroup && !showViewersList && !deleteConfirm) {
      timer = setTimeout(() => {
        if (currentStoryIndex < activeStoryGroup.items.length - 1) {
          setCurrentStoryIndex(prev => prev + 1);
        } else {
          setActiveStoryGroup(null);
        }
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [activeStoryGroup, currentStoryIndex, showViewersList, deleteConfirm]);

  const fetchViewersData = async (uids: string[]) => {
    if (!uids || uids.length === 0) {
      setViewersData([]);
      return;
    }
    const data: {name: string, avatar: string}[] = [];
    for (const uid of uids.slice(0, 20)) { 
      const userSnap = await getDoc(doc(db, 'users', uid));
      if (userSnap.exists()) {
        const u = userSnap.data();
        data.push({ name: u.name, avatar: u.avatarUrl });
      }
    }
    setViewersData(data);
  };

  // Audio Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => setMediaAudio(reader.result as string);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
    } catch (e) { alert("মাইক্রোফোন পারমিশন দিন"); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'img' | 'vid' | 'story' | 'pdf') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const limit = type === 'vid' ? 15 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > limit) return alert(`ফাইল সাইজ অনেক বড়। সর্বোচ্চ ${type === 'vid' ? '১৫' : '৫'} এমবি অনুমোদিত।`);

    setIsProcessingMedia(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      if (type === 'story') {
        try {
          await addDoc(collection(db, 'stories'), {
            uid: auth.currentUser?.uid,
            userName: user?.name || "User",
            userAvatar: user?.avatarUrl || "",
            media: base64,
            viewers: [],
            timestamp_ms: Date.now()
          });
          alert("স্টোরি আপলোড হয়েছে!");
        } catch (e) { alert("ব্যর্থ হয়েছে!"); }
      } else if (type === 'vid') {
        setMediaVid(base64);
        setShowComposer(true);
      } else if (type === 'pdf') {
        setMediaPdf(base64);
        setPdfName(file.name);
        setShowComposer(true);
      } else {
        setMediaImg(base64);
        setShowComposer(true);
      }
      setIsProcessingMedia(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePost = async () => {
    if (!content.trim() && !mediaImg && !mediaVid && !mediaAudio && !mediaPdf) return;
    setIsPublishing(true);
    try {
      const isAnon = activeTab === 'anonymous';
      const postData = {
        uid: auth.currentUser?.uid,
        userName: isAnon ? "Anonymous" : (user?.name || "ইউজার"),
        userAvatar: isAnon ? "anonymous" : (user?.avatarUrl || ""),
        content: content.trim(),
        image: mediaImg,
        video: mediaVid,
        audio: mediaAudio,
        pdf: mediaPdf,
        pdfName: pdfName,
        isAnonymous: isAnon,
        likes: 0,
        likedBy: [],
        comments: [],
        timestamp: serverTimestamp(),
        time: "এইমাত্র"
      };
      if (editingId) await updateDoc(doc(db, 'posts', editingId), postData);
      else await addDoc(collection(db, 'posts'), postData);
      closeComposer();
    } catch (e) { alert("পোস্ট করা যায়নি।"); }
    finally { setIsPublishing(false); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'post') {
        await deleteDoc(doc(db, 'posts', deleteConfirm.id));
      } else if (deleteConfirm.type === 'story') {
        await deleteDoc(doc(db, 'stories', deleteConfirm.id));
        setActiveStoryGroup(null);
      }
      setDeleteConfirm(null);
    } catch (e) { alert("ডিলিট করা সম্ভব হয়নি।"); }
  };

  const closeComposer = () => {
    setShowComposer(false);
    setContent('');
    setMediaImg(null);
    setMediaVid(null);
    setMediaAudio(null);
    setMediaPdf(null);
    setPdfName('');
    setEditingId(null);
  };

  const handleLike = async (postId: string, likedBy: string[]) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const isLiked = likedBy?.includes(uid);
    try {
      await updateDoc(doc(db, 'posts', postId), {
        likedBy: isLiked ? arrayRemove(uid) : arrayUnion(uid),
        likes: increment(isLiked ? -1 : 1)
      });
    } catch (e) { console.error(e); }
  };

  const handleComment = async () => {
    if (!commentInput.trim() || !activePostId) return;
    setIsCommenting(true);
    try {
      const currentPost = posts.find(p => p.id === activePostId);
      if (!currentPost) return;

      const commentObj: Comment = {
        id: Math.random().toString(36).substr(2, 9),
        uid: auth.currentUser?.uid || '',
        userName: activeTab === 'anonymous' ? 'Anonymous' : (user?.name || 'User'),
        userAvatar: activeTab === 'anonymous' ? 'anonymous' : (user?.avatarUrl || ''),
        text: commentInput.trim(),
        time: 'এইমাত্র',
        timestamp: Date.now(),
        likes: 0,
        likedBy: [],
        replies: []
      };

      if (replyingToCommentId) {
        // Find parent comment and append reply
        const updatedComments = currentPost.comments.map(c => {
          if (c.id === replyingToCommentId) {
            return { ...c, replies: [...(c.replies || []), commentObj] };
          }
          return c;
        });
        await updateDoc(doc(db, 'posts', activePostId), { comments: updatedComments });
      } else {
        await updateDoc(doc(db, 'posts', activePostId), { comments: arrayUnion(commentObj) });
      }
      
      setCommentInput('');
      setReplyingToCommentId(null);
    } catch (e) { alert("ব্যর্থ!"); }
    finally { setIsCommenting(false); }
  };

  const handleCommentLike = async (postId: string, commentId: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const updatedComments = post.comments.map(c => {
      if (c.id === commentId) {
        const likedBy = c.likedBy || [];
        const isLiked = likedBy.includes(uid);
        return {
          ...c,
          likedBy: isLiked ? likedBy.filter(id => id !== uid) : [...likedBy, uid],
          likes: (c.likes || 0) + (isLiked ? -1 : 1)
        };
      }
      // Check replies
      if (c.replies) {
        const updatedReplies = c.replies.map(r => {
          if (r.id === commentId) {
            const likedBy = r.likedBy || [];
            const isLiked = likedBy.includes(uid);
            return {
              ...r,
              likedBy: isLiked ? likedBy.filter(id => id !== uid) : [...likedBy, uid],
              likes: (r.likes || 0) + (isLiked ? -1 : 1)
            };
          }
          return r;
        });
        return { ...c, replies: updatedReplies };
      }
      return c;
    });

    await updateDoc(doc(db, 'posts', postId), { comments: updatedComments });
  };

  const currentCommentPost = posts.find(p => p.id === activePostId);

  return (
    <div className={`min-h-full pb-32 font-['Hind_Siliguri'] transition-colors duration-500 ${activeTab === 'anonymous' ? 'bg-[#0f172a]' : 'bg-[#f0f2f5]'}`}>
      
      {/* SWITCHER */}
      <div className="sticky top-0 z-[100] bg-white/90 backdrop-blur-md border-b px-4 py-3 shadow-sm flex items-center justify-center">
        <div className="bg-slate-100 p-1.5 rounded-[24px] flex gap-1 w-full max-w-sm">
          <button onClick={() => setActiveTab('public')} className={`flex-1 py-3 rounded-[20px] font-black text-xs transition-all flex items-center justify-center gap-2 ${activeTab === 'public' ? 'bg-emerald-700 text-white shadow-lg' : 'text-slate-500'}`}>
            <UserIcon size={16}/> পাবলিক
          </button>
          <button onClick={() => setActiveTab('anonymous')} className={`flex-1 py-3 rounded-[20px] font-black text-xs transition-all flex items-center justify-center gap-2 ${activeTab === 'anonymous' ? 'bg-indigo-700 text-white shadow-lg' : 'text-slate-500'}`}>
            <Ghost size={16}/> বেনামী
          </button>
        </div>
      </div>

      {/* STORIES SECTION */}
      {activeTab === 'public' && (
        <div className="bg-white p-5 mb-4 flex gap-5 overflow-x-auto no-scrollbar border-b shadow-sm items-center">
          <div className="flex flex-col items-center shrink-0">
            <button 
              onClick={() => storyRef.current?.click()}
              className="w-16 h-16 rounded-[22px] bg-slate-50 flex items-center justify-center border-2 border-emerald-500 border-dashed active:scale-95 transition-all shadow-inner"
            >
              {isProcessingMedia ? <Loader2 className="animate-spin text-emerald-600" /> : <Plus className="text-emerald-600" size={28} />}
            </button>
            <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase">স্টোরি দিন</span>
            <input type="file" ref={storyRef} onChange={(e) => handleFileUpload(e, 'story')} className="hidden" accept="image/*" />
          </div>
          {stories.map(group => (
            <div key={group.uid} onClick={() => { setActiveStoryGroup(group); setCurrentStoryIndex(0); }} className="flex flex-col items-center shrink-0 cursor-pointer active:scale-95 transition-transform">
              <div className="w-16 h-16 rounded-[22px] border-2 border-emerald-500 p-0.5 shadow-md bg-white ring-2 ring-emerald-50 ring-offset-2">
                <img src={group.userAvatar} className="w-full h-full rounded-[20px] object-cover bg-slate-100" alt="story" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 mt-2 truncate w-16 text-center">{group.userName}</span>
            </div>
          ))}
        </div>
      )}

      {/* COMPOSER TRIGGER */}
      <div className={`mx-4 mt-4 p-5 rounded-[36px] border shadow-sm mb-6 ${activeTab === 'anonymous' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100'}`}>
         <div className="flex gap-4 items-center">
            <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center shadow-lg ${activeTab === 'anonymous' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
               {activeTab === 'anonymous' ? <Ghost className="text-white" size={24}/> : <img src={user?.avatarUrl} className="w-full h-full rounded-[18px] object-cover" alt="me" />}
            </div>
            <button onClick={() => { setEditingId(null); setShowComposer(true); }} className={`flex-grow text-left py-4 px-6 rounded-2xl text-sm font-black transition-all ${activeTab === 'anonymous' ? 'bg-white/10 text-white/40' : 'bg-slate-50 text-slate-400'}`}>
              {activeTab === 'anonymous' ? 'আপনার জীবন সম্পর্কে অভিজ্ঞতা শেয়ার করুন...' : 'আজকে আপনার প্রস্তুতি কেমন?'}
            </button>
         </div>
      </div>

      {/* FEED LIST */}
      <div className="space-y-6 px-4">
        {posts.map(post => (
          <div key={post.id} className={`rounded-[40px] shadow-sm border overflow-hidden animate-in slide-in-from-bottom duration-500 ${post.isAnonymous ? 'bg-white/10 border-white/10 text-white' : 'bg-white border-slate-100'}`}>
            <div className={`p-6 flex justify-between items-center ${post.isAnonymous ? 'bg-white/5' : 'bg-slate-50/50'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border shadow-sm ${post.isAnonymous ? 'bg-indigo-600 text-white' : 'bg-white border-slate-200'}`}>
                  {post.isAnonymous ? <UserIcon size={24} /> : <img src={post.userAvatar} className="w-full h-full object-cover" alt="avatar" />}
                </div>
                <div>
                  <h4 className={`font-black text-sm leading-tight ${post.isAnonymous ? 'text-indigo-200' : 'text-slate-900'}`}>
                    {post.isAnonymous ? 'গোপন ইউজার' : post.userName}
                  </h4>
                  <p className={`text-[10px] font-bold uppercase mt-1 ${post.isAnonymous ? 'text-white/30' : 'text-slate-400'}`}>{post.time}</p>
                </div>
              </div>
              {post.uid === auth.currentUser?.uid && (
                <div className="flex gap-2">
                   <button onClick={() => { 
                      setEditingId(post.id); setContent(post.content); setMediaImg(post.image || null); setMediaVid(post.video || null); setMediaAudio(post.audio || null); setMediaPdf(post.pdf || null); setPdfName(post.pdfName || ''); setShowComposer(true);
                   }} className="p-2.5 bg-white/10 rounded-xl text-slate-400 hover:text-emerald-500"><Edit3 size={16}/></button>
                   <button onClick={() => setDeleteConfirm({show: true, type: 'post', id: post.id})} className="p-2.5 bg-white/10 rounded-xl text-rose-400"><Trash2 size={16}/></button>
                </div>
              )}
            </div>
            <div className="p-7">
              {post.content && <p className="text-[16px] leading-relaxed whitespace-pre-wrap font-medium mb-6">{post.content}</p>}
              
              {post.pdf && (
                <div className={`mb-6 p-6 rounded-3xl flex items-center justify-between border ${post.isAnonymous ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center"><FileText size={24}/></div>
                      <div>
                         <p className={`text-sm font-black truncate max-w-[150px] ${post.isAnonymous ? 'text-white' : 'text-slate-900'}`}>{post.pdfName || 'Document.pdf'}</p>
                         <p className="text-[10px] text-slate-400 font-bold uppercase">PDF DOCUMENT</p>
                      </div>
                   </div>
                   <a href={post.pdf} download={post.pdfName || 'file.pdf'} className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg active:scale-95 transition-all"><Download size={20}/></a>
                </div>
              )}

              {post.video && (
                <div className="mb-6 rounded-[32px] overflow-hidden border border-white/5 shadow-lg bg-black">
                  <video src={post.video} controls className="w-full max-h-[500px]" />
                </div>
              )}
              {post.audio && (
                <div className={`mb-6 p-5 rounded-3xl flex items-center gap-4 border ${post.isAnonymous ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg shrink-0 ${post.isAnonymous ? 'bg-indigo-600' : 'bg-emerald-500'}`}><Volume2 size={24}/></div>
                  <audio src={post.audio} controls className="flex-grow h-10 custom-audio" />
                </div>
              )}
              {post.image && (
                <div className="mb-6 rounded-[32px] overflow-hidden border border-white/5 shadow-sm"><img src={post.image} className="w-full object-contain max-h-[500px]" alt="post" /></div>
              )}

              <div className={`flex items-center justify-between mt-8 pt-6 border-t ${post.isAnonymous ? 'border-white/5' : 'border-slate-50'}`}>
                <div className="flex items-center gap-8">
                  <button onClick={() => handleLike(post.id, post.likedBy)} className={`flex items-center gap-2.5 font-black text-sm transition-all active:scale-125 ${post.likedBy?.includes(auth.currentUser?.uid || '') ? (post.isAnonymous ? 'text-indigo-400' : 'text-emerald-600') : 'text-slate-400'}`}>
                    <ThumbsUp size={20} fill={post.likedBy?.includes(auth.currentUser?.uid || '') ? "currentColor" : "none"} /> {post.likes || 0}
                  </button>
                  <button onClick={() => setActivePostId(post.id)} className="flex items-center gap-2.5 text-slate-400 font-black text-sm hover:text-slate-600 active:scale-95 transition-all">
                    <MessageSquare size={20} /> {post.comments?.length || 0}
                  </button>
                </div>
                <button className="text-slate-400 p-1 hover:text-indigo-500"><Share2 size={20} /></button>
              </div>
            </div>
          </div>
        ))}
        {loading && <div className="py-24 text-center"><Loader2 className="animate-spin mx-auto text-emerald-600" size={32} /></div>}
      </div>

      {/* STORY VIEWER */}
      {activeStoryGroup && (
        <div className="fixed inset-0 bg-black z-[2000] flex flex-col font-['Hind_Siliguri']">
           {/* Progress Bars */}
           <div className="absolute top-6 inset-x-4 flex gap-1.5 z-[2100]">
              {activeStoryGroup.items.map((_: any, idx: number) => (
                <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                   <div className={`h-full bg-white transition-all duration-[5000ms] ease-linear ${idx < currentStoryIndex ? 'w-full' : idx === currentStoryIndex ? 'w-full' : 'w-0'}`} />
                </div>
              ))}
           </div>
           
           {/* Header */}
           <div className="absolute top-12 inset-x-0 px-6 flex items-center justify-between z-[2100]">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full border-2 border-emerald-500 p-0.5"><img src={activeStoryGroup.userAvatar} className="w-full h-full rounded-full object-cover" alt=""/></div>
                 <div className="flex flex-col">
                    <span className="text-white font-black text-sm shadow-sm">{activeStoryGroup.userName}</span>
                    <button 
                      onClick={() => {
                        if (activeStoryGroup.uid === auth.currentUser?.uid) {
                          fetchViewersData(activeStoryGroup.items[currentStoryIndex].viewers || []);
                          setShowViewersList(true);
                        }
                      }}
                      className="text-white/60 text-[10px] flex items-center gap-1 active:scale-95"
                    >
                      <Eye size={10}/> {activeStoryGroup.items[currentStoryIndex].viewers?.length || 0} ভিউ
                    </button>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 {activeStoryGroup.uid === auth.currentUser?.uid && (
                   <button onClick={() => setDeleteConfirm({show: true, type: 'story', id: activeStoryGroup.items[currentStoryIndex].id})} className="p-2.5 bg-black/20 text-white rounded-full backdrop-blur-md"><Trash2 size={20}/></button>
                 )}
                 <button onClick={() => setActiveStoryGroup(null)} className="p-2.5 bg-black/20 text-white rounded-full backdrop-blur-md"><X size={24}/></button>
              </div>
           </div>

           {/* Media Content */}
           <div className="flex-grow flex items-center justify-center relative">
              <img src={activeStoryGroup.items[currentStoryIndex].media} className="w-full max-h-screen object-contain" alt="story content" />
              {/* Navigation Regions */}
              <div className="absolute inset-y-0 left-0 w-1/3" onClick={() => setCurrentStoryIndex(p => Math.max(0, p - 1))}></div>
              <div className="absolute inset-y-0 right-0 w-1/3" onClick={() => {
                if (currentStoryIndex < activeStoryGroup.items.length - 1) setCurrentStoryIndex(p => p + 1);
                else setActiveStoryGroup(null);
              }}></div>
           </div>

           {/* Viewers List Overlay */}
           {showViewersList && (
             <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-[40px] p-8 z-[2500] animate-in slide-in-from-bottom duration-300 max-h-[50vh] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="font-black text-slate-900">স্টোরি ভিউয়ার্স ({viewersData.length})</h3>
                   <button onClick={() => setShowViewersList(false)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={18}/></button>
                </div>
                <div className="flex-grow overflow-y-auto space-y-4 no-scrollbar">
                   {viewersData.map((v, i) => (
                     <div key={i} className="flex items-center gap-4 p-2 bg-slate-50 rounded-2xl">
                        <img src={v.avatar} className="w-10 h-10 rounded-full object-cover" alt=""/>
                        <span className="font-bold text-slate-800 text-sm">{v.name}</span>
                     </div>
                   ))}
                   {viewersData.length === 0 && (
                     <p className="text-center py-10 text-slate-300 font-bold uppercase text-[10px]">এখনো কেউ দেখেনি</p>
                   )}
                </div>
             </div>
           )}
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deleteConfirm && deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[3000] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-sm rounded-[40px] p-10 text-center animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner"><AlertTriangle size={40} /></div>
              <h4 className="text-2xl font-black text-slate-900 mb-2">আপনি কি নিশ্চিত?</h4>
              <p className="text-sm text-slate-400 font-bold mb-10 leading-relaxed">এই {deleteConfirm.type === 'post' ? 'পোস্টটি' : 'স্টোরিটি'} ডিলিট করলে তা আর ফিরে পাওয়া যাবে না।</p>
              <div className="flex flex-col gap-3">
                 <button onClick={handleDelete} className="w-full bg-rose-600 text-white py-5 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all">হ্যাঁ, ডিলিট করুন</button>
                 <button onClick={() => setDeleteConfirm(null)} className="w-full bg-slate-100 text-slate-400 py-4 rounded-2xl font-black text-sm">বাতিল</button>
              </div>
           </div>
        </div>
      )}

      {/* COMMENT MODAL */}
      {activePostId && currentCommentPost && (
        <div className="fixed inset-0 bg-black/70 z-[1000] flex items-end justify-center backdrop-blur-sm">
           <div className="bg-white w-full max-w-md rounded-t-[50px] p-8 animate-in slide-in-from-bottom duration-400 max-h-[85vh] flex flex-col shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="font-black text-xl text-slate-900">{currentCommentPost.isAnonymous ? 'আপনার জীবন সম্পর্কে অভিজ্ঞতা' : 'মন্তব্যসমূহ'}</h3>
                 <button onClick={() => { setActivePostId(null); setReplyingToCommentId(null); }} className="p-3 bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
              </div>
              <div className="flex-grow overflow-y-auto space-y-6 mb-8 no-scrollbar pr-1">
                 {currentCommentPost.comments?.map((c: Comment) => (
                   <div key={c.id} className="flex flex-col gap-2">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 overflow-hidden">
                          {c.userAvatar && c.userAvatar !== 'anonymous' ? <img src={c.userAvatar} className="w-full h-full object-cover" /> : <UserIcon size={20} />}
                        </div>
                        <div className="flex-grow">
                           <div className="bg-slate-50 p-5 rounded-[24px] border border-slate-100">
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{c.userName}</p>
                              <p className="text-sm text-slate-700 font-medium">{c.text}</p>
                           </div>
                           <div className="flex items-center gap-6 mt-2 ml-3">
                              <p className="text-[9px] text-slate-300 font-black uppercase">{c.time}</p>
                              <button 
                                onClick={() => handleCommentLike(currentCommentPost.id, c.id)}
                                className={`flex items-center gap-1 text-[10px] font-black uppercase transition-all ${c.likedBy?.includes(auth.currentUser?.uid || '') ? 'text-emerald-600' : 'text-slate-400'}`}
                              >
                                <ThumbsUp size={12} fill={c.likedBy?.includes(auth.currentUser?.uid || '') ? "currentColor" : "none"} /> {c.likes || 0}
                              </button>
                              <button 
                                onClick={() => setReplyingToCommentId(c.id)}
                                className={`text-[10px] font-black uppercase ${replyingToCommentId === c.id ? 'text-emerald-600' : 'text-slate-400'}`}
                              >
                                রিপ্লাই
                              </button>
                           </div>
                        </div>
                      </div>

                      {/* Replies */}
                      {c.replies?.map((r: Comment) => (
                        <div key={r.id} className="flex gap-3 ml-12 mt-2">
                           <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 shrink-0 overflow-hidden">
                              {r.userAvatar && r.userAvatar !== 'anonymous' ? <img src={r.userAvatar} className="w-full h-full object-cover" /> : <UserIcon size={14} />}
                           </div>
                           <div className="flex-grow">
                              <div className="bg-slate-50/50 p-4 rounded-[20px] border border-slate-100">
                                 <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">{r.userName}</p>
                                 <p className="text-xs text-slate-600 font-medium">{r.text}</p>
                              </div>
                              <div className="flex items-center gap-4 mt-1.5 ml-2">
                                 <p className="text-[8px] text-slate-300 font-black uppercase">{r.time}</p>
                                 <button 
                                  onClick={() => handleCommentLike(currentCommentPost.id, r.id)}
                                  className={`flex items-center gap-1 text-[9px] font-black uppercase ${r.likedBy?.includes(auth.currentUser?.uid || '') ? 'text-emerald-600' : 'text-slate-400'}`}
                                 >
                                    <ThumbsUp size={10} fill={r.likedBy?.includes(auth.currentUser?.uid || '') ? "currentColor" : "none"} /> {r.likes || 0}
                                 </button>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                 ))}
                 {(!currentCommentPost.comments || currentCommentPost.comments.length === 0) && (
                   <div className="text-center py-20 opacity-30 flex flex-col items-center">
                      <MessageSquare className="mb-4" size={56}/>
                      <p className="text-xs font-black uppercase tracking-[0.3em]">এখনো কোনো মন্তব্য নেই</p>
                   </div>
                 )}
              </div>

              {replyingToCommentId && (
                <div className="flex items-center justify-between px-4 py-2 bg-emerald-50 rounded-t-2xl border-t border-emerald-100 animate-in slide-in-from-bottom duration-200">
                   <p className="text-[10px] font-black text-emerald-700 uppercase">রিপ্লাই দিচ্ছেন: {currentCommentPost.comments.find(c => c.id === replyingToCommentId)?.userName}</p>
                   <button onClick={() => setReplyingToCommentId(null)} className="text-emerald-700"><X size={14}/></button>
                </div>
              )}

              <div className="flex gap-3 bg-slate-50 p-2 rounded-[28px] border border-slate-100 shadow-inner">
                 <input 
                  type="text" 
                  value={commentInput} 
                  onChange={(e) => setCommentInput(e.target.value)} 
                  placeholder={replyingToCommentId ? "আপনার উত্তর লিখুন..." : "আপনার মতামত লিখুন..."} 
                  className="flex-grow bg-white p-5 rounded-2xl outline-none font-bold text-sm shadow-sm" 
                 />
                 <button onClick={handleComment} disabled={isCommenting || !commentInput.trim()} className={`w-16 h-16 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all ${currentCommentPost.isAnonymous ? 'bg-indigo-700' : 'bg-emerald-700'}`}>
                    {isCommenting ? <Loader2 className="animate-spin" size={24}/> : <Send size={28}/>}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* COMPOSER */}
      {showComposer && (
        <div className="fixed inset-0 bg-white z-[1000] flex flex-col animate-in slide-in-from-bottom duration-400">
          <div className={`p-6 border-b flex items-center justify-between text-white ${activeTab === 'anonymous' ? 'bg-indigo-900 shadow-xl' : 'bg-emerald-900 shadow-xl'}`}>
            <button onClick={closeComposer} className="p-2.5 bg-white/10 rounded-full"><X size={24}/></button>
            <h3 className="font-black text-xl flex items-center gap-3">
               {activeTab === 'anonymous' ? <Ghost size={24}/> : <UserIcon size={24}/>} 
               {editingId ? 'পোস্ট এডিট' : (activeTab === 'anonymous' ? 'আপনার জীবন সম্পর্কে অভিজ্ঞতা' : 'নতুন পোস্ট')}
            </h3>
            <button onClick={handlePost} disabled={isPublishing || (!content.trim() && !mediaImg && !mediaVid && !mediaAudio && !mediaPdf)} className="px-8 py-3 bg-white text-slate-900 rounded-[20px] font-black text-sm disabled:opacity-50 shadow-2xl">
              {isPublishing ? <Loader2 className="animate-spin" size={18}/> : 'পাবলিশ'}
            </button>
          </div>
          <div className="p-8 flex-grow overflow-y-auto no-scrollbar">
            {isRecording ? (
               <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-24 h-24 bg-rose-500 rounded-full flex items-center justify-center animate-pulse shadow-xl shadow-rose-500/30 mb-6">
                     <Square size={32} className="text-white" fill="white" />
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 mb-2">রেকর্ড হচ্ছে: {recordingTime}s</h4>
                  <button onClick={stopRecording} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm">সম্পন্ন করুন</button>
               </div>
            ) : (
              <>
                <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={activeTab === 'anonymous' ? "আপনার জীবন সম্পর্কে অভিজ্ঞতা শেয়ার করুন..." : "আজকের অভিজ্ঞতা লিখুন..."} className="w-full text-2xl outline-none resize-none min-h-[200px] font-medium placeholder:text-slate-200" autoFocus />
                
                {mediaPdf && (
                   <div className="relative rounded-[32px] bg-slate-50 p-6 border-2 border-emerald-500 flex items-center justify-between shadow-lg mt-4">
                      <div className="flex items-center gap-4">
                         <FileText size={24} className="text-emerald-700"/>
                         <span className="text-sm font-black truncate max-w-[200px]">{pdfName}</span>
                      </div>
                      <button onClick={() => setMediaPdf(null)} className="p-2 bg-rose-500 text-white rounded-lg"><X size={16}/></button>
                   </div>
                )}

                {mediaAudio && (
                  <div className="relative rounded-[32px] bg-slate-50 p-6 border-2 border-indigo-500 flex items-center gap-4 shadow-lg mt-4">
                    <Volume2 size={24} className="text-indigo-700" />
                    <audio src={mediaAudio} controls className="flex-grow h-10" />
                    <button onClick={() => setMediaAudio(null)} className="p-2 bg-rose-500 text-white rounded-lg"><X size={16}/></button>
                  </div>
                )}

                {mediaImg && (
                  <div className="relative rounded-[40px] overflow-hidden border-4 border-white shadow-2xl mt-4"><img src={mediaImg} className="w-full" alt="preview" /><button onClick={() => setMediaImg(null)} className="absolute top-6 right-6 p-3 bg-black/60 text-white rounded-2xl backdrop-blur-md shadow-xl"><X size={20}/></button></div>
                )}
                {mediaVid && (
                  <div className="relative rounded-[40px] overflow-hidden border-4 border-white shadow-2xl mt-4 bg-black">
                    <video src={mediaVid} controls className="w-full" />
                    <button onClick={() => setMediaVid(null)} className="absolute top-6 right-6 p-3 bg-black/60 text-white rounded-2xl backdrop-blur-md shadow-xl z-10"><X size={20}/></button>
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="p-8 border-t flex items-center justify-around bg-slate-50 rounded-t-[48px]">
             <button onClick={() => imgRef.current?.click()} className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md text-emerald-600 border border-slate-100"><Camera size={28}/></div>
                <span className="text-[10px] font-black text-slate-400 uppercase">ছবি</span>
             </button>
             <button onClick={() => vidRef.current?.click()} className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md text-blue-600 border border-slate-100"><Film size={28}/></div>
                <span className="text-[10px] font-black text-slate-400 uppercase">ভিডিও</span>
             </button>
             <button onClick={() => fileRef.current?.click()} className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md text-rose-600 border border-slate-100"><FileText size={28}/></div>
                <span className="text-[10px] font-black text-slate-400 uppercase">ফাইল</span>
             </button>
             <button onClick={startRecording} className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md text-indigo-600 border border-slate-100"><Mic size={28}/></div>
                <span className="text-[10px] font-black text-slate-400 uppercase">ভয়েস</span>
             </button>

             <input type="file" ref={imgRef} onChange={(e) => handleFileUpload(e, 'img')} className="hidden" accept="image/*" />
             <input type="file" ref={vidRef} onChange={(e) => handleFileUpload(e, 'vid')} className="hidden" accept="video/*" />
             <input type="file" ref={fileRef} onChange={(e) => handleFileUpload(e, 'pdf')} className="hidden" accept=".pdf" />
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityTab;
