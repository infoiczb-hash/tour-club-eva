"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, CheckCircle, Loader2, Phone, User, 
  MessageSquare, Calendar, Minus, Plus, 
  AlertCircle, Users, LifeBuoy 
} from 'lucide-react';
import { Tour } from '@/features/tours/types';
import { createBookingAction } from '@/features/tours/actions/createBooking';
import { getMyProfileAction } from '@/features/account/actions/getProfile';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tour: Tour;
  initialDate?: string;
  initialDateId?: string;
}

const JACKET_SIZES = ['Детский', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL-5XL'];

const formatDateForDropdown = (d: any) => {
  const dateVal = d.start || d.date;
  if (!dateVal) return '';
  const dateObj = new Date(dateVal);
  const str = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  return `${str}${d.time ? ` в ${d.time}` : ''}`;
};

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

  const [formData, setFormData] = useState({
    name: '',
    phone: '+373 ',
    social: '', 
    comment: '',
    website: '' 
  });

  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  const [selectedDateId, setSelectedDateId] = useState<string | null>(null);

  const [tickets, setTickets] = useState({ 
    adult: 1, 
    child: 0, 
    member: 0, 
    family: 0 
  });
  
  // Хранилище данных для каждого конкретного гостя
  const [guestData, setGuestData] = useState<Record<string, {name: string, jacket: string}>>({});

  const isWaterTour = ['sup', 'kayaking', 'kayak', 'water'].includes(
    tour.category?.slug?.toLowerCase() || ''
  );

  // 1. Инициализация (Фикс бага с пустой датой) + Профиль
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      // Инициализируем дату сразу
      if (initialDate && initialDateId) {
         setSelectedDateStr(initialDate);
         setSelectedDateId(initialDateId);
      } else if (tour.dates && tour.dates.length > 0) {
         setSelectedDateId(tour.dates[0].id || null);
         setSelectedDateStr(formatDateForDropdown(tour.dates[0]));
      } else if (tour.date) {
         setSelectedDateStr(new Date(tour.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }));
      }

      // Подтягиваем профиль (Включая соцсети для админки)
      getMyProfileAction().then(profile => {
        if (profile) {
          setFormData(prev => ({
            ...prev,
            name: profile.name || prev.name,
            phone: profile.phone || prev.phone,
            social: profile.telegram || profile.instagram || profile.email || prev.social
          }));
        }
      });
    } else {
      document.body.style.overflow = '';
      const timer = setTimeout(() => {
        setStep('form'); 
        setErrorMsg(null);
        setFormData({ name: '', phone: '+373 ', social: '', comment: '', website: '' });
        setTickets({ adult: 1, child: 0, member: 0, family: 0 });
        setGuestData({});
      }, 300);
      return () => clearTimeout(timer);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, initialDate, initialDateId, tour]);

  // 2. Генерация списка ожидаемых гостей
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

  // Расчет итоговой цены
  const totalPrice = useMemo(() => {
    let sum = tickets.adult * tour.price;
    if (tour.priceChild) sum += tickets.child * tour.priceChild;
    if (tour.priceMember) sum += tickets.member * tour.priceMember;
    if (tour.priceFamily) sum += tickets.family * tour.priceFamily;
    return sum;
  }, [tickets, tour]);

  // 3. Восстановленный умный плейсхолдер
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

  const handleGuestChange = (id: string, field: string, value: string) => {
    setGuestData(prev => ({ 
      ...prev, 
      [id]: { ...prev[id], [field]: value } 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    // Собираем массив гостей для базы
    const payloadGuests = expectedGuests.map((g, index) => {
        if (index === 0) {
            return {
                isMain: true,
                type: g.type,
                name: formData.name.trim(), // Главный заказчик
                phone: formData.phone.trim(),
                jacket: guestData[g.id]?.jacket || ''
            };
        }
        return {
            isMain: false,
            type: g.type,
            name: guestData[g.id]?.name?.trim() || '',
            jacket: guestData[g.id]?.jacket || ''
        };
    });

    try {
      const result = await createBookingAction({
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
        guests:        payloadGuests, // Отправляем массив
        totalPrice,
        currency:      tour.currency ?? 'MDL',
      });

      if (result.success) {
        setStep('success');
      } else {
        // Умный вывод ошибок Zod
        if (result.fields && Object.keys(result.fields).length > 0) {
            const issues = Object.values(result.fields).join(' | ');
            setErrorMsg(`Исправьте ошибки: ${issues}`);
        } else {
            setErrorMsg(result.error ?? 'Что-то пошло не так. Попробуйте ещё раз.');
        }
      }
    } catch {
      setErrorMsg('Ошибка соединения. Проверьте интернет и попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
  };

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
        <div className="text-xs text-slate-400">{price} {tour.currency}</div>
      </div>
      <div className="flex items-center gap-3 bg-slate-950 rounded-lg p-1 border border-white/10">
        <button 
          type="button" 
          onClick={() => setTickets(prev => ({ ...prev, [type]: Math.max(type === 'adult' ? 1 : 0, prev[type] - 1) }))} 
          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
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
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar">
            {step === 'form' ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Honeypot поле для ботов */}
                <input 
                  type="text" 
                  name="website" 
                  style={{ display: 'none' }} 
                  tabIndex={-1} 
                  value={formData.website} 
                  onChange={(e) => setFormData({...formData, website: e.target.value})} 
                />

                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
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
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                            ▼
                          </div>
                        </div>
                      ) : (
                         <div className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-300">
                            {new Date(tour.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                         </div>
                      )
                   )}
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <Counter 
                      label="Взрослый" 
                      price={tour.price} 
                      value={tickets.adult} 
                      type="adult" 
                    />
                    
                    {tour.priceChild && tour.priceChild > 0 ? (
                      <Counter 
                        label="Детский" 
                        price={tour.priceChild} 
                        value={tickets.child} 
                        type="child" 
                      />
                    ) : null}
                    
                    {tour.priceFamily && tour.priceFamily > 0 ? (
                      <Counter 
                        label="Семейный (2 взр. + 1 реб.)" 
                        price={tour.priceFamily} 
                        value={tickets.family} 
                        type="family" 
                      />
                    ) : null}
                    
                    {tour.priceMember && tour.priceMember > 0 ? (
                      <Counter 
                        label="По клубной карте" 
                        price={tour.priceMember} 
                        value={tickets.member} 
                        type="member" 
                      />
                    ) : null}
                    
                    <div className="flex items-center justify-between pt-3 mt-1 border-t border-white/10">
                       <span className="text-xs font-bold text-slate-400 uppercase">Итого к оплате:</span>
                       <span className="text-xl font-black text-teal-400">
                         {totalPrice.toLocaleString()} {tour.currency}
                       </span>
                    </div>
                </div>

                {/* ДИНАМИЧЕСКИЙ СПИСОК ГОСТЕЙ */}
                <div className="space-y-4 pt-2">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1 flex items-center gap-1.5 border-b border-white/5 pb-2">
                        <Users size={14} className="text-teal-500" /> Данные участников ({expectedGuests.length})
                    </label>

                    {expectedGuests.map((guest, index) => (
                        <div key={guest.id} className="bg-slate-950/50 border border-white/10 rounded-xl p-4 space-y-3">
                            <div className="flex justify-between items-center mb-1">
                               <span className="text-[10px] font-black uppercase text-teal-500 tracking-widest">
                                 Участник {index + 1} {index === 0 && '(Вы)'}
                               </span>
                               <span className="text-[10px] text-slate-500 font-bold uppercase">
                                 {guest.type}
                               </span>
                            </div>

                            {index === 0 ? (
                                // Заказчик (Участник 1)
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="relative">
                                       <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
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
                                       <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                                       <input 
                                         required 
                                         type="tel" 
                                         value={formData.phone} 
                                         onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                                         className="w-full bg-slate-900 border border-white/5 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white focus:border-teal-500/50 outline-none transition-colors" 
                                       />
                                    </div>
                                </div>
                            ) : (
                                // Дополнительные участники
                                <div>
                                    <div className="relative">
                                       <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                                       <input 
                                         required 
                                         type="text" 
                                         placeholder="Имя участника" 
                                         value={guestData[guest.id]?.name || ''} 
                                         onChange={(e) => handleGuestChange(guest.id, 'name', e.target.value)} 
                                         className="w-full bg-slate-900 border border-white/5 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white focus:border-teal-500/50 outline-none transition-colors" 
                                       />
                                    </div>
                                </div>
                            )}

                            {/* Выбор жилета для воды */}
                            {isWaterTour && (
                                <div className="relative">
                                    <LifeBuoy size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                                    <select 
                                      required 
                                      value={guestData[guest.id]?.jacket || ''} 
                                      onChange={(e) => handleGuestChange(guest.id, 'jacket', e.target.value)} 
                                      className="w-full bg-slate-900 border border-white/5 rounded-lg py-2.5 pl-9 pr-3 text-sm text-slate-300 focus:border-teal-500/50 outline-none transition-colors appearance-none"
                                    >
                                        <option value="" disabled>Размер спасжилета...</option>
                                        {JACKET_SIZES.map(size => (
                                          <option key={size} value={size}>{size}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    ))}

                    <div className="space-y-1.5 pt-2">
                      <label className="text-xs font-bold text-slate-400 uppercase ml-1 flex items-center gap-1.5">
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
                    `Оформить за ${totalPrice.toLocaleString()} ${tour.currency}`
                  )}
                </button>
                
                <p className="text-sm text-slate-500 text-center leading-tight">
                  Нажимая кнопку, вы соглашаетесь с обработкой персональных данных.
                </p>

              </form>
            ) : (
              <div className="flex flex-col items-center text-center py-8">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-6 border border-emerald-500/20 animate-in zoom-in duration-500">
                  <CheckCircle size={40} />
                </div>
                <h3 className="text-2xl font-black text-white uppercase mb-2">
                  Заявка принята!
                </h3>
                <p className="text-slate-400 text-sm mb-8 leading-relaxed max-w-[260px]">
                  Мы свяжемся с вами в ближайшее время по номеру <span className="text-white font-bold">{formData.phone}</span>.
                </p>
                <button 
                  onClick={onClose} 
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase tracking-wide rounded-xl transition-colors"
                >
                  Закрыть окно
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}