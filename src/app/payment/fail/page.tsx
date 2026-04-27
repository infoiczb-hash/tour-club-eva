// src/app/payment/fail/page.tsx
import React from 'react';
import Link from 'next/link';
import { XCircle, AlertCircle, RefreshCcw, MessageSquare } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export default async function PaymentFailPage({
  searchParams,
}: {
  searchParams: { invoiceId?: string };
}) {
  const invoiceId = searchParams.invoiceId;

  // Пытаемся найти бронь, чтобы дать контекстный ответ
  const booking = invoiceId 
    ? await prisma.booking.findUnique({ where: { apbInvoiceId: invoiceId }, include: { tour: true } })
    : null;

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center text-rose-500">
            <XCircle size={48} strokeWidth={2.5} />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">
            Оплата не прошла
          </h1>
          <p className="text-slate-400 text-sm">
            Транзакция была отклонена банком или отменена. Средства не были списаны.
          </p>
        </div>

        {booking && (
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 text-sm text-rose-200/80 italic">
            «{booking.tour.title}» — ваша бронь #{booking.shortId} всё еще активна. Вы можете попробовать оплатить её другим способом в личном кабинете.
          </div>
        )}

        <div className="space-y-3 pt-2">
          <Link 
            href="/account/bookings"
            className="w-full py-4 bg-white/10 hover:bg-white/20 text-white font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 border border-white/10"
          >
            <RefreshCcw size={18} /> Попробовать снова
          </Link>
          
          <Link 
            href="/#contact"
            className="w-full py-4 bg-transparent text-slate-400 hover:text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <MessageSquare size={16} /> Нужна помощь с оплатой?
          </Link>
        </div>

        <div className="pt-4 border-t border-white/5">
          <div className="flex items-start gap-3 text-left bg-amber-500/5 p-4 rounded-xl border border-amber-500/20">
            <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-200/60 leading-normal">
              Возможные причины: недостаточно средств, превышен лимит операций, ошибка в данных карты или банк заблокировал платеж.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}