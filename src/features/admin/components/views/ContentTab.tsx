import React from 'react';
import { LayoutTemplate, MessageSquare } from 'lucide-react';

interface ContentTabProps {
  onEdit: (slug: string) => void;
}

export default function ContentTab({ onEdit }: ContentTabProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold uppercase dark:text-white">Настройки сайта</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div 
          onClick={() => onEdit('hero')} 
          className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:shadow-xl hover:border-teal-500 transition-all group"
        >
          <LayoutTemplate size={40} className="text-slate-300 mb-4 group-hover:text-teal-500 transition-colors"/>
          <h3 className="text-xl font-bold dark:text-white">Главный экран (Hero)</h3>
          <p className="text-sm text-slate-500 mt-2">Заголовок, подзаголовок и видео на главной</p>
        </div>
        <div 
          onClick={() => onEdit('footer')} 
          className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:shadow-xl hover:border-teal-500 transition-all group"
        >
          <MessageSquare size={40} className="text-slate-300 mb-4 group-hover:text-teal-500 transition-colors"/>
          <h3 className="text-xl font-bold dark:text-white">Футер и Контакты</h3>
          <p className="text-sm text-slate-500 mt-2">Ссылки на соцсети, телефоны</p>
        </div>
      </div>
    </div>
  );
}