"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, CheckCircle, Loader2, Phone, User, 
  MessageSquare, Calendar, Minus, Plus, 
  AlertCircle, Users, LifeBuoy, CalendarDays,
  CreditCard, Banknote, Globe, QrCode, Tag, Mail
} from 'lucide-react';
import { Tour } from '@/features/tours/types';
import { createBookingAction, type BookingInput, type GuestInput } from '@/features/tours/actions/createBooking';
import { getMyProfileAction } from '@/features/account/actions/getProfile';
import { SuccessScreen } from './SuccessScreen';
import { validatePromoCodeAction } from '@/features/tours/actions/validatePromo'; 

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tour: Tour;
  initialDate?: string;
  initialDateId?: string;
}

const JACKET_SIZES = ['Детский', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL-5XL'];

type DropdownDateInfo = {
  id?: string;
  start?: string | Date;
  date?: string | Date;
  time?: string | null;
};

const formatDateForDropdown = (d: DropdownDateInfo) => {
  const dateVal = d.start || d.date;
  if (!dateVal) return '';
  const dateObj = new Date(dateVal);
  const str = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  return `${str}${d.time ? ` в ${d.time}` : ''}`;
};

export interface GuestDetails {
  name: string;
  phone?: string;
  age?: string;
  jacket: string;
}

export default function BookingModal({ 
  isOpen, 
  onClose, 
  tour, 
  initialDate, 
  initialDateId 
}: BookingModalProps) {
  
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

 const [paymentMethod, setPaymentMethod] = useState<'biletpmr' | 'qr' | 'cash' | 'foreign' | 'online_card'>('biletpmr');


interface BookingFormData {
  name: string;
  phone: string;
  social: string;
  comment: string;
  website: string;
}

const [formData, setFormData] = useState<BookingFormData>({
  name: '',
  phone: '+373 ',
  social: '',
  comment: '',
  website: ''
});

  const [successData, setSuccessData] = useState<{
    bookingId: string;
    shortId: number;
    totalPrice: number;
    biletpmrLink?: string | null;
    apbQrLink?: string | null;
    apbQrImage?: string | null;
    paymentMethod: string;
  } | null>(null);

  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  const [selectedDateId, setSelectedDateId] = useState<string | null>(null);

  const [tickets, setTickets] = useState({ adult: 1, child: 0, member: 0, family: 0 });
  const [guestData, setGuestData] = useState<Record<string, GuestDetails>>({});

  // ✅ НОВОЕ: Стейт авторизации
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [balance, setBalance] = useState<number>(0);
  const [useBonuses, setUseBonuses] = useState<boolean>(false);
  
  const [promoCode, setPromoCode] = useState<string>('');
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [promoType, setPromoType] = useState<string>('fixed');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<boolean>(false);
  const [isCheckingPromo, setIsCheckingPromo] = useState<boolean>(false);

  // ✅ НОВЫЕ СТЕЙТЫ ДЛЯ КАЯКИНГА
  const [hasChildUnder7, setHasChildUnder7] = useState<boolean>(false);
  const [hasDog, setHasDog] = useState<boolean>(false);

  const isWaterTour = ['sup', 'kayaking', 'kayak', 'water', 'rafting'].includes(
    tour.category?.slug?.toLowerCase() || ''
  );

  // ✅ ПРОВЕРКА ИМЕННО НА БАЙДАРКИ
  const isKayakingTour = ['kayaking', 'kayak'].includes(
    tour.category?.slug?.toLowerCase() || ''
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      if (initialDate && initialDateId) {
         setSelectedDateStr(initialDate);
         setSelectedDateId(initialDateId);
      } else if (tour.dates && tour.dates.length > 0) {
         setSelectedDateId(tour.dates[0].id || null);
         setSelectedDateStr(formatDateForDropdown(tour.dates[0]));
      } else {
         setSelectedDateStr('Открытая дата (по согласованию)');
         setSelectedDateId(null);
      }

      getMyProfileAction().then((profile) => {
        if (!profile) {
          setIsLoggedIn(false);
          return;
        }

        setIsLoggedIn(true);
        setFormData((prev) => ({
          ...prev,
          name: profile.name || prev.name,
          phone: profile.phone || prev.phone,
          social: profile.email || profile.telegram || profile.instagram || prev.social,
        }));

        setBalance(profile.balance || 0);

        setGuestData((prev) => {
          const firstGuest = prev['adult_0'] || { name: '', jacket: '' }; 
          return {
            ...prev,
            'adult_0': {
              ...firstGuest,
              name: profile.name || firstGuest.name || '',
              jacket: profile.lifeJacketSize || firstGuest.jacket || '', 
            },
          };
        });
      });
      
    } else {
      document.body.style.overflow = '';
      const timer = setTimeout(() => {
        setStep('form'); 
        setErrorMsg(null);
        setFormData({ name: '', phone: '+373 ', social: '', comment: '', website: '' });
        setTickets({ adult: 1, child: 0, member: 0, family: 0 });
        setGuestData({});
        setPaymentMethod('biletpmr'); 
        setUseBonuses(false);
        setPromoCode('');
        setIsLoggedIn(false);
        // ✅ СБРАСЫВАЕМ ГАЛОЧКИ
        setHasChildUnder7(false);
        setHasDog(false);
      }, 300);
      return () => clearTimeout(timer);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, initialDate, initialDateId, tour]);

  const expectedGuests = useMemo(() => {
    const list = [];
    for(let i=0; i<tickets.adult; i++) list.push({ type: 'Взрослый', id: `adult_${i}` });
    for(let i=0; i<tickets.member; i++) list.push({ type: 'Клубный', id: `member_${i}` });
    for(let i=0; i<tickets.child; i++) list.push({ type: 'Детский', id: `child_${i}` });
    for(let i=0; i<tickets.family; i++) {
       list.push({ type: 'Семейный (Взр)', id: `fam_a1_${i}` });
       list.push({ type: 'Семейный (Взр)', id: `fam_a2_${i}` });
       list.push({ type: 'Семейный (Дет)', id: `fam_c_${i}` });
    }
    return list;
  }, [tickets]);

  const baseTotalPrice = useMemo(() => {
    let sum = tickets.adult * tour.price;
    if (tour.priceChild) sum += tickets.child * tour.priceChild;
    if (tour.priceMember) sum += tickets.member * tour.priceMember;
    if (tour.priceFamily) sum += tickets.family * tour.priceFamily;
    return sum;
  }, [tickets, tour]);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setIsCheckingPromo(true);
    setPromoError(null);
    setPromoSuccess(false);
    setPromoDiscount(0);

    try {
      const res = await validatePromoCodeAction(promoCode);
      if (res.success) {
        setPromoSuccess(true);
        setPromoDiscount(res.discount!);
        setPromoType(res.type!);
      } else {
        setPromoError(res.error || 'Ошибка проверки кода');
      }
    } catch (e) {
      setPromoError('Ошибка соединения');
    } finally {
      setIsCheckingPromo(false);
    }
  };

  // Визуальный пересчет (для отображения клиенту)
  const maxBonusDiscount = Math.floor(baseTotalPrice * 0.1);
  const availableBonusesToUse = Math.min(balance, maxBonusDiscount);
  
  let appliedDiscount = 0;
  if (isLoggedIn && useBonuses && balance > 0) {
    appliedDiscount = availableBonusesToUse;
  } else if (!isLoggedIn && promoSuccess) {
    appliedDiscount = promoType === 'percent' 
      ? Math.floor(baseTotalPrice * (promoDiscount / 100)) 
      : promoDiscount;
  }
  const displayFinalPrice = Math.max(0, baseTotalPrice - appliedDiscount);

  const getSmartPlaceholder = () => {
    const categorySlug = tour.category?.slug;
    if (categorySlug === 'water' || categorySlug === 'kayaking' || categorySlug === 'sup') {
      return 'Есть ли особенности, о которых нам нужно знать?';
    }
    if (categorySlug === 'abroad' || tour.location?.toLowerCase().includes('румыния')) {
      return 'Какое снаряжение вам нужно? Есть ли у Вас действующий биометрический паспорт?';
    }
    if (categorySlug === 'kids') {
      return 'Укажите возраст детей, если они едут с вами...';
    }
    return 'Задайте вопрос и мы постараемся ответить на него в короткие сроки?';
  };

  const handleInputResize = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = 'auto'; 
    target.style.height = `${target.scrollHeight}px`;
  };

  const handleGuestChange = (id: string, field: keyof GuestDetails, value: string) => {
    setGuestData(prev => ({ 
      ...prev, 
      [id]: { 
        ...prev[id], 
        [field]: value 
      } as GuestDetails
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const payloadGuests: GuestInput[] = expectedGuests.map((g, index) => {
    if (index === 0) {
        return {
            isMain: true,
            type: g.type,
            name: formData.name.trim(), 
            phone: formData.phone.trim(),
            jacket: guestData[g.id]?.jacket || ''
        };
    }
    return {
        isMain: false,
        type: g.type,
        name: guestData[g.id]?.name?.trim() || '',
        phone: guestData[g.id]?.phone?.trim() || undefined,
        age: guestData[g.id]?.age?.trim() || undefined,
        jacket: guestData[g.id]?.jacket || ''
    };
});

try {
    // Явно указываем тип аргумента для дополнительной проверки (опционально)
    const bookingPayload: BookingInput = {
        tourId:        String(tour.id),
        tourDateId:    selectedDateId || undefined, 
        tourTitle:     tour.title,
        tourDate:      selectedDateStr,
        name:          formData.name.trim(),
        phone:         formData.phone.trim(),
        social:        formData.social.trim() || undefined,
        comment:       formData.comment.trim() || undefined,
        website:       formData.website, 
        ticketsAdult:  tickets.adult,
        ticketsChild:  tickets.child,
        ticketsMember: tickets.member,
        ticketsFamily: tickets.family, 
        guests:        payloadGuests, 
        currency:      tour.currency ?? 'RUB',
        paymentMethod: paymentMethod, 
        useBonuses:    isLoggedIn ? useBonuses : false,
        promoCode:     !isLoggedIn && promoCode.trim() ? promoCode.trim() : undefined,
        hasChildUnder7, 
        hasDog,         
    };

    const result = await createBookingAction(bookingPayload);

if (result.success) {
        if (result.redirectUrl) {
            window.location.href = result.redirectUrl;
            return;
        }
        setSuccessData({
            bookingId: result.bookingId,
            shortId: result.shortId,
            totalPrice: result.totalPrice,
            biletpmrLink: result.biletpmrLink,
            apbQrLink: result.apbQrLink,
            apbQrImage: result.apbQrImage,
            paymentMethod: paymentMethod
        });
        setStep('success');
    } else {
        if ('fields' in result && result.fields && Object.keys(result.fields).length > 0) {
            const issues = Object.values(result.fields).join(' | ');
            setErrorMsg(`Ошибка в полях: ${issues}`);
        } else {
            setErrorMsg(result.error || 'Произошла ошибка при бронировании. Попробуйте позже.');
        }
    }
} catch {
    setErrorMsg('Ошибка соединения. Проверьте интернет и попробуйте снова.');
} finally {
    setIsLoading(false);
}
}
  const Counter = ({ 
    label, 
    price, 
    value, 
    type 
  }: { 
    label: string, 
    price: number, 
    value: number, 
    type: 'adult'|'child'|'member'|'family' 
  }) => (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div>
        <div className="text-sm font-bold text-white">{label}</div>
        <div className="text-xs text-slate-300">{price} {tour.currency}</div>
      </div>
      <div className="flex items-center gap-3 bg-slate-950 rounded-lg p-1 border border-white/10">
        <button 
          type="button" 
          onClick={() => setTickets(prev => ({ ...prev, [type]: Math.max(type === 'adult' ? 1 : 0, prev[type] - 1) }))} 
          className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
        >
          <Minus size={16} />
        </button>
        <span className="text-sm font-bold text-white w-4 text-center">{value}</span>
        <button 
          type="button" 
          onClick={() => setTickets(prev => ({ ...prev, [type]: prev[type] + 1 }))} 
          className="w-8 h-8 flex items-center justify-center text-teal-500 hover:bg-teal-500/20 rounded-md transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <>
      <div 
        onClick={onClose} 
        className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200" 
      />

      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 pointer-events-none">
        <div 
          role="dialog" 
          aria-modal="true" 
          className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl pointer-events-auto overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 slide-in-from-bottom-8 duration-300"
        >
          
          <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/5 shrink-0">
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wide leading-none mb-1">
                {step === 'form' ? 'Оформление билета' : 'Успешно!'}
              </h3>
              <p className="text-xs text-teal-400 font-bold truncate max-w-[250px]">
                {tour.title}
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar">
            {step === 'form' ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                <input 
                  type="text" 
                  name="website" 
                  style={{ display: 'none' }} 
                  tabIndex={-1} 
                  value={formData.website} 
                  onChange={(e) => setFormData({...formData, website: e.target.value})} 
                />

                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5">
                     <Calendar size={12} /> Дата и время
                   </label>
                   
                   {initialDate && initialDateId ? (
                      <div className="w-full bg-slate-950/50 border border-teal-500/30 rounded-xl px-4 py-3 text-teal-400 font-bold">
                        {initialDate}
                      </div>
                   ) : (
                      tour.dates && tour.dates.length > 0 ? (
                        <div className="relative">
                          <select 
                            value={selectedDateId || ''} 
                            onChange={(e) => {
                               const id = e.target.value; 
                               setSelectedDateId(id);
                               const d = tour.dates?.find(x => x.id === id);
                               if (d) setSelectedDateStr(formatDateForDropdown(d));
                            }} 
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:border-teal-500 focus:outline-none cursor-pointer"
                          >
                            {tour.dates.map((d, i) => (
                              <option key={d.id || i} value={d.id || ''}>
                                {formatDateForDropdown(d)}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                            ▼
                          </div>
                        </div>
                      ) : (
                         <div className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-300">
                            {selectedDateStr}
                         </div>
                      )
                   )}
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <Counter label="Взрослый" price={tour.price} value={tickets.adult} type="adult" />
                    {tour.priceChild && tour.priceChild > 0 ? (
                      <Counter label="Детский" price={tour.priceChild} value={tickets.child} type="child" />
                    ) : null}
                    {tour.priceFamily && tour.priceFamily > 0 ? (
                      <Counter label="Семейный (2 взр. + 1 реб.)" price={tour.priceFamily} value={tickets.family} type="family" />
                    ) : null}
                    {tour.priceMember && tour.priceMember > 0 ? (
                      <Counter label="По клубной карте" price={tour.priceMember} value={tickets.member} type="member" />
                    ) : null}
                    
                    {/* ✅ НОВАЯ ЛОГИКА: Разделение по авторизации */}
                    {isLoggedIn ? (
                      <div className="pt-3 mt-1 border-t border-white/10">
                        {balance > 0 ? (
                          <label className="flex items-center gap-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 cursor-pointer hover:bg-amber-500/20 transition-colors">
                            <div className="relative flex items-center justify-center">
                              <input 
                                type="checkbox" 
                                checked={useBonuses} 
                                onChange={(e) => setUseBonuses(e.target.checked)} 
                                className="peer sr-only" 
                              />
                              <div className="w-5 h-5 border-2 border-amber-500/50 rounded flex items-center justify-center bg-slate-950 peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-all">
                                <CheckCircle size={14} className="text-slate-950 opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} />
                              </div>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-amber-500">Списать бонусы</p>
                              <p className="text-[12px] text-amber-500/70 uppercase tracking-widest font-bold mt-0.5">
                                Доступно {balance} ₽ (макс. {maxBonusDiscount} ₽)
                              </p>
                            </div>
                            {useBonuses && (
                              <div className="text-sm font-black text-amber-500 shrink-0">
                                -{availableBonusesToUse} ₽
                              </div>
                            )}
                          </label>
                        ) : (
                          <div className="p-3 rounded-xl border border-white/5 bg-white/5 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold text-slate-300">Бонусная система</p>
                              <p className="text-[12px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">
                                На вашем счету пока 0 ₽
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="pt-3 mt-1 border-t border-white/10">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input 
                              type="text" 
                              placeholder="У меня есть промокод" 
                              value={promoCode} 
                              onChange={(e) => {
                                setPromoCode(e.target.value);
                                if (promoSuccess) {
                                  setPromoSuccess(false);
                                  setPromoDiscount(0);
                                }
                                setPromoError(null);
                              }} 
                              disabled={promoSuccess || isCheckingPromo}
                              className="w-full bg-slate-900 border border-white/5 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white focus:border-teal-500/50 outline-none transition-colors uppercase placeholder:normal-case placeholder:text-slate-400 disabled:opacity-50" 
                            />
                          </div>
                          {!promoSuccess ? (
                              <button
                                type="button"
                                onClick={handleApplyPromo}
                                disabled={!promoCode.trim() || isCheckingPromo}
                                className="px-4 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-teal-500/20 disabled:opacity-50 transition-colors flex items-center justify-center min-w-[100px]"
                              >
                                {isCheckingPromo ? <Loader2 size={14} className="animate-spin" /> : 'Применить'}
                              </button>
                          ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setPromoSuccess(false);
                                  setPromoCode('');
                                  setPromoDiscount(0);
                                }}
                                className="px-4 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-rose-500/20 transition-colors flex items-center justify-center min-w-[100px]"
                              >
                                Отменить
                              </button>
                          )}
                        </div>
                        {promoError && (
                          <p className="text-[12px] text-rose-400 mt-1.5 ml-1 font-bold">
                            {promoError}
                          </p>
                        )}
                        {promoSuccess && (
                          <p className="text-[12px] text-teal-400 mt-1.5 ml-1 font-bold">
                            ✅ Код применен! Скидка: {promoType === 'percent' ? `${promoDiscount}%` : `${promoDiscount} ${tour.currency}`}
                          </p>
                        )}
                      </div>
                    )}

                   <div className="flex items-center justify-between pt-3 mt-1 border-t border-white/10">
                       <span className="text-xs font-bold text-slate-300 uppercase">Итого к оплате:</span>
                       <div className="text-right flex items-center gap-2 justify-end">
                         {((isLoggedIn && useBonuses) || (!isLoggedIn && promoSuccess)) && (
                           <div className="text-[12px] text-slate-300 line-through font-bold uppercase tracking-widest">
                             {baseTotalPrice.toLocaleString()} {tour.currency}
                           </div>
                         )}
                         <span className="text-xl font-black text-teal-400">
                           {displayFinalPrice.toLocaleString()} {tour.currency}
                         </span>
                       </div>
                    </div>
                </div>

                <div className="space-y-4 pt-2">
                    <label className="text-xs font-bold text-slate-300 uppercase ml-1 flex items-center gap-1.5 border-b border-white/5 pb-2">
                        <Users size={14} className="text-teal-500" /> Данные участников ({expectedGuests.length})
                    </label>

                    {expectedGuests.map((guest, index) => {
                        const isChild = guest.type.includes('Дет');

                        return (
                          <div key={guest.id} className="bg-slate-950/50 border border-white/10 rounded-xl p-4 space-y-3">
                              <div className="flex justify-between items-center mb-1">
                                 <span className="text-[12px] font-black uppercase text-teal-500 tracking-widest">
                                   Участник {index + 1} {index === 0 && '(Вы)'}
                                 </span>
                                 <span className="text-[12px] text-slate-300 font-bold uppercase">
                                   {guest.type}
                                 </span>
                              </div>

                              {index === 0 ? (
                                  <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="relative">
                                           <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"/>
                                           <input 
                                             required 
                                             type="text" 
                                             placeholder="Имя Фамилия" 
                                             value={formData.name} 
                                             onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                             className="w-full bg-slate-900 border border-white/5 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white focus:border-teal-500/50 outline-none transition-colors" 
                                           />
                                        </div>
                                        <div className="relative">
                                           <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"/>
                                           <input 
                                             required 
                                             type="tel" 
                                             value={formData.phone} 
                                             onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                                             className="w-full bg-slate-900 border border-white/5 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white focus:border-teal-500/50 outline-none transition-colors" 
                                           />
                                        </div>
                                    </div>
                                    {/* ✅ НОВОЕ ПОЛЕ: Email/Telegram для получения билета */}
                                    <div className="relative mt-3">
                                       <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"/>
                                       <input 
                                         required
                                         type="text" 
                                         placeholder="Email или Telegram (Сюда придет билет)" 
                                         value={formData.social} 
                                         onChange={(e) => setFormData({...formData, social: e.target.value})} 
                                         className="w-full bg-slate-900 border border-white/5 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white focus:border-teal-500/50 outline-none transition-colors" 
                                       />
                                    </div>
                                  </>
                              ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div className="relative">
                                         <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"/>
                                         <input 
                                           required 
                                           type="text" 
                                           placeholder="Имя Фамилия" 
                                           value={guestData[guest.id]?.name || ''} 
                                           onChange={(e) => handleGuestChange(guest.id, 'name', e.target.value)} 
                                           className="w-full bg-slate-900 border border-white/5 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white focus:border-teal-500/50 outline-none transition-colors" 
                                         />
                                      </div>

                                      {isChild ? (
                                          <div className="relative">
                                            <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"/>
                                            <input 
                                              required 
                                              type="number" 
                                              min="1"
                                              max="17"
                                              placeholder="Возраст" 
                                              value={guestData[guest.id]?.age || ''} 
                                              onChange={(e) => handleGuestChange(guest.id, 'age', e.target.value)} 
                                              className="w-full bg-slate-900 border border-white/5 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white focus:border-teal-500/50 outline-none transition-colors" 
                                            />
                                          </div>
                                      ) : (
                                          <div className="relative">
                                            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"/>
                                            <input 
                                              type="tel" 
                                              placeholder="Телефон" 
                                              value={guestData[guest.id]?.phone || ''} 
                                              onChange={(e) => handleGuestChange(guest.id, 'phone', e.target.value)} 
                                              className="w-full bg-slate-900 border border-white/5 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white focus:border-teal-500/50 outline-none transition-colors" 
                                            />
                                          </div>
                                      )}
                                  </div>
                              )}

                              {isWaterTour && (
                                  <div className="relative mt-3">
                                      <LifeBuoy size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"/>
                                      <select 
                                        required 
                                        value={guestData[guest.id]?.jacket || ''} 
                                        onChange={(e) => handleGuestChange(guest.id, 'jacket', e.target.value)} 
                                        className="w-full bg-slate-900 border border-white/5 rounded-lg py-2.5 pl-9 pr-3 text-sm text-slate-300 focus:border-teal-500/50 outline-none transition-colors appearance-none cursor-pointer"
                                      >
                                          <option value="" disabled>Размер спасжилета...</option>
                                          {JACKET_SIZES.map(size => (
                                            <option key={size} value={size}>{size}</option>
                                          ))}
                                      </select>
                                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 text-xs">
                                        ▼
                                      </div>
                                  </div>
                              )}
                          </div>
                        );
                    })}

                  {/* ✅ НОВЫЕ ЧЕКБОКСЫ ДЛЯ БАЙДАРОК */}
                    {isKayakingTour && (
                      <div className="space-y-3 pt-4 border-t border-white/5">
                        <label className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-slate-950/50 cursor-pointer hover:bg-white/5 transition-colors">
                          <div className="relative flex items-center justify-center">
                            <input 
                              type="checkbox" 
                              checked={hasChildUnder7} 
                              onChange={(e) => setHasChildUnder7(e.target.checked)} 
                              className="peer sr-only" 
                            />
                            <div className="w-5 h-5 border-2 border-slate-600 rounded flex items-center justify-center bg-slate-900 peer-checked:bg-teal-500 peer-checked:border-teal-500 transition-all">
                              <CheckCircle size={14} className="text-slate-900 opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} />
                            </div>
                          </div>
                          <div className="flex-1 text-sm font-bold text-slate-300">
                            С нами будет ребенок до 7 лет 👶
                          </div>
                        </label>

                        <label className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-slate-950/50 cursor-pointer hover:bg-white/5 transition-colors">
                          <div className="relative flex items-center justify-center">
                            <input 
                              type="checkbox" 
                              checked={hasDog} 
                              onChange={(e) => setHasDog(e.target.checked)} 
                              className="peer sr-only" 
                            />
                            <div className="w-5 h-5 border-2 border-slate-600 rounded flex items-center justify-center bg-slate-900 peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-all">
                              <CheckCircle size={14} className="text-slate-900 opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} />
                            </div>
                          </div>
                          <div className="flex-1 text-sm font-bold text-slate-300">
                            Будем с собакой 🐶
                          </div>
                        </label>
                      </div>
                    )}

                    <div className="space-y-1.5 pt-4">
                      <label className="text-xs font-bold text-slate-300 uppercase ml-1 flex items-center gap-1.5">
                        <MessageSquare size={12} /> Комментарий / Пожелания
                      </label>
                      <textarea 
                        rows={1} 
                        placeholder={getSmartPlaceholder()} 
                        value={formData.comment}
                        onChange={(e) => setFormData({...formData, comment: e.target.value})}
                        onInput={handleInputResize}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50 transition-all resize-none min-h-[50px]"
                      />
                    </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-xs font-bold text-slate-300 uppercase ml-1 flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <CreditCard size={14} className="text-teal-500" /> Способ оплаты
                  </label>
                  
                  <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Выберите способ оплаты">
                    <button 
                      type="button"
                      role="radio"
                      aria-checked={paymentMethod === 'biletpmr'}
                      onClick={() => setPaymentMethod('biletpmr')} 
                      className={`relative p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 text-left ${paymentMethod === 'biletpmr' ? 'bg-teal-500/10 border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.1)]' : 'bg-slate-900 border-white/5 hover:border-white/20'}`}
                    >
                        <div className="flex items-center justify-between w-full">
                            <span className={`text-sm font-bold ${paymentMethod === 'biletpmr' ? 'text-teal-400' : 'text-slate-300'}`}>BILETPMR</span>
                            <CreditCard size={16} className={paymentMethod === 'biletpmr' ? 'text-teal-500' : 'text-slate-300'} />
                        </div>
                        <span className="text-[12px] text-slate-300 leading-tight">BILETPMR/другой сервис</span>
                    </button>

                    <button 
                      type="button"
                      role="radio"
                      aria-checked={paymentMethod === 'qr'}
                      onClick={() => setPaymentMethod('qr')} 
                      className={`relative p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 text-left ${paymentMethod === 'qr' ? 'bg-teal-500/10 border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.1)]' : 'bg-slate-900 border-white/5 hover:border-white/20'}`}
                    >
                        <div className="flex items-center justify-between w-full">
                            <span className={`text-sm font-bold ${paymentMethod === 'qr' ? 'text-teal-400' : 'text-slate-300'}`}>QR-код</span>
                            <QrCode size={16} className={paymentMethod === 'qr' ? 'text-teal-500' : 'text-slate-300'} />
                        </div>
                        <span className="text-[12px] text-slate-300 leading-tight"> Система КЛЕВЕР/Наш совет</span>
                    </button>

                   <button 
                      type="button"
                      role="radio"
                      aria-checked={paymentMethod === 'cash'}
                      onClick={() => setPaymentMethod('cash')} 
                      className={`relative p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 text-left ${paymentMethod === 'cash' ? 'bg-teal-500/10 border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.1)]' : 'bg-slate-900 border-white/5 hover:border-white/20'}`}
                    >
                        <div className="flex items-center justify-between w-full">
                            <span className={`text-sm font-bold ${paymentMethod === 'cash' ? 'text-teal-400' : 'text-slate-300'}`}>Наличными</span>
                            <Banknote size={16} className={paymentMethod === 'cash' ? 'text-teal-500' : 'text-slate-300'} />
                        </div>
                        <span className="text-[12px] text-slate-300 leading-tight">Оплата гиду на месте</span>
                    </button>

                    {/* ✅ НОВОЕ: онлайн-оплата через АПБ */}
                    <button 
                      type="button"
                      role="radio"
                      aria-checked={paymentMethod === 'online_card'}
                      onClick={() => setPaymentMethod('online_card')} 
                      className={`relative p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 text-left ${paymentMethod === 'online_card' ? 'bg-teal-500/10 border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.1)]' : 'bg-slate-900 border-white/5 hover:border-white/20'}`}
                    >
                        <div className="flex items-center justify-between w-full">
                            <span className={`text-sm font-bold ${paymentMethod === 'online_card' ? 'text-teal-400' : 'text-slate-300'}`}>Онлайн</span>
                            <CreditCard size={16} className={paymentMethod === 'online_card' ? 'text-teal-500' : 'text-slate-300'} />
                        </div>
                        <span className="text-[12px] text-slate-300 leading-tight">Картой Клевер / АПБ</span>
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-xs font-bold leading-snug">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full py-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 font-black uppercase tracking-wider rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4 shadow-[0_0_20px_rgba(20,184,166,0.2)] hover:shadow-[0_0_30px_rgba(20,184,166,0.4)]"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    `Оформить за ${displayFinalPrice.toLocaleString()} ${tour.currency}`
                  )}
                </button>
                
                <p className="text-sm text-slate-300 text-center leading-tight">
                  Нажимая кнопку, вы соглашаетесь с обработкой персональных данных.
                </p>

              </form>
         ) : successData ? (
               <SuccessScreen
                 bookingId={successData.bookingId} 
                 shortId={successData.shortId}
                 totalPrice={successData.totalPrice} 
                 currency={tour.currency ?? 'RUB'}
                 phone={formData.phone}
                 biletpmrLink={successData.biletpmrLink}
                 apbQrLink={successData.apbQrLink}
                 apbQrImage={successData.apbQrImage}
                 paymentMethod={successData.paymentMethod}
                 onClose={onClose}
               />
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}