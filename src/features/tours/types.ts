// src/features/tours/types.ts

// ==========================================
// 1. НОВЫЕ ТИПЫ ДЛЯ РЕЛЯЦИОННЫХ ДАТ
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
// 2. СТРОГИЙ ТИП ГИДА (Чтобы не было ошибок с .name и .image)
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
// 3. ОСНОВНОЙ ТИП ТУРА (View Model)
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

  // 🔥 НОВОЕ ПОЛЕ: Реляционные даты (строго типизированные)
  tourDates?: TourDateItem[];

  // === ДАТЫ (Старые, оставлены для обратной совместимости) ===
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
  type: string;            
  categoryId?: string | null; 
  category?: {
    id: string;
    title: string;
    slug: string;
    icon: string;
  } | null;

  tags?: string[];         
  highlights?: any[];      

  // === ЛОГИСТИКА И ХАРАКТЕРИСТИКИ ===
  location: string;
  startLocation?: string | null; 
  meetingPoint?: string | null;  
  duration?: string | null;
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert' | string | null;
  route?: string | null;
  distance?: string | null; 
  meta?: any; 

  // === СТАТИСТИКА ===
  spots: number;     
  spotsLeft: number; 
  groupSize?: number; 

  // === СВЯЗЬ С ГИДОМ ===
  // 🔥 ИСПРАВЛЕНО: Убрали `string |`, теперь это только строгий объект `GuideInfo`
  guide?: GuideInfo | null;

  // === КОНТЕНТ И СПИСКИ ===
  program: any;                 
  faq: any;                     
  checklist?: any;              
  documents?: any;              
  
  included: string[];           
  additionalExpenses: string[];  

  // === SEO ===
  metaTitle?: string | null;
  metaDesc?: string | null;

  // === СТАТУС ===
  isActive: boolean;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

// ==========================================
// 4. ВСПОМОГАТЕЛЬНЫЕ ТИПЫ (Оставлены без изменений)
// ==========================================

export type TourPrice = Tour['price'];

export type TourProgramData = 
  | string 
  | { days: TourProgramDay[] } 
  | TourProgramDay[];

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

export interface TourGuide {
  id: string;
  name: string;
  role: string;
  image?: string | null;
  instagram?: string | null;
}