"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, HelpCircle } from 'lucide-react';
import ContactHubModal from "@/components/modals/ContactHubModal";
import LegalNav from "@/components/LegalNav" 



export default function PrivacyPage() {
  const [isHubOpen, setIsHubOpen] = useState(false);

  return (
    <main className="min-h-screen bg-slate-950 pt-24 md:pt-32 pb-16 md:pb-20 px-4 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-teal-900/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto max-w-3xl relative z-10">
        
        {/* Header */}
        <div className="mb-8 md:mb-12">
            <Link href="/" className="inline-flex items-center gap-1.5 md:gap-2 text-slate-400 hover:text-teal-400 transition-colors mb-6 text-[14px] md:text-sm font-bold uppercase tracking-wider">
                <ArrowLeft size={16} /> На главную
            </Link>
            
         <h1 className="text-[24px] xs:text-3xl md:text-5xl font-black text-white mb-4 md:mb-6 uppercase tracking-tighter leading-[1.1] break-words [hyphens:auto]" lang="ru">
      Политика <span className="text-teal-500 block sm:inline">Конфиденциальности</span>
    </h1>
            
            <div className="inline-flex items-center gap-2 md:gap-3 text-slate-400 text-xs md:text-sm font-medium bg-slate-900/50 p-4 rounded-xl border border-white/5">
                <ShieldCheck size={18} className="text-teal-500 shrink-0" />
                <span>Последнее обновление: Февраль 2026</span>
            </div>
        </div>

        {/* Content (Адаптивный Prose) */}
        <div className="prose prose-sm md:prose-lg prose-invert max-w-none 
            prose-headings:font-bold prose-headings:uppercase prose-headings:text-white prose-headings:mt-8 prose-headings:mb-4
            prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-4
            prose-a:text-teal-400 hover:prose-a:text-teal-300 
            prose-li:text-slate-300 prose-li:my-1
            prose-ul:my-4 prose-ul:pl-5
            prose-strong:text-teal-400">
            
            <section className="mb-8 md:mb-10">
                <h3>1. Общие положения</h3>
                <p>
                    Туристический клуб «Эва» уважает ваше личное пространство. Мы собираем только те данные, которые реально нужны для организации вашего тура или мероприятия.
                </p>
                <p>Адрес сайта: <Link href="https://evatur.club">https://evatur.club</Link></p>
            </section>

            <section className="mb-8 md:mb-10">
                <h3>2. Какие данные мы собираем</h3>
                <p>Для записи в тур или события для логистики нам могут понадобиться:</p>
                <ul>
                    <li>Имя и Фамилия (чтобы знать, как к вам обращаться);</li>
                    <li>Контактный телефон и Telegram (для создания чата группы);</li>
                    <li>Паспортные данные (строго для оформления страховки, билетов или пропусков в пограничные зоны).</li>
                </ul>
            </section>

            <section className="mb-8 md:mb-10">
                <h3>3. Фото и Видео (Контент)</h3>
                <p>
                    Путешествия — это эмоции, и мы любим их сохранять!
                </p>
                <ul>
                    <li>
                        <strong>Съемка гидами:</strong> Во время туров наши гиды могут делать фото и видео для отчетов в социальных сетях и на сайте. Участвуя в туре, вы даете на это согласие. Если вы категорически против съемки — просто предупредите гида заранее, мы уважаем ваше право на приватность.
                    </li>
                    <li>
                        <strong>Ваш контент:</strong> Мы приветствуем, когда участники добровольно делятся своими кадрами и видео с туров. Отправляя нам материалы, вы разрешаете использовать их в наших соцсетях и на сайте для вдохновения других путешественников.
                    </li>
                </ul>
            </section>

            <section className="mb-8 md:mb-10">
                <h3>4. Передача данных</h3>
                <p>
                    Мы не продаем и не передаем ваши контакты спамерам. Ваши данные могут быть переданы третьим лицам только в случаях, необходимых для исполнения тура:
                </p>
                <ul>
                    <li>Транспортным компаниям (для списков пассажиров);</li>
                    <li>Отелям и гостевым домам (для заселения);</li>
                    <li>Страховым агентам (для оформления полиса).</li>
                </ul>
            </section>

            <section className="mb-8 md:mb-10">
                <h3>5. Согласие</h3>
                <p>
                    Оставляя заявку на сайте, бронируя тур или вступая в чат поездки, вы подтверждаете, что ознакомились с данной политикой и принимаете её условия.
                </p>
            </section>

        </div>

        {/* Блок Центр Связи */}
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
<LegalNav currentPage="faq" />
      </div>

      <ContactHubModal 
        isOpen={isHubOpen} 
        onClose={() => setIsHubOpen(false)} 
        initialTab="HELP" 
      />
    </main>
  );
}