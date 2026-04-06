// src/lib/constants/levels.ts

import { Map, Compass, Mountain, Flame, Crown, type LucideIcon } from 'lucide-react';

export interface LevelConfig {
  name: string;           
  min: number;            
  max: number;            
  toursLabel: string;     
  benefits: string[];     
  color: string;          
  bg: string;             
  border: string;         
  colorMode: string;      
  icon: LucideIcon;       
}

export const LEVELS_CONFIG: LevelConfig[] = [
  {
    name: 'Первопроходец',
    min: 2,
    max: 2,
    toursLabel: '2 тура',
    benefits: ['Доступ к личному кабинету'],
    color: 'text-emerald-400',
    bg: 'from-emerald-700 to-teal-900',
    border: 'border-emerald-500/30',
    colorMode: 'from-emerald-700 to-teal-900',
    icon: Map,
  },
  {
    name: 'Искатель',
    min: 4,
    max: 5,
    toursLabel: '4 — 5 туров',
    benefits: ['Реферальный промокод', 'плюс бонусы урвоня ниже'],
    color: 'text-blue-400',
    bg: 'from-blue-600 to-indigo-900',
    border: 'border-blue-500/30',
    colorMode: 'from-blue-600 to-indigo-900',
    icon: Compass,
  },
  {
    name: 'Следопыт',
    min: 6,
    max: 10,
    toursLabel: '6 — 10 туров',
    benefits: [
      'Бесплатная аренда снаряжения (1 ед.) для горных туров в рамках стока', 
      'Ранний доступ к новым маршрутам',
      'Возможность участвовать в закрытых/тестовых маршрутах',
      'Плюс бонусы урвоня ниже'
    ],
    color: 'text-purple-400',
    bg: 'from-purple-600 to-fuchsia-900',
    border: 'border-purple-500/30',
    colorMode: 'from-purple-600 to-violet-900',
    icon: Mountain,
  },
  {
    name: 'Мастер троп',
    min: 11,
    max: 20,
    toursLabel: '11 — 20 туров',
    benefits: ['Выбор места в группе раньше других (автобус / палатка)', 'Плюс бонусы урвоня ниже'],
    color: 'text-orange-400',
    bg: 'from-orange-500 to-red-800',
    border: 'border-orange-500/30',
    colorMode: 'from-orange-500 to-red-700',
    icon: Flame,
  },
  {
    name: 'Легенда',
    min: 21,
    max: 9999,
    toursLabel: '21+ туров',
    benefits: [
      'Бесплатное участие в 1 однодневном туре раз в год', 
      'Эксклюзивный значок', 
      'Возможность быть «помощником гида» в турах',
       'Плюс бонусы урвоня ниже'
    ],
    color: 'text-amber-400',
    bg: 'from-amber-500 to-orange-900',
    border: 'border-amber-500/50',
    colorMode: 'from-slate-800 to-black border-yellow-500/50',
    icon: Crown,
  }
];

// Хелпер: получить полный конфиг уровня по количеству туров
export function getLevelConfig(toursCount: number): LevelConfig {
  return LEVELS_CONFIG.find(l => toursCount >= l.min && toursCount <= l.max) || LEVELS_CONFIG[0];
}

// Хелпер: получить только название уровня для записи в БД
export function getLevelName(toursCount: number): string {
  return getLevelConfig(toursCount).name;
}