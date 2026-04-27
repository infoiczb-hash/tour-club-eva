// src/app/payment/success/page.tsx
import React from 'react';
import Link from 'next/link';
import { CheckCircle, Calendar, CreditCard, ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: { invoiceId?: string };
}) {
  const invoiceId = searchParams.invoiceId;

  if (!invoiceId) {
    return notFound();
  }

  // Загружаем данные бронирования для отображения контента
  const booking = await prisma.booking.findUnique({
    where: { apbInvoiceId: invoiceId },
    include: {
      tour: true,
      tourDate: true,
    },
  });

  if (!booking) {
    return notFound();
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-teal-500/20 rounded-full flex items-center justify-center text-teal-500">
            <CheckCircle size={48} strokeWidth={2.5} />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">
            Оплата получена!
          </h1>
          <p className="text-slate-400 text-sm">
            Мы успешно зафиксировали транзакцию на стороне банка.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left space-y-4">
          <div className="flex justify-between items-start border-b border-white/5 pb-3">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Тур</p>
              <p className="text-sm font-bold text-white line-clamp-1">{booking.tour.title}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Заказ</p>
              <p className="text-sm font-bold text-teal-400">#{booking.shortId}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                <Calendar size={10} /> Дата
              </div>
              <p className="text-xs font-bold text-slate-200">
                {booking.tourDate 
                  ? new Date(booking.tourDate.startDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
                  : 'Открытая дата'}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                <CreditCard size={10} /> Сумма
              </div>
              <p className="text-xs font-bold text-slate-200">
                {booking.totalPrice} {booking.tour.currency}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <Link 
            href="/account/bookings"
            className="w-full py-4 bg-teal-500 hover:bg-teal-400 text-slate-900 font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
          >
            Мои бронирования <ArrowRight size={18} />
          </Link>
          
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Подтверждение и билет скоро придут вам на почту или в Telegram. 
            Если статус в личном кабинете обновится не сразу — не переживайте, банку нужно несколько минут для обработки вебхука.
          </p>
        </div>
      </div>
    </div>
  );
}