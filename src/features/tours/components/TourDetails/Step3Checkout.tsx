// src/features/tours/components/TourDetails/Step3Checkout.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { 
  ArrowLeft, CreditCard, Globe, Banknote, 
  CheckCircle, Tag, Loader2, AlertTriangle, AlertCircle
} from 'lucide-react';
import { Tour } from '@/features/tours/types';
import { BookingFormValues } from './booking.schema';
import { validatePromoCodeAction } from '@/features/tours/actions/validatePromo';
import { createBookingAction, type BookingInput, type GuestInput } from '@/features/tours/actions/createBooking';
import { clsx } from 'clsx';

const EMPTY_CART: Record<string, number> = {};

interface Step3CheckoutProps {
  tour: Tour & { tourPriceCategories?: any[]; priceCategories?: any[] };
  isLoggedIn: boolean;
  userBalance: number;
  onSuccess: (data: any) => void;
}

export default function Step3Checkout({ tour, isLoggedIn, userBalance, onSuccess }: Step3CheckoutProps) {
  const { register, watch, setValue, handleSubmit, formState: { errors } } = useFormContext<BookingFormValues>();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- Стейты промокода ---
  const [promoInput, setPromoInput] = useState('');
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [promoType, setPromoType] = useState<string>('fixed');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<boolean>(false);
  const [isCheckingPromo, setIsCheckingPromo] = useState<boolean>(false);

  // --- Чтение стейта формы ---
  const cartV2 = watch('cartV2') || EMPTY_CART;
  const ticketsAdult = watch('ticketsAdult');
  const ticketsChild = watch('ticketsChild');
  const ticketsMember = watch('ticketsMember');
  const ticketsFamily = watch('ticketsFamily');

  const paymentMethod = watch('paymentMethod');
  const useBonuses = watch('useBonuses');
  
  const agreedOffer = watch('agreedOffer');
  const agreedPrivacy = watch('agreedPrivacy');
  const agreedRules = watch('agreedRules');

  // --- Логика категорий тура ---
  const categorySlug = (tour.category?.slug || '').toLowerCase();
  const isKidsTour = ['kids', 'academy', 'children', 'детск'].some(k => categorySlug.includes(k));
  const isSupTour = categorySlug === 'sup';
  const isKayakingTour = ['kayaking', 'kayak'].includes(categorySlug);
  const showSpecificRules = isKayakingTour || isSupTour;
  
  const specificRulesText = isKayakingTour 
    ? "Правилами поведения на сплаве на байдарках" 
    : "Правилами поведения для SUP туров";
    
  const specificRulesLink = isKayakingTour ? "/rules-kayaking" : "/rules-sup";

  const priceCategories = useMemo(() => {
    return tour.tourPriceCategories || tour.priceCategories || [];
  }, [tour.tourPriceCategories, tour.priceCategories]);

  const isV2 = Array.isArray(priceCategories) && priceCategories.length > 0;

  // --- ВЫЧИСЛЕНИЯ ЭКОНОМИКИ ---
  const baseTotalPrice = useMemo(() => {
    if (isV2) {
      return priceCategories.reduce((sum: number, cat: any) => {
        return sum + ((cartV2[cat.id] || 0) * cat.price);
      }, 0);
    }
    return (ticketsAdult * tour.price) + 
           (ticketsChild * (tour.priceChild || 0)) + 
           (ticketsMember * (tour.priceMember || 0)) + 
           (ticketsFamily * (tour.priceFamily || 0));
  }, [isV2, cartV2, ticketsAdult, ticketsChild, ticketsMember, ticketsFamily, tour, priceCategories]);

  const maxBonusDiscount = Math.floor(baseTotalPrice * 0.1);
  const availableBonusesToUse = Math.min(userBalance, maxBonusDiscount);
  
  let appliedDiscount = 0;
  if (isLoggedIn && useBonuses && userBalance > 0) {
    appliedDiscount = availableBonusesToUse;
  } else if (!isLoggedIn && promoSuccess) {
    appliedDiscount = promoType === 'percent' 
      ? Math.floor(baseTotalPrice * (promoDiscount / 100)) 
      : promoDiscount;
  }
  
  const displayFinalPrice = Math.max(0, baseTotalPrice - appliedDiscount);

  // --- ПРОМОКОД ---
  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setIsCheckingPromo(true); setPromoError(null); setPromoSuccess(false); setPromoDiscount(0);
    try {
      const res = await validatePromoCodeAction(promoInput);
      if (res.success) { 
        setPromoSuccess(true); setPromoDiscount(res.discount!); setPromoType(res.type!); 
        setValue('promoCode', promoInput.trim());
      } else { 
        setPromoError(res.error || 'Ошибка проверки кода'); 
      }
    } catch (e) { 
      setPromoError('Ошибка соединения'); 
    } finally { 
      setIsCheckingPromo(false); 
    }
  };

  const handleCancelPromo = () => {
    setPromoSuccess(false); setPromoInput(''); setPromoDiscount(0); setValue('promoCode', '');
  };

  // --- ОТПРАВКА ФОРМЫ БРОНИРОВАНИЯ ---
  const onSubmit = async (data: BookingFormValues) => {
    setIsLoading(true);
    setErrorMsg(null);

    // 🚀 SENIOR FIX: Умное разделение гостей
    // Ищем профиль заказчика (он всегда генерируется первым с id='customer_parent' или type='Заказчик' для детских туров)
    const customerProfile = isKidsTour 
        ? data.guests.find(g => g.id === 'customer_parent' || g.type === 'Заказчик') 
        : data.guests[0];

    // Фильтруем массив: отсекаем Заказчика, оставляем только реальных УЧАСТНИКОВ, которые занимают посадочные места
    const actualParticipants = isKidsTour 
        ? data.guests.filter(g => g.id !== 'customer_parent' && g.type !== 'Заказчик')
        : data.guests;

    const payloadGuests: GuestInput[] = actualParticipants.map(g => ({
      isMain: g.isMain,
      type: g.type,
      categoryId: g.categoryId,
      unitIndex: g.unitIndex,
      name: g.name.trim(),
      phone: g.phone?.trim() || undefined,
      age: g.age?.trim() || undefined,
      jacket: g.jacket || ''
    }));

    const itemsPayload = isV2 
      ? Object.entries(data.cartV2).map(([categoryId, qty]) => ({ categoryId, qty })).filter(i => i.qty > 0) 
      : undefined;

    try {
      const bookingPayload: BookingInput = {
          tourId: String(tour.id),
          tourDateId: data.tourDateId || undefined, 
          tourTitle: tour.title,
          tourDate: data.tourDateStr,
          
          // 🚀 Передаем контактные данные Заказчика в корень заказа
          name: customerProfile?.name.trim() || 'Без имени',
          phone: customerProfile?.phone?.trim() || '',
          social: data.social?.trim() || undefined, 
          comment: data.comment?.trim() || undefined,
          website: (data as any).website || '', 
          
          items: itemsPayload,
          ticketsAdult: data.ticketsAdult,
          ticketsChild: data.ticketsChild,
          ticketsMember: data.ticketsMember,
          ticketsFamily: data.ticketsFamily, 
          
          // 🚀 Отправляем ТОЛЬКО реальных участников
          guests: payloadGuests, 
          
          currency: tour.currency ?? 'RUB',
          paymentMethod: data.paymentMethod, 
          useBonuses: isLoggedIn ? data.useBonuses : false,
          promoCode: !isLoggedIn && promoSuccess && data.promoCode ? data.promoCode : undefined,
          hasChildUnder7: data.hasChildUnder7, 
          hasDog: data.hasDog,         
      };

      const result = await createBookingAction(bookingPayload);

      if (result.success) {
          onSuccess({
              bookingId: result.bookingId,
              shortId: result.shortId,
              totalPrice: result.totalPrice,
              biletpmrLink: result.biletpmrLink,
              apbQrLink: result.apbQrLink,
              apbQrImage: result.apbQrImage,
              paymentMethod: data.paymentMethod,
              redirectUrl: result.redirectUrl ?? null,  
          });
      } else {
          // Если бэкенд ругается на количество гостей (хотя мы уже отфильтровали)
          if (result.error?.includes('Количество анкет гостей')) {
               setErrorMsg('Ошибка валидации мест. Попробуйте обновить страницу и забронировать заново.');
          }
          else if ('fields' in result && result.fields && Object.keys(result.fields).length > 0) {
              setErrorMsg(`Ошибка в полях: ${Object.values(result.fields).join(' | ')}`);
          } else {
              setErrorMsg(result.error || 'Ошибка при бронировании.');
          }
      }
    } catch {
        setErrorMsg('Ошибка соединения. Проверьте интернет.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* БЛОК СКИДОК И БОНУСОВ */}
      <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-4">
        {isLoggedIn ? (
          userBalance > 0 ? (
            <label className="flex items-center gap-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 cursor-pointer hover:bg-amber-500/20 transition-colors">
              <div className="relative flex items-center justify-center">
                <input 
                  type="checkbox" 
                  {...register('useBonuses')}
                  className="peer sr-only" 
                />
                <div className="w-5 h-5 border-2 border-amber-500/50 rounded flex items-center justify-center bg-slate-950 peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-all">
                  <CheckCircle size={14} className="text-slate-950 opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-500">Списать бонусы</p>
                <p className="text-[10px] text-amber-500/70 uppercase tracking-widest font-bold mt-0.5">Доступно {userBalance} ₽</p>
              </div>
              {useBonuses && <div className="text-sm font-black text-amber-500">-{availableBonusesToUse} ₽</div>}
            </label>
          ) : (
            <div className="p-3 text-sm font-bold text-slate-400">Бонусов пока нет 0 ₽</div>
          )
        ) : (
          <div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Промокод" 
                  value={promoInput} 
                  onChange={e => {
                    setPromoInput(e.target.value); 
                    setPromoSuccess(false); 
                    setPromoError(null);
                  }} 
                  disabled={promoSuccess || isCheckingPromo} 
                  className="w-full bg-slate-900 border border-white/5 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white focus:border-teal-500/50 outline-none transition-colors uppercase placeholder:normal-case placeholder:text-slate-400 disabled:opacity-50" 
                />
              </div>
              {!promoSuccess ? (
                <button type="button" onClick={handleApplyPromo} disabled={!promoInput.trim() || isCheckingPromo} className="px-5 bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/20 disabled:opacity-50">
                  {isCheckingPromo ? <Loader2 size={14} className="animate-spin" /> : 'OK'}
                </button>
              ) : (
                <button type="button" onClick={handleCancelPromo} className="px-5 bg-rose-500/20 text-rose-400 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-rose-500/30 transition-colors">
                  Отмена
                </button>
              )}
            </div>
            {promoError && <p className="text-[10px] text-rose-400 mt-1.5 ml-1 font-bold">{promoError}</p>}
            {promoSuccess && <p className="text-[10px] text-teal-400 mt-1.5 ml-1 font-bold">Скидка применена!</p>}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <span className="text-xs font-bold text-slate-400 uppercase">Итого к оплате:</span>
            <div className="text-right flex items-center gap-2">
              {appliedDiscount > 0 && <span className="text-[12px] text-slate-500 line-through font-bold">{baseTotalPrice}</span>}
              <span className="text-2xl font-black text-teal-400">{displayFinalPrice.toLocaleString()} {tour.currency ?? 'RUB'}</span>
            </div>
        </div>
      </div>

      {/* ВЫБОР СПОСОБА ОПЛАТЫ */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Способ оплаты</label>
        <div className="flex flex-col gap-2">
          
          <button 
            type="button" 
            onClick={() => setValue('paymentMethod', 'online_card')} 
            className={clsx("w-full p-4 rounded-2xl border text-left transition-all", paymentMethod === 'online_card' ? 'bg-teal-500/10 border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.1)]' : 'bg-slate-950 border-white/5 hover:border-white/20')}
          >
            <div className="flex justify-between items-center"><span className={clsx("text-sm font-bold", paymentMethod === 'online_card' ? 'text-teal-400' : 'text-white')}>Клевер (Онлайн)/QR</span><CreditCard size={18} className={paymentMethod === 'online_card' ? 'text-teal-500' : 'text-slate-400'}/></div>
          </button>
          
          <button 
            type="button" 
            onClick={() => setValue('paymentMethod', 'foreign')} 
            className={clsx("w-full p-4 rounded-2xl border text-left transition-all", paymentMethod === 'foreign' ? 'bg-teal-500/10 border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.1)]' : 'bg-slate-950 border-white/5 hover:border-white/20')}
          >
            <div className="flex justify-between items-center"><span className={clsx("text-sm font-bold", paymentMethod === 'foreign' ? 'text-teal-400' : 'text-white')}>Из других стран</span><Globe size={18} className={paymentMethod === 'foreign' ? 'text-teal-500' : 'text-slate-400'}/></div>
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            <button 
              type="button" 
              onClick={() => setValue('paymentMethod', 'biletpmr')} 
              className={clsx("w-full p-3 rounded-2xl border text-left transition-all", paymentMethod === 'biletpmr' ? 'bg-teal-500/10 border-teal-500' : 'bg-slate-950 border-white/5 hover:border-white/20')}
            >
              <div className={clsx("text-xs font-bold", paymentMethod === 'biletpmr' ? 'text-teal-400' : 'text-white')}>BiletPMR</div>
            </button>
            <button 
              type="button" 
              onClick={() => setValue('paymentMethod', 'cash')} 
              className={clsx("w-full p-3 rounded-2xl border text-left transition-all", paymentMethod === 'cash' ? 'bg-orange-500/10 border-orange-500' : 'bg-slate-950 border-white/5 hover:border-white/20')}
            >
              <div className={clsx("text-xs font-bold", paymentMethod === 'cash' ? 'text-orange-400' : 'text-white')}>Наличные</div>
            </button>
          </div>
        </div>

        {paymentMethod === 'cash' && (
          <div className="mt-2 p-3.5 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex gap-3 text-orange-400 text-xs font-medium leading-relaxed animate-in fade-in slide-in-from-top-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <p><b>Внимание!</b> Оплачивайте наличными только в крайнем случае, если онлайн-оплата недоступна. Организаторы оставляют за собой право устанавливать дополнительную комиссию при оплате наличными на месте.</p>
          </div>
        )}
      </div>

      {errorMsg && (
        <div role="alert" className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-xs font-bold leading-snug">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* БЛОК СОГЛАСИЙ */}
      <div className="mt-2 bg-white/5 p-5 rounded-2xl border border-white/10">
        
        <div className="mb-4">
          <p className="text-xs font-black text-white uppercase tracking-widest">
            При бронировании вы соглашаетесь с:
          </p>
          <p className="text-[12px] text-amber-400/90 mt-1.5 flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse" />
            Пожалуйста, поставьте отметку для согласия
          </p>
        </div>
        
        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-0.5 shrink-0">
              <input type="checkbox" {...register('agreedOffer')} className="peer sr-only" />
              <div className="w-5 h-5 border-2 border-slate-400 rounded-md flex items-center justify-center bg-slate-900 peer-checked:bg-teal-500 peer-checked:border-teal-500 transition-all shadow-sm">
                <CheckCircle size={14} className="text-slate-900 opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} />
              </div>
            </div>
            <span className="text-sm text-white leading-snug">
              <a href="/offer" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300 underline underline-offset-4 decoration-teal-500/40 transition-colors">Публичной офертой оказания услуг</a>
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-0.5 shrink-0">
              <input type="checkbox" {...register('agreedPrivacy')} className="peer sr-only" />
              <div className="w-5 h-5 border-2 border-slate-400 rounded-md flex items-center justify-center bg-slate-900 peer-checked:bg-teal-500 peer-checked:border-teal-500 transition-all shadow-sm">
                <CheckCircle size={14} className="text-slate-950 opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} />
              </div>
            </div>
            <span className="text-sm text-white leading-snug">
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300 underline underline-offset-4 decoration-teal-500/40 transition-colors">Политикой обработки персональных данных</a>
            </span>
          </label>

          {showSpecificRules && (
            <label className="flex items-start gap-3 cursor-pointer group animate-in fade-in slide-in-from-left-2">
              <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                <input type="checkbox" {...register('agreedRules', { required: true })} className="peer sr-only" />
                <div className="w-5 h-5 border-2 border-slate-400 rounded-md flex items-center justify-center bg-slate-900 peer-checked:bg-teal-500 peer-checked:border-teal-500 transition-all shadow-sm">
                  <CheckCircle size={14} className="text-slate-950 opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} />
                </div>
              </div>
              <span className="text-sm text-white leading-snug">
                Ознакомлен с <a href={specificRulesLink} target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300 underline underline-offset-4 decoration-teal-500/40 transition-colors">{specificRulesText}</a>
              </span>
            </label>
          )}
        </div>
      </div>

      <input type="text" {...register('website' as any)} style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />

      <button 
        type="submit" 
        disabled={isLoading || !agreedOffer || !agreedPrivacy || (showSpecificRules && !agreedRules)} 
        className="w-full py-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black uppercase tracking-wider rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4 shadow-[0_0_20px_rgba(20,184,166,0.2)]"
      >
        {isLoading ? (
          <Loader2 className="animate-spin" size={20} />
        ) : (
          `Оформить за ${displayFinalPrice.toLocaleString()} ${tour.currency ?? 'RUB'}`
        )}
      </button>

    </form>
  );
}