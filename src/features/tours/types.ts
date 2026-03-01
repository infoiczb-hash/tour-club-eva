// src/features/tours/types.ts

// ==========================================
// 1. ОСНОВНОЙ ТИП ТУРА (View Model)
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

  // === ДАТЫ ===
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
  type: string;            // Старое поле "hiking", "weekend", etc.
  categoryId?: string | null; // ✅ НОВОЕ ПОЛЕ (Связь с TourCategory)
  
  // Мы также можем подтянуть объект категории целиком в будущем:
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
  guide?: string | {
    id: string;
    name: string;
    role: string;
    image?: string | null; 
    bio?: string | null;    
    instagram?: string | null;
    telegram?: string | null;
  } | null;

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
// 2. ВСПОМОГАТЕЛЬНЫЕ ТИПЫ
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