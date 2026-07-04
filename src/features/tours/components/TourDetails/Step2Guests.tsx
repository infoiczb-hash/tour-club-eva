// src/features/tours/components/TourDetails/Step2Guests.tsx
"use client";

import React, { useEffect, useMemo, useRef } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { ArrowRight, User, Users, Phone, CalendarDays, LifeBuoy, Mail, MessageSquare, CheckCircle } from 'lucide-react';
import { Tour } from '@/features/tours/types';
import { BookingFormValues, guestSchema } from './booking.schema';
import { clsx } from 'clsx';
import { z } from 'zod';

const EMPTY_CART: Record<string, number> = {};

interface Step2GuestsProps {
  tour: Tour & { tourPriceCategories?: any[]; priceCategories?: any[] };
  onNext: () => void;
}

const JACKET_SIZES = ['Детский', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

export default function Step2Guests({ tour, onNext }: Step2GuestsProps) {
  // Поле 'social' теперь официально объявлено в схеме, убираем хаки приведения типов
  const { control, register, trigger, watch, formState: { errors } } = useFormContext<BookingFormValues>();

  const { fields, replace } = useFieldArray({
    control,
    name: 'guests',
  });

  const cartV2 = watch('cartV2') || EMPTY_CART;
  const ticketsAdult = watch('ticketsAdult');
  const ticketsChild = watch('ticketsChild');
  const ticketsMember = watch('ticketsMember');
  const ticketsFamily = watch('ticketsFamily');

  const hasChildUnder7 = watch('hasChildUnder7');
  const hasDog = watch('hasDog');

  const categorySlug = tour.category?.slug?.toLowerCase() || '';
  const isKayakingTour = ['kayaking', 'kayak'].includes(categorySlug);
  const isWaterTour = ['sup', 'kayaking', 'kayak', 'water', 'rafting'].includes(categorySlug);
  
  // Безопасное чтение динамических тарифов
  const priceCategories = useMemo(() => {
    return tour.tourPriceCategories || tour.priceCategories || [];
  }, [tour.tourPriceCategories, tour.priceCategories]);

  const isV2 = Array.isArray(priceCategories) && priceCategories.length > 0;

  // Используем ref для отслеживания слепка корзины и предотвращения бесконечного ререндера useEffect
  const previousCartFingerprint = useRef('');

  // Интеллектуальное слияние (Smart Merge) — генерация анкет без стирания ранее введенных имен
  useEffect(() => {
    const cartFingerprint = isV2 
      ? JSON.stringify(cartV2) 
      : `${ticketsAdult}-${ticketsChild}-${ticketsMember}-${ticketsFamily}`;

    if (cartFingerprint === previousCartFingerprint.current) return;
    previousCartFingerprint.current = cartFingerprint;

    const expectedGuests: z.infer<typeof guestSchema>[] = [];
    
    if (isV2) {
      let unitCounter = 0;
      priceCategories.forEach((cat: any) => {
        const qty = cartV2[cat.id] || 0;
        for (let i = 0; i < qty; i++) {
          const uIdx = cat.spotsPerUnit > 1 ? unitCounter++ : undefined;
          const spots = cat.spotsPerUnit || 1;
          for (let s = 0; s < spots; s++) {
            expectedGuests.push({
              id: `${cat.id}_${i}_${s}`, 
              isMain: expectedGuests.length === 0,
              type: spots > 1 ? `Место ${s + 1}` : cat.label,
              categoryId: cat.id,
              unitIndex: uIdx,
              groupLabel: spots > 1 ? `${cat.label} #${i + 1}` : undefined,
              name: '',
            });
          }
        }
      });
    } else {
      let idx = 0;
      for (let i = 0; i < ticketsAdult; i++) expectedGuests.push({ id: `v1_${idx++}`, isMain: expectedGuests.length === 0, type: 'Стандарт', name: '' });
      for (let i = 0; i < ticketsMember; i++) expectedGuests.push({ id: `v1_${idx++}`, isMain: expectedGuests.length === 0, type: 'Клубный', name: '' });
      for (let i = 0; i < ticketsChild; i++) expectedGuests.push({ id: `v1_${idx++}`, isMain: expectedGuests.length === 0, type: 'Детский', name: '' });
      for (let i = 0; i < ticketsFamily; i++) {
        expectedGuests.push({ id: `v1_${idx++}`, isMain: expectedGuests.length === 0, type: 'Семейный (Взр)', name: '' });
        expectedGuests.push({ id: `v1_${idx++}`, isMain: false, type: 'Семейный (Взр)', name: '' });
        expectedGuests.push({ id: `v1_${idx++}`, isMain: false, type: 'Семейный (Дет)', name: '' });
      }
    }

    // Восстанавливаем введенные данные из существующего массива, чтобы они не стирались при переходах назад-вперед
    const mergedGuests = expectedGuests.map((expected, index) => {
      const existing = fields[index];
      if (existing) {
        return {
          ...expected,
          name: existing.name || '',
          phone: existing.phone || '',
          age: existing.age || '',
          jacket: existing.jacket || '',
        };
      }
      return expected;
    });

    replace(mergedGuests);
  }, [cartV2, ticketsAdult, ticketsChild, ticketsMember, ticketsFamily, isV2, replace, priceCategories, fields]);

  // Группировка экипажей (для лодок повышенной вместимости в V2)
  const groupedFields = useMemo(() => {
    const groups: { label?: string; items: { field: any, index: number }[] }[] = [];
    const map = new Map<string, { field: any, index: number }[]>();

    fields.forEach((field, index) => {
      const key = field.unitIndex !== undefined ? `unit_${field.unitIndex}` : `single_${field.id}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ field, index });
    });

    map.forEach(items => {
      groups.push({ label: items[0].field.groupLabel, items });
    });

    return groups;
  }, [fields]);

  // Строгая проверка Zod-валидации перед пуском на экран оплаты
  const handleProceed = async () => {
    const isValid = await trigger(['guests', 'social']);
    if (isValid) onNext();
  };

  // 100% оригинальная логика умных плейсхолдеров из старого файла
  const getSmartPlaceholder = () => {
    const slug = tour.category?.slug?.toLowerCase() || '';
    const location = tour.location?.toLowerCase() || '';

    if (['water', 'kayaking', 'kayak', 'sup', 'rafting'].includes(slug)) {
      return 'Здессь можно оставить комментарий к поездке или важную информацию, пожелания';
    }
    if (slug === 'abroad' || location.includes('румыния')) {
      return 'Какое снаряжение вам нужно? Есть ли у Вас действующий биометрический паспорт?';
    }
    if (slug === 'kids') {
      return 'Укажите возраст детей, если они едут с вами...';
    }
    return 'Задайте вопрос и мы постараемся ответить на него в короткие сроки?';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {groupedFields.map((group, gIdx) => (
        <div key={gIdx} className="bg-slate-950/50 border border-white/10 rounded-2xl p-5 space-y-5 relative overflow-hidden">
          {group.label && (
            <div className="absolute top-0 right-0 bg-teal-500/20 text-teal-400 px-3 py-1 rounded-bl-xl text-[10px] font-black uppercase tracking-widest border-b border-l border-teal-500/20 shadow-sm">
              {group.label}
            </div>
          )}
          
    {group.items.map(({ field, index }) => {
           const isChild = (field.type || '').toLowerCase().includes('дет');
            const errBase = errors?.guests?.[index];

            return (
              <div key={field.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-teal-500 uppercase tracking-widest flex items-center gap-1.5">
                    {field.isMain ? <User size={14}/> : <Users size={14}/>} 
                    Участник {index + 1} {field.isMain && <span className="text-white bg-white/10 px-1.5 py-0.5 rounded ml-1">Заказчик</span>}
                  </label>
                  {!field.isMain && (
                    <span className="text-[10px] uppercase font-bold text-slate-400 border border-slate-700 px-2 py-0.5 rounded">
                      {field.type}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                      <input 
                        {...register(`guests.${index}.name`)}
                        placeholder="Имя Фамилия *" 
                        className={clsx(
                          "w-full bg-slate-900 border rounded-xl py-2.5 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600",
                          errBase?.name ? "border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500" : "border-white/5 focus:border-teal-500/50"
                        )} 
                      />
                    </div>
                    {errBase?.name && <p className="text-[10px] text-rose-400 font-bold ml-1">{errBase.name.message}</p>}
                  </div>

                  {field.isMain ? (
                    <div className="space-y-1">
                      <div className="relative">
                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                        <input 
                          {...register(`guests.${index}.phone`, { required: 'Укажите телефон' })}
                          type="tel" 
                          placeholder="Телефон *" 
                          className={clsx(
                            "w-full bg-slate-900 border rounded-xl py-2.5 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600",
                            errBase?.phone ? "border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500" : "border-white/5 focus:border-teal-500/50"
                          )} 
                        />
                      </div>
                      {errBase?.phone && <p className="text-[10px] text-rose-400 font-bold ml-1">{errBase.phone.message}</p>}
                    </div>
                  ) : (
                    <div className="relative">
                      {isChild ? (
                        <>
                          <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                          <input 
                            {...register(`guests.${index}.age`)}
                            type="number" min="1" max="17" placeholder="Возраст" 
                            className="w-full bg-slate-900 border border-white/5 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white focus:border-teal-500/50 outline-none transition-colors placeholder:text-slate-600" 
                          />
                        </>
                      ) : (
                        <>
                          <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                          <input 
                            {...register(`guests.${index}.phone`)}
                            type="tel" placeholder="Телефон (Опционально)" 
                            className="w-full bg-slate-900 border border-white/5 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white focus:border-teal-500/50 outline-none transition-colors placeholder:text-slate-600" 
                          />
                        </>
                      )}
                    </div>
                  )}
                </div>

                {field.isMain && (
                  <div className="space-y-1">
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                      <input 
                        {...register('social', { required: 'Куда отправить электронный билет?' })}
                        type="text" 
                        placeholder="Email или Telegram (Сюда придет билет) *" 
                        className={clsx(
                          "w-full bg-slate-900 border rounded-xl py-2.5 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600",
                          errors?.social ? "border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500" : "border-white/5 focus:border-teal-500/50"
                        )} 
                      />
                    </div>
                    {errors?.social && <p className="text-[10px] text-rose-400 font-bold ml-1">{errors.social.message}</p>}
                  </div>
                )}

                {isWaterTour && (
                  <div className="space-y-1.5 mt-3 pt-3 border-t border-white/5">
                    <label className="text-[10px] font-bold text-teal-500 uppercase tracking-widest ml-1">
                      Спасательный жилет
                    </label>
                    <div className="relative">
                      <LifeBuoy size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                      <select 
                        {...register(`guests.${index}.jacket`)}
                        className="w-full bg-slate-900 border border-white/5 rounded-xl py-2.5 pl-9 pr-8 text-sm text-slate-300 focus:border-teal-500/50 outline-none transition-colors appearance-none cursor-pointer"
                      >
                        <option value="" disabled>Выберите размер спасжилета...</option>
                        {JACKET_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">▼</div>
                    </div>
                  </div>
                )}
                
                {group.items.length > 1 && index !== group.items[group.items.length - 1].index && (
                  <div className="h-px bg-white/5 w-full mt-4" />
                )}
              </div>
            );
          })}
        </div>
      ))}

      <div className="space-y-4 pt-2">
        {isKayakingTour && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className={clsx("flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors", hasChildUnder7 ? "bg-teal-500/10 border-teal-500/30" : "bg-slate-950/50 border-white/5 hover:bg-white/5")}>
              <div className="relative flex items-center justify-center">
                <input type="checkbox" {...register('hasChildUnder7')} className="peer sr-only" />
                <div className="w-5 h-5 border-2 border-slate-600 rounded flex items-center justify-center bg-slate-900 peer-checked:bg-teal-500 peer-checked:border-teal-500 transition-all shadow-sm">
                  <CheckCircle size={14} className="text-slate-900 opacity-0 peer-checked:opacity-100" strokeWidth={3} />
                </div>
              </div>
              <span className="text-xs font-bold text-slate-300">Ребенок до 7 лет 👶</span>
            </label>

            <label className={clsx("flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors", hasDog ? "bg-amber-500/10 border-amber-500/30" : "bg-slate-950/50 border-white/5 hover:bg-white/5")}>
              <div className="relative flex items-center justify-center">
                <input type="checkbox" {...register('hasDog')} className="peer sr-only" />
                <div className="w-5 h-5 border-2 border-slate-600 rounded flex items-center justify-center bg-slate-900 peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-all shadow-sm">
                  <CheckCircle size={14} className="text-slate-900 opacity-0 peer-checked:opacity-100" strokeWidth={3} />
                </div>
              </div>
              <span className="text-xs font-bold text-slate-300">Собака с нами 🐶</span>
            </label>
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="booking-comment" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
            <MessageSquare size={12} /> Комментарий / Пожелания
          </label>
          <textarea 
            id="booking-comment"
            {...register('comment')}
            rows={1} 
            placeholder={getSmartPlaceholder()} 
            onInput={(e) => {
              const target = e.currentTarget;
              target.style.height = 'auto'; 
              target.style.height = `${target.scrollHeight}px`;
            }}
            className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50 transition-all resize-none min-h-[60px]"
          />
        </div>
      </div>

      <button 
        type="button" 
        onClick={handleProceed}
        className="w-full py-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black uppercase tracking-widest rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4 shadow-lg shadow-teal-500/20 text-sm"
      >
        К оформлению <ArrowRight size={18}/>
      </button>

    </div>
  );
}