"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  Calendar, MapPin, Users, CreditCard, 
  ChevronRight, CheckCircle2, Clock,
  AlertCircle, Gift, X, Hourglass 
} from 'lucide-react'; 
import { clsx } from 'clsx';
import cloudinaryLoader from '@/lib/cloudinary-loader';
import dynamic from 'next/dynamic';

// Ленивая загрузка QR-кода, чтобы не раздувать LCP/JS-бандл списка туров
const QRCode = dynamic(() => import('react-qr-code'), { ssr: false });

interface BookingCardProps {
  bookingId: string;
  booking: {
    id: string;
    shortId: string | null;
    status: string;
    totalPrice: number;
    finalPrice?: number | null;
    discount?: number; //   Исправили на discount (как в БД) и сделали необязательным
    paymentMethod?: string | null;
    guestsCount: number;
    tourDate?: {
      startDate: Date | null;
      time: string | null;
    } | null;
    tour?: {
      title: string;
      slug: string | null;
      location: string | null;
      meetingPoint: string | null;
      coverImage: string | null;
      currency: string | null;
    } | null;
  };
}

const STATUS_MAP = { 
  pending: { label: 'Новая', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30', icon: Clock },
  awaiting_payment: { label: 'Ждет оплаты', color: 'text-sky-400', bg: 'bg-sky-400/10', border: 'border-sky-400/30', icon: CreditCard },
  moderation: { label: 'Проверка чека', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/30', icon: Hourglass },
  confirmed: { label: 'Оплачено', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', icon: CheckCircle2 },
  rejected: { label: 'Отклонено', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/30', icon: AlertCircle },
cancelled: { label: 'Отменено', color: 'text-ui-muted', bg: 'bg-ui-surface', border: 'border-ui-border', icon: X },
};

const PAYMENT_METHOD_MAP: Record<string, string> = {
  'cash': 'Наличными гиду',
  'qr': 'Клевер QR',
  'biletpmr': 'BiletPMR',
  'foreign': 'Другие страны'
};

export default function BookingCard({ bookingId, booking }: BookingCardProps) {
  const { 
    tour, status, totalPrice, guestsCount, 
    shortId, tourDate,
    discount, finalPrice, paymentMethod  
  } = booking;
  
  //   Переводим discount из БД в переменную для верстки
  const appliedBonuses = discount || 0;
  
  const statusInfo = STATUS_MAP[status as keyof typeof STATUS_MAP] || STATUS_MAP.pending;
  const StatusIcon = statusInfo.icon;
  const paymentLabel = paymentMethod ? PAYMENT_METHOD_MAP[paymentMethod] || paymentMethod : 'Не выбран';

  let formattedDate = 'Открытая дата';
  let time = '—';
  
  if (tourDate && tourDate.startDate) {
    const startDate = new Date(tourDate.startDate);
    formattedDate = format(startDate, 'd MMMM yyyy', { locale: ru });
    time = tourDate.time || format(startDate, 'HH:mm');
  }

  const imageUrl = tour?.coverImage;
  const displayId = shortId ? String(shortId) : bookingId.substring(0, 5).toUpperCase();

 return (
    <div className="relative flex flex-col md:flex-row bg-ui-panel rounded-3xl overflow-hidden border border-ui-border shadow-xl group transition-all hover:border-ui-accent/50 hover:shadow-2xl">
      {/*   ГЛАВНАЯ ССЫЛКА НА БИЛЕТ (Растянута на всю карточку) */}
      <Link href={`/account/bookings/${bookingId}`} className="absolute inset-0 z-0 focus:outline-none" aria-hidden="true" />

      {/* ─── ЛЕВАЯ ЧАСТЬ (Инфо о туре) ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col sm:flex-row p-4 sm:p-6 gap-6 relative z-10 pointer-events-none">
        
        {/* Изображение */}
       <div className="w-full sm:w-48 h-48 sm:h-auto rounded-2xl overflow-hidden relative shrink-0 bg-ui-bg flex items-center justify-center pointer-events-auto">
          {imageUrl ? (
            <Image
              loader={cloudinaryLoader}
              src={imageUrl}
              alt={tour?.title || 'Тур'}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, 200px"
            />
          ) : (
            <MapPin className="text-ui-muted/50" size={32} />
          )}
          
<div className="absolute inset-0 bg-gradient-to-t from-ui-panel/80 via-transparent to-transparent sm:hidden" />
          
          <div className="absolute top-3 left-3 sm:hidden">
            <div className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-lg backdrop-blur-md border shadow-lg", statusInfo.bg, statusInfo.border)}>
              <StatusIcon size={14} className={statusInfo.color} />
              <span className={clsx("text-xs font-bold uppercase tracking-wider", statusInfo.color)}>
                {statusInfo.label}
              </span>
            </div>
          </div>
        </div>

        {/* Детали */}
        <div className="flex flex-col justify-center flex-1">
          <div className="flex items-center justify-between mb-2 pointer-events-auto">
            <div className="flex items-center gap-2 text-ui-accent">
              <MapPin size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">{tour?.meetingPoint || tour?.location || 'Место старта'}</span>
            </div>
            
           {appliedBonuses > 0 && (
              <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                <Gift size={12} /> Скидка {appliedBonuses} ₽
              </div>
            )}
          </div>
          
          {/*   ССЫЛКА НА ТУР (Локальная, работает только при точном клике на текст) */}
         <h3 className="text-xl sm:text-2xl font-black text-ui-text leading-tight mb-4 pointer-events-auto w-fit">
            <Link href={`/tour/${tour?.slug}`} className="hover:text-ui-accent transition-colors relative z-20">
            </Link>
          </h3>

          <div className="grid grid-cols-2 gap-y-3 gap-x-4">
            <div>
            <p className="text-xs text-ui-muted font-bold uppercase tracking-widest mb-1">Дата и Время </p>
              <div className="flex items-center gap-2 text-ui-muted font-medium">
                <Calendar size={16} className="text-ui-muted shrink-0" />
                <span className="truncate">{formattedDate}, {time}</span>
              </div>
            </div>

            <div>
              <p className="text-xs text-ui-muted font-bold uppercase tracking-widest mb-1">Места</p>
              <div className="flex items-center gap-2 text-ui-muted font-medium">
                <Users size={16} className="text-ui-muted shrink-0" />
                <span>{guestsCount} чел.</span>
              </div>
            </div>
            
            <div>
           <p className="text-xs text-ui-muted font-bold uppercase tracking-widest mb-1">Сумма</p>
              <div className="flex items-center gap-2 text-ui-muted font-medium">
                <CreditCard size={16} className="text-ui-muted shrink-0" />
                {appliedBonuses > 0 ? (
                  <span>
                    <span className="line-through text-ui-muted text-xs mr-2">{totalPrice}</span>
                    <span className="text-emerald-400 font-bold">{finalPrice || totalPrice - appliedBonuses} {tour?.currency || 'RUB'}</span>
                  </span>
                ) : (
                  <span>{totalPrice} {tour?.currency || 'RUB'}</span>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs text-ui-muted font-bold uppercase tracking-widest mb-1">Оплата</p>
              <div className="flex items-center gap-2 text-ui-muted font-medium">
                <span className="text-xs">{paymentLabel}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── ЛИНИЯ ОТРЫВА (ПЕРФОРАЦИЯ) ─────────────────────────────────── */}
    <div className="hidden md:flex flex-col items-center justify-between relative w-6 border-l-2 border-dashed border-ui-border my-4 z-10">
        <div className="absolute -top-7 -left-[13px] w-6 h-6 bg-ui-bg rounded-full border border-ui-border" />
        <div className="absolute -bottom-7 -left-[13px] w-6 h-6 bg-ui-bg rounded-full border border-ui-border" />
      </div>

      <div className="md:hidden w-full h-0 border-t-2 border-dashed border-ui-border relative my-2 z-10">
         <div className="absolute -left-3 -top-[13px] w-6 h-6 bg-ui-bg rounded-full border border-ui-border" />
         <div className="absolute -right-3 -top-[13px] w-6 h-6 bg-ui-bg rounded-full border border-ui-border" />
      </div>

      {/* ─── ПРАВАЯ ЧАСТЬ (Контрольный талон) ──────────── */}
     <div className="w-full md:w-64 bg-ui-bg/50 p-6 flex flex-col justify-between items-center text-center relative z-10 pointer-events-none">
        <div className="hidden md:flex flex-col items-center mb-6 w-full">
          <div className={clsx("flex justify-center items-center gap-2 px-4 py-2 w-full rounded-xl border", statusInfo.bg, statusInfo.border)}>
            <StatusIcon size={16} className={statusInfo.color} />
            <span className={clsx("text-xs font-bold uppercase tracking-widest", statusInfo.color)}>
              {statusInfo.label}
            </span>
          </div>
        </div>
{/*   НАСТОЯЩИЙ QR Code */}
        <div className="p-2 bg-white rounded-xl mb-6 shadow-inner hidden md:block opacity-90 transition-all duration-300">
           <QRCode 
             size={90} 
             value={`https://evatur.club/admin/scan?b=${displayId}`} // 👈 ИЗМЕНЕНО НА ?b=
             viewBox={`0 0 90 90`} 
             level="M" 
           />
        </div>

        <div className="w-full flex md:flex-col justify-between items-center">
          <div className="text-left md:text-center mb-0 md:mb-4">
            <p className="text-xs text-ui-muted font-bold uppercase tracking-widest mb-1">Booking Ref</p>
            <p className="text-sm font-mono text-ui-text font-bold tracking-wider">#{displayId}</p>
          </div>

          {/* Визуальная кнопка "Подробнее" */}
         <div className="flex items-center gap-2 text-ui-accent text-xs font-bold uppercase tracking-widest group-hover:text-ui-accent/80 transition-colors pointer-events-auto">
            Подробнее 
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

    </div>
  );
}