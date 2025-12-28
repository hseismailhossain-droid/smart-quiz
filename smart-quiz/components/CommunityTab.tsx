
import React, { useState } from 'react';
import { 
  Heart, MessageCircle, 
  Globe, Send, Trash2, Edit3, Eye, X 
} from 'lucide-react';
import { Post, Comment } from '../types';

interface PostCardProps {
  post: Post;
  onLike: (id: string) => void;
  onAddComment: (postId: string, comment: string, parentCommentId?: string) => void;
  onDeletePost: (id: string) => void;
  onEditPost: (post: Post) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  currentUserId: string;
}

export const PostCard: React.FC<PostCardProps> = ({ 
  post, onLike, onAddComment, onDeletePost, onEditPost, onDeleteComment, currentUserId 
}) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string, name: string } | null>(null);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onAddComment(post.id, commentText, replyTo?.id);
      setCommentText('');
      setReplyTo(null);
    }
  };

  const isOwner = !post.isAnonymous && post.userId === currentUserId;

  return (
    <div className={`bg-white shadow-sm border rounded-xl overflow-hidden mb-4 transition-all duration-300 ${post.isAnonymous ? 'border-indigo-200' : 'border-gray-200'}`}>
      <div className="p-4 flex justify-between items-start">
        <div className="flex items-center gap-3">
          <img 
            src={post.isAnonymous ? "https://api.dicebear.com/7.x/bottts/svg?seed=anonymous" : post.userAvatar} 
            className="w-10 h-10 rounded-full border bg-gray-50 shadow-sm" 
            alt="User Avatar"
          />
          <div>
            <h4 className="font-bold text-[15px] font-hind">{post.isAnonymous ? 'বেনামী ইউজার' : post.userName}</h4>
            <p className="text-xs text-gray-500 font-medium flex items-center gap-2 font-hind">
              {post.time} • <Globe size={12} /> • <Eye size={12} className="inline" /> {post.views} ভিউ
            </p>
          </div>
        </div>
        
        {isOwner && (
          <div className="flex items-center gap-1">
            <button 
              onClick={() => onEditPost(post)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="এডিট করুন"
            >
              <Edit3 size={18} />
            </button>
            <button 
              onClick={() => onDeletePost(post.id)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
              title="ডিলিট করুন"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      <div className="px-4 pb-3 text-[15px] leading-relaxed font-hind text-gray-800">
        {post.content}
      </div>

      {post.media && (
        <div className="bg-gray-50 border-y flex justify-center max-h-[500px] overflow-hidden relative">
          {post.type === 'video' ? (
            <div className="w-full relative">
              <video src={post.media} controls className="w-full object-contain" />
              <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded-md text-xs flex items-center gap-1">
                <Eye size={12} /> {post.views} ভিউ
              </div>
            </div>
          ) : (
            <img src={post.media} className="w-full object-cover" alt="Post content" />
          )}
        </div>
      )}

      <div className="px-4 py-3 flex justify-between text-gray-500 text-sm border-b mx-2 font-hind">
        <div className="flex items-center gap-1">
          <div className="bg-blue-600 p-1 rounded-full shadow-sm">
            <Heart size={10} fill="white" className="text-white" />
          </div>
          <span className="font-medium">{post.likes}</span>
        </div>
        <button onClick={() => setShowComments(!showComments)} className="hover:underline font-medium">
          {post.comments.length} টি কমেন্ট
        </button>
      </div>

      <div className="flex px-2 py-1">
        <button 
          onClick={() => onLike(post.id)}
          className={`flex-1 flex justify-center items-center gap-2 py-2 hover:bg-gray-100 rounded-lg font-bold text-sm transition-colors font-hind ${post.isLiked ? 'text-blue-600' : 'text-gray-600'}`}
        >
          <Heart size={18} fill={post.isLiked ? 'currentColor' : 'none'} /> লাইক
        </button>
        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex-1 flex justify-center items-center gap-2 py-2 hover:bg-gray-100 rounded-lg text-gray-600 font-bold text-sm font-hind"
        >
          <MessageCircle size={18} /> কমেন্ট
        </button>
      </div>

      {showComments && (
        <div className="px-4 pb-4 animate-slide-up bg-gray-50/50 border-t">
          <div className="pt-2 space-y-3">
            {post.comments.map((comment) => (
              <div key={comment.id} className="space-y-2">
                <div className="flex gap-2 group">
                  <img src={comment.userAvatar} className="w-8 h-8 rounded-full border bg-white shadow-sm" />
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-2xl px-3 py-2 inline-block shadow-sm">
                      <p className="font-bold text-[13px] font-hind">{comment.userName}</p>
                      <p className="text-[14px] font-hind">{comment.content}</p>
                    </div>
                    <div className="flex items-center gap-4 ml-2 mt-1 text-[11px] font-bold text-gray-500 font-hind">
                      <span>{comment.time}</span>
                      <button onClick={() => setReplyTo({ id: comment.id, name: comment.userName })} className="hover:underline">রিপ্লাই</button>
                      <button onClick={() => onDeleteComment(post.id, comment.id)} className="text-red-500 hover:underline">ডিলিট</button>
                    </div>
                  </div>
                </div>
                
                {comment.replies && comment.replies.map(reply => (
                  <div key={reply.id} className="flex gap-2 ml-10 group">
                    <img src={reply.userAvatar} className="w-6 h-6 rounded-full border bg-white shadow-sm" />
                    <div className="flex-1">
                      <div className="bg-gray-200/50 rounded-2xl px-3 py-2 inline-block">
                        <p className="font-bold text-[12px] font-hind">{reply.userName}</p>
                        <p className="text-[13px] font-hind">{reply.content}</p>
                      </div>
                      <div className="flex items-center gap-4 ml-2 mt-1 text-[10px] font-bold text-gray-500 font-hind">
                        <span>{reply.time}</span>
                        <button onClick={() => onDeleteComment(post.id, reply.id)} className="text-red-500 hover:underline">ডিলিট</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          
          <form onSubmit={handleSubmitComment} className="flex flex-col gap-2 mt-4">
            {replyTo && (
              <div className="flex items-center justify-between bg-blue-50 px-3 py-1 rounded-lg text-xs text-blue-600 border border-blue-100 font-hind">
                <span>রিপ্লাই দিচ্ছেন: <b>{replyTo.name}</b></span>
                <button type="button" onClick={() => setReplyTo(null)} className="p-1 hover:bg-blue-100 rounded-full"><X size={12}/></button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <img src={currentUserId === 'user_1' ? "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" : "https://api.dicebear.com/7.x/bottts/svg?seed=anonymous"} className="w-8 h-8 rounded-full border bg-white shadow-sm" />
              <div className="relative flex-1">
                <input 
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={replyTo ? "একটি রিপ্লাই লিখুন..." : "কমেন্ট লিখুন..."}
                  className="w-full bg-gray-100 rounded-full py-2 px-4 pr-10 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm font-hind"
                />
                <button 
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 p-1 hover:bg-blue-50 rounded-full transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
