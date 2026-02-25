"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Save, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { upsertFunTestAction } from "@features/admin/actions/fun";


// --- Схема валидации Zod ---
const formSchema = z.object({
  slug: z.string().min(2, "Slug обязателен (напр. fear-debrief)"),
  title: z.string().min(2, "Введите название теста"),
  description: z.string().min(5, "Добавьте краткое описание"),
  image: z.string().url("Введите корректный URL картинки").or(z.literal("")),
  category: z.string().min(2, "Укажите категорию"),
  isActive: z.boolean(), // <-- убрали .default()
  passCount: z.number().min(0), // <-- убрали .default()
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
 initialData?: any; // (или твой FormValues, если он там есть)
  onSuccess?: () => void; // 👈 Добавь эту строку
}

export default function FanForm({ initialData, onSuccess }: Props) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      slug: "",
      title: "",
      description: "",
      image: "",
      category: "Психология",
      isActive: false,
      passCount: 0,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    setError(null);
    
    try {
      const res = await upsertFunTestAction(data);
      if (res.success) {
        // Вызываем функцию закрытия модалки и обновления данных в дашборде
        if (onSuccess) {onSuccess(); 
        }
        // router.push и router.refresh мы удалили, они больше не нужны!
      } else {
        setError(res.error || "Произошла ошибка при сохранении");
      }
    } catch (err) {
      setError("Ошибка сети. Попробуйте еще раз.");
    } finally {
      setIsSaving(false);
    }
     }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/admin/fun" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-2">
            <ArrowLeft size={16} /> Назад к списку
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">
            {initialData ? "Редактирование теста" : "Новый тест (Карточка)"}
          </h1>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl text-sm">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* --- СИСТЕМНЫЙ SLUG --- */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Системный Slug (Ключ) <span className="text-red-500">*</span></label>
              <input 
                {...form.register("slug")}
                disabled={!!initialData} // Запрещаем менять slug после создания, чтобы не сломать связь с кодом
                placeholder="напр. fear-debrief"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
              />
              {form.formState.errors.slug && <p className="text-xs text-red-500">{form.formState.errors.slug.message}</p>}
              <p className="text-xs text-slate-400">Связывает карточку с кодом модалки. Должен совпадать с ключом в реестре.</p>
            </div>

            {/* --- КАТЕГОРИЯ --- */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Категория <span className="text-red-500">*</span></label>
              <input 
                {...form.register("category")}
                placeholder="Психология, Игры, Тесты"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              />
              {form.formState.errors.category && <p className="text-xs text-red-500">{form.formState.errors.category.message}</p>}
            </div>
          </div>

          {/* --- НАЗВАНИЕ --- */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Название карточки <span className="text-red-500">*</span></label>
            <input 
              {...form.register("title")}
              placeholder="Разбор страхов"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            />
            {form.formState.errors.title && <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>}
          </div>

          {/* --- ОПИСАНИЕ --- */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Описание <span className="text-red-500">*</span></label>
            <textarea 
              {...form.register("description")}
              rows={3}
              placeholder="AI-психолог проанализирует, что тебя останавливает..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none"
            />
            {form.formState.errors.description && <p className="text-xs text-red-500">{form.formState.errors.description.message}</p>}
          </div>

          {/* --- ОБЛОЖКА --- */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">URL обложки (Cloudinary)</label>
            <input 
              {...form.register("image")}
              placeholder="https://res.cloudinary.com/..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            />
            {form.formState.errors.image && <p className="text-xs text-red-500">{form.formState.errors.image.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            {/* --- СЧЕТЧИК (Только для корректировки) --- */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Счетчик прохождений</label>
              <input 
                type="number"
                {...form.register("passCount", { valueAsNumber: true })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              />
            </div>

            {/* --- СТАТУС --- */}
            <div className="flex items-center gap-3 pt-8">
              <input 
                type="checkbox"
                id="isActive"
                {...form.register("isActive")}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
              />
              <label htmlFor="isActive" className="text-sm font-semibold text-slate-700 cursor-pointer">
                Отображать на сайте (Активен)
              </label>
            </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit" 
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-semibold transition-colors disabled:opacity-70"
            >
              {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              {isSaving ? "Сохраняем..." : "Сохранить карточку"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}