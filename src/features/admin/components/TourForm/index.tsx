// src/features/admin/components/TourForm/index.tsx
"use client";

import React, { useEffect, useMemo } from 'react';
import { useForm, FormProvider, Resolver } from 'react-hook-form'; // 👈 ИСПРАВЛЕНО: Добавлен импорт Resolver
import { zodResolver } from '@hookform/resolvers/zod';
import { tourFormSchema, type TourFormValues } from './schema';
import { saveTour } from '@/features/admin/actions/tour';
import { useToast } from '@/shared/context/ToastContext';
import { Loader2, Save, X } from 'lucide-react';
import Button from '@/shared/ui/Button';

// Импортируем наши кирпичики
import { MainInfo } from './sections/MainInfo';
import { Logistics } from './sections/Logistics';
import { Finance } from './sections/Finance';
import { Content } from './sections/Content';
import { Lists } from './sections/Lists';
import { SEO } from './sections/SEO';

interface TourFormProps {
  initialData?: any; // оставляем как есть
  onClose: () => void;
  guides: { id: string; name: string }[];
  categories?: { id: string; title: string }[];
  onSuccess?: () => void;
}

export default function TourForm({ initialData, onClose, guides, categories = [], onSuccess }: TourFormProps) {
  const { showToast } = useToast();
  
  //   ДОБАВЛЕНО: Умный выбор дефолтной категории
  const defaultCategoryId = categories.length > 0 ? categories[0].id : '';

  // =========================================================
  // 1. МАППИНГ ДАННЫХ (БАЗА -> ФОРМА)
  // =========================================================
  const defaultValues: Partial<TourFormValues> = useMemo(() => {
    // Дефолтные значения для НОВОГО тура
    if (!initialData) {
      return {
         currency: 'RUB',
         type: 'hiking',
         categoryId: defaultCategoryId, //   ДОБАВЛЕНО: Дефолтная категория
         isActive: false,
         price: 0, // Важно: для нового тура цена 0
         dates: [],
         tags: [],
         faq: [],
         program: [],
         included: [],
         additionalExpenses: [],
         documents: [],
         gallery: [],
         highlights: [],
         checklist: [],
         spots: 15,
         spotsLeft: 15,
         // 👇 Добавлено для соответствия строгой схеме Zod без ошибок:
         difficulty: 'medium',
         label: '',
         location: '',
         duration: '1 день',
      };
    }

    // Значения для РЕДАКТИРОВАНИЯ
    return {
      ...initialData,
      // Приводим поля к формату схемы
      isActive: initialData.isActive ?? initialData.is_active ?? false,
      
      categoryId: initialData.categoryId ?? initialData.categoryId ?? defaultCategoryId, //   ДОБАВЛЕНО: Маппинг категории
      
      //   ИСПРАВЛЕНО: Принудительная конвертация в число (Number)
      // Это решает проблему "expected number, received NaN"
      price: initialData.price ? Number(initialData.price) : 0,
      
      priceOld: (initialData.priceOld ?? initialData.price_old) 
        ? Number(initialData.priceOld ?? initialData.price_old) 
        : null,
        
      priceChild: (initialData.priceChild ?? initialData.price_child) 
        ? Number(initialData.priceChild ?? initialData.price_child) 
        : null,
        
      priceFamily: (initialData.priceFamily ?? initialData.price_family) 
        ? Number(initialData.priceFamily ?? initialData.price_family) 
        : null,
        
      priceMember: (initialData.priceMember ?? initialData.price_member) 
        ? Number(initialData.priceMember ?? initialData.price_member) 
        : null,
      
      // Логистика
      spots: initialData.spots ? Number(initialData.spots) : 15,
      spotsLeft: (initialData.spotsLeft ?? initialData.spots_left) 
        ? Number(initialData.spotsLeft ?? initialData.spots_left) 
        : 15,
      
      meetingPoint: initialData.meetingPoint ?? initialData.meeting_point ?? '',
      coverImage: initialData.coverImage ?? initialData.cover_image ?? initialData.image,
      
      // SEO
      metaTitle: initialData.metaTitle ?? initialData.meta_title ?? '',
      metaDesc: initialData.metaDesc ?? initialData.meta_desc ?? '',

      // Списки (защита от null)
      tags: initialData.tags || [],
      faq: initialData.faq || [],
      program: initialData.program || [],
      documents: initialData.documents || [],
      highlights: initialData.highlights || [],
      included: initialData.included || [],
      checklist: initialData.checklist || [],
      additionalExpenses: initialData.additionalExpenses ?? initialData.additional_expenses ?? [],
      gallery: initialData.gallery || [],
      
      // Даты и выезды
      dates: Array.isArray(initialData.dates) ? initialData.dates.map((d: any) => ({
        ...d,
        // Очищаем даты от ISO формата (T00:00:00.000Z) для корректного отображения в <input type="date">
        start: d.start ? (typeof d.start === 'string' ? d.start.split('T')[0] : new Date(d.start).toISOString().split('T')[0]) : '', 
        end: d.end ? (typeof d.end === 'string' ? d.end.split('T')[0] : new Date(d.end).toISOString().split('T')[0]) : '',
        
        // ✅ ГАРАНТИРУЕМ ТИПЫ (чтобы форма видела значение, даже если в базе оно null)
        time: d.time || '', 
        spots: d.spots ? Number(d.spots) : 15,
        spotsLeft: d.spotsLeft ? Number(d.spotsLeft) : (d.spots ? Number(d.spots) : 15),
        basePrice: d.basePrice ? Number(d.basePrice) : null,
        
        // ✅ ПОДДЕРЖКА МАРКЕТИНГОВЫХ ПОЛЕЙ
        discountEarlyBird: d.discountEarlyBird ? Number(d.discountEarlyBird) : null,
        earlyBirdDeadline: d.earlyBirdDeadline ? Number(d.earlyBirdDeadline) : null,
        surchargeLastMinute: d.surchargeLastMinute ? Number(d.surchargeLastMinute) : null,
        lastMinuteTrigger: d.lastMinuteTrigger ? Number(d.lastMinuteTrigger) : null,
      })) : [],
    };
  }, [initialData, defaultCategoryId]); //   ДОБАВЛЕНО: defaultCategoryId в зависимости

  // =========================================================
  // 2. ИНИЦИАЛИЗАЦИЯ ФОРМЫ
  // =========================================================
  const methods = useForm<TourFormValues>({
    // 👈 ИСПРАВЛЕНО: Безопасное приведение типов для обхода конфликта Zod и RHF
    resolver: zodResolver(tourFormSchema) as unknown as Resolver<TourFormValues>, 
    defaultValues,
    mode: 'onChange' 
  });

  const { handleSubmit, formState: { isSubmitting, errors } } = methods;

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.error("❌ Ошибки валидации формы:", errors);
      showToast('Есть ошибки заполнения (проверьте красные поля)', 'error');
    }
  }, [errors, showToast]);

  // =========================================================
  // 3. ОТПРАВКА ДАННЫХ
  // =========================================================
  const onSubmit = async (data: TourFormValues) => {
    try {
      const payload = { ...data };
      
      //   ДОБАВЛЕНО: Защита от пустой строки в UUID
      if (payload.categoryId === '') {
          delete payload.categoryId;
      }

      const res = await saveTour(payload) as { success: boolean; error?: string };
      
      if (res.success) {
        showToast('Тур успешно сохранен!', 'success');
        if (onSuccess) onSuccess();
        onClose(); 
      } else {
        console.error("Server Error:", res.error);
        showToast(res.error || 'Ошибка сохранения', 'error');
      }
    } catch (e) {
      console.error("Submit Error:", e);
      showToast('Критическая ошибка при сохранении', 'error');
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-hidden">
        
        <div className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 ring-1 ring-slate-900/5">
          
          {/* A. ШАПКА */}
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white z-10 shrink-0">
            <div>
               <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                 {initialData ? 'Редактирование тура' : 'Создание нового тура'}
                 {initialData?.isActive && <span className="text-[12px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">Active</span>}
               </h2>
               <p className="text-xs text-slate-800 font-bold uppercase tracking-wider mt-1">
                 {initialData?.title || 'Заполните информацию'}
               </p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-slate-100 text-slate-800 hover:text-slate-700 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* B. ТЕЛО ФОРМЫ */}
          <div className="flex-1 overflow-y-auto bg-slate-50/50 scroll-smooth">
            <form 
              id="tour-form" 
              onSubmit={handleSubmit(onSubmit)} 
              className="p-6 space-y-6 max-w-5xl mx-auto pb-24"
            >
               {/* 1. Главная инфо */}
               <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                  <MainInfo categories={categories} /> {/*   ДОБАВЛЕНО: Прокидываем категории */}
               </section>

               {/* 2. Логистика */}
               <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                  <Logistics guides={guides} />
               </section>

               {/* 3. Финансы */}
               <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                  <Finance />
               </section>

               {/* 4. Контент */}
               <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                  <Content />
               </section>

               {/* 5. Списки */}
               <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                  <Lists />
               </section>
               
               {/* 6. SEO */}
               <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                  <SEO />
               </section>

            </form>
          </div>

          {/* C. ПОДВАЛ */}
          <div className="px-6 py-4 border-t border-slate-100 bg-white z-10 flex justify-between items-center shrink-0">
            <Button variant="secondary" onClick={onClose}>
              Отмена
            </Button>
            
            <Button 
               variant="primary" 
               onClick={handleSubmit(onSubmit)} 
               disabled={isSubmitting}
               className="bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-500/20 min-w-[180px]"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin mr-2" size={20} />
              ) : (
                <Save className="mr-2" size={20} />
              )}
              {initialData ? 'Сохранить изменения' : 'Создать тур'}
            </Button>
          </div>

        </div>
      </div>
    </FormProvider>
  );
}