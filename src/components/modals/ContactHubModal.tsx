"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, Phone, AtSign, MessageSquare, Briefcase, Heart, Star, Tent, FileText, CheckCircle2 } from 'lucide-react';
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
  initialTab?: TabType; // Можно открыть сразу на нужном табе
  tourContext?: string; // Название тура, если открыто со страницы
}

export default function ContactHubModal({ isOpen, onClose, initialTab = 'TOUR', tourContext }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  
  // Данные формы
  const [formData, setFormData] = useState<any>({});
  
  // Ref для honeypot
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

    // Собираем payload для валидации
    const payload: any = {
        type: activeTab,
        name: formData.name,
        phone: formData.phone,
        social: formData.social,
        honeypot: honeypotRef.current?.value,
        ...formData // Остальные поля
    };

    if (activeTab === 'TOUR' && tourContext) {
        payload.tourTitle = tourContext;
    }

    const res = await submitInquiry(payload as InquiryInput);

    if (res.success) {
        setStatus('success');
        setTimeout(() => onClose(), 2500);
    } else {
        alert(res.error || 'Проверьте данные'); // В реальном проекте useToast
        setStatus('idle');
    }
  };

  const updateField = (field: string, value: any) => {
      setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
          >
            {/* HEADER */}
            <div className="p-4 border-b border-white/5 bg-slate-900 z-10">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white font-bold text-lg">Центр связи</h3>
                  <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-full"><X size={18}/></button>
               </div>
               
               {/* TABS (Scrollable) */}
               <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                  {TABS.map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => { setActiveTab(tab.id); setFormData({}); }}
                        className={clsx(
                            "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all border",
                            activeTab === tab.id 
                                ? "bg-teal-500 border-teal-500 text-slate-900" 
                                : "bg-slate-800 border-white/5 text-slate-400 hover:border-white/20"
                        )}
                      >
                          <tab.icon size={14}/> {tab.label}
                      </button>
                  ))}
               </div>
            </div>

            {/* BODY */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-900">
               {status === 'success' ? (
                   <div className="h-full flex flex-col items-center justify-center text-center py-10">
                       <div className="w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center text-teal-500 mb-4 animate-in zoom-in">
                           <CheckCircle2 size={32}/>
                       </div>
                       <h3 className="text-xl font-bold text-white mb-2">Сообщение отправлено!</h3>
                       <p className="text-slate-400 text-sm">Мы уже получили его и скоро ответим.</p>
                   </div>
               ) : (
                   <form onSubmit={handleSubmit} className="space-y-5">
                       
                       {/* Context Banner */}
                       {activeTab === 'TOUR' && tourContext && (
                           <div className="bg-teal-900/20 border border-teal-500/30 p-3 rounded-xl flex items-center gap-3">
                               <Tent size={16} className="text-teal-400"/>
                               <span className="text-xs text-teal-200">Вопрос по туру: <strong className="text-white">{tourContext}</strong></span>
                           </div>
                       )}

                       {/* --- COMMON FIELDS --- */}
                       <div className="space-y-3">
                           <div className="relative">
                               <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"/>
                               <input required placeholder="Ваше имя" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:border-teal-500 outline-none" 
                                   value={formData.name || ''} onChange={e => updateField('name', e.target.value)}
                               />
                           </div>
                           <div className="grid grid-cols-2 gap-3">
                               <div className="relative">
                                   <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"/>
                                   <input placeholder="+373..." className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:border-teal-500 outline-none" 
                                       value={formData.phone || ''} onChange={e => updateField('phone', e.target.value)}
                                   />
                               </div>
                               <div className="relative">
                                   <AtSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"/>
                                   <input placeholder="Telegram / Insta" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:border-teal-500 outline-none" 
                                       value={formData.social || ''} onChange={e => updateField('social', e.target.value)}
                                   />
                               </div>
                           </div>
                           <p className="text-[14px] text-slate-500 ml-2">* Укажите хотя бы один контакт</p>
                       </div>

                       {/* --- DYNAMIC FIELDS --- */}
                       
                       {/* HR */}
                       {activeTab === 'HR' && (
                           <div className="space-y-3 animate-in fade-in">
                               <select required className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:border-teal-500 outline-none appearance-none"
                                   value={formData.role || ''} onChange={e => updateField('role', e.target.value)}
                               >
                                  <option value="" disabled>Выберите роль...</option>
                                   <option value="guide">Гид / Инструктор</option>
                                   <option value="cook">Повар</option>
                                   <option value="driver">Водитель</option>
                                   <option value="tech">Тех. ассистент</option>
                                   <option value="photo">Фотограф / Контент</option>
                                   <option value="other">Другое</option>
                               </select>
                               <textarea required placeholder="Ваш опыт (где работали, навыки)" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm h-20 resize-none focus:border-teal-500 outline-none"
                                   value={formData.experience || ''} onChange={e => updateField('experience', e.target.value)}
                               />
                               <textarea required placeholder="Почему хотите к нам?" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm h-20 resize-none focus:border-teal-500 outline-none"
                                   value={formData.motivation || ''} onChange={e => updateField('motivation', e.target.value)}
                               />
                           </div>
                       )}

                       {/* BLOG */}
                       {activeTab === 'BLOG' && (
                           <div className="space-y-3 animate-in fade-in">
                               <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                                   {['idea', 'text'].map(type => (
                                       <button key={type} type="button" onClick={() => updateField('format', type)} 
                                           className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${formData.format === type ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                       >
                                           {type === 'idea' ? 'Есть идея' : 'Готовый текст'}
                                       </button>
                                   ))}
                               </div>
                               <textarea required placeholder="Опишите тему или дайте ссылку на текст..." className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm h-32 resize-none focus:border-teal-500 outline-none"
                                   value={formData.message || ''} onChange={e => updateField('message', e.target.value)}
                               />
                           </div>
                       )}

                       {/* B2B */}
                       {activeTab === 'B2B' && (
                           <div className="space-y-3 animate-in fade-in">
                               <input placeholder="Название компании (необязательно)" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:border-teal-500 outline-none"
                                   value={formData.company || ''} onChange={e => updateField('company', e.target.value)}
                               />
                               <textarea required placeholder="Суть предложения..." className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm h-32 resize-none focus:border-teal-500 outline-none"
                                   value={formData.message || ''} onChange={e => updateField('message', e.target.value)}
                               />
                           </div>
                       )}

                       {/* REVIEW */}
                       {activeTab === 'REVIEW' && (
                           <div className="space-y-3 animate-in fade-in">
                               <div className="flex justify-center gap-2 mb-2">
                                   {[1, 2, 3, 4, 5].map(star => (
                                       <button key={star} type="button" onClick={() => updateField('rating', star)} className="transition-transform hover:scale-110">
                                           <Star size={28} className={formData.rating >= star ? "text-amber-400 fill-amber-400" : "text-slate-700"} />
                                       </button>
                                   ))}
                               </div>
                               <textarea required placeholder="Ваш отзыв..." className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm h-32 resize-none focus:border-teal-500 outline-none"
                                   value={formData.message || ''} onChange={e => updateField('message', e.target.value)}
                               />
                           </div>
                       )}

                       {/* TOUR / HELP (Simple) */}
                       {(activeTab === 'TOUR' || activeTab === 'HELP') && (
                           <div className="animate-in fade-in">
                               <textarea required placeholder={activeTab === 'TOUR' ? "Ваш вопрос..." : "Чем можете помочь?"} 
                                   className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm h-32 resize-none focus:border-teal-500 outline-none"
                                   value={formData.message || ''} onChange={e => updateField('message', e.target.value)}
                               />
                           </div>
                       )}

                       {/* Honeypot (Hidden) */}
                       <input ref={honeypotRef} type="text" name="website" className="hidden" autoComplete="off" />

                       <button 
                           disabled={status === 'loading'}
                           className="w-full py-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] flex items-center justify-center gap-2"
                       >
                           {status === 'loading' ? 'Отправка...' : <><Send size={18}/> Отправить</>}
                       </button>
                   </form>
               )}
            </div>

            {/* FOOTER */}
            <div className="p-4 border-t border-white/5 bg-slate-950/50 text-center">
               <a href="https://t.me/romansvtirase" target="_blank" className="text-xs font-bold text-slate-500 hover:text-teal-400 transition-colors uppercase tracking-wider flex items-center justify-center gap-2">
                  <MessageSquare size={14}/> Срочно? Написать в Telegram
               </a>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}