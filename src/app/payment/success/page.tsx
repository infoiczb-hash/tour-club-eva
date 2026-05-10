// src/app/payment/success/page.tsx
import React from 'react';
import Link from 'next/link';
import crypto from 'crypto';
import { 
  CheckCircle, Calendar, CreditCard, ArrowRight, 
  Clock, Mail, Send, UserPlus 
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { apbClient } from '@/lib/apb/client';
import { env } from '@/lib/env';
import { Resend } from 'resend';
import { BookingTicketEmail } from '@/features/tours/emails/BookingTicketEmail';
import { publishToTelegram } from '@/features/admin/actions/telegram';
import { revalidatePath } from 'next/cache';

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    [key: string]: string | undefined;
  }>;
}) {
  const params = await searchParams;
  
  // 1. НАДЕЖНАЯ НОРМАЛИЗАЦИЯ (Защита от разного регистра параметров банка)
  const normalized: Record<string, string> = {};
  for (const [k, v] of Object.entries(params || {})) {
    if (v) normalized[k.toLowerCase()] = v;
  }

  const invoiceId = normalized.invoiceid;
  const sum = normalized.paymentsum;
  const curr = normalized.paymentcurrcode || normalized.paymentcurrency;
  const date = normalized.date;
  const sig = normalized.signaturevalue || normalized.signature;

  if (!invoiceId) return notFound();

  // Загружаем бронь из базы
  let booking = await prisma.booking.findUnique({
    where: { apbInvoiceId: invoiceId },
    include: { tour: true, tourDate: true },
  });

  if (!booking) return notFound();

  let isPending = booking.status === 'awaiting_payment' || booking.status === 'pending';

  // 2. ЛОКАЛЬНАЯ ПРОВЕРКА ПОДПИСИ (Главный гарант)
  let isSignatureValid = false;
  // По документации АПБ SuccessURL подписывается с константой 'paid'
// Банк присылает дату в формате DD.MM.YYYY, но MD5 требует DDMMYYYY (без точек)
const normalizedDate = date?.replace(/\./g, '') ?? '';
if (invoiceId && sum && curr && normalizedDate && sig && env.APB_MERCHANT_PASS) {
  const hashStr = `${invoiceId}:paid:${sum}:${curr}:${normalizedDate}:${env.APB_MERCHANT_PASS}`;
    const expectedSig = crypto.createHash('md5').update(hashStr).digest('hex');
    
    if (expectedSig.toLowerCase() === sig.toLowerCase()) {
      isSignatureValid = true;
    }
  }

  // 3. ПРЯМОЕ ОБНОВЛЕНИЕ БАЗЫ (Без глючных fetch-запросов)
  if (isPending) {
    if (isSignatureValid) {
      isPending = false; // Снимаем лоадер
      
      try {
        // Мгновенно обновляем БД
        booking = await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: 'confirmed',
            paidAt: new Date(),
            amountPaid: booking.totalPrice,
            confirmedAt: new Date(),
            confirmedBy: 'APB_PAGE_AUTO', // Пометка, что оплата прошла через страницу
          },
          include: { tour: true, tourDate: true },
        });

        // Отправляем уведомление администраторам в Telegram
        const msg = [
          `🟢 <b>Оплата подтверждена (SuccessPage)</b>`,
          `🆔 Бронь #<b>${booking.shortId}</b>`,
          `🏦 Invoice: <code>${booking.apbInvoiceId}</code>`,
          `👤 ${booking.name ?? 'Клиент'} | 📞 ${booking.phone}`,
          `🏕 ${booking.tour.title}`,
          `💰 ${booking.totalPrice} ${booking.tour.currency}`
        ].join('\n');
        await publishToTelegram(msg, undefined, undefined, false, { messageThreadId: env.TELEGRAM_TOPIC_BOOKINGS });

        // Отправляем билет клиенту на Email
        const clientEmail = booking.email || (booking.social && booking.social.includes('@') ? booking.social : null);
        if (clientEmail) {
          const resend = new Resend(env.RESEND_API_KEY);
          const ticketsCount = (booking.ticketsAdult || 0) + (booking.ticketsChild || 0) + ((booking.ticketsFamily || 0) * 3) + (booking.ticketsMember || 0);

          await resend.emails.send({
            from: 'Турклуб EVA <info@evatur.club>',
            to: clientEmail,
            subject: `Ваш билет: ${booking.tour.title} 🏕️`,
            react: BookingTicketEmail({
              name: booking.name || 'Путешественник',
              tourTitle: booking.tour.title,
              tourDate: booking.tourDate?.startDate ? new Date(booking.tourDate.startDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : 'Открытая дата',
              shortId: booking.shortId || booking.id.slice(-6).toUpperCase(),
              totalPrice: booking.totalPrice,
              currency: booking.tour.currency,
              paymentMethod: booking.paymentMethod || 'online_card',
              ticketsCount: ticketsCount > 0 ? ticketsCount : 1,
              siteUrl: env.NEXT_PUBLIC_SITE_URL
            })
          });
        }
        
        // Сбрасываем кэш, чтобы админка обновилась
        revalidatePath('/admin');
        revalidatePath('/account/bookings');
      } catch (e) {
        console.error('[PAYMENT_SUCCESS] Ошибка прямого обновления БД:', e);
      }
    } else {
      // Запасной план: если подписи в URL нет или она неверна, дергаем SOAP АПБ
      try {
        const state = await apbClient.getPaymentState(invoiceId);
        if (state.isPaid) isPending = false;
      } catch (error) {
        console.error('[PAYMENT_SUCCESS] Ошибка SOAP-проверки:', error);
      }
    }
  }

  const isEmail = !!booking.email;
  const isGuest = !booking.memberId;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-in fade-in zoom-in-95 duration-500">
        
        <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="flex justify-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isPending ? 'bg-amber-500/20 text-amber-500' : 'bg-teal-500/20 text-teal-500'}`}>
              {isPending ? <Clock size={48} strokeWidth={2.5} className="animate-pulse" /> : <CheckCircle size={48} strokeWidth={2.5} />}
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">
              {isPending ? 'Проверка оплаты' : 'Оплата принята!'}
            </h1>
            <div className="text-slate-400 text-sm min-h-[40px] flex items-center justify-center gap-2">
              {isPending ? (
                'Подтверждаем транзакцию в банке...'
              ) : (
                <>
                  {isEmail ? <Mail size={14} className="text-teal-500" /> : <Send size={14} className="text-teal-500" />}
                  <span>Билет отправлен в {isEmail ? 'почту' : 'ваш Telegram'}</span>
                </>
              )}
            </div>
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
                  {booking.tourDate?.startDate ? new Date(booking.tourDate.startDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : 'Открытая'}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                  <CreditCard size={10} /> Сумма
                </div>
                <p className="text-xs font-bold text-slate-200">{booking.totalPrice} {booking.tour.currency}</p>
              </div>
            </div>
          </div>

          <Link 
            href={isGuest ? "/" : `/account/bookings/${booking.id}`}
            className="w-full py-4 bg-teal-500 hover:bg-teal-400 text-slate-900 font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
          >
            {isGuest ? 'На главную' : 'Детали бронирования'} <ArrowRight size={18} />
          </Link>
        </div>

        {isGuest && (
          <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 text-center space-y-4">
            <div className="space-y-1">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">Сохраните этот билет</h3>
              <p className="text-slate-400 text-[11px]">Создайте личный кабинет, чтобы всегда иметь доступ к точке сбора, контактам гида и истории поездок.</p>
            </div>
            
            <Link 
              href="/login" 
              className="w-full py-3 bg-white/5 border border-white/10 text-white font-bold text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
            >
              <UserPlus size={16} /> Создать аккаунт
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}