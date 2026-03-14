import React, { useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { FormInput, FormSelect, FormSwitch, FormTextarea } from '../ui/FormUI';
import { ImageUploader } from '../ui/ImageUploader';
import { AlignLeft, Plus, X } from 'lucide-react'; 
import Image from 'next/image';
import { uploadFile } from '@/features/admin/upload'; 

// 👇 ДОБАВИЛИ ПРОПС ДЛЯ КАТЕГОРИЙ
export const MainInfo = ({ categories = [] }: { categories?: any[] }) => {
  const { control, watch } = useFormContext();
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "gallery" 
  });

  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

 const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploadingGallery(true);
      try {
        const files = Array.from(e.target.files);
        for (const file of files) {
          // 1. Получаем ответ (объект)
          const response = await uploadFile(file, 'tours'); 
          // 2. Вытаскиваем из него ТОЛЬКО строчку с ссылкой (response.url)
          if (response && response.url) {
             append(response.url); 
          }
        }
      } catch (err) {
        console.error(err);
        alert('Ошибка загрузки фото');
      } finally {
        setIsUploadingGallery(false);
      }
    }
  };

  // 👇 ФОРМИРУЕМ ОПЦИИ ДЛЯ СЕЛЕКТА ИЗ БАЗЫ ДАННЫХ
  const categoryOptions = [
    { value: '', label: '— Выберите категорию —' },
    ...categories.map(c => ({ value: c.id, label: c.title }))
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
        <AlignLeft className="text-teal-500" size={24} />
        <h3 className="text-lg font-black text-slate-800">Основная информация</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* ЛЕВАЯ КОЛОНКА */}
        <div className="space-y-5">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
             <FormSwitch name="isActive" label="Тур опубликован на сайте" />
          </div>
          
          <FormInput 
            name="title" 
            label="Название тура" 
            placeholder="Придумай красивое название тура" 
          />
          
          <FormInput 
            name="slug" 
            label="URL (Slug)" 
            placeholder="auto-generated"
            className="font-mono text-xs text-slate-500"
            helperText="Уникальная ссылка на страницу тура"
          />

          <FormTextarea 
             name="subtitle" 
             label="Краткое описание (Subtitle)" 
             placeholder="1-2 предложения, которые будут видны в карточке тура..."
             rows={3}
           />

          <div className="grid grid-cols-2 gap-4">
             {/* 👇 ИЗМЕНИЛИ NAME НА category_id И ПОДСТАВИЛИ ДИНАМИЧЕСКИЕ ОПЦИИ */}
             <FormSelect 
                name="categoryId" 
                label="Категория тура"
                options={categoryOptions}
             />
             <FormInput 
                name="label" 
                label="Метка (Badge)" 
                placeholder="ХИТ, NEW, -20%" 
             />
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА: МЕДИА */}
        <div className="space-y-6">
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <ImageUploader name="coverImage" label="Главная обложка" folder="tours" />
           </div>
           
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="text-xs font-bold uppercase text-slate-600 mb-3 flex items-center justify-between">
                 <span>Галерея ({fields.length})</span>
                 {isUploadingGallery && <span className="text-teal-500 animate-pulse">Загрузка...</span>}
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="relative aspect-square rounded-lg overflow-hidden group border border-slate-200 bg-white">
                    <Image 
                       src={watch(`gallery.${index}`) || ''} 
                       alt="Gallery" 
                       fill 
                       className="object-cover"
                    />
                    <button 
                      type="button" 
                      onClick={() => remove(index)}
                      className="absolute top-1 right-1 bg-rose-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                <label className="aspect-square rounded-lg border-2 border-dashed border-slate-300 hover:border-teal-500 hover:bg-teal-50 flex flex-col items-center justify-center cursor-pointer transition-colors text-slate-400 hover:text-teal-600">
                  <Plus size={24} />
                  <span className="text-[12px] font-bold uppercase mt-1">Добавить</span>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleGalleryUpload} 
                  />
                </label>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};