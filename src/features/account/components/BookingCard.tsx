"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  Calendar, MapPin, Users, CreditCard, 
  ChevronRight, CheckCircle2, Clock,
  AlertCircle, QrCode
} from 'lucide-react';
import { clsx } from 'clsx';
import cloudinaryLoader from '@/lib/cloudinary-loader';

interface BookingCardProps {
  booking: any; // В идеале типизировать как BookingWithTour
}

const STATUS_MAP = {
  pending: { label: 'В обработке', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30', icon: Clock },
  confirmed: { label: 'Подтвержден', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', icon: CheckCircle2 },
  cancelled: { label: 'Отменен', color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/30', icon: AlertCircle },
};

export default function BookingCard({ booking }: BookingCardProps) {
  // 1. Деструктуризация пропсов
  const { tour, status, totalPrice, guestsCount, id, tourDate } = booking;
  
  const statusInfo = STATUS_MAP[status as keyof typeof STATUS_MAP] || STATUS_MAP.pending;
  const StatusIcon = statusInfo.icon;

  // 2. БЕЗОПАСНАЯ ОБРАБОТКА ДАТЫ (Защита от краша, если tourDate === null)
  let formattedDate = 'Открытая дата';
  let time = '—';
  
  if (tourDate && tourDate.startDate) {
    const startDate = new Date(tourDate.startDate);
    formattedDate = format(startDate, 'd MMMM yyyy', { locale: ru });
    // Берем точное время из поля time, либо форматируем из startDate
    time = tourDate.time || format(startDate, 'HH:mm');
  }

  // 3. Безопасная обложка (в БД используется coverImage)
  const imageUrl = tour?.coverImage;

  return (
    <div className="relative flex flex-col md:flex-row bg-slate-900 rounded-3xl overflow-hidden border border-white/10 shadow-xl group transition-all hover:border-white/20 hover:shadow-2xl">
      
      {/* ─── ЛЕВАЯ ЧАСТЬ (Инфо о туре) ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col sm:flex-row p-4 sm:p-6 gap-6">
        
        {/* Изображение (с защитой от отсутствия картинки) */}
        <div className="w-full sm:w-48 h-48 sm:h-auto rounded-2xl overflow-hidden relative shrink-0 bg-slate-800 flex items-center justify-center">
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
            <MapPin className="text-slate-600" size={32} />
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent sm:hidden" />
          
          {/* Статус на мобилке */}
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
          <div className="flex items-center gap-2 mb-2 text-teal-400">
            <MapPin size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">{tour?.location || 'Молдова'}</span>
          </div>
          
          <h3 className="text-xl sm:text-2xl font-black text-white leading-tight mb-4 group-hover:text-teal-400 transition-colors line-clamp-2">
            <Link href={`/tour/${tour?.slug}`} className="focus:outline-none">
               <span className="absolute inset-0" aria-hidden="true" />
               {tour?.title || 'Название тура'}
            </Link>
          </h3>

          <div className="grid grid-cols-2 gap-y-3 gap-x-4">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Дата</p>
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <Calendar size={16} className="text-slate-500 shrink-0" />
                <span className="truncate">{formattedDate}</span>
              </div>
            </div>
            
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Время сбора</p>
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <Clock size={16} className="text-slate-500 shrink-0" />
                <span>{time}</span>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Места</p>
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <Users size={16} className="text-slate-500 shrink-0" />
                <span>{guestsCount} чел.</span>
              </div>
            </div>
            
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Сумма</p>
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <CreditCard size={16} className="text-slate-500 shrink-0" />
                <span>{totalPrice} {tour?.currency || 'MDL'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── ЛИНИЯ ОТРЫВА (ПЕРФОРАЦИЯ) ─────────────────────────────────── */}
      <div className="hidden md:flex flex-col items-center justify-between relative w-6 border-l-2 border-dashed border-white/10 my-4 z-10">
        {/* Полукруги сверху и снизу для имитации билета */}
        <div className="absolute -top-7 -left-[13px] w-6 h-6 bg-slate-950 rounded-full border border-white/10" />
        <div className="absolute -bottom-7 -left-[13px] w-6 h-6 bg-slate-950 rounded-full border border-white/10" />
      </div>

      <div className="md:hidden w-full h-0 border-t-2 border-dashed border-white/10 relative my-2 z-10">
         <div className="absolute -left-3 -top-[13px] w-6 h-6 bg-slate-950 rounded-full border border-white/10" />
         <div className="absolute -right-3 -top-[13px] w-6 h-6 bg-slate-950 rounded-full border border-white/10" />
      </div>

      {/* ─── ПРАВАЯ ЧАСТЬ (Контрольный талон / Boarding Pass) ──────────── */}
      <div className="w-full md:w-64 bg-slate-800/20 p-6 flex flex-col justify-between items-center text-center relative z-10">
        
        {/* Статус (на десктопе) */}
        <div className="hidden md:flex flex-col items-center mb-6 w-full">
          <div className={clsx("flex justify-center items-center gap-2 px-4 py-2 w-full rounded-xl border", statusInfo.bg, statusInfo.border)}>
            <StatusIcon size={16} className={statusInfo.color} />
            <span className={clsx("text-xs font-bold uppercase tracking-widest", statusInfo.color)}>
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* QR Code (Подготовлен для интеграции сканера) */}
        <div className="p-3 bg-white rounded-xl mb-6 shadow-inner hidden md:block opacity-90 grayscale group-hover:grayscale-0 transition-all duration-500">
           {/* Пока используем иконку, позже заменим на реальный QR (react-qr-code) */}
           <QrCode size={80} className="text-slate-900" strokeWidth={1.5} />
        </div>

        <div className="w-full flex md:flex-col justify-between items-center">
          <div className="text-left md:text-center mb-0 md:mb-4">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Booking Ref</p>
            <p className="text-sm font-mono text-slate-300 font-bold tracking-wider">{id.slice(0, 8).toUpperCase()}</p>
          </div>

          <Link 
            href={`/account/bookings/${id}`}
            className="flex items-center gap-2 text-teal-400 hover:text-teal-300 text-xs font-bold uppercase tracking-widest group/link transition-colors relative z-20"
          >
            Подробнее 
            <ChevronRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

    </div>
  );
}