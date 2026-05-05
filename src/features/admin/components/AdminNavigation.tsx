"use client";

import React, { useState } from 'react';
import { LayoutTemplate, Compass, Users, MessageCircle, FileText, Layout, LogOut, Plus, Activity, MessageSquare, Sparkles, Waves, ScanLine, Megaphone, Menu, X, ShoppingBag } from 'lucide-react';
import { SidebarNavItem } from './ui/SidebarNavItem';

// Типы табов (совпадают с AdminDashboard)
export type Tab = 'dashboard' | 'tours' | 'bookings' | 'reviews' | 'guides' | 'blog' | 'content' | 'inquiries' | 'fun' | 'members' | 'smm' | 'scan' | 'logs' | 'kayaking' | 'shop';
 
interface AdminNavigationProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onLogout: () => void;
  onFabClick: () => void;
  stats: {
    pendingBookings: number;
    newInquiries: number;
  };
}

export default function AdminNavigation({ 
  activeTab, 
  setActiveTab, 
  onLogout, 
  onFabClick,
  stats 
}: AdminNavigationProps) {
  // Стейт для мобильного меню
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Единый массив всех пунктов меню, чтобы не дублировать код
const navItems: Array<{ id: Tab; icon: any; label: string; badge?: number }> = [
    { id: 'dashboard', icon: LayoutTemplate, label: 'Главная' },
    { id: 'tours', icon: Compass, label: 'Туры' },
    { id: 'bookings', icon: Users, label: 'Брони', badge: stats.pendingBookings },
    { id: 'inquiries', icon: MessageSquare, label: 'Обращения', badge: stats.newInquiries },
    { id: 'reviews', icon: MessageCircle, label: 'Отзывы' },
    { id: 'blog', icon: FileText, label: 'Блог' },
    { id: 'guides', icon: Users, label: 'Команда' },
    { id: 'content', icon: Layout, label: 'Сайт' },
    { id: 'fun', icon: Sparkles, label: 'Фан-сектор' },
    { id: 'members', icon: Users, label: 'Участники' },
    { id: 'smm', icon: Megaphone, label: 'SMM Пульт' },
    { id: 'scan', icon: ScanLine, label: 'Сканер QR' },
    { id: 'logs', icon: Activity, label: 'Журнал' },
    { id: 'kayaking', icon: Waves, label: 'Байдарки' },
    { id: 'shop', icon: ShoppingBag, label: 'Магазин' },
  ];

  // Обработчик клика для мобилки (переключает таб и закрывает меню)
  const handleTabClick = (id: Tab) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* --- DESKTOP SIDEBAR (md+) --- */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-colors duration-300">
         <div className="p-6">
            <div className="text-2xl font-black bg-gradient-to-r from-teal-500 to-blue-600 bg-clip-text text-transparent italic tracking-tighter">
              EVA ADMIN
            </div>
         </div>
         
         <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
            {navItems.map(item => (
              <SidebarNavItem 
                key={item.id}
                active={activeTab === item.id} 
                onClick={() => setActiveTab(item.id as Tab)} 
                icon={<item.icon size={20}/>} 
                label={item.label} 
                badge={item.badge}
              />
            ))}
         </nav>

         <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <button 
              onClick={onLogout} 
              className="flex items-center gap-3 text-slate-800 hover:text-red-500 transition px-3 py-2 text-sm font-bold w-full rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
                <LogOut size={18}/> Выйти
            </button>
         </div>
      </aside>

      {/* ========================================================= */}
      {/* --- MOBILE TOP BAR & DRAWER (sm only) --- */}
      {/* ========================================================= */}
      
      {/* Мобильная верхняя шапка */}
      <div className="md:hidden fixed top-0 inset-x-0 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 z-40 flex items-center justify-between px-5 shadow-sm transition-colors duration-300">
         <div className="text-xl font-black bg-gradient-to-r from-teal-500 to-blue-600 bg-clip-text text-transparent italic tracking-tighter">
           EVA ADMIN
         </div>
         <button 
           onClick={() => setIsMobileMenuOpen(true)} 
           className="p-2 -mr-2 text-slate-700 dark:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg active:scale-95 transition-all"
         >
           <Menu size={24} />
         </button>
      </div>

      {/* Плавающая кнопка "Добавить" (FAB) в правом нижнем углу */}
      <button 
        onClick={onFabClick} 
        className="md:hidden fixed bottom-6 right-6 z-40 bg-gradient-to-tr from-teal-500 to-blue-600 text-white p-4 rounded-full shadow-xl shadow-teal-500/30 active:scale-95 transition-transform"
      >
        <Plus size={24} strokeWidth={3}/>
      </button>

      {/* Затемнение фона при открытом меню */}
      <div 
        className={`md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Выезжающая панель (Drawer) */}
      <div 
        className={`md:hidden fixed inset-y-0 right-0 w-[280px] bg-white dark:bg-slate-900 z-[70] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
         <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
           <span className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-sm">Меню</span>
           <button 
             onClick={() => setIsMobileMenuOpen(false)} 
             className="p-2 -mr-2 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-800 dark:text-slate-700 active:scale-95 transition-transform"
           >
             <X size={16} strokeWidth={3}/>
           </button>
         </div>
         
         {/* Список вкладок (используем тот же SidebarNavItem, что и на десктопе!) */}
         <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
            {navItems.map(item => (
              <SidebarNavItem 
                key={item.id}
                active={activeTab === item.id} 
                onClick={() => handleTabClick(item.id as Tab)} 
                icon={<item.icon size={20}/>} 
                label={item.label} 
                badge={item.badge}
              />
            ))}
         </nav>

         <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <button 
              onClick={onLogout} 
              className="flex items-center justify-center gap-2 bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 px-4 py-3 rounded-xl font-bold w-full active:scale-95 transition-transform"
            >
                <LogOut size={18}/> Выйти из аккаунта
            </button>
         </div>
      </div>
    </>
  );
}