
export enum Category {
  PRIMARY = 'Class 1-5',
  JUNIOR = 'Class 6-8',
  SSC = 'SSC / Class 9-10',
  HSC = 'HSC / College',
  ADMISSION = 'Admission',
  ISLAMIC = 'ইসলামিক জ্ঞান',
  JOB_PREP = 'চাকুরি প্রস্তুতি (সরকারি/বেসরকারি)',
  BCS = 'BCS / Govt. Job'
}

export interface ExamCategory {
  id: string;
  label: string;
  iconName: string;
  color: string;
  timestamp: any;
}

export interface UserProfile {
  name: string;
  email: string;
  category: Category;
  balance: number;
  totalPoints: number;
  streak: number;
  avatarUrl?: string;
  playedQuizzes: { quizId: string; attempts: number }[];
  votedPolls?: string[]; // ইউজার কোন পোলে ভোট দিয়েছে তা ট্র্যাক করতে
}

export interface Poll {
  id: string;
  question: string;
  options: { text: string; votes: number }[];
  active: boolean;
  timestamp: any;
  votedBy: string[];
}

export interface AdminNotice {
  id: string;
  title: string;
  content: string;
  image?: string;
  active: boolean;
  timestamp: any;
}

export interface Subject {
  id: string;
  title: string;
  icon: string;
}

export interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface QuizResult {
  id: string;
  subject: string;
  score: number;
  total: number;
  date: string;
  mistakes: Question[];
  quizId?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  subject: string;
  content: string;
  timestamp: any;
}

export interface DepositRequest {
  id: string;
  uid: string;
  userName: string;
  amount: number;
  method: 'bkash' | 'nagad';
  trxId: string;
  status: 'pending' | 'approved' | 'rejected';
  time: string;
  timestamp: any;
}

export interface WithdrawRequest {
  id: string;
  uid: string;
  userName: string;
  amount: number;
  method: 'bkash' | 'nagad';
  accountNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: any;
}

export interface UserReport {
  id: string;
  uid: string;
  userName: string;
  category: string;
  message: string;
  quizId?: string;
  questionText?: string;
  status: 'pending' | 'resolved';
  timestamp: any;
}

export interface Post {
  id: string;
  userName: string;
  userAvatar: string;
  uid: string;
  content: string;
  image?: string;
  video?: string;
  thumbnail?: string;
  likes: number;
  likedBy: string[];
  comments: Comment[];
  views: number;
  timestamp: any;
  time: string;
}

export interface Comment {
  userName: string;
  text: string;
  time: string;
  uid: string;
  id: string;
  likes: number;
  likedBy: string[];
  replies?: Comment[];
}

export interface Story {
  id: string;
  uid: string;
  userName: string;
  userAvatar: string;
  media: string;
  type: 'image' | 'video';
  thumbnail?: string;
  views: number;
  viewedBy: string[];
  timestamp_ms: number;
}

export interface PaidQuiz {
  id: string;
  title: string;
  subject: string;
  prizePool: number;
  entryFee: number;
  status: 'active' | 'ended';
  timestamp: any;
}
