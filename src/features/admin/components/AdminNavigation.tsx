"use client";

import React from 'react';
import { 
  LayoutTemplate, Compass, Users, 
  MessageCircle, FileText, Layout, 
  LogOut, Plus, Settings, MessageSquare, Sparkles 
} from 'lucide-react';
import { SidebarNavItem } from './ui/SidebarNavItem';
import { MobileNavItem } from './ui/MobileNavItem';

// Типы табов (должны совпадать с AdminDashboard)
export type Tab = 'dashboard' | 'tours' | 'bookings' | 'reviews' | 'guides' | 'blog' | 'content' | 'inquiries' | 'fun';
interface AdminNavigationProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onLogout: () => void;
  onFabClick: () => void;
  stats: {
    pendingBookings: number;
    newInquiries: number; // Новое поле для счетчика
  };
}

export default function AdminNavigation({ 
  activeTab, 
  setActiveTab, 
  onLogout, 
  onFabClick,
  stats 
}: AdminNavigationProps) {
  
  return (
    <>
      {/* --- DESKTOP SIDEBAR (md+) --- */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-colors duration-300">
         
         {/* Логотип */}
         <div className="p-6">
            <div className="text-2xl font-black bg-gradient-to-r from-teal-500 to-blue-600 bg-clip-text text-transparent italic tracking-tighter">
              EVA ADMIN
            </div>
         </div>
         
         {/* Меню */}
         <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
            <SidebarNavItem 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
              icon={<LayoutTemplate size={20}/>} 
              label="Главная" 
            />
            <SidebarNavItem 
              active={activeTab === 'tours'} 
              onClick={() => setActiveTab('tours')} 
              icon={<Compass size={20}/>} 
              label="Туры" 
            />
            <SidebarNavItem 
              active={activeTab === 'bookings'} 
              onClick={() => setActiveTab('bookings')} 
              icon={<Users size={20}/>} 
              label="Брони" 
              badge={stats.pendingBookings}
            />
            {/* 👇 НОВЫЙ ПУНКТ */}
            <SidebarNavItem 
              active={activeTab === 'inquiries'} 
              onClick={() => setActiveTab('inquiries')} 
              icon={<MessageSquare size={20}/>} 
              label="Обращения" 
              badge={stats.newInquiries}
            />
            <SidebarNavItem 
              active={activeTab === 'reviews'} 
              onClick={() => setActiveTab('reviews')} 
              icon={<MessageCircle size={20}/>} 
              label="Отзывы" 
            />
            <SidebarNavItem 
              active={activeTab === 'blog'} 
              onClick={() => setActiveTab('blog')} 
              icon={<FileText size={20}/>} 
              label="Блог" 
            />
            <SidebarNavItem 
              active={activeTab === 'guides'} 
              onClick={() => setActiveTab('guides')} 
              icon={<Users size={20}/>} 
              label="Команда" 
            />
            <SidebarNavItem 
              active={activeTab === 'content'} 
              onClick={() => setActiveTab('content')} 
              icon={<Layout size={20}/>} 
              label="Сайт" 
            />
            <SidebarNavItem 
  active={activeTab === 'fun'} 
  onClick={() => setActiveTab('fun')} 
  icon={<Sparkles size={20}/>} 
  label="Фан-сектор" 
/>
         </nav>

         {/* Футер сайдбара */}
         <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <button 
              onClick={onLogout} 
              className="flex items-center gap-3 text-slate-800 hover:text-red-500 transition px-3 py-2 text-sm font-bold w-full rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
                <LogOut size={18}/> Выйти
            </button>
         </div>
      </aside>

      {/* --- MOBILE BOTTOM NAV (sm only) --- */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 pb-safe transition-colors duration-300">
         <div className="flex justify-around items-center h-16">
            <MobileNavItem 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
              icon={<LayoutTemplate size={20}/>} 
              label="Главная" 
            />
            <MobileNavItem 
              active={activeTab === 'tours'} 
              onClick={() => setActiveTab('tours')} 
              icon={<Compass size={20}/>} 
              label="Туры" 
            />
            
            {/* FAB (Большая кнопка по центру) */}
            <button 
              onClick={onFabClick} 
              className="-mt-8 p-1 rounded-full bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 active:scale-95 transition-transform"
            >
                <div className="bg-gradient-to-tr from-teal-500 to-blue-600 text-white p-3.5 rounded-full shadow-lg shadow-teal-500/30">
                    <Plus size={24}/>
                </div>
            </button>

            <MobileNavItem 
              active={activeTab === 'bookings'} 
              onClick={() => setActiveTab('bookings')} 
              icon={<Users size={20}/>} 
              label="Брони" 
              badge={stats.pendingBookings}
            />
            {/* 👇 ЗАМЕНИЛ БЛОГ НА ОБРАЩЕНИЯ (Важнее на мобилке) */}
            <MobileNavItem 
              active={activeTab === 'inquiries'} 
              onClick={() => setActiveTab('inquiries')} 
              icon={<MessageSquare size={20}/>} 
              label="Входящие" 
              badge={stats.newInquiries}
            />
         </div>
      </div>
    </>
  );
}