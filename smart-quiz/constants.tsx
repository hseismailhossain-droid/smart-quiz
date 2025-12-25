
import React from 'react';
import { 
  Newspaper, BookOpen, BookText, PenTool, SquareFunction, 
  FlaskConical, MapPin, Globe, Wind, Scale, Monitor, BrainCircuit,
  Star, Library, Atom, Beaker, Stethoscope, Moon, Briefcase, Languages, Landmark,
  Calculator, Receipt, Presentation, Users, History, GraduationCap, HeartPulse, Palette
} from 'lucide-react';
import { Subject } from './types';

export const ADMIN_EMAIL = 'admin@smartquiz.com';

// Common Subjects (For SSC & HSC)
const COMMON_ACADEMIC = [
  { id: 'bn_1', title: 'বাংলা ১ম পত্র', icon: 'BookOpen' },
  { id: 'bn_2', title: 'বাংলা ২য় পত্র', icon: 'BookText' },
  { id: 'en_1', title: 'English 1st Paper', icon: 'PenTool' },
  { id: 'en_2', title: 'English 2nd Paper', icon: 'PenTool' },
  { id: 'ict', title: 'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)', icon: 'Monitor' },
  { id: 'rel_i', title: 'ইসলাম শিক্ষা', icon: 'Moon' },
  { id: 'rel_h', title: 'হিন্দু ধর্ম শিক্ষা', icon: 'Star' },
];

// SSC Specific (Group-wise)
export const SSC_SUBJECTS: Subject[] = [
  ...COMMON_ACADEMIC,
  { id: 's_math', title: 'সাধারণ গণিত', icon: 'Calculator' },
  // Science
  { id: 's_phy', title: 'পদার্থবিজ্ঞান', icon: 'Atom' },
  { id: 's_che', title: 'রসায়ন', icon: 'Beaker' },
  { id: 's_bio', title: 'জীববিজ্ঞান', icon: 'Stethoscope' },
  { id: 's_hmath', title: 'উচ্চতর গণিত', icon: 'SquareFunction' },
  // Commerce
  { id: 's_acc', title: 'হিসাববিজ্ঞান', icon: 'Receipt' },
  { id: 's_bus', title: 'ব্যবসায় উদ্যোগ', icon: 'Briefcase' },
  { id: 's_fin', title: 'ফিন্যান্স ও ব্যাংকিং', icon: 'Landmark' },
  // Arts
  { id: 's_hist', title: 'বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা', icon: 'History' },
  { id: 's_civ', title: 'পৌরনীতি ও নাগরিকতা', icon: 'Scale' },
  { id: 's_geo', title: 'ভূগোল ও পরিবেশ', icon: 'MapPin' },
  { id: 's_eco', title: 'অর্থনীতি', icon: 'Globe' },
];

// HSC Specific (Group-wise)
export const HSC_SUBJECTS: Subject[] = [
  ...COMMON_ACADEMIC,
  // Science
  { id: 'h_phy_1', title: 'পদার্থবিজ্ঞান ১ম', icon: 'Atom' },
  { id: 'h_phy_2', title: 'পদার্থবিজ্ঞান ২য়', icon: 'Atom' },
  { id: 'h_che_1', title: 'রসায়ন ১ম', icon: 'Beaker' },
  { id: 'h_che_2', title: 'রসায়ন ২য়', icon: 'Beaker' },
  { id: 'h_bio_1', title: 'উদ্ভিদবিজ্ঞান', icon: 'Stethoscope' },
  { id: 'h_bio_2', title: 'প্রাণীবিজ্ঞান', icon: 'Stethoscope' },
  { id: 'h_math_1', title: 'উচ্চতর গণিত ১ম', icon: 'SquareFunction' },
  { id: 'h_math_2', title: 'উচ্চতর গণিত ২য়', icon: 'SquareFunction' },
  // Commerce
  { id: 'h_acc_1', title: 'হিসাববিজ্ঞান ১ম', icon: 'Receipt' },
  { id: 'h_acc_2', title: 'হিসাববিজ্ঞান ২য়', icon: 'Receipt' },
  { id: 'h_mgt_1', title: 'ব্যবসায় সংগঠন ও ব্যবস্থাপনা ১ম', icon: 'Presentation' },
  { id: 'h_mgt_2', title: 'ব্যবসায় সংগঠন ও ব্যবস্থাপনা ২য়', icon: 'Presentation' },
  { id: 'h_fin_1', title: 'ফিন্যান্স ও ব্যাংকিং ১ম', icon: 'Landmark' },
  { id: 'h_fin_2', title: 'ফিন্যান্স ও ব্যাংকিং ২য়', icon: 'Landmark' },
  { id: 'h_eco_1', title: 'অর্থনীতি ১ম', icon: 'Globe' },
  { id: 'h_eco_2', title: 'অর্থনীতি ২য়', icon: 'Globe' },
  // Arts
  { id: 'h_hist', title: 'ইতিহাস', icon: 'History' },
  { id: 'h_ihist', title: 'ইসলামের ইতিহাস ও সংস্কৃতি', icon: 'Library' },
  { id: 'h_civ_1', title: 'পৌরনীতি ও সুশাসন ১ম', icon: 'Scale' },
  { id: 'h_civ_2', title: 'পৌরনীতি ও সুশাসন ২য়', icon: 'Scale' },
  { id: 'h_soc', title: 'সমাজবিজ্ঞান', icon: 'Users' },
  { id: 'h_log', title: 'যুক্তিবিদ্যা', icon: 'BrainCircuit' },
  { id: 'h_psy', title: 'মনোবিজ্ঞান', icon: 'HeartPulse' },
];

// University Admission Subjects
export const ADMISSION_SUBJECTS: Subject[] = [
  { id: 'a_bn', title: 'বাংলা (ভর্তি প্রস্তুতি)', icon: 'BookOpen' },
  { id: 'a_en', title: 'English (Admission)', icon: 'PenTool' },
  { id: 'a_gk_b', title: 'সাধারণ জ্ঞান (বাংলাদেশ)', icon: 'MapPin' },
  { id: 'a_gk_i', title: 'সাধারণ জ্ঞান (আন্তর্জাতিক)', icon: 'Globe' },
  { id: 'a_math', title: 'গণিত (DU A/Engineering)', icon: 'Calculator' },
  { id: 'a_phy', title: 'পদার্থবিজ্ঞান', icon: 'Atom' },
  { id: 'a_che', title: 'রসায়ন', icon: 'Beaker' },
  { id: 'a_bio', title: 'জীববিজ্ঞান (Medical/Varsity)', icon: 'Stethoscope' },
  { id: 'a_acc', title: 'Accounting (C Unit)', icon: 'Receipt' },
  { id: 'a_mgt', title: 'Management/Business', icon: 'Presentation' },
  { id: 'a_iq', title: 'IQ ও মানসিক দক্ষতা', icon: 'BrainCircuit' },
  { id: 'a_fin', title: 'Finance/Marketing', icon: 'Landmark' },
];

// Other Existing Categories
export const ISLAMIC_SUBJECTS: Subject[] = [
  { id: 'i_quran', title: 'আল-কুরআন', icon: 'Moon' },
  { id: 'i_hadith', title: 'আল-হাদিস', icon: 'BookOpen' },
  { id: 'i_seerah', title: 'সীরাত ও ইতিহাস', icon: 'MapPin' },
  { id: 'i_fiqh', title: 'ফিকহ ও মাসায়ালা', icon: 'Scale' },
  { id: 'i_culture', title: 'ইসলামিক সংস্কৃতি', icon: 'Star' },
];

export const JOB_PREP_SUBJECTS: Subject[] = [
  { id: 'j_gk', title: 'সাধারণ জ্ঞান (জব স্পেশাল)', icon: 'Globe' },
  { id: 'j_bank', title: 'ব্যাংক ও কর্পোরেট প্রস্তুতি', icon: 'Landmark' },
  { id: 'j_math', title: 'গণিত ও মানসিক দক্ষতা', icon: 'Calculator' },
  { id: 'j_ict', title: 'কম্পিউটার ও আইসিটি', icon: 'Monitor' },
  { id: 'j_eng', title: 'ইংরেজি ভাষা ও সাহিত্য', icon: 'Languages' },
  { id: 'j_viva', title: 'ভাইভা ও ক্যারিয়ার টিপস', icon: 'Briefcase' },
];

export const BCS_SUBJECTS: Subject[] = [
  { id: 'ca', title: 'কারেন্ট অ্যাফেয়ার্স', icon: 'Newspaper' },
  { id: 'bn_lit', title: 'বাংলা সাহিত্য', icon: 'BookOpen' },
  { id: 'bn_gram', title: 'বাংলা ব্যাকরণ', icon: 'BookText' },
  { id: 'en_lit', title: 'English Literature', icon: 'PenTool' },
  { id: 'en_gram', title: 'English Grammar', icon: 'PenTool' },
  { id: 'math', title: 'গাণিতিক যুক্তি', icon: 'Calculator' },
  { id: 'science', title: 'সাধারণ বিজ্ঞান', icon: 'FlaskConical' },
  { id: 'bd', title: 'বাংলাদেশ বিষয়াবলি', icon: 'MapPin' },
  { id: 'int', title: 'আন্তর্জাতিক বিষয়াবলি', icon: 'Globe' },
  { id: 'ict_c', title: 'কম্পিউটার ও তথ্যপ্রযুক্তি', icon: 'Monitor' },
];

export const PRIMARY_SUBJECTS: Subject[] = [
  { id: 'p_bn', title: 'আমার বাংলা বই', icon: 'BookOpen' },
  { id: 'p_en', title: 'English for Today', icon: 'PenTool' },
  { id: 'p_math', title: 'প্রাথমিক গণিত', icon: 'Calculator' },
  { id: 'p_env', title: 'পরিবেশ পরিচিতি', icon: 'Wind' },
  { id: 'p_rel', title: 'ধর্ম ও নৈতিক শিক্ষা', icon: 'Star' },
];

export const JUNIOR_SUBJECTS: Subject[] = [
  { id: 'j_bn', title: 'বাংলা (১ম ও ২য়)', icon: 'BookOpen' },
  { id: 'j_en', title: 'English (1st & 2nd)', icon: 'PenTool' },
  { id: 'j_math', title: 'গণিত', icon: 'Calculator' },
  { id: 'j_sci', title: 'বিজ্ঞান', icon: 'FlaskConical' },
  { id: 'j_soc', title: 'বাংলাদেশ ও বিশ্বপরিচয়', icon: 'Globe' },
  { id: 'j_ict_s', title: 'তথ্য ও যোগাযোগ প্রযুক্তি', icon: 'Monitor' },
];

export const SUBJECTS: Subject[] = [
  ...BCS_SUBJECTS,
  ...PRIMARY_SUBJECTS,
  ...JUNIOR_SUBJECTS,
  ...SSC_SUBJECTS,
  ...HSC_SUBJECTS,
  ...ADMISSION_SUBJECTS,
  ...ISLAMIC_SUBJECTS,
  ...JOB_PREP_SUBJECTS
];

export const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'Newspaper': return <Newspaper className="text-blue-500" />;
    case 'BookOpen': return <BookOpen className="text-orange-500" />;
    case 'BookText': return <BookText className="text-red-500" />;
    case 'PenTool': return <PenTool className="text-purple-500" />;
    case 'Calculator': return <Calculator className="text-pink-500" />;
    case 'FlaskConical': return <FlaskConical className="text-green-500" />;
    case 'MapPin': return <MapPin className="text-emerald-500" />;
    case 'Globe': return <Globe className="text-rose-500" />;
    case 'Wind': return <Wind className="text-cyan-500" />;
    case 'Scale': return <Scale className="text-indigo-500" />;
    case 'Monitor': return <Monitor className="text-violet-500" />;
    case 'BrainCircuit': return <BrainCircuit className="text-blue-600" />;
    case 'Atom': return <Atom className="text-blue-400" />;
    case 'Beaker': return <Beaker className="text-green-400" />;
    case 'Stethoscope': return <Stethoscope className="text-rose-400" />;
    case 'Star': return <Star className="text-yellow-500" />;
    case 'Library': return <Library className="text-amber-600" />;
    case 'Moon': return <Moon className="text-indigo-400" />;
    case 'Briefcase': return <Briefcase className="text-slate-600" />;
    case 'Languages': return <Languages className="text-sky-500" />;
    case 'Landmark': return <Landmark className="text-amber-700" />;
    case 'Receipt': return <Receipt className="text-emerald-600" />;
    case 'Presentation': return <Presentation className="text-indigo-600" />;
    case 'Users': return <Users className="text-blue-500" />;
    case 'History': return <History className="text-amber-800" />;
    case 'GraduationCap': return <GraduationCap className="text-emerald-700" />;
    case 'HeartPulse': return <HeartPulse className="text-rose-500" />;
    case 'Palette': return <Palette className="text-purple-400" />;
    default: return <BookOpen className="text-emerald-500" />;
  }
};
