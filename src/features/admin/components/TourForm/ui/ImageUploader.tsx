import React, { useState, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { UploadCloud, X, Loader2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { clsx } from 'clsx';
// Импортируем вашу функцию загрузки (теперь это Server Action)
import { uploadFile } from '@/features/admin/upload'; 

interface ImageUploaderProps {
  name: string;      // Имя поля в форме (например "coverImage")
  label?: string;
  className?: string;
  folder?: string;   // Папка в Storage (по дефолту "tours")
}

export const ImageUploader = ({ 
  name, 
  label = "Обложка тура", 
  className,
  folder = "tours" 
}: ImageUploaderProps) => {
  const { setValue, watch, formState: { errors } } = useFormContext();
  
  // Следим за значением поля (там лежит URL строки)
  const value = watch(name);
  const error = errors[name]?.message as string;
  
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

// === ЛОГИКА ЗАГРУЗКИ ===
  const handleUpload = async (file: File) => {
    // Проверка типа
    if (!file.type.startsWith('image/')) {
      alert("Можно загружать только изображения");
      return;
    }
    // Проверка размера (например 5Мб)
    if (file.size > 5 * 1024 * 1024) {
      alert("Файл слишком большой (макс 5Мб)");
      return;
    }

    try {
      setIsUploading(true);
      
      // ✅ ИСПРАВЛЕНИЕ: Формируем FormData для отправки в Server Action
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      // Загружаем в Supabase через сервер
      const response = await uploadFile(formData); 
      
      // Достаем url из объекта response
   if (response && 'url' in response && response.url) {
        // Записываем полученную СТРОКУ в форму
        setValue(name, response.url, { shouldDirty: true, shouldValidate: true });
      } else if (response.error) {
        alert("Ошибка сервера: " + response.error);
      }
    } catch (e) {
      console.error("Upload error:", e);
      alert("Ошибка загрузки файла");
    } finally {
      setIsUploading(false);
    }
  };

  // === DRAG & DROP ===
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  return (
    <div className={clsx("w-full", className)}>
      <label className="text-xs font-bold uppercase text-slate-300 mb-2 block">
        {label}
      </label>

      {/* 1. Если картинка уже есть -> Показываем PREVIEW */}
      {value && value.length > 0 ? (
  <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-200 group bg-slate-100">
   <Image
  src={value}
  alt="Preview"
  fill
  sizes="(max-width: 768px) 100vw, 50vw"
  quality={75}
  className="object-cover ..."
/>
          
          {/* Кнопка удаления */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setValue(name, null, { shouldDirty: true });
            }}
            className="absolute top-2 right-2 p-2 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-rose-600"
          >
            <X size={16} />
          </button>
          
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-[12px] rounded backdrop-blur-md">
            Загружено
          </div>
        </div>
      ) : (
        /* 2. Если картинки нет -> Показываем ЗАГРУЗЧИК */
        <div
          className={clsx(
            "relative w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer",
            dragActive ? "border-teal-500 bg-teal-50" : "border-slate-300 hover:border-teal-400 hover:bg-slate-50",
            error && "border-rose-500 bg-rose-50"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={handleChange}
            disabled={isUploading}
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-teal-600">
              <Loader2 className="animate-spin" size={32} />
              <span className="text-sm font-bold">Загрузка...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-300">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                <UploadCloud size={24} />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-600">Нажмите или перетащите фото</p>
                <p className="text-xs">JPG, PNG, WEBP (макс 5MB)</p>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-rose-500 font-bold mt-1">{error}</p>}
    </div>
  );
};