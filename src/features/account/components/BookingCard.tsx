"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  Calendar, MapPin, Users, CreditCard, 
  ChevronRight, CheckCircle2, Clock,
  AlertCircle, Gift, X,  Hourglass 
} from 'lucide-react'; // 👈 Убрали фейковый QrCode, добавили Gift для бонусов
import { clsx } from 'clsx';
import cloudinaryLoader from '@/lib/cloudinary-loader';
import QRCode from "react-qr-code"; // 👈 Используем настоящий генератор

interface BookingCardProps {
  booking: any; 
}

const STATUS_MAP = {
  pending: { label: 'Новая', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30', icon: Clock },
  awaiting_payment: { label: 'Ждет оплаты', color: 'text-sky-400', bg: 'bg-sky-400/10', border: 'border-sky-400/30', icon: CreditCard },
  moderation: { label: 'Проверка чека', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/30', icon: Hourglass },
  confirmed: { label: 'Оплачено', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', icon: CheckCircle2 },
  rejected: { label: 'Отклонено', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/30', icon: AlertCircle },
  cancelled: { label: 'Отменено', color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/30', icon: X },
};

const PAYMENT_METHOD_MAP: Record<string, string> = {
  'cash': 'Наличными гиду',
  'qr': 'Клевер QR',
  'biletpmr': 'BiletPMR',
  'foreign': 'Другие страны'
};

export default function BookingCard({ booking }: BookingCardProps) {
  // ✅ 1. Вытаскиваем новые поля из базы (shortId, бонусы, финал.цена, метод оплаты)
  const { 
    tour, status, totalPrice, guestsCount, 
    id, shortId, tourDate, 
    appliedBonuses, finalPrice, paymentMethod  
  } = booking;
  
  const statusInfo = STATUS_MAP[status as keyof typeof STATUS_MAP] || STATUS_MAP.pending;
  const StatusIcon = statusInfo.icon;
  const paymentLabel = paymentMethod ? PAYMENT_METHOD_MAP[paymentMethod] || paymentMethod : 'Не выбран';

  // 2. БЕЗОПАСНАЯ ОБРАБОТКА ДАТЫ
  let formattedDate = 'Открытая дата';
  let time = '—';
  
  if (tourDate && tourDate.startDate) {
    const startDate = new Date(tourDate.startDate);
    formattedDate = format(startDate, 'd MMMM yyyy', { locale: ru });
    time = tourDate.time || format(startDate, 'HH:mm');
  }

  const imageUrl = tour?.coverImage;

  // Безопасный фоллбэк: если это старая бронь без shortId, используем срез UUID
const displayId = shortId ? String(shortId) : id.substring(0, 5).toUpperCase();

  return (
    <div className="relative flex flex-col md:flex-row bg-slate-900 rounded-3xl overflow-hidden border border-white/10 shadow-xl group transition-all hover:border-white/20 hover:shadow-2xl">
      
      {/* ─── ЛЕВАЯ ЧАСТЬ (Инфо о туре) ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col sm:flex-row p-4 sm:p-6 gap-6">
        
        {/* Изображение */}
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
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-teal-400">
              <MapPin size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">{tour?.location || 'Молдова'}</span>
            </div>
            
            {/* ✅ Плашка лояльности: Если списаны бонусы */}
            {appliedBonuses > 0 && (
              <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                <Gift size={12} />
                Скидка {appliedBonuses} ₽
              </div>
            )}
          </div>
          
          <h3 className="text-xl sm:text-2xl font-black text-white leading-tight mb-4 group-hover:text-teal-400 transition-colors line-clamp-2">
            <Link href={`/tour/${tour?.slug}`} className="focus:outline-none">
               <span className="absolute inset-0" aria-hidden="true" />
               {tour?.title || 'Название тура'}
            </Link>
          </h3>

          <div className="grid grid-cols-2 gap-y-3 gap-x-4">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Дата и Время</p>
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <Calendar size={16} className="text-slate-400 shrink-0" />
                <span className="truncate">{formattedDate}, {time}</span>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Места</p>
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <Users size={16} className="text-slate-400 shrink-0" />
                <span>{guestsCount} чел.</span>
              </div>
            </div>
            
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Сумма</p>
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <CreditCard size={16} className="text-slate-400 shrink-0" />
                {/* ✅ Если есть скидка, показываем зачеркнутую старую цену */}
                {appliedBonuses > 0 ? (
                  <span>
                    <span className="line-through text-slate-300 text-xs mr-2">{totalPrice}</span>
                    <span className="text-emerald-400 font-bold">{finalPrice || totalPrice - appliedBonuses} {tour?.currency || 'MDL'}</span>
                  </span>
                ) : (
                  <span>{totalPrice} {tour?.currency || 'MDL'}</span>
                )}
              </div>
            </div>

            {/* ✅ Метод оплаты */}
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Оплата</p>
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <span className="text-xs">{paymentLabel}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── ЛИНИЯ ОТРЫВА (ПЕРФОРАЦИЯ) ─────────────────────────────────── */}
      <div className="hidden md:flex flex-col items-center justify-between relative w-6 border-l-2 border-dashed border-white/10 my-4 z-10">
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

        {/* ✅ НАСТОЯЩИЙ QR Code */}
        <div className="p-2 bg-white rounded-xl mb-6 shadow-inner hidden md:block opacity-90 hover:opacity-100 transition-all duration-300">
           <QRCode 
             size={90} 
             value={`https://evatur.club/admin/scan?id=${displayId}`} 
             viewBox={`0 0 90 90`} 
             level="M" // Оптимальный уровень коррекции ошибок
           />
        </div>

        <div className="w-full flex md:flex-col justify-between items-center">
          <div className="text-left md:text-center mb-0 md:mb-4">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Booking Ref</p>
            {/* ✅ Реальный ID билета */}
            <p className="text-sm font-mono text-slate-300 font-bold tracking-wider">#{displayId}</p>
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