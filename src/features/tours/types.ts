// src/features/tours/types.ts

// ==========================================
// 1. ТИПЫ ДЛЯ РЕЛЯЦИОННЫХ ДАТ
// ==========================================
export interface TourDateItem {
  id: string;
  date: string;
  endDate?: string | null;
  time?: string | null;
  spots: number;
  spotsLeft: number;
  basePrice?: number | null;
  guideId?: string | null;
}

// ==========================================
// 2. СТРОГИЙ ТИП ГИДА
// ==========================================
export interface GuideInfo {
  id: string;
  name: string;
  role: string;
  image?: string | null;
  bio?: string | null;
  instagram?: string | null;
  telegram?: string | null;
}

// ==========================================
// 3. ВЛОЖЕННЫЕ ТИПЫ ДЛЯ JSON-ПОЛЕЙ
// ==========================================
export interface TourHighlight {
  title: string;
  description?: string;
  desc?: string;
  icon?: string;
}

export interface TourFaq {
  question: string;
  answer: string;
}

export interface TourChecklist {
  title: string;
  items?: string;
}

export interface TourDocument {
  title: string;
  url?: string;
}

export interface TourActivity {
  time?: string;
  title: string;
  description?: string;
  icon?: string; 
}

export interface TourProgramDay {
  day: number;
  title: string;
  date?: string;
  activities: TourActivity[];
  description?: string; 
  location?: string; 
}

// ==========================================
// 4. ОСНОВНОЙ ТИП ТУРА
// ==========================================
export interface Tour {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null; 

  // === ЦЕНЫ ===
  price: number;           
  currency: string;        
  priceOld?: number | null;
  priceChild?: number | null;
  priceFamily?: number | null;
  priceMember?: number | null;

  tourDates?: TourDateItem[];

  date: string | Date;            
  endDate?: string | Date | null; 
  dates?: {
    start: string;
    end?: string;
    guide_id?: string;
    time?: string;
    spots?: number; 
  }[];

  // === МЕДИА ===
  image?: string | null;   
  gallery?: string[];      

  // === МАРКЕТИНГ И ТЕГИ ===
  label?: string | null;            
  categoryId?: string | null; 
  category?: {
    id: string;
    title: string;
    slug: string;
    icon: string;
    color?: string;
  } | null;

  tags?: string[];         
  highlights?: TourHighlight[];      

  // === ЛОГИСТИКА И ХАРАКТЕРИСТИКИ ===
  location: string;
  startLocation?: string | null; 
  meetingPoint?: string | null;  
  duration?: string | null;
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert' | string | null;
  route?: string | null;
  distance?: string | null; 
  meta?: unknown; // Заменили any на unknown (безопасный тип)

  // === СТАТИСТИКА ===
  spots: number;     
  spotsLeft: number; 
  groupSize?: number; 

  guide?: GuideInfo | null;

  // === СТРОГИЕ МАССИВЫ ВМЕСТО ANY ===
  program: TourProgramDay[];                 
  faq: TourFaq[];                     
  checklist?: TourChecklist[];              
  documents?: TourDocument[];              
  
  included: string[];           
  additionalExpenses: string[];  

  metaTitle?: string | null;
  metaDesc?: string | null;

  isActive: boolean;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

export type TourPrice = Tour['price'];

export type TourProgramData = 
  | string 
  | { days: TourProgramDay[] } 
  | TourProgramDay[];

export interface TourGuide {
  id: string;
  name: string;
  role: string;
  image?: string | null;
  instagram?: string | null;
}