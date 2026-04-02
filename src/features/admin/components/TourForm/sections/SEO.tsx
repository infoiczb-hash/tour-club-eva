import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormInput, FormTextarea } from '../ui/FormUI';
import { Search, Globe } from 'lucide-react';

export const SEO = () => {
  const { watch } = useFormContext();
  
  // Следим за длиной текста, чтобы подсказывать админу
  const metaTitle = watch('metaTitle') || '';
  const metaDesc = watch('metaDesc') || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
        <Search className="text-purple-500" size={24} />
        <h3 className="text-lg font-black text-slate-800">SEO и Поисковая оптимизация</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Поля ввода */}
        <div className="space-y-5">
           <div className="relative">
              <FormInput 
                name="metaTitle" 
                label="Meta Title (Заголовок в Google)" 
                placeholder="Поход в Карпаты | Лучшие цены | Название компании" 
              />
              <div className={`text-[12px] text-right mt-1 font-bold ${metaTitle.length > 60 ? 'text-rose-500' : 'text-slate-300'}`}>
                {metaTitle.length} / 60 символов
              </div>
           </div>

           <div className="relative">
              <FormTextarea 
                name="metaDesc" 
                label="Meta Description (Описание в поиске)" 
                rows={4}
                placeholder="Краткое описание тура, которое заставит кликнуть. Укажите ключевые преимущества..." 
              />
              <div className={`text-[12px] text-right mt-1 font-bold ${metaDesc.length > 160 ? 'text-rose-500' : 'text-slate-300'}`}>
                {metaDesc.length} / 160 символов
              </div>
           </div>
        </div>

        {/* Превью (Как это видит клиент в Google) */}
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
           <h4 className="text-xs font-bold uppercase text-slate-300 mb-4 flex gap-2 items-center">
             <Globe size={14}/> Предпросмотр в Google
           </h4>
           
           <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                 <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[12px] text-slate-300">Logo</div>
                 <div className="flex flex-col">
                    <span className="text-[12px] text-slate-800 font-bold">Ваш Сайт</span>
                    <span className="text-[12px] text-slate-300">https://vash-site.com/tours/...</span>
                 </div>
              </div>
              <h3 className="text-lg text-[#1a0dab] hover:underline cursor-pointer font-medium truncate">
                {metaTitle || 'Заголовок страницы тура...'}
              </h3>
              <p className="text-sm text-[#4d5156] mt-1 line-clamp-2">
                {metaDesc || 'Здесь будет описание тура, которое пользователь увидит в поисковой выдаче. Важно написать привлекательный текст.'}
              </p>
           </div>
           
           <p className="text-[12px] text-slate-300 mt-4 leading-tight">
             * Это примерное отображение. Реальный вид зависит от поисковой системы.
           </p>
        </div>

      </div>
    </div>
  );
};