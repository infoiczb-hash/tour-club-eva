// src/features/admin/components/TourForm/sections/MainInfo.tsx
import React, { useState, useEffect } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { FormInput, FormSelect, FormSwitch, FormTextarea } from '../ui/FormUI';
import { ImageUploader } from '../ui/ImageUploader';
import { AlignLeft, Plus, X, RefreshCw } from 'lucide-react'; 
import Image from 'next/image';
import { uploadFile } from '@/features/admin/upload'; 
import { slugify } from '@/lib/slugify'; 
import { TourCategory } from '@prisma/client'; // ✅ ДОБАВЛЕН ИМПОРТ УТИЛИТЫ

type CategoryOption = Pick<TourCategory, 'id' | 'title'>;
export const MainInfo = ({ categories = [] }: { categories?: CategoryOption[] }) => {
  const { control, watch, setValue, getValues } = useFormContext();
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "gallery" 
  });

  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  // ✅ ЛОГИКА АВТОГЕНЕРАЦИИ SLUG ДЛЯ НОВОГО ТУРА
  const title = watch('title');
  const slug = watch('slug');

  useEffect(() => {
    // Если создается новый тур (slug изначально пустой) - генерируем на лету
    if (title && !getValues('id') && (!slug || slug === slugify(title.slice(0, -1)))) {
      setValue('slug', slugify(title), { shouldValidate: true, shouldDirty: true });
    }
  }, [title]);

  const handleRegenerateSlug = () => {
    if (title) {
      setValue('slug', slugify(title), { shouldValidate: true, shouldDirty: true });
    }
  };

 const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploadingGallery(true);
      try {
        const files = Array.from(e.target.files);
        for (const file of files) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('folder', 'tours');
          
          const response = await uploadFile(formData); 
          
          // ✅ ИСПРАВЛЕНО: Сначала проверяем, есть ли ключ 'url' в ответе
          if (response && 'url' in response && response.url) {
              append(response.url); 
          } else if (response && 'error' in response) {
              // Опционально: можно вывести конкретную ошибку, если загрузка не удалась
              console.error('Ошибка сервера при загрузке:', response.error);
          }
        }
      } catch (err) {
        alert('Ошибка загрузки фото');
      } finally {
        setIsUploadingGallery(false);
        e.target.value = '';
      }
    }
  };

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
          
          {/* ✅ БЛОК SLUG С КНОПКОЙ */}
          <div className="flex items-end gap-2">
             <div className="flex-1">
                 <FormInput 
                   name="slug" 
                   label="URL (Slug)" 
                   placeholder="auto-generated"
                   className="font-mono text-xs text-slate-800"
                   helperText="Уникальная ссылка на страницу тура"
                 />
             </div>
             <button 
                type="button" 
                onClick={handleRegenerateSlug} 
                className="h-[44px] px-3 bg-slate-100 hover:bg-teal-50 text-slate-800 hover:text-teal-600 rounded-xl border border-slate-200 transition-colors flex items-center justify-center mb-6" 
                title="Сгенерировать из названия"
             >
               <RefreshCw size={18} />
             </button>
          </div>

          <FormTextarea 
             name="subtitle" 
             label="Краткое описание (Subtitle)" 
             placeholder="1-2 предложения, которые будут видны в карточке тура..."
             rows={3}
           />

          <div className="grid grid-cols-2 gap-4">
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

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
             <h4 className="text-xs font-black uppercase text-slate-800 mb-2">Детализация для карточки</h4>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <FormInput 
                    name="tourFormat" 
                    label="Формат тура" 
                    placeholder="Напр: С рюкзаками" 
                 />
                 <FormInput 
                    name="accommodation" 
                    label="Проживание" 
                    placeholder="Напр: Отель / Палатки" 
                 />
             </div>
             
             <FormInput 
                name="groupInfo" 
                label="Инфо о группе" 
                placeholder="Напр: До 12 человек, можно с детьми" 
             />
             
             <FormTextarea 
                name="importantInfo" 
                label="Важная информация (Красный блок)" 
                placeholder="Напр: Обязательно наличие загранпаспорта..." 
                rows={2}
             />
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА: МЕДИА */}
        <div className="space-y-6">
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <ImageUploader name="coverImage" label="Главная обложка" folder="tours" />
           </div>
           
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="text-xs font-bold uppercase text-slate-800 mb-3 flex items-center justify-between">
                 <span>Галерея ({fields.length})</span>
                 {isUploadingGallery && <span className="text-teal-500 animate-pulse">Загрузка...</span>}
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="relative aspect-square rounded-lg overflow-hidden group border border-slate-200 bg-white">
                    <Image src={watch(`gallery.${index}`) || ''} alt="Gallery" fill className="object-cover"/>
                    <button type="button" onClick={() => remove(index)} className="absolute top-1 right-1 bg-rose-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <label className="aspect-square rounded-lg border-2 border-dashed border-slate-300 hover:border-teal-500 hover:bg-teal-50 flex flex-col items-center justify-center cursor-pointer transition-colors text-slate-800 hover:text-teal-600">
                  <Plus size={24} />
                  <span className="text-[12px] font-bold uppercase mt-1">Добавить</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleGalleryUpload} />
                </label>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};