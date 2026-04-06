// src/components/modals/ContactHubModal.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, User, Phone, AtSign, MessageSquare, Briefcase, Heart, Star, Tent, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { submitInquiry } from '@/features/inquiries/actions';
import { InquiryInput } from '@/features/inquiries/schema';

type TabType = 'TOUR' | 'HR' | 'BLOG' | 'B2B' | 'REVIEW' | 'HELP';

const TABS: { id: TabType; label: string; icon: any }[] = [
  { id: 'TOUR', label: 'Вопрос', icon: Tent },
  { id: 'HR', label: 'В команду', icon: User },
  { id: 'REVIEW', label: 'Отзыв', icon: Star },
  { id: 'B2B', label: 'Партнерство', icon: Briefcase },
  { id: 'BLOG', label: 'Блог', icon: FileText },
  { id: 'HELP', label: 'Помощь', icon: Heart },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: TabType;
  tourContext?: string;
}

export default function ContactHubModal({ isOpen, onClose, initialTab = 'TOUR', tourContext }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [formData, setFormData] = useState<any>({});
  const honeypotRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
        setActiveTab(initialTab);
        setFormData({});
        setStatus('idle');
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, initialTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    const payload: any = {
        type: activeTab,
        name: formData.name,
        phone: formData.phone,
        social: formData.social,
        honeypot: honeypotRef.current?.value,
        ...formData
    };

    if (activeTab === 'TOUR' && tourContext) {
        payload.tourTitle = tourContext;
    }

    const res = await submitInquiry(payload as InquiryInput);

    if (res.success) {
        setStatus('success');
        setTimeout(() => onClose(), 2500);
    } else {
        alert(res.error || 'Проверьте данные'); 
        setStatus('idle');
    }
  };

  const updateField = (field: string, value: any) => {
      setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  // ✅ Функция для авто-растягивания текстовых полей
const handleInputResize = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = 'auto'; // Сбрасываем высоту, чтобы узнать реальный размер
    target.style.height = `${target.scrollHeight}px`; // Ставим высоту по контенту
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      
      <div
        role="dialog" aria-modal="true" aria-labelledby="modal-contact-title" 
        className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-t-[2rem] md:rounded-3xl shadow-2xl flex flex-col h-[90vh] md:h-auto md:max-h-[90vh] overflow-hidden relative animate-in fade-in zoom-in-95 slide-in-from-bottom-10 duration-300"
      >
        {/* Язычок для мобилки (декор) */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 mb-1 md:hidden" />

        {/* ✅ HEADER: Теперь тут только заголовок и крестик */}
        <div className="p-5 md:p-6 border-b border-white/5 bg-slate-900 z-10 shrink-0">
           <div className="flex justify-between items-center">
              <h3 id="modal-contact-title" className="text-white font-black text-2xl md:text-3xl tracking-tight">Центр связи</h3>
              <button onClick={onClose} aria-label="Закрыть" className="p-2 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20}/>
              </button>
           </div>
        </div>

        {/* BODY */}
        <div className="p-5 md:p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-900 flex flex-col">
           {status === 'success' ? (
               <div className="h-full flex flex-col items-center justify-center text-center py-10 md:py-20 my-auto">
                   <div className="w-20 h-20 bg-teal-500/20 rounded-full flex items-center justify-center text-teal-500 mb-6 border border-teal-500/30 animate-in zoom-in duration-500">
                       <CheckCircle2 size={40}/>
                   </div>
                   <h3 className="text-2xl md:text-3xl font-black text-white mb-3">Успешно!</h3>
                   <p className="text-slate-300 text-base md:text-lg">Сообщение отправлено, мы скоро с вами свяжемся.</p>
               </div>
           ) : (
               <form onSubmit={handleSubmit} className="flex flex-col h-full">
                   
                   {/* ✅ TABS: Перенесены в скроллируемую зону формы */}
                   <div className="flex flex-wrap gap-2.5 mb-6 md:mb-8">
                      {TABS.map(tab => {
                          const isActive = activeTab === tab.id;
                          return (
                              <button
                                key={tab.id}
                                type="button"
                                onClick={() => { setActiveTab(tab.id); setFormData({}); }}
                                className={clsx(
                                    "flex items-center gap-2 px-4 py-2.5 md:py-2 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wide transition-all border",
                                    isActive 
                                        ? "bg-teal-500 border-teal-500 text-slate-900 shadow-lg shadow-teal-500/20" 
                                        : "bg-slate-800/50 border-white/5 text-slate-300 hover:border-white/20 hover:text-white"
                                )}
                              >
                                  <tab.icon size={16} strokeWidth={isActive ? 2.5 : 2}/> {tab.label}
                              </button>
                          );
                      })}
                   </div>
                   
                   <div className="space-y-6 md:space-y-8 flex-1">
                       {/* Context Banner */}
                       {activeTab === 'TOUR' && tourContext && (
                           <div className="bg-teal-900/20 border border-teal-500/30 p-4 rounded-2xl flex items-center gap-3">
                               <Tent size={20} className="text-teal-400 shrink-0"/>
                               <span className="text-sm text-teal-100">Контекст заявки: <strong className="text-white font-bold">{tourContext}</strong></span>
                           </div>
                       )}

                       {/* --- COMMON FIELDS --- */}
                       <div className="space-y-4">
                           <div className="relative group">
                               <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors"/>
                               <input required placeholder="Ваше имя" 
                                   className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white text-base focus:bg-slate-900 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all" 
                                   value={formData.name || ''} onChange={e => updateField('name', e.target.value)}
                               />
                           </div>
                           
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div className="relative group">
                                   <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors"/>
                                   <input placeholder="+373..." 
                                       className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white text-base focus:bg-slate-900 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all" 
                                       value={formData.phone || ''} onChange={e => updateField('phone', e.target.value)}
                                   />
                               </div>
                               <div className="relative group">
                                   <AtSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors"/>
                                   <input placeholder="Telegram / Insta" 
                                       className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white text-base focus:bg-slate-900 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all" 
                                       value={formData.social || ''} onChange={e => updateField('social', e.target.value)}
                                   />
                               </div>
                           </div>
                           <p className="text-[12px] text-slate-300 ml-2">* Укажите хотя бы один контакт для связи</p>
                       </div>

                       {/* --- DYNAMIC FIELDS --- */}
                       
                       {/* HR */}
                       {activeTab === 'HR' && (
                           <div className="space-y-4 animate-in fade-in">
                               <select required 
                                   className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white text-base focus:bg-slate-900 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none appearance-none cursor-pointer transition-all"
                                   value={formData.role || ''} onChange={e => updateField('role', e.target.value)}
                               >
                                  <option value="" disabled>Кем вы хотите быть?</option>
                                   <option value="guide">Гид / Инструктор</option>
                                   <option value="cook">Повар</option>
                                   <option value="driver">Водитель</option>
                                   <option value="tech">Тех. ассистент</option>
                                   <option value="photo">Фотограф / Контент</option>
                                   <option value="other">Другое</option>
                               </select>
                               {/* ✅ Добавлен onInput и удален resize-none */}
                               <textarea required placeholder="Ваш опыт (где работали, навыки, хобби)" 
                                   className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white text-base min-h-[80px] overflow-hidden focus:bg-slate-900 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all"
                                   value={formData.experience || ''} 
                                   onInput={handleInputResize}
                                   onChange={e => updateField('experience', e.target.value)}
                               />
                               {/* ✅ Добавлен onInput и удален resize-none */}
                               <textarea required placeholder="Почему хотите именно к нам?" 
                                   className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white text-base min-h-[80px] overflow-hidden focus:bg-slate-900 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all"
                                   value={formData.motivation || ''} 
                                   onInput={handleInputResize}
                                   onChange={e => updateField('motivation', e.target.value)}
                               />
                           </div>
                       )}

                       {/* BLOG */}
                       {activeTab === 'BLOG' && (
                           <div className="space-y-4 animate-in fade-in">
                               <div className="flex gap-2 p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
                                   {['idea', 'text'].map(type => (
                                       <button key={type} type="button" onClick={() => updateField('format', type)} 
                                           className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-xl transition-colors ${formData.format === type ? 'bg-teal-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
                                       >
                                           {type === 'idea' ? 'Есть идея' : 'Готовый текст'}
                                       </button>
                                   ))}
                               </div>
                               <textarea required placeholder="Опишите тему или дайте ссылку на Google Docs..." 
                                   className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white text-base min-h-[100px] overflow-hidden focus:bg-slate-900 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all"
                                   value={formData.message || ''} 
                                   onInput={handleInputResize}
                                   onChange={e => updateField('message', e.target.value)}
                               />
                           </div>
                       )}

                       {/* B2B */}
                       {activeTab === 'B2B' && (
                           <div className="space-y-4 animate-in fade-in">
                               <div className="relative group">
                                   <Briefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors"/>
                                   <input placeholder="Название компании (необязательно)" 
                                       className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white text-base focus:bg-slate-900 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all"
                                       value={formData.company || ''} onChange={e => updateField('company', e.target.value)}
                                   />
                               </div>
                               <textarea required placeholder="Опишите масштаб выезда: количество человек, пожелания, примерные даты..." 
                                   className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white text-base min-h-[100px] overflow-hidden focus:bg-slate-900 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all"
                                   value={formData.message || ''} 
                                   onInput={handleInputResize}
                                   onChange={e => updateField('message', e.target.value)}
                               />
                           </div>
                       )}

                       {/* REVIEW */}
                       {activeTab === 'REVIEW' && (
                           <div className="space-y-4 animate-in fade-in">
                               <div className="flex justify-center gap-3 bg-slate-950 py-4 rounded-2xl border border-slate-800">
                                   {[1, 2, 3, 4, 5].map(star => (
                                       <button key={star} type="button" onClick={() => updateField('rating', star)} className="transition-transform hover:scale-110 p-1">
                                           <Star size={36} strokeWidth={1.5} className={formData.rating >= star ? "text-amber-400 fill-amber-400" : "text-slate-700"} />
                                       </button>
                                   ))}
                               </div>
                               <textarea required placeholder="Ваши честные впечатления о туре..." 
                                   className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white text-base min-h-[100px] overflow-hidden focus:bg-slate-900 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all"
                                   value={formData.message || ''} 
                                   onInput={handleInputResize}
                                   onChange={e => updateField('message', e.target.value)}
                               />
                           </div>
                       )}

                       {/* TOUR / HELP */}
                       {(activeTab === 'TOUR' || activeTab === 'HELP') && (
                           <div className="animate-in fade-in">
                               <textarea required 
                                   placeholder={activeTab === 'TOUR' ? "Напишите ваш вопрос который Вас интересует" : "Опишите ситуацию, с которой нужна помощь..."} 
                                   className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white text-base min-h-[100px] overflow-hidden focus:bg-slate-900 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all"
                                   value={formData.message || ''} 
                                   onInput={handleInputResize}
                                   onChange={e => updateField('message', e.target.value)}
                               />
                           </div>
                       )}
                   </div>

                   {/* Honeypot (Hidden) */}
                <input 
  ref={honeypotRef} 
  type="text" 
  name="website" 
  className="hidden" 
  tabIndex={-1} 
  aria-hidden="true" 
  autoComplete="off" 
/>

                   {/* 🔥 КНОПКА ОТПРАВКИ И ТЕЛЕГРАМ */}
                   <div className="mt-8 pt-6 border-t border-white/5 shrink-0 flex flex-col gap-4">
                       <button 
                           disabled={status === 'loading'}
                           className="w-full py-4 md:py-5 bg-teal-500 hover:bg-teal-400 text-slate-900 font-black text-base md:text-lg uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] flex items-center justify-center gap-3 active:scale-[0.98]"
                       >
                           {status === 'loading' ? <Loader2 className="animate-spin" size={24} /> : <><Send size={20}/> Отправить</>}
                       </button>
                       
                       <a 
                         href="https://t.me/romansvtirase" 
                         target="_blank" 
                         rel="noopener noreferrer" 
                         className="text-xs md:text-sm font-bold text-slate-300 hover:text-teal-400 transition-colors uppercase tracking-widest flex items-center justify-center gap-2 mb-2" 
                         aria-label="Наш Telegram"
                       >
                          <MessageSquare size={16}/> Срочно? Написать в Telegram
                       </a>
                   </div>
               </form>
           )}
        </div>

      </div>
    </div>
  );
}