import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { ArrowLeft, FileText, Scale } from 'lucide-react';
import LegalNav from "@/components/LegalNav";
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';
import AskQuestionButton from '@/components/AskQuestionButton';

export const metadata: Metadata = {
  title: 'Публичная Оферта | Турклуб «Эва»',
  description: 'Официальная публичная оферта и условия оказания услуг туристического клуба «Эва». Правила бронирования, возврата средств и участия в турах.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Публичная Оферта | Турклуб «Эва»',
    description: 'Официальные условия оказания туристических услуг.',
    url: 'https://evatur.club/offer',
    siteName: 'Турклуб «Эва»',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630 }],
    locale: 'ru_RU',
    type: 'website',
  }
};

export default function OfferPage() {
  return (
   <>
   <BreadcrumbJsonLd items={[
      { name: "Главная", url: "https://evatur.club" },
      { name: "Оферта", url: "https://evatur.club/offer" },
   ]} />
   <main className="min-h-screen bg-slate-950 pt-24 md:pt-32 pb-16 md:pb-20 px-4 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-1/2 translate-x-1/2 w-[800px] h-[500px] bg-indigo-900/20 md:blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto max-w-3xl relative z-10">
        
        {/* Header */}
        <div className="mb-8 md:mb-12">
            <Link href="/" className="inline-flex items-center gap-1.5 md:gap-2 text-slate-400 hover:text-teal-400 transition-colors mb-6 text-[14px] md:text-sm font-bold uppercase tracking-wider">
                <ArrowLeft size={16} /> На главную
            </Link>
            
            <h1 className="text-3xl md:text-5xl font-black text-white mb-4 md:mb-6 uppercase tracking-tight leading-none">
              Публичная <span className="text-teal-500">Оферта</span>
            </h1>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-slate-400 text-xs md:text-sm font-medium bg-slate-900/50 p-4 md:p-5 rounded-xl border border-white/5">
                <div className="flex items-center gap-2">
                    <FileText size={18} className="text-teal-500 shrink-0" />
                    <span>Редакция от 14.02.2026</span>
                </div>
                <div className="hidden sm:block w-px h-4 bg-slate-700"></div>
                <div className="flex items-center gap-2">
                    <Scale size={18} className="text-teal-500 shrink-0" />
                    <span>ИП Санду Р.С.</span>
                </div>
            </div>
        </div>

        {/* Content */}
        <article className="prose prose-sm md:prose-lg prose-invert max-w-none 
            prose-headings:font-bold prose-headings:uppercase prose-headings:text-white prose-headings:mt-8 prose-headings:mb-4
            prose-h2:text-xl md:prose-h2:text-2xl
            prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-4
            prose-li:text-slate-300 prose-li:my-1
            prose-ul:my-4 prose-ul:pl-5
            prose-strong:text-teal-400">
            
            <section aria-labelledby="offer-general">
                <h2 id="offer-general">1. Общие положения</h2>
                <p>1.1. Настоящий документ является официальной публичной офертой Индивидуального Предпринимателя Санду Р.С. (далее — Организатор) и содержит все существенные условия предоставления услуг по организации активного отдыха.</p>
                <p>1.2. В соответствии с законодательством, оплата Услуг (полная или частичная) является акцептом данной Оферты, что считается равносильным заключению Договора на изложенных ниже условиях.</p>
            </section>

            <section aria-labelledby="offer-subject">
                <h2 id="offer-subject">2. Предмет оферты</h2>
                <p>2.1. Организатор обязуется оказать Участнику услуги по организации туристического тура, поездки, сплава, прогулки или экскурсии (далее — Мероприятие), а Участник обязуется оплатить эти услуги.</p>
                <p>2.2. Полное описание маршрута, дат, стоимости и уровня сложности публикуется на сайте <Link href="https://evatur.club" className="text-teal-400 no-underline hover:underline">https://evatur.club</Link> или в официальных соцсетях клуба.</p>
            </section>

            <section aria-labelledby="offer-payment">
                <h2 id="offer-payment">3. Порядок оплаты и бронирования</h2>
                <p>3.1. Для бронирования места в группе Участник оплачивает полную стоимость Мероприятия или вносит предоплату в размере, установленном для конкретного Мероприятия.</p>
                <p>3.2. Оплата производится наличными, онлайн-платежом на сайте ( в случае возможности), оргинизатору или через официальные сторонние сервисы (Biletpmr). Факт оплаты или внесения предоплаты (в зависимости от конкретного тура) означает согласие Участника с условиями настоящей Оферты, правилами техники безопасности и политикой конфиденциальности.</p>
            </section>

            <section aria-labelledby="offer-refund" className="my-8 p-5 md:p-6 bg-slate-900 border border-slate-700 rounded-2xl">
                <h2 id="offer-refund" className="!mt-0 text-teal-500">4. Отмена участия и Возврат средств</h2>
                <p>4.1. Внесенная предоплата расходуется Организатором на бронирование невозвратных услуг (транспорт, проживание, разрешительные документы) — это Фактически Понесенные Расходы (ФПР).</p>
                <p className="font-bold text-white !mb-2">4.2. Правила возврата при отказе Участника:</p>
                <ul className="!mt-0 text-sm md:text-base">
                    <li>Если Участник находит себе замену (другого человека) — <strong>возвращается 100%</strong> внесенной суммы.</li>
                    <li>Если замена не найдена — Организатор удерживает сумму, равную Фактически Понесенным Расходам (что может составлять до 100% предоплаты, в зависимости от срока отказа и условий подрядчиков).</li>
                    <li>При неявке к месту сбора (опоздании) стоимость тура не возвращается.</li>
                </ul>
                <p className="!mb-0 !mt-4 text-sm md:text-base">4.3. В случае отмены Мероприятия по инициативе Организатора (недобор группы, болезнь гида) средства возвращаются Участнику в полном объеме.</p>
            </section>

            <section aria-labelledby="offer-security">
                <h2 id="offer-security">5. Безопасность и Ответственность</h2>
                <p>5.1. Участник подтверждает, что не имеет медицинских противопоказаний к физическим нагрузкам. Ответственность за состояние своего здоровья несет лично Участник.</p>
                <p>5.2. Организатор (Гид) имеет право <strong>исключить Участника из группы</strong> без возврата стоимости тура в случаях:</p>
                <ul>
                    <li>Нахождения в состоянии алкогольного или наркотического опьянения;</li>
                    <li>Агрессивного поведения, создающего угрозу для других участников;</li>
                    <li>Грубого нарушения техники безопасности и игнорирования команд гида.</li>
                </ul>
            </section>

            <section aria-labelledby="offer-force-majeure">
                <h2 id="offer-force-majeure">6. Форс-мажор</h2>
                <p>6.1. Стороны освобождаются от ответственности за неисполнение обязательств в случае действия обстоятельств непреодолимой силы: стихийных бедствий, военных действий, закрытия границ, эпидемий, запретительных актов государственных органов, как для отдельных участников, так и для всей группы.</p>
                <p>6.2. В случае наступления форс-мажора, делающего проведение тура невозможным, Организатор предлагает перенос дат или возврат средств за вычетом уже понесенных расходов, которые невозможно вернуть от поставщиков.</p>
            </section>

            <section aria-labelledby="offer-media">
                <h2 id="offer-media">7. Фото и Видео</h2>
                <p>7.1. Организатор имеет право проводить фото- и видеосъемку во время Мероприятия и использовать полученные материалы для продвижения клуба (сайт, соцсети), если Участник заранее не выразил письменного несогласия.</p>
            </section>
    
            {/* Реквизиты */}
            <div className="mt-12 md:mt-16 p-6 bg-slate-900/50 border border-white/5 rounded-2xl text-sm md:text-base text-slate-400">
                <h2 className="!text-white uppercase !mt-0 !mb-5 text-xl">8. Реквизиты Организатора</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <p className="!m-0"><strong className="text-white">ИП Санду Р.С.</strong></p>
                        <p className="!m-0">Туристический клуб «Эва»</p>
                        <p className="!m-0">Адрес: г. Тирасполь</p>
                        <p className="!m-0">Сайт: <span className="text-teal-400">https://evatur.club</span></p>
                    </div>
                    <div className="space-y-1.5">
                        <p className="!m-0">ИНН: <span className="text-white font-mono">9000075596</span></p>
                        <p className="!m-0">Патент (ПСН): <span className="text-white font-mono">№1210008706</span></p>
                        <p className="!mt-4 text-xs opacity-60 leading-snug">Договор вступает в силу с момента совершения Участником действий по бронированию или оплаты тура.</p>
                    </div>
                </div>
            </div>

        </article>

        {/* Блок Центр Связи */}
        <div className="mt-8 md:mt-12 p-5 md:p-6 bg-slate-900/80 border border-white/5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-5 text-center md:text-left">
            <div>
                <h3 className="text-white font-black text-lg md:text-xl uppercase tracking-tight mb-1.5">Остались вопросы?</h3>
                <p className="text-slate-400 text-xs md:text-sm max-w-md">Если вы не нашли ответ на свой вопрос, напишите нам. Мы всегда на связи!</p>
            </div>
            
            {/* 👇 НАШ НОВЫЙ КЛИЕНТСКИЙ ОСТРОВОК */}
            <AskQuestionButton context="Вопрос по оферте" tab="TOUR" />

        </div>
        
        <LegalNav currentPage="offer" />

      </div>
   </main>
   </>
  );
}