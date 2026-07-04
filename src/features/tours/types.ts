// src/features/tours/types.ts

// ==========================================
// 1. ТИПЫ ДЛЯ РЕЛЯЦИОННЫХ ДАТ
// ==========================================
export interface TourDateItem {
  id: string;
  date?: string;
  start?: string | Date;
  startDate: string | Date;
  endDate?: string | Date | null;
  time?: string | null;
  capacity: number;
  spots?: number;
  spotsLeft?: number;
  basePrice?: number | null;
  guideId?: string | null;
  _count?: {
    bookings: number;
  };
}

// ==========================================
// 2. СТРОГИЙ ТИП ГИДА И КАТЕГОРИЙ ЦЕН
// ==========================================
export interface GuideInfo {
  id: string;
  name: string;
  role: string;
  image?: string | null;
  bio?: string | null;
  instagram?: string | null;
  telegram?: string | null;
  slug?: string | null;
}

export interface TourPriceCategory {
  id?: string;
  key: string;
  label: string;
  price: number;
  spotsPerUnit?: number;
  minQuantity?: number;
  sortOrder?: number;
  isActive?: boolean;
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
  subtitle: string | null;
  description: string;

  // === ЦЕНЫ ===
  price: number;
  currency: string;
  priceOld: number | null;
  priceChild: number | null;
  priceFamily: number | null;
  priceMember: number | null;
  
  priceCategories?: TourPriceCategory[];
  tourPriceCategories?: TourPriceCategory[];

  biletpmrLink?: string | null;
  apbQrLink?: string | null;
  apbQrImage?: string | null;

  tourDates?: TourDateItem[];

  date: string | Date;            
  endDate?: string | Date | null; 
  dates?: {
    id?: string;            
    start?: string;
    startDate?: string;
    date?: string;
    end?: string;
    guide_id?: string;
    time?: string;
    capacity: number;
    // 🚀 SENIOR FIX: Поля для поддержки обратной совместимости легаси-дат
    spots?: number;
    spotsLeft?: number;
    basePrice?: number | null; 
    _count?: {
      bookings: number;
    };
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

  // === НОВЫЕ ХАРАКТЕРИСТИКИ ===
  tourFormat?: string | null;
  accommodation?: string | null;
  groupInfo?: string | null;
  importantInfo?: string | null;

  // === ЛОГИСТИКА И ХАРАКТЕРИСТИКИ ===
  location: string;
  startLocation?: string | null; 
  meetingPoint?: string | null;  
  duration?: string | null;
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert' | string | null;
  route?: string | null;
  distance?: string | null; 
  meta?: unknown; 

  // === СТАТИСТИКА ===
  spots: number;     
  spotsLeft: number; 
  groupSize?: number; 

  guide?: GuideInfo | null;

  // === СТРОГИЕ МАССИВЫ ===
  program: TourProgramDay[];                 
  faq: TourFaq[];                     
  checklist?: TourChecklist[];              
  documents?: TourDocument[];              
  
  included: string[];           
  additionalExpenses: string[];  

  // === НОВЫЕ ДЕТАЛИЗИРОВАННЫЕ СПИСКИ ===
  includedDetailed?: any | null;
  excludedDetailed?: any | null;

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

// ==========================================
// 5. DTO ДЛЯ КАРТОЧЕК (Облегченный тип)
// ==========================================
export type TourPreview = Pick<Tour,
  | 'id' | 'slug' | 'title' | 'subtitle' | 'price' | 'currency' | 'priceOld'
  | 'priceMember' | 'priceChild' | 'tags' 
  | 'priceCategories' | 'tourPriceCategories' 
  | 'date' | 'endDate' | 'dates' | 'image' | 'label' | 'categoryId' | 'category'
  | 'difficulty' | 'location' | 'duration' | 'spots' | 'spotsLeft' | 'isActive'
  | 'guide'
>;