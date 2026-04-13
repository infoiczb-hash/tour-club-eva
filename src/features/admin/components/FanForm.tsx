"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, AlertCircle, Loader2, Tags, Key } from "lucide-react";
import { upsertFunTestAction } from "@/features/admin/actions/fun";
import type { FunTest } from "@prisma/client"; // ✅ ДОБАВЛЕНО: Строгий тип из базы данных

// --- КОНСТАНТЫ ДЛЯ УДОБСТВА ---
const CATEGORIES = [
  "Психологические тесты",
  "Поддержка в туре",
  "Подбор тура",
  "Какой ты турист?",
  "Юмористические",
  "Другое"
];

// Все системные ключи, которые поддерживаются в коде модалок
const SYSTEM_SLUGS = [
  { id: 'fears', label: 'Разбор страхов (AI)' },
  { id: 'physical', label: 'Готов ли я физически? (AI)' },
  { id: 'signals', label: 'Симптомы в туре (AI)' },
  { id: 'debrief', label: 'Рефлексия опыта (AI)' },
  { id: 'psych-profile', label: 'Псих. профиль (AI)' },
  { id: 'tourist-type', label: 'Кто ты в горах?' },
  { id: 'backpack', label: 'Собери рюкзак' },
  { id: 'survival', label: 'Выживание' },
  { id: 'totem', label: 'Тотемное животное' },
];

// --- Схема валидации Zod ---
const formSchema = z.object({
  id: z.string().optional(), // ✅ ДОБАВЛЕНО: Для корректного сохранения при редактировании
  slug: z.string().min(2, "Выберите системный ключ"),
  title: z.string().min(2, "Введите название теста"),
  description: z.string().min(5, "Добавьте краткое описание"),
  image: z.string().url("Введите корректный URL картинки").or(z.literal("")).optional().nullable(), // ✅ ИСПРАВЛЕНО: Разрешаем null
  category: z.string().min(2, "Укажите категорию"),
  isActive: z.boolean(), 
  passCount: z.number().min(0), 
});

type FormValues = z.infer<typeof formSchema>;

// ✅ ИСПРАВЛЕНО: Строгая типизация вместо any
interface Props {
  initialData?: Partial<FunTest> | null; 
  onSuccess?: () => void; 
}

export default function FanForm({ initialData, onSuccess }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ ИСПРАВЛЕНО: Безопасный маппинг данных из БД в форму
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: initialData?.id || undefined,
      slug: initialData?.slug || "",
      title: initialData?.title || "",
      description: initialData?.description || "",
      image: initialData?.image || "", // Конвертируем null в пустую строку
      category: initialData?.category || "Психологические тесты",
      isActive: initialData?.isActive ?? true, // По умолчанию делаем активным при создании
      passCount: initialData?.passCount ?? 0,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    setError(null);
    
    try {
      // ✅ ИСПРАВЛЕНО: Приводим данные к строгому формату экшена
      const payload = {
        id: data.id,
        slug: data.slug,
        title: data.title,
        description: data.description,
        image: data.image || "", 
        category: data.category,
        isActive: data.isActive,
        passCount: data.passCount,
      };

      const res = await upsertFunTestAction(payload);
      
      if (res.success) {
        if (onSuccess) onSuccess(); 
      } else {
        setError(res.error || "Произошла ошибка при сохранении");
      }
    } catch (err) {
      setError("Ошибка сети. Попробуйте еще раз.");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCategory = form.watch("category");

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
      
      {/* Шапка модалки */}
      <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          {initialData ? "✏️ Редактирование карточки" : "✨ Новая карточка (Квиз)"}
        </h1>
        <p className="text-xs text-slate-800 mt-1">
          {initialData ? "Измените описание или категорию теста." : "Выберите системный ключ и настройте внешний вид."}
        </p>
      </div>

      {/* Тело формы (скроллится) */}
      <div className="p-6 overflow-y-auto no-scrollbar">
        <form id="fan-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {/* --- СИСТЕМНЫЙ SLUG --- */}
          <div className="space-y-2 bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
            <label className="flex items-center gap-1.5 text-sm font-bold text-indigo-900 dark:text-indigo-300">
              <Key size={14} /> Системный Slug (Связь с кодом) <span className="text-red-500">*</span>
            </label>
            
            {initialData ? (
              <input 
                {...form.register("slug")}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 font-mono text-sm outline-none"
              />
            ) : (
              <select 
                {...form.register("slug")}
                className="w-full px-4 py-3 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-white dark:bg-slate-800 font-bold text-sm text-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="" disabled>-- Выберите ключ теста --</option>
                {SYSTEM_SLUGS.map(s => (
                  <option key={s.id} value={s.id}>{s.id} ({s.label})</option>
                ))}
              </select>
            )}
            {form.formState.errors.slug && <p className="text-xs text-red-500 font-medium">{form.formState.errors.slug.message}</p>}
          </div>

          {/* --- КАТЕГОРИЯ --- */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2">
                <Tags size={12} /> Раздел на сайте <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
               {CATEGORIES.map(cat => (
                 <button
                    key={cat}
                    type="button"
                    onClick={() => form.setValue("category", cat)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                      selectedCategory === cat 
                        ? 'bg-teal-500 text-white border-teal-600 shadow-md' 
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-800 hover:border-teal-300'
                    }`}
                 >
                    {cat}
                 </button>
               ))}
            </div>
            {form.formState.errors.category && <p className="text-xs text-red-500">{form.formState.errors.category.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* --- НАЗВАНИЕ --- */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Название карточки <span className="text-red-500">*</span></label>
              <input 
                {...form.register("title")}
                placeholder="напр. Разбор страхов"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
              />
              {form.formState.errors.title && <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>}
            </div>

            {/* --- ОБЛОЖКА --- */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">URL обложки</label>
              <input 
                {...form.register("image")}
                placeholder="https://res.cloudinary.com/..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
              />
              {form.formState.errors.image && <p className="text-xs text-red-500">{form.formState.errors.image.message}</p>}
            </div>
          </div>

          {/* --- ОПИСАНИЕ --- */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Описание <span className="text-red-500">*</span></label>
            <textarea 
              {...form.register("description")}
              rows={3}
              placeholder="Кратко, о чем этот тест..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all resize-none"
            />
            {form.formState.errors.description && <p className="text-xs text-red-500">{form.formState.errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            {/* --- СТАТУС --- */}
            <div className="flex items-center gap-3 pt-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" {...form.register("isActive")} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                <span className="ml-3 text-sm font-bold text-slate-700 dark:text-slate-800">Показывать на сайте</span>
              </label>
            </div>

            {/* --- СЧЕТЧИК --- */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Прохождений (Накрутка)</label>
              <input 
                type="number"
                {...form.register("passCount", { valueAsNumber: true })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Подвал формы с кнопкой */}
      <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 mt-auto">
        <button 
          form="fan-form"
          type="submit" 
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white py-3.5 rounded-xl font-bold transition-colors disabled:opacity-70 shadow-lg shadow-teal-600/20"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {isSaving ? "Сохраняем..." : "Сохранить карточку"}
        </button>
      </div>

    </div>
  );
}