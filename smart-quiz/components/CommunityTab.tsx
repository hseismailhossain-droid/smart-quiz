
import React, { useState, useRef, useEffect } from 'react';
import { Ghost, MessageSquare, Share2, Camera, Film, Send, X, Loader2, Plus, Trash2, FileText, ThumbsUp, Edit3, Mic, User as UserIcon, Square, Volume2, Link as LinkIcon, Download, ChevronRight, ChevronLeft, Heart, Paperclip, MoreVertical } from 'lucide-react';
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
  
  // States for Modals
  const [showComposer, setShowComposer] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkTarget, setLinkTarget] = useState<'post' | 'story'>('post');
  const [externalLink, setExternalLink] = useState('');
  const [activeStoryGroup, setActiveStoryGroup] = useState<any | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, type: 'post' | 'story' | 'comment', id: string, extraId?: string, item?: any} | null>(null);

  // States for Post Drafting
  const [content, setContent] = useState('');
  const [mediaImg, setMediaImg] = useState<string | null>(null);
  const [mediaVid, setMediaVid] = useState<string | null>(null);
  const [mediaAudio, setMediaAudio] = useState<string | null>(null);
  const [mediaPdf, setMediaPdf] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string>('');
  const [commentInput, setCommentInput] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<any>(null);

  // Refs for inputs
  const imgRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const storyRef = useRef<HTMLInputElement>(null);

  // Sync Feed and Stories
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

  // Story Auto-progress
  useEffect(() => {
    if (!activeStoryGroup) { setStoryProgress(0); return; }
    const interval = setInterval(() => {
      setStoryProgress(p => {
        if (p >= 100) {
          if (currentStoryIndex < activeStoryGroup.items.length - 1) {
            setCurrentStoryIndex(i => i + 1);
            return 0;
          } else {
            setActiveStoryGroup(null);
            return 0;
          }
        }
        return p + 1;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [activeStoryGroup, currentStoryIndex]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'img' | 'vid' | 'story' | 'pdf') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024 && type !== 'vid') {
      alert("ফাইলের সাইজ বড়। বড় ফাইলের জন্য 'লিঙ্ক' অপশনটি ব্যবহার করুন।");
      e.target.value = '';
      return;
    }

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
            mediaType: file.type.startsWith('video') ? 'video' : 'image',
            timestamp_ms: Date.now(),
            timestamp: serverTimestamp()
          });
          alert("স্টোরি আপলোড হয়েছে!");
        } catch (err) { alert("স্টোরি আপলোড ব্যর্থ হয়েছে।"); }
      } else if (type === 'pdf') { setMediaPdf(base64); setPdfName(file.name); }
      else if (type === 'vid') setMediaVid(base64);
      else setMediaImg(base64);
      setIsProcessingMedia(false);
      if (type !== 'story') setShowComposer(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const applyLink = async () => {
    if (!externalLink.trim()) return;
    const url = externalLink.trim();
    const isVideo = url.match(/\.(mp4|webm|mov|m4v|youtube|vimeo)/i) || url.includes('youtube.com') || url.includes('youtu.be');

    if (linkTarget === 'story') {
      setIsProcessingMedia(true);
      try {
        await addDoc(collection(db, 'stories'), {
          uid: auth.currentUser?.uid,
          userName: user?.name || "User",
          userAvatar: user?.avatarUrl || "",
          media: url,
          mediaType: isVideo ? 'video' : 'image',
          timestamp_ms: Date.now(),
          timestamp: serverTimestamp()
        });
        alert("লিঙ্ক স্টোরি যুক্ত হয়েছে!");
      } catch (err) { alert("স্টোরি ব্যর্থ হয়েছে।"); }
      finally { setIsProcessingMedia(false); setShowLinkInput(false); setExternalLink(''); }
    } else {
      if (isVideo) setMediaVid(url);
      else setMediaImg(url);
      setExternalLink('');
      setShowLinkInput(false);
    }
  };

  const handlePost = async () => {
    if (!content.trim() && !mediaImg && !mediaVid && !mediaAudio && !mediaPdf) return;
    setIsPublishing(true);
    try {
      const isAnon = activeTab === 'anonymous';
      const postData = {
        uid: auth.currentUser?.uid || 'guest',
        userName: isAnon ? "গোপন ইউজার" : (user?.name || "ইউজার"),
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
        time: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })
      };
      if (editingId) await updateDoc(doc(db, 'posts', editingId), postData);
      else await addDoc(collection(db, 'posts'), postData);
      closeComposer();
    } catch (err) { alert("পোস্ট করা যায়নি।"); }
    finally { setIsPublishing(false); }
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
    setShowLinkInput(false);
  };

  const handleComment = async () => {
    if (!commentInput.trim() || !activePostId) return;
    setIsCommenting(true);
    try {
      const newComment = {
        id: Math.random().toString(36).substr(2, 9),
        uid: auth.currentUser?.uid || '',
        userName: activeTab === 'anonymous' ? 'গোপন ইউজার' : (user?.name || 'User'),
        userAvatar: activeTab === 'anonymous' ? 'anonymous' : (user?.avatarUrl || ''),
        text: commentInput.trim(),
        time: 'এখনই',
        timestamp: Date.now()
      };
      await updateDoc(doc(db, 'posts', activePostId), { comments: arrayUnion(newComment) });
      setCommentInput('');
    } catch (err) { alert("ব্যর্থ হয়েছে।"); }
    finally { setIsCommenting(false); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'post') {
        await deleteDoc(doc(db, 'posts', deleteConfirm.id));
      } else if (deleteConfirm.type === 'story') {
        await deleteDoc(doc(db, 'stories', deleteConfirm.id));
        setActiveStoryGroup(null);
      } else if (deleteConfirm.type === 'comment' && deleteConfirm.extraId && deleteConfirm.item) {
        await updateDoc(doc(db, 'posts', deleteConfirm.extraId), {
          comments: arrayRemove(deleteConfirm.item)
        });
      }
      setDeleteConfirm(null);
    } catch (e) { alert("মুছে ফেলা যায়নি।"); }
  };

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

  const handleShare = async (post: Post) => {
    // Ensuring a valid absolute URL for sharing
    const shareUrl = window.location.origin + window.location.pathname;
    const shareData = {
      title: 'Smart Quiz',
      text: post.content ? post.content.substring(0, 100) : 'Check out this post on Smart Quiz!',
      url: shareUrl
    };
    
    const fallbackToClipboard = async () => {
      try {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        alert("লিঙ্ক কপি করা হয়েছে!");
      } catch (e) {
        alert("শেয়ার করা সম্ভব হয়নি।");
      }
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await fallbackToClipboard();
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      await fallbackToClipboard();
    }
  };

  return (
    <div className={`min-h-full pb-32 font-['Hind_Siliguri'] transition-colors duration-500 ${activeTab === 'anonymous' ? 'bg-slate-900' : 'bg-slate-50'}`}>
      
      {/* Header Tabs */}
      <div className="sticky top-0 z-[100] bg-white/90 backdrop-blur-md border-b px-4 py-3 shadow-sm flex items-center justify-center">
        <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 w-full max-w-sm">
          <button onClick={() => setActiveTab('public')} className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${activeTab === 'public' ? 'bg-emerald-700 text-white shadow-lg' : 'text-slate-500'}`}>
            পাবলিক
          </button>
          <button onClick={() => setActiveTab('anonymous')} className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${activeTab === 'anonymous' ? 'bg-indigo-700 text-white shadow-lg' : 'text-slate-500'}`}>
            বেনামী
          </button>
        </div>
      </div>

      {/* Stories */}
      {activeTab === 'public' && (
        <div className="bg-white p-5 mb-4 flex gap-4 overflow-x-auto no-scrollbar border-b shadow-sm items-center">
          <div className="flex gap-3 shrink-0">
            <div className="flex flex-col items-center">
              <button onClick={() => storyRef.current?.click()} className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center border-2 border-emerald-500 border-dashed transition-transform active:scale-90 shadow-sm">
                {isProcessingMedia ? <Loader2 className="animate-spin text-emerald-600" /> : <Camera className="text-emerald-600" size={24} />}
              </button>
              <span className="text-[9px] font-bold text-slate-400 mt-2 uppercase">ক্যামেরা</span>
            </div>
            <div className="flex flex-col items-center">
              <button onClick={() => { setLinkTarget('story'); setShowLinkInput(true); }} className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center border-2 border-amber-500 border-dashed transition-transform active:scale-90 shadow-sm">
                <LinkIcon className="text-amber-600" size={24} />
              </button>
              <span className="text-[9px] font-bold text-slate-400 mt-2 uppercase">লিঙ্ক</span>
            </div>
            <input type="file" ref={storyRef} onChange={(e) => handleFileUpload(e, 'story')} className="hidden" accept="image/*,video/*" />
          </div>
          <div className="w-px h-12 bg-slate-100 shrink-0 mx-1"></div>
          {stories.map(group => (
            <div key={group.uid} onClick={() => { setActiveStoryGroup(group); setCurrentStoryIndex(0); }} className="flex flex-col items-center shrink-0 cursor-pointer active:scale-95 transition-transform">
              <div className="w-16 h-16 rounded-2xl border-2 border-emerald-500 p-0.5 shadow-md bg-white">
                <img src={group.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${group.userName}`} className="w-full h-full rounded-[14px] object-cover" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 mt-2 truncate w-16 text-center">{group.userName}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main Feed Content */}
      <div className={`mx-4 mt-4 p-5 rounded-[32px] border shadow-sm mb-6 ${activeTab === 'anonymous' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100'}`}>
        <div className="flex gap-4 items-center">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg ${activeTab === 'anonymous' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
            {activeTab === 'anonymous' ? <Ghost className="text-white" size={20}/> : <img src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`} className="w-full h-full rounded-xl object-cover" />}
          </div>
          <button onClick={() => { setEditingId(null); setLinkTarget('post'); setShowComposer(true); }} className={`flex-grow text-left py-3.5 px-6 rounded-xl text-sm font-black transition-all ${activeTab === 'anonymous' ? 'bg-white/10 text-white/40' : 'bg-slate-50 text-slate-400'}`}>
            {activeTab === 'anonymous' ? 'গোপন কথা শেয়ার করুন...' : 'আজকের প্রস্তুতি কেমন?'}
          </button>
        </div>
      </div>

      <div className="space-y-6 px-4">
        {posts.map(post => (
          <div key={post.id} className={`rounded-[36px] shadow-sm border overflow-hidden animate-in slide-in-from-bottom duration-500 ${post.isAnonymous ? 'bg-white/5 border-white/5 text-white' : 'bg-white border-slate-100'}`}>
            <div className={`p-6 flex justify-between items-center ${post.isAnonymous ? 'bg-white/5' : 'bg-slate-50/50'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border ${post.isAnonymous ? 'bg-indigo-600 text-white' : 'bg-white border-slate-200'}`}>
                  {post.isAnonymous ? <Ghost size={18} /> : <img src={post.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.userName}`} className="w-full h-full object-cover" />}
                </div>
                <div>
                  <h4 className={`font-black text-sm leading-tight ${post.isAnonymous ? 'text-indigo-200' : 'text-slate-900'}`}>{post.isAnonymous ? 'গোপন ইউজার' : post.userName}</h4>
                  <p className={`text-[9px] font-bold uppercase mt-0.5 ${post.isAnonymous ? 'text-white/30' : 'text-slate-400'}`}>{post.time}</p>
                </div>
              </div>
              {post.uid === auth.currentUser?.uid && (
                <div className="flex gap-1">
                  <button onClick={() => { setEditingId(post.id); setContent(post.content); setMediaImg(post.image || null); setMediaVid(post.video || null); setMediaAudio(post.audio || null); setMediaPdf(post.pdf || null); setPdfName(post.pdfName || ''); setShowComposer(true); }} className="p-2 text-slate-400 hover:bg-white/10 rounded-lg"><Edit3 size={16}/></button>
                  <button onClick={() => setDeleteConfirm({show: true, type: 'post', id: post.id})} className="p-2 text-rose-400 hover:bg-white/10 rounded-lg"><Trash2 size={16}/></button>
                </div>
              )}
            </div>
            <div className="p-7">
              {post.content && <p className="text-[16px] leading-relaxed whitespace-pre-wrap font-medium mb-6">{post.content}</p>}
              {post.image && <div className="mb-6 rounded-2xl overflow-hidden border border-slate-100"><img src={post.image} className="w-full max-h-[450px] object-contain bg-slate-50" /></div>}
              {post.video && <div className="mb-6 rounded-2xl overflow-hidden bg-black shadow-lg"><video src={post.video} controls className="w-full max-h-[450px]" /></div>}
              {post.pdf && (
                <div className={`mb-6 p-5 rounded-2xl flex items-center justify-between border ${post.isAnonymous ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center"><FileText size={20}/></div>
                      <p className="text-xs font-black truncate max-w-[150px]">{post.pdfName || 'ডকুমেন্ট.pdf'}</p>
                   </div>
                   <a href={post.pdf} download={post.pdfName || 'file.pdf'} className="p-2.5 bg-emerald-600 text-white rounded-lg"><Download size={18}/></a>
                </div>
              )}
              {post.audio && (
                <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 border ${post.isAnonymous ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                  <Volume2 size={20} className="text-emerald-500" />
                  <audio src={post.audio} controls className="flex-grow h-10 custom-audio" />
                </div>
              )}
              <div className={`flex items-center justify-between mt-8 pt-6 border-t ${post.isAnonymous ? 'border-white/5' : 'border-slate-50'}`}>
                <div className="flex items-center gap-8">
                  <button onClick={async () => {
                    const uid = auth.currentUser?.uid; if (!uid) return;
                    const isLiked = post.likedBy?.includes(uid);
                    await updateDoc(doc(db, 'posts', post.id), { likedBy: isLiked ? arrayRemove(uid) : arrayUnion(uid), likes: increment(isLiked ? -1 : 1) });
                  }} className={`flex items-center gap-2 font-black text-sm transition-all active:scale-125 ${post.likedBy?.includes(auth.currentUser?.uid || '') ? (post.isAnonymous ? 'text-indigo-400' : 'text-emerald-600') : 'text-slate-400'}`}>
                    <Heart size={18} fill={post.likedBy?.includes(auth.currentUser?.uid || '') ? "currentColor" : "none"} /> {post.likes || 0}
                  </button>
                  <button onClick={() => setActivePostId(post.id)} className="flex items-center gap-2 text-slate-400 font-black text-sm active:scale-95 transition-all"><MessageSquare size={18} /> {post.comments?.length || 0}</button>
                </div>
                <button onClick={() => handleShare(post)} className="text-slate-400 p-1"><Share2 size={18} /></button>
              </div>
            </div>
          </div>
        ))}
        {loading && <div className="py-24 text-center"><Loader2 className="animate-spin mx-auto text-emerald-600" size={32} /></div>}
      </div>

      {/* Story Viewer Overlay */}
      {activeStoryGroup && (
        <div className="fixed inset-0 z-[2000] bg-black flex flex-col items-center justify-center">
          <div className="absolute top-6 left-0 right-0 flex gap-1 px-4 z-30">
            {activeStoryGroup.items.map((_: any, idx: number) => (
              <div key={idx} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white transition-all ease-linear" style={{ width: idx < currentStoryIndex ? '100%' : idx === currentStoryIndex ? `${storyProgress}%` : '0%' }} />
              </div>
            ))}
          </div>
          <div className="absolute top-12 left-0 right-0 px-6 flex justify-between items-center z-30">
            <div className="flex items-center gap-3">
              <img src={activeStoryGroup.userAvatar} className="w-9 h-9 rounded-full border border-white" />
              <span className="text-white font-black text-sm">{activeStoryGroup.userName}</span>
            </div>
            <div className="flex items-center gap-2">
              {activeStoryGroup.uid === auth.currentUser?.uid && (
                <button onClick={() => setDeleteConfirm({show: true, type: 'story', id: activeStoryGroup.items[currentStoryIndex].id})} className="text-white p-2 hover:bg-white/10 rounded-full transition-all"><Trash2 size={20} /></button>
              )}
              <button onClick={() => setActiveStoryGroup(null)} className="text-white p-2 hover:bg-white/10 rounded-full transition-all"><X size={24} /></button>
            </div>
          </div>
          <div className="w-full h-full flex items-center justify-center relative">
            <button onClick={() => currentStoryIndex > 0 && setCurrentStoryIndex(c => c - 1)} className="absolute left-0 top-0 bottom-0 w-1/3 z-20" />
            <button onClick={() => { if (currentStoryIndex < activeStoryGroup.items.length - 1) setCurrentStoryIndex(c => c + 1); else setActiveStoryGroup(null); }} className="absolute right-0 top-0 bottom-0 w-1/3 z-20" />
            
            {activeStoryGroup.items[currentStoryIndex].mediaType === 'video' ? (
              <video 
                src={activeStoryGroup.items[currentStoryIndex].media} 
                autoPlay 
                playsInline
                className="max-w-full max-h-full"
              />
            ) : (
              <img src={activeStoryGroup.items[currentStoryIndex].media} className="max-w-full max-h-full object-contain" alt="Story" />
            )}
          </div>
        </div>
      )}

      {/* Comment Overlay */}
      {activePostId && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-[40px] h-[70vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
             <div className="p-6 border-b flex justify-between items-center">
                <h3 className="font-black text-slate-900">মতামত দিন</h3>
                <button onClick={() => setActivePostId(null)} className="p-2.5 bg-slate-50 rounded-full text-slate-400"><X size={20}/></button>
             </div>
             <div className="flex-grow overflow-y-auto p-6 space-y-6 no-scrollbar">
                {posts.find(p => p.id === activePostId)?.comments?.map((c: any) => (
                  <div key={c.id} className="flex gap-4 group animate-in fade-in">
                    <img src={c.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.userName}`} className="w-9 h-9 rounded-full shrink-0" />
                    <div className="bg-slate-50 p-4 rounded-2xl flex-grow border border-slate-100 relative">
                       <div className="flex justify-between items-start">
                          <p className="font-black text-emerald-700 text-[10px] mb-1">{c.userName}</p>
                          {(c.uid === auth.currentUser?.uid || posts.find(p => p.id === activePostId)?.uid === auth.currentUser?.uid) && (
                            <button 
                              onClick={() => setDeleteConfirm({show: true, type: 'comment', id: c.id, extraId: activePostId, item: c})}
                              className="text-slate-300 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 size={12}/>
                            </button>
                          )}
                       </div>
                       <p className="text-xs font-medium text-slate-700 leading-relaxed">{c.text}</p>
                    </div>
                  </div>
                ))}
             </div>
             <div className="p-6 border-t flex gap-3">
                <input type="text" value={commentInput} onChange={(e) => setCommentInput(e.target.value)} placeholder="আপনার মতামত লিখুন..." className="flex-grow bg-slate-50 p-4 rounded-xl outline-none font-bold text-sm" />
                <button onClick={handleComment} disabled={isCommenting || !commentInput.trim()} className="bg-emerald-700 text-white w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all active:scale-90">
                  {isCommenting ? <Loader2 className="animate-spin" size={18}/> : <Send size={20}/>}
                </button>
             </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-[3000] bg-black/70 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-xs rounded-[40px] p-8 text-center animate-in zoom-in duration-200 shadow-2xl">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6"><Trash2 size={32}/></div>
            <h4 className="text-xl font-black text-slate-900 mb-2">মুছে ফেলবেন?</h4>
            <div className="flex flex-col gap-3 mt-8">
              <button onClick={handleDelete} className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all">হ্যাঁ, মুছে ফেলুন</button>
              <button onClick={() => setDeleteConfirm(null)} className="w-full bg-slate-100 text-slate-400 py-4 rounded-2xl font-black text-sm active:scale-95 transition-all">বাতিল</button>
            </div>
          </div>
        </div>
      )}

      {/* Composer Modal */}
      {showComposer && (
        <div className="fixed inset-0 bg-white z-[1000] flex flex-col animate-in slide-in-from-bottom duration-400">
          <div className={`p-6 border-b flex items-center justify-between text-white ${activeTab === 'anonymous' ? 'bg-indigo-900 shadow-xl' : 'bg-emerald-900 shadow-xl'}`}>
            <button onClick={closeComposer} className="p-2.5 bg-white/10 rounded-full"><X size={24}/></button>
            <h3 className="font-black text-xl">{editingId ? 'পোস্ট এডিট' : 'নতুন পোস্ট'}</h3>
            <button onClick={handlePost} disabled={isPublishing} className="px-8 py-3 bg-white text-slate-900 rounded-2xl font-black text-sm shadow-2xl active:scale-90 transition-all">
              {isPublishing ? <Loader2 className="animate-spin" size={18}/> : 'পাবলিশ'}
            </button>
          </div>
          <div className="p-8 flex-grow overflow-y-auto no-scrollbar">
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="আপনার মনের কথা লিখুন..." className="w-full text-2xl outline-none resize-none min-h-[200px] font-medium" autoFocus />
            {mediaImg && <div className="relative rounded-3xl overflow-hidden mt-4 shadow-2xl"><img src={mediaImg} className="w-full" /><button onClick={() => setMediaImg(null)} className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-lg"><X size={18}/></button></div>}
            {mediaVid && <div className="relative rounded-3xl overflow-hidden mt-4 bg-black shadow-2xl"><video src={mediaVid} controls className="w-full" /><button onClick={() => setMediaVid(null)} className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-lg"><X size={18}/></button></div>}
            {mediaPdf && <div className="bg-slate-50 p-6 rounded-2xl mt-4 border flex items-center gap-4 shadow-sm animate-in zoom-in"><FileText className="text-rose-600"/><p className="text-xs font-black truncate">{pdfName}</p><button onClick={()=>setMediaPdf(null)} className="ml-auto text-slate-400"><X size={18}/></button></div>}
            {mediaAudio && <div className="bg-slate-50 p-6 rounded-2xl mt-4 border flex items-center gap-4 shadow-sm animate-in zoom-in"><Volume2 className="text-indigo-600"/><p className="text-xs font-black uppercase">ভয়েস রেকর্ড</p><button onClick={()=>setMediaAudio(null)} className="ml-auto text-rose-500"><Trash2 size={18}/></button></div>}
          </div>
          <div className="p-8 border-t flex items-center justify-around bg-slate-50 rounded-t-[44px]">
             <button onClick={() => imgRef.current?.click()} className="flex flex-col items-center gap-2 active:scale-90 transition-transform"><div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md text-emerald-600 border border-slate-100"><Camera size={24}/></div><span className="text-[9px] font-black text-slate-400 uppercase">ছবি</span></button>
             <button onClick={() => vidRef.current?.click()} className="flex flex-col items-center gap-2 active:scale-90 transition-transform"><div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md text-blue-600 border border-slate-100"><Film size={24}/></div><span className="text-[9px] font-black text-slate-400 uppercase">ভিডিও</span></button>
             <button onClick={() => { setLinkTarget('post'); setShowLinkInput(true); }} className="flex flex-col items-center gap-2 active:scale-90 transition-transform"><div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md text-amber-600 border border-slate-100"><LinkIcon size={24}/></div><span className="text-[9px] font-black text-slate-400 uppercase">লিঙ্ক</span></button>
             <button onClick={startRecording} className="flex flex-col items-center gap-2 active:scale-90 transition-transform"><div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md text-indigo-600 border border-slate-100"><Mic size={24}/></div><span className="text-[9px] font-black text-slate-400 uppercase">ভয়েস</span></button>
             <button onClick={() => pdfRef.current?.click()} className="flex flex-col items-center gap-2 active:scale-90 transition-transform"><div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md text-rose-600 border border-slate-100"><Paperclip size={24}/></div><span className="text-[9px] font-black text-slate-400 uppercase">ফাইল</span></button>
             <input type="file" ref={imgRef} onChange={(e) => handleFileUpload(e, 'img')} className="hidden" accept="image/*" />
             <input type="file" ref={vidRef} onChange={(e) => handleFileUpload(e, 'vid')} className="hidden" accept="video/*" />
             <input type="file" ref={pdfRef} onChange={(e) => handleFileUpload(e, 'pdf')} className="hidden" accept=".pdf,.doc,.docx" />
          </div>
        </div>
      )}

      {/* Shared Link Input Modal */}
      {showLinkInput && (
        <div className="fixed inset-0 bg-white z-[2000] flex flex-col animate-in slide-in-from-bottom duration-400">
           <div className={`p-6 border-b flex items-center justify-between text-white ${linkTarget === 'story' ? 'bg-amber-700 shadow-xl' : 'bg-emerald-900 shadow-xl'}`}>
              <button onClick={() => setShowLinkInput(false)} className="p-2.5 bg-white/10 rounded-full"><X size={24}/></button>
              <h3 className="font-black text-xl">মিডিয়া লিঙ্ক</h3>
              <div className="w-10"></div>
           </div>
           <div className="p-10 flex-grow flex flex-col justify-center items-center text-center">
              <div className={`w-20 h-20 mb-8 rounded-[28px] flex items-center justify-center shadow-xl ${linkTarget === 'story' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-700'}`}>
                <LinkIcon size={32} />
              </div>
              <h4 className="text-2xl font-black text-slate-900 mb-2">{linkTarget === 'story' ? 'স্টোরি লিঙ্ক যুক্ত করুন' : 'বড় ফাইল শেয়ার করুন'}</h4>
              <p className="text-sm text-slate-400 font-bold mb-8 leading-relaxed">যেকোনো সাইজের ভিডিও বা ছবির সরাসরি লিঙ্ক দিন। এটি অটোমেটিক {linkTarget === 'story' ? 'স্টোরিতে' : 'পোস্টে'} দেখা যাবে।</p>
              
              <input 
                type="url" 
                value={externalLink} 
                onChange={(e) => setExternalLink(e.target.value)} 
                placeholder="https://example.com/video.mp4" 
                className="w-full bg-slate-50 p-6 rounded-[28px] border-2 border-slate-100 outline-none font-bold focus:border-indigo-300 transition-all mb-8" 
              />
              
              <div className="flex gap-4 w-full">
                <button onClick={() => setShowLinkInput(false)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[24px] font-black">বাতিল</button>
                <button onClick={applyLink} className={`flex-1 py-5 text-white rounded-[24px] font-black shadow-xl ${linkTarget === 'story' ? 'bg-amber-600' : 'bg-emerald-700'}`}>যুক্ত করুন</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CommunityTab;
