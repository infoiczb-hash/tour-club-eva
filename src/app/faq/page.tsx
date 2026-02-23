"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  ArrowLeft, ChevronDown, HelpCircle, 
  CreditCard, HeartPulse, ShieldAlert, 
  Tent, CloudSun, Wine, Users
} from 'lucide-react';
import ContactHubModal from "@/components/modals/ContactHubModal"; // Подключаем Центр связи

// --- ДАННЫЕ ---
const FAQ_ITEMS = [
  {
    id: 'booking',
    icon: <Users className="text-teal-400" size={18} />,
    question: "Как записаться и можно ли новичкам?",
    answer: (
      <div className="space-y-2 md:space-y-3">
        <p>
          Запись осуществляется через сайт, Telegram-бота, через гидов, наши социальные сети или в личном сообщении организатору. После подтверждения участия место считается забронированным за вами.
        </p>
        <p>
          <strong>Новичкам — можно!</strong> 90% наших маршрутов разработаны так, чтобы их прошел человек без спецподготовки. Сложность (Лёгкая/Средняя/Профи) всегда указана в описании конкретного тура. Поэтому учитывайте это при выборе.
        </p>
      </div>
    )
  },
  {
    id: 'payment',
    icon: <CreditCard className="text-purple-400" size={18} />,
    question: "Оплата и условия отмены (Возврат)",
    answer: (
      <div className="space-y-2 md:space-y-3">
        <p>
          Оплата возможна наличными, мобильным платежом (QR) или переводом. Для бронирования места часто требуется предоплата (она идет на бронь трансфера и жилья).
        </p>
        <div className="p-3 md:p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
          <p className="font-bold text-white mb-2 text-xs md:text-sm">🛑 Условия отмены участия:</p>
          <ul className="list-disc pl-4 space-y-1 text-slate-300">
            <li>Если вы не можете поехать, <strong>в первую очередь вы ищете себе замену</strong> (друга/знакомого).</li>
            <li>Если замена найдена — предоплата возвращается полностью.</li>
            <li>Если вы не нашли замену, мы пробуем найти человека из листа ожидания.</li>
            <li>Если замена не найдена никем — <strong>предоплата не возвращается</strong> (так как она уже потрачена на логистику).</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'health',
    icon: <HeartPulse className="text-red-400" size={18} />,
    question: "Здоровье, Аптечка и Лекарства",
    answer: (
      <div className="space-y-2 md:space-y-3">
        <p>
          У гида всегда есть <strong>базовая групповая аптечка</strong> (перевязочные, обезболивающие, антисептики).
        </p>
        <div className="p-3 border-l-2 border-red-500 bg-red-500/10 pl-3 md:pl-4">
            <p className="font-bold text-red-200 text-xs md:text-sm">Важно!</p>
            <p>
              Если у вас есть хронические заболевания, аллергии или специфика организма — <strong>вы обязаны иметь при себе личные лекарства</strong>. Гид не несет ответственности за отсутствие ваших специфических препаратов. Пожалуйста, предупредите организатора о проблемах со здоровьем заранее.
            </p>
        </div>
      </div>
    )
  },
  {
    id: 'alcohol',
    icon: <Wine className="text-amber-400" size={18} />,
    question: "Алкоголь и Правила поведения",
    answer: (
      <div className="space-y-2 md:space-y-3">
        <p>
          Во время активной части маршрута (ходьба, сплав, восхождение) действует <strong>правила самоконтроля</strong>. Вечером или при отсуствии физической нагрузки умеренное потребление алкоголя возможно, не мешая отдыху других участников.
        </p>
        <div className="p-3 md:p-4 rounded-xl bg-amber-900/20 border border-amber-500/30">
            <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2 text-amber-500 font-black uppercase text-[14px] md:text-xs tracking-wider">
                <ShieldAlert size={14}/> Внимание: Последствия
            </div>
            <p className="text-xs md:text-sm text-amber-100/80 leading-relaxed">
                Алкоголь на природе действует иначе. Опьянение может привести к <strong>солнечному удару, скачкам давления, обезвоживанию и тошноте</strong>. Человек с похмельным синдромом тормозит всю группу и подвергает себя опасности. Гид имеет право снять нетрезвого участника с маршрута без возврата средств.
            </p>
        </div>
      </div>
    )
  },
  {
    id: 'gear',
    icon: <Tent className="text-teal-400" size={18} />,
    question: "Что брать с собой и Погода",
    answer: (
      <div className="space-y-2 md:space-y-3">
        <p>
          Перед каждым туром мы высылаем подробный чек-лист снаряжения в чат группы. Читайте его внимательно!
        </p>
        <p>
          <strong>Погода:</strong> Природа непредсказуема. Маршрут может быть изменен гидом прямо на месте ради безопасности группы (дождь, шторм, размытая дорога). Безопасность — приоритет №1. Мы не несем отвественность за погодные условия, но всегда стараемся адаптироваться и обеспечить комфортное приключение.
        </p>
      </div>
    )
  },
  {
    id: 'kids',
    icon: <CloudSun className="text-blue-400" size={18} />,
    question: "Можно ли с детьми?",
    answer: (
      <p>
        Да, мы любим семейные выезды! Дети участвуют с родителями. Возможность участия ребенка зависит от сложности конкретного маршрута — уточняйте у организатора перед записью.
      </p>
    )
  }
];

// --- КОМПОНЕНТ АККОРДЕОНА (Компактный для мобилок) ---
function AccordionItem({ item, isOpen, onClick }: { item: any, isOpen: boolean, onClick: () => void }) {
  return (
    <motion.div 
      initial={false}
      className={`border rounded-2xl overflow-hidden transition-colors duration-300 ${isOpen ? 'bg-slate-900 border-teal-500/50 shadow-[0_0_15px_rgba(20,184,166,0.1)]' : 'bg-slate-900/50 border-white/5 hover:border-white/10'}`}
    >
      <button 
        onClick={onClick}
        className="flex items-center justify-between w-full p-4 md:p-5 text-left"
      >
        <div className="flex items-center gap-3 md:gap-4 pr-4">
          <div className={`p-2 rounded-lg shrink-0 ${isOpen ? 'bg-teal-500/10' : 'bg-slate-800'}`}>
             {item.icon}
          </div>
          <span className={`text-sm md:text-lg font-bold leading-tight ${isOpen ? 'text-white' : 'text-slate-300'}`}>
            {item.question}
          </span>
        </div>
        <ChevronDown 
          className={`shrink-0 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-teal-500' : ''}`} 
          size={18}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: "auto" },
              collapsed: { opacity: 0, height: 0 }
            }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <div className="px-4 md:px-5 pb-4 md:pb-5 pl-[3.25rem] md:pl-[4.5rem] text-slate-400 leading-relaxed text-xs md:text-sm">
               {item.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- СТРАНИЦА ---
export default function FAQPage() {
  const [openId, setOpenId] = useState<string | null>('booking');
  const [isHubOpen, setIsHubOpen] = useState(false); // Стейт для модалки

  const handleToggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <main className="min-h-screen bg-slate-950 pt-24 md:pt-32 pb-16 md:pb-20 px-4 relative overflow-hidden">
      
      {/* Decor */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-900/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto max-w-3xl relative z-10">
        
        {/* Header */}
        <div className="mb-8 md:mb-12 text-center md:text-left">
            <Link href="/" className="inline-flex items-center gap-1.5 md:gap-2 text-slate-400 hover:text-teal-400 transition-colors mb-4 md:mb-6 text-[14px] md:text-sm font-bold uppercase tracking-wider">
                <ArrowLeft size={16} /> На главную
            </Link>
            
            <h1 className="text-3xl md:text-5xl font-black text-white mb-3 md:mb-4 uppercase tracking-tight leading-none">
              Правила <span className="text-teal-500">& FAQ</span>
            </h1>
            <p className="text-slate-400 text-sm md:text-lg">
                Всё, что нужно знать перед тем, как отправиться в приключение с клубом «Эва».
            </p>
        </div>

        {/* List */}
        <div className="space-y-3 md:space-y-4">
            {FAQ_ITEMS.map((item) => (
                <AccordionItem 
                    key={item.id} 
                    item={item} 
                    isOpen={openId === item.id}
                    onClick={() => handleToggle(item.id)}
                />
            ))}
        </div>

        {/* Блок Центр Связи (Плотный и адаптивный) */}
        <div className="mt-8 md:mt-12 p-5 md:p-6 bg-slate-900/80 border border-white/5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-5 text-center md:text-left">
            <div>
                <h3 className="text-white font-black text-lg md:text-xl uppercase tracking-tight mb-1.5">Остались вопросы?</h3>
                <p className="text-slate-400 text-xs md:text-sm max-w-md">
                    Если вы не нашли ответ на свой вопрос, напишите нам. Мы всегда на связи!
                </p>
            </div>
            <button 
                onClick={() => setIsHubOpen(true)}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-6 py-3.5 md:py-3 rounded-xl font-bold uppercase text-xs md:text-sm tracking-widest transition-all shadow-lg shadow-teal-900/20 active:scale-95 shrink-0"
            >
                <HelpCircle size={18}/> Задать вопрос
            </button>
        </div>

      </div>

      {/* Вызов модалки */}
      <ContactHubModal 
        isOpen={isHubOpen} 
        onClose={() => setIsHubOpen(false)} 
        initialTab="HELP" 
      />
    </main>
  );
}