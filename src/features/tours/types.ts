// src/features/tours/types.ts

// ==========================================
// 1. ОСНОВНОЙ ТИП ТУРА (View Model)
// ==========================================
export interface Tour {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null; // HTML описание
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;

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
    spots?: number; // Добавили spots сюда тоже на всякий случай
  }[];

  // === МЕДИА ===
  image?: string | null;   
  gallery?: string[];      

  // === МАРКЕТИНГ И ТЕГИ ===
  label?: string | null;   
  type: string;            // "hiking", "weekend", etc.
  tags?: string[];         
  highlights?: any[];      

  // === ЛОГИСТИКА И ХАРАКТЕРИСТИКИ ===
  location: string;
  startLocation?: string | null; // ✅ ДОБАВЛЕНО: Для TourLogistics
  meetingPoint?: string | null;  // Альтернатива startLocation
  
  duration?: string | null;
  
  // ✅ ОБНОВЛЕНО: Строгая типизация для TourStats, чтобы ключи совпадали
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert' | string | null;
  
  route?: string | null;
  
  distance?: string | null; // ✅ ДОБАВЛЕНО: Для TourStats (например "12 км")
  
  meta?: any; 

  // === СТАТИСТИКА ===
  spots: number;     // Общее кол-во мест
  spotsLeft: number; // Осталось мест
  groupSize?: number; // ✅ ДОБАВЛЕНО: Максимальный размер группы для TourStats

  // === СВЯЗЬ С ГИДОМ ===
  // ✅ ОБНОВЛЕНО: Разрешаем и объект, и строку, чтобы не ломать простые компоненты
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
  location?: string; // ✅ Добавлено, так как используется в TourProgram
}

export interface TourGuide {
  id: string;
  name: string;
  role: string;
  image?: string | null;
  instagram?: string | null;
}