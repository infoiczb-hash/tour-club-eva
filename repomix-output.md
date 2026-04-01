This file is a merged representation of a subset of the codebase, containing specifically included files and files not matching ignore patterns, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of a subset of the repository's contents that is considered the most important context.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Only files matching these patterns are included: src/features/account, src/app/account
- Files matching these patterns are excluded: node_modules, .next, *.log
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
src/app/account/bookings/[id]/page.tsx
src/app/account/dashboard/page.tsx
src/app/account/history/page.tsx
src/app/account/layout.tsx
src/app/account/page.tsx
src/app/account/settings/page.tsx
src/app/account/tests/page.tsx
src/app/account/wishlist/page.tsx
src/features/account/actions/blogWishlist.ts
src/features/account/actions/getProfile.ts
src/features/account/actions/onboarding.ts
src/features/account/actions/saveTestResult.ts
src/features/account/actions/submitReview.ts
src/features/account/actions/toggleWishlist.ts
src/features/account/actions/transferSpot.ts
src/features/account/actions/updatePaymentMethod.ts
src/features/account/actions/updateSettings.ts
src/features/account/actions/waitlist.ts
src/features/account/actions/wishlistActions.ts
src/features/account/components/AccountNav.tsx
src/features/account/components/AchievementsBox.tsx
src/features/account/components/BookingCard.tsx
src/features/account/components/CancelWaitlistButton.tsx
src/features/account/components/CategorySubscribeToggle.tsx
src/features/account/components/MemberQrCode.tsx
src/features/account/components/OnboardingModal.tsx
src/features/account/components/PaymentActionBlock.tsx
src/features/account/components/ReferralCard.tsx
src/features/account/components/ReviewFromCabinetButton.tsx
src/features/account/components/SettingsForm.tsx
src/features/account/components/TransferSpotButton.tsx
src/features/account/components/VirtualCard.tsx
src/features/account/components/WishlistToggle.tsx
```

# Files

## File: src/app/account/page.tsx
```typescript
import { redirect } from 'next/navigation';
export default function AccountPage() {
  redirect('/account/dashboard');
}
```

## File: src/features/account/actions/blogWishlist.ts
```typescript
// src/features/account/actions/blogWishlist.ts
'use server';

import { prisma } from '@/lib/prisma';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function toggleFavoritePostAction(postId: string) {
  try {
  const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { success: false, error: 'unauthorized' };

    const profile = await prisma.memberProfile.findUnique({
      where: { userId: user.id },
      select: { id: true }
    });

    if (!profile) return { success: false, error: 'profile_not_found' };

    // Проверяем, есть ли статья в избранном (предполагаем таблицу FavoritePost)
    const existing = await prisma.favoritePost.findUnique({
      where: {
        memberId_postId: {
          memberId: profile.id,
          postId: postId
        }
      }
    });

    if (existing) {
      await prisma.favoritePost.delete({ where: { id: existing.id } });
    } else {
      await prisma.favoritePost.create({
        data: {
          memberId: profile.id,
          postId: postId
        }
      });
    }

    revalidatePath('/account/wishlist');
    revalidatePath(`/blog`); 
    
    return { success: true, isFavorite: !existing };
  } catch (error) {
    console.error('Toggle post favorite error:', error);
    return { success: false, error: 'server_error' };
  }
}
```

## File: src/features/account/actions/getProfile.ts
```typescript
'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { MemberProfile } from '@prisma/client'; // 👈 Строгий тип из Prisma

export async function getMyProfileAction(): Promise<MemberProfile | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    const profile = await prisma.memberProfile.findUnique({ 
      where: { userId: user.id } 
    });
    
    return profile;
  } catch (error) {
    console.error('Ошибка при получении профиля:', error);
    return null;
  }
}
```

## File: src/features/account/actions/toggleWishlist.ts
```typescript
// src/features/account/actions/toggleWishlist.ts
"use server";

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function toggleWishlistAction(tourId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Если юзер не авторизован, возвращаем флаг needsAuth
    if (!user) return { success: false, needsAuth: true };

    const profile = await prisma.memberProfile.findUnique({ 
      where: { userId: user.id } 
    });

    if (!profile) return { success: false, error: 'Профиль не найден' };

    // Проверяем, есть ли уже этот тур в избранном
    const existing = await prisma.watchList.findFirst({
      where: { memberId: profile.id, tourId }
    });

    if (existing) {
      // Если есть — удаляем
      await prisma.watchList.delete({ where: { id: existing.id } });
    } else {
      // Если нет — добавляем
      await prisma.watchList.create({
        data: { memberId: profile.id, tourId }
      });
    }

    // Сбрасываем кэш, чтобы счетчики в шапке/кабинете обновились
    revalidatePath('/tour');
    revalidatePath('/account');
    
    return { success: true, isWished: !existing };
  } catch (error) {
    console.error('Ошибка в toggleWishlistAction:', error);
    return { success: false, error: 'Ошибка сервера' };
  }
}
```

## File: src/features/account/actions/updatePaymentMethod.ts
```typescript
// src/features/account/actions/updatePaymentMethod.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updatePaymentMethodAction(bookingId: string, paymentMethod: string) {
  try {
    // 1. Сначала проверяем текущее состояние брони
    const current = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { status: true }
    });

    if (!current) {
      return { success: false, error: 'Бронирование не найдено' };
    }

    if (current.status === 'confirmed') {
      return { success: false, error: 'Билет уже оплачен, смена метода невозможна' };
    }

    // 2. Определяем новый статус (cash -> pending, остальные -> awaiting_payment)
    const newStatus = paymentMethod === 'cash' ? 'pending' : 'awaiting_payment';

    // 3. Обновляем данные и ОЧИЩАЕМ старые чеки/ошибки
    await prisma.booking.update({
      where: { id: bookingId },
      data: { 
        paymentMethod,
        status: newStatus,
        receiptUrl: null,   // Сбрасываем старый скриншот чека
        rejectReason: null, // Удаляем старую причину отказа менеджером
      }
    });

    // 4. Очищаем кэш по всем направлениям, чтобы клиент сразу увидел изменения
    revalidatePath(`/account/bookings/${bookingId}`);
    revalidatePath('/account/bookings');
    revalidatePath('/account/dashboard');
    
    return { success: true };

  } catch (error) {
    console.error('[Action] Update Payment Method Error:', error);
    return { success: false, error: 'Не удалось обновить способ оплаты. Попробуйте еще раз.' };
  }
}
```

## File: src/features/account/components/CancelWaitlistButton.tsx
```typescript
'use client';

import { useTransition } from 'react';
import { XCircle, Loader2 } from 'lucide-react';
import { cancelWaitlistAction } from '../actions/waitlist';
import { useToast } from '@/shared/context/ToastContext';

export default function CancelWaitlistButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault(); // Останавливаем переход по ссылке (карточке)
    if (!confirm('Вы уверены, что хотите отменить заявку в лист ожидания?')) return;

    startTransition(async () => {
      const res = await cancelWaitlistAction(id);
      if (res.success) {
        showToast('Заявка успешно отменена', 'success');
      } else {
        showToast(res.error || 'Ошибка при отмене', 'error');
      }
    });
  };

  return (
    <button
      onClick={handleCancel}
      disabled={isPending}
      className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/60 hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
      title="Отменить заявку"
    >
      {isPending ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
      <span className="hidden sm:inline">Отменить</span>
    </button>
  );
}
```

## File: src/features/account/components/CategorySubscribeToggle.tsx
```typescript
'use client';

import { useState, useTransition } from 'react';
import { Bell, BellOff, Loader } from 'lucide-react';
import { toggleCategorySubscription } from '@/features/account/actions/wishlistActions';
import { clsx } from 'clsx';

interface CategorySubscribeToggleProps {
  categoryId: string;
  memberId: string;
  title: string;
  icon: string;
  isSubscribed: boolean;
  colorBg: string;
  colorText: string;
  colorBorder: string;
}

export default function CategorySubscribeToggle({
  categoryId,
  memberId,
  title,
  icon,
  isSubscribed: initialSubscribed,
  colorBg,
  colorText,
  colorBorder,
}: CategorySubscribeToggleProps) {
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const next = !subscribed;
    setSubscribed(next); // оптимистичный апдейт

    startTransition(async () => {
      const result = await toggleCategorySubscription({
        categoryId,
        memberId,
        subscribe: next,
      });
      // Откатываем если ошибка
      if (!result.success) setSubscribed(!next);
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={clsx(
        'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left',
        subscribed
          ? `${colorBg} ${colorText} ${colorBorder}`
          : 'bg-slate-900/60 border-white/5 text-slate-300 hover:border-white/10 hover:text-slate-300'
      )}
    >
      <span className="text-base leading-none">{icon}</span>
      <span className="flex-1 text-xs font-bold truncate">{title}</span>
      {isPending ? (
        <Loader size={12} className="animate-spin shrink-0" />
      ) : subscribed ? (
        <Bell size={12} className="shrink-0" />
      ) : (
        <BellOff size={12} className="shrink-0 opacity-40" />
      )}
    </button>
  );
}
```

## File: src/features/account/components/MemberQrCode.tsx
```typescript
"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface MemberQrCodeProps {
  bookingShortId: number;      // Booking.shortId (Int, уникальный)
  tourTitle: string;           // Tour.title
  tourStartDate?: Date | null; // TourDate.startDate (Date из Prisma)
  size?: number;
}

export default function MemberQrCode({
  bookingShortId,
  tourTitle,
  tourStartDate,
  size = 140,
}: MemberQrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const payload = JSON.stringify({
      id:   String(bookingShortId),
      tour: tourTitle,
      date: tourStartDate
        ? tourStartDate.toLocaleDateString("ru-RU", {
            day: "numeric", month: "long", year: "numeric",
          })
        : "Дата уточняется",
    });

    QRCode.toCanvas(canvasRef.current, payload, {
      width: size,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
      errorCorrectionLevel: "M",
    }).catch((err) => {
      console.error("[MemberQrCode]", err);
    });
  }, [bookingShortId, tourTitle, tourStartDate, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded-xl"
      style={{ imageRendering: "pixelated" }}
      aria-label={`QR брони #${bookingShortId}`}
    />
  );
}
```

## File: src/features/account/components/PaymentActionBlock.tsx
```typescript
// src/features/account/components/PaymentActionBlock.tsx
'use client';

import React, { useState } from 'react';
import { Send, Link as LinkIcon, AlertCircle, RefreshCw, CheckCircle, CreditCard, QrCode, Banknote, Globe, Eye } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { updatePaymentMethodAction } from '../actions/updatePaymentMethod';

interface PaymentActionBlockProps {
  bookingId: string;
  shortId: number;
  status: string;
  paymentMethod: string;
  totalPrice: number;
  amountPaid: number;
  currency: string;
  receiptUrl?: string | null;
  rejectReason?: string | null;
  biletpmrLink?: string | null;
  apbQrLink?: string | null;
  apbQrImage?: string | null;
}

export const PaymentActionBlock: React.FC<PaymentActionBlockProps> = ({
  bookingId, shortId, status, paymentMethod, totalPrice, amountPaid, currency,
  receiptUrl, rejectReason, biletpmrLink, apbQrLink, apbQrImage
}) => {
  const [isChangingMethod, setIsChangingMethod] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const botDeepLink = `https://t.me/authevaclub_bot?start=${shortId}`;
  const managerLink = `https://t.me/romansvtirase`;
  const amountToPay = totalPrice - amountPaid;

  const defaultApbImage = process.env.NEXT_PUBLIC_DEFAULT_APB_IMAGE || "/images/default-apb-qr.png";
  const finalApbImage = apbQrImage || defaultApbImage;
  const finalApbLink = apbQrLink || process.env.NEXT_PUBLIC_DEFAULT_APB_LINK || "#";

  const isConfirmed = status === 'confirmed';
  const isModeration = status === 'moderation';
  const isRejected = status === 'rejected';
  const isAwaiting = status === 'awaiting_payment' || status === 'pending';

  const handleChangeMethod = async (newMethod: string) => {
    setIsLoading(true);
    await updatePaymentMethodAction(bookingId, newMethod);
    setIsChangingMethod(false);
    setIsLoading(false);
  };

  // Если всё оплачено
  if (isConfirmed) {
    return (
      <div className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-col items-center justify-center gap-2">
        <CheckCircle className="text-emerald-500 w-8 h-8" />
        <span className="text-emerald-400 font-bold text-sm uppercase tracking-widest">Билет оплачен</span>
        {receiptUrl && (
          <a href={receiptUrl} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-1.5 text-xs text-emerald-500/70 hover:text-emerald-400 transition-colors">
            <Eye size={14} /> Посмотреть чек
          </a>
        )}
      </div>
    );
  }

  // Если на проверке
  if (isModeration) {
    return (
      <div className="w-full bg-sky-500/10 border border-sky-500/20 rounded-2xl p-5 text-center flex flex-col items-center">
        <RefreshCw className="text-sky-400 w-8 h-8 mb-3 animate-spin-slow" />
        <h3 className="text-sky-400 font-bold text-sm uppercase tracking-widest mb-2">Чек на проверке</h3>
        <p className="text-xs text-sky-200/70 mb-4 max-w-xs">
          Мы получили ваш скриншот. Менеджер проверит его в ближайшее время, и статус билета обновится автоматически.
        </p>
        {receiptUrl && (
          <a href={receiptUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-sky-500/20 text-sky-400 rounded-lg text-xs font-bold transition-colors hover:bg-sky-500/30">
            <Eye size={14} /> Открытый чек
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Алерт об ошибке (Если отклонено) */}
      {isRejected && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex gap-3 items-start">
          <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="text-rose-400 font-bold text-sm mb-1">Оплата не подтверждена</h4>
            <p className="text-xs text-rose-200/70">{rejectReason || 'Пожалуйста, проверьте скриншот и отправьте его заново.'}</p>
          </div>
        </div>
      )}

      {/* Блок с инструкциями по текущему методу */}
      <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-5 shadow-lg">
        {/* Шапка блока */}
        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">К оплате: <span className="text-white">{amountToPay} {currency}</span></span>
          <button 
            onClick={() => setIsChangingMethod(!isChangingMethod)}
            className="text-[12px] uppercase font-bold text-teal-500 hover:text-teal-400 transition-colors"
          >
            {isChangingMethod ? 'Отмена' : 'Изменить способ'}
          </button>
        </div>

        {/* Выбор нового метода */}
        {isChangingMethod ? (
          <div className="grid grid-cols-2 gap-2 mb-4 animate-in fade-in">
             <button onClick={() => handleChangeMethod('biletpmr')} disabled={isLoading} className="p-3 rounded-xl border border-white/5 bg-slate-950 hover:border-teal-500/50 flex flex-col gap-1 items-start transition-all disabled:opacity-50">
               <CreditCard size={14} className="text-teal-500" />
               <span className="text-xs font-bold text-slate-300">BiletPMR</span>
             </button>
             <button onClick={() => handleChangeMethod('qr')} disabled={isLoading} className="p-3 rounded-xl border border-white/5 bg-slate-950 hover:border-teal-500/50 flex flex-col gap-1 items-start transition-all disabled:opacity-50">
               <QrCode size={14} className="text-teal-500" />
               <span className="text-xs font-bold text-slate-300">Клевер QR.</span>
             </button>
             <button onClick={() => handleChangeMethod('cash')} disabled={isLoading} className="p-3 rounded-xl border border-white/5 bg-slate-950 hover:border-teal-500/50 flex flex-col gap-1 items-start transition-all disabled:opacity-50">
               <Banknote size={14} className="text-teal-500" />
               <span className="text-xs font-bold text-slate-300">Наличные</span>
             </button>
             <button onClick={() => handleChangeMethod('foreign')} disabled={isLoading} className="p-3 rounded-xl border border-white/5 bg-slate-950 hover:border-teal-500/50 flex flex-col gap-1 items-start transition-all disabled:opacity-50">
               <Globe size={14} className="text-teal-500" />
               <span className="text-xs font-bold text-slate-300">Иностранцы</span>
             </button>
          </div>
        ) : (
          /* Инструкции в зависимости от выбранного метода */
          <div className="space-y-4 animate-in fade-in">
            {paymentMethod === 'biletpmr' && (
              <>
                <p className="text-xs text-slate-300 leading-relaxed">Оплатите билеты онлайн через систему biletPmr.  После оплаты отправьте PDF/скрин-билета в наш Telegram бот.</p>
                <div className="flex flex-col gap-2">
                  {biletpmrLink && (
                    <Link href={biletpmrLink} target="_blank" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-colors">
                      <LinkIcon size={16} /> Перейти к оплате
                    </Link>
                  )}
                  <Link href={botDeepLink} target="_blank" className="w-full py-3 bg-[#2AABEE] hover:bg-[#229ED9] text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-colors">
                    <Send size={16} /> Отправить билет
                  </Link>
                </div>
              </>
            )}

            {paymentMethod === 'qr' && (
              <>
                <p className="text-xs text-slate-300 leading-relaxed">Отсканируйте QR-код. После перевода <strong>обязательно</strong> отправьте скриншот чека в Telegram.</p>
                <div className="flex justify-center bg-white p-2 rounded-xl w-fit mx-auto">
                  <Image src={finalApbImage} alt="QR" width={120} height={120} className="rounded-lg object-contain" />
                </div>
                <div className="flex flex-col gap-2 mt-2">
                  <Link href={finalApbLink} target="_blank" className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-colors">
                    <LinkIcon size={16} /> Ссылка (Клевер)
                  </Link>
                  <Link href={botDeepLink} target="_blank" className="w-full py-3 bg-[#2AABEE] hover:bg-[#229ED9] text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-colors shadow-[0_0_15px_rgba(42,171,238,0.2)]">
                    <Send size={16} /> Отправить чек
                  </Link>
                </div>
              </>
            )}

            {paymentMethod === 'cash' && (
              <>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Оплата гиду на месте (без сдачи). Если вы решили оплатить наличкой через платежные терминалы АПБ (ТурКлуб "Эва"), отправьте квитанцию в наш Телеграмм бот.
                </p>
                <Link href={botDeepLink} target="_blank" className="w-full py-3 bg-[#2AABEE] hover:bg-[#229ED9] text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-colors">
                  <Send size={16} /> Отправить квитанцию
                </Link>
              </>
            )}

            {paymentMethod === 'foreign' && (
              <>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">Для перевода свяжитесь напрямую с нашими менеджерами.</p>
                <Link href={managerLink} target="_blank" className="w-full py-3 bg-[#2AABEE] hover:bg-[#229ED9] text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-colors">
                  Написать менеджеру (Telegram)
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
```

## File: src/app/account/settings/page.tsx
```typescript
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import SettingsForm from '@/features/account/components/SettingsForm';

export const dynamic = 'force-dynamic';
export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login?next=/account/settings');

  const profile = await prisma.memberProfile.findUnique({
    where: { userId: user.id }
  });

  if (!profile) redirect('/login?next=/account/settings');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Настройки профиля</h1>
        <p className="text-sm text-slate-300">Ваша походная карточка. Заполните её один раз, чтобы мы учитывали это во всех турах.</p>
      </div>

      <SettingsForm profile={profile} />
    </div>
  );
}
```

## File: src/features/account/actions/onboarding.ts
```typescript
'use server';

import { prisma } from '@/lib/prisma';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Функция расчета уровня (Синхронизирована с новым LevelsInfoModal)
function getLevel(tourCount: number): string {
  if (tourCount >= 21) return 'Легенда';
  if (tourCount >= 11) return 'Мастер троп';
  if (tourCount >= 6)  return 'Следопыт';
  if (tourCount >= 3)  return 'Искатель';
  return 'Первопроходец';
}

export async function saveOnboardingDataAction(phoneRaw: string, name: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Не авторизован' };

  // Очищаем номер от пробелов, чтобы искать в базе корректно
  const phone = phoneRaw.replace(/[^\d+]/g, '');
  
  if (phone.length < 10) {
    return { success: false, error: 'Введен некорректный номер телефона' };
  }

  // ✅ НОВОЕ: Валидация имени
  if (!name || name.trim().length < 2) {
    return { success: false, error: 'Пожалуйста, введите ваше реальное имя' };
  }

  try {
    // 1. ЗАЩИТА ОТ УГОНА: Проверяем, не занят ли этот номер кем-то другим
    const existing = await prisma.memberProfile.findUnique({ where: { phone } });
    if (existing && existing.userId !== user.id) {
      return { success: false, error: 'Этот номер уже привязан к другому аккаунту' };
    }

    // 2. Сохраняем телефон и ИМЯ юзеру
    const profile = await prisma.memberProfile.update({
      where: { userId: user.id },
      data: { 
        phone,
        name: name.trim() // ✅ Добавили сохранение имени
      }
    });

    // 3. МАГИЯ: Ищем все исторические брони по этому номеру, у которых еще нет memberId
    const linkedBookings = await prisma.booking.updateMany({
      where: { 
        phone: phone, 
        memberId: null 
      },
      data: { memberId: profile.id },
    });

    // ✅ НОВОЕ: Привязываем Листы ожидания (раз мы сделали это на дашборде)
    await prisma.waitlist.updateMany({
      where: { 
        phone: phone, 
        memberId: null 
      },
      data: { memberId: profile.id },
    });

    // 4. ПЕРЕСЧЕТ: Если нашли старые брони — пересчитываем статусы и километраж
    if (linkedBookings.count > 0) {
      const stats = await prisma.booking.aggregate({
        where: { memberId: profile.id, status: { not: 'cancelled' } },
        _count: { id: true },
      });

      const bookingsWithTours = await prisma.booking.findMany({
        where: { memberId: profile.id, status: { not: 'cancelled' } },
        include: { tour: { select: { distance: true } } },
      });

      const totalKm = bookingsWithTours.reduce((sum, b) => {
        const km = parseFloat(b.tour?.distance ?? '0');
        return sum + (isNaN(km) ? 0 : km);
      }, 0);

      const tourCount = stats._count.id;
      await prisma.memberProfile.update({
        where: { id: profile.id },
        data: { 
          totalTours: tourCount, 
          totalKm, 
          level: getLevel(tourCount) 
        },
      });
    }

    revalidatePath('/account', 'layout'); // Сбрасываем кэш всего ЛК
    return { success: true, linkedCount: linkedBookings.count };
    
  } catch (error) {
    console.error('Onboarding Action Error:', error);
    return { success: false, error: 'Произошла ошибка при сохранении данных' };
  }
}
```

## File: src/features/account/actions/updateSettings.ts
```typescript
// src/features/account/actions/updateSettings.ts
'use server';

import { prisma } from '@/lib/prisma';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const SettingsSchema = z.object({
  name: z.string().min(2, "Имя обязательно"),
  email: z.string().email("Неверный формат email").or(z.literal("")).optional().nullable(),
  telegram: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  viber: z.string().optional().nullable(),
  foodPref: z.string().optional().nullable(),
  shoeSize: z.string().optional().nullable(),
  clothesSize: z.string().optional().nullable(),
  lifeJacketSize: z.string().optional().nullable(),
  inventory: z.array(z.string()).default([]),
});

export type SettingsInput = z.infer<typeof SettingsSchema>;

export async function updateProfileSettingsAction(data: SettingsInput) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Необходима авторизация' };
  }

  const parsed = SettingsSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Проверьте правильность заполнения полей' };
  }

  try {
    await prisma.memberProfile.update({
      where: { userId: user.id },
      data: {
        name: parsed.data.name,
        email: parsed.data.email || null,
        telegram: parsed.data.telegram || null,
        instagram: parsed.data.instagram || null,
        viber: parsed.data.viber || null,
        foodPref: parsed.data.foodPref || null,
        shoeSize: parsed.data.shoeSize || null,
        clothesSize: parsed.data.clothesSize || null,
        lifeJacketSize: parsed.data.lifeJacketSize || null,
        inventory: parsed.data.inventory,
      }
    });

    revalidatePath('/account/settings');
    revalidatePath('/account/dashboard');
    
    return { success: true };
  } catch (error) {
    console.error('Update Settings Error:', error);
    return { success: false, error: 'Ошибка сохранения в базу данных' };
  }
}
```

## File: src/features/account/actions/waitlist.ts
```typescript
'use server';

import { prisma } from '@/lib/prisma';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function cancelWaitlistAction(waitlistId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Необходима авторизация' };

    const profile = await prisma.memberProfile.findUnique({ 
      where: { userId: user.id } 
    });

    if (!profile || !profile.phone) {
      return { success: false, error: 'Профиль или телефон не найдены' };
    }

    // Проверяем, что заявка принадлежит именно этому пользователю
    const waitlist = await prisma.waitlist.findUnique({ 
      where: { id: waitlistId } 
    });

    if (!waitlist || waitlist.phone !== profile.phone) {
      return { success: false, error: 'Заявка не найдена или вам не принадлежит' };
    }

    await prisma.waitlist.delete({ where: { id: waitlistId } });
    
    // Сбрасываем кэш страницы броней
    revalidatePath('/account/bookings');
    return { success: true };
  } catch (error) {
    console.error('Cancel Waitlist Error:', error);
    return { success: false, error: 'Внутренняя ошибка сервера' };
  }
}

export async function joinWaitlistAction({
  tourId,
  tourDateId,
  name,
  phone,
  social,
}: {
  tourId:      string;
  tourDateId?: string;
  name:        string;
  phone?:      string;
  social?:     string;
}) {
  try {
    // Пробуем получить авторизованного пользователя (необязательно)
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    let memberId: string | null = null;

    if (user) {
      const profile = await prisma.memberProfile.findUnique({
        where: { userId: user.id },
        select: { id: true, phone: true, name: true },
      });
      if (profile) {
        memberId = profile.id;
        // Подставляем данные профиля если не переданы
        name  = name  || profile.name  || '';
        phone = phone || profile.phone || undefined;
      }
    }

    // Защита от дублей — один телефон на один тур
    if (phone) {
      const existing = await prisma.waitlist.findFirst({
        where: { tourId, phone },
      });
      if (existing) {
        return { success: false, error: 'Вы уже в списке ожидания на этот тур' };
      }
    }

    await prisma.waitlist.create({
      data: {
        tourId,
        tourDateId: tourDateId || null,
        memberId:   memberId   || null,
        name,
        phone:      phone  || null,
        social:     social || null,
      },
    });

    revalidatePath(`/tour`);
    return { success: true };
  } catch (error) {
    console.error('Join Waitlist Error:', error);
    return { success: false, error: 'Внутренняя ошибка сервера' };
  }
}
```

## File: src/features/account/actions/wishlistActions.ts
```typescript
'use server';

import { prisma } from '@/lib/prisma';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ─── Добавить / убрать тур из вишлиста ──────────────────────────────
interface ToggleWishlistInput {
  tourId: string;
  memberId: string;
  watchlistId?: string;
  inWishlist: boolean;
}

export async function toggleWishlist(input: ToggleWishlistInput) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { tourId, memberId, watchlistId, inWishlist } = input;

  // Убеждаемся что memberId принадлежит этому юзеру
  const profile = await prisma.memberProfile.findUnique({
    where: { userId: user.id, id: memberId },
  });
  if (!profile) return { success: false };

  if (inWishlist) {
    // Убрать из вишлиста
    if (watchlistId) {
      await prisma.watchList.delete({ where: { id: watchlistId } });
    } else {
      await prisma.watchList.deleteMany({
        where: { memberId, tourId },
      });
    }
  } else {
    // Добавить в вишлист (upsert — защита от дублей)
    await prisma.watchList.upsert({
      where: { memberId_tourId: { memberId, tourId } },
      create: { memberId, tourId },
      update: {},
    });
  }

  revalidatePath('/account/wishlist');
  return { success: true };
}

// ─── Подписаться / отписаться от категории ──────────────────────────
interface ToggleCategoryInput {
  categoryId: string;
  memberId: string;
  subscribe: boolean;
}

export async function toggleCategorySubscription(
  input: ToggleCategoryInput
): Promise<{ success: boolean }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { categoryId, memberId, subscribe } = input;

  const profile = await prisma.memberProfile.findUnique({
    where: { userId: user.id, id: memberId },
  });
  if (!profile) return { success: false };

  if (subscribe) {
    await prisma.watchList.upsert({
      where: { memberId_categoryId: { memberId, categoryId } },
      create: { memberId, categoryId },
      update: {},
    });
  } else {
    await prisma.watchList.deleteMany({
      where: { memberId, categoryId },
    });
  }

  revalidatePath('/account/wishlist');
  return { success: true };
}

// ─── Проверить входит ли тур в вишлист участника ────────────────────
// Используется на странице тура для отображения кнопки ♡
export async function getTourWishlistStatus(
  tourId: string
): Promise<{ inWishlist: boolean; watchlistId?: string; memberId?: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { inWishlist: false };

  const profile = await prisma.memberProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) return { inWishlist: false };

  const item = await prisma.watchList.findUnique({
    where: { memberId_tourId: { memberId: profile.id, tourId } },
  });

  return {
    inWishlist: !!item,
    watchlistId: item?.id,
    memberId: profile.id,
  };
}
```

## File: src/features/account/components/TransferSpotButton.tsx
```typescript
'use client';

import { useState, useTransition } from 'react';
import { ArrowLeftRight, X, Loader, CheckCircle } from 'lucide-react';
import { transferBookingSpot } from '@/features/account/actions/transferSpot';

interface TransferSpotButtonProps {
  bookingId: string;
  tourTitle: string;
  tourDate: string;
}

export default function TransferSpotButton({
  bookingId,
  tourTitle,
  tourDate,
}: TransferSpotButtonProps) {
  const [isOpen, setIsOpen]       = useState(false);
  const [phone, setPhone]         = useState('');
  const [name, setName]           = useState('');
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    setIsOpen(true);
    setError('');
    setPhone('');
    setName('');
    setSuccess(false);
  }

  function handleClose() {
    if (isPending) return;
    setIsOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!phone.trim() || phone.replace(/\D/g, '').length < 7) {
      setError('Введите корректный номер телефона');
      return;
    }
    if (!name.trim() || name.trim().length < 2) {
      setError('Введите имя (минимум 2 символа)');
      return;
    }

    startTransition(async () => {
      const result = await transferBookingSpot({
        bookingId,
        newPhone: phone.trim(),
        newName: name.trim(),
      });

      if (!result.success) {
        setError(result.error ?? 'Что-то пошло не так');
        return;
      }

      setSuccess(true);
      setTimeout(() => setIsOpen(false), 2000);
    });
  }

  const dateFormatted = new Date(tourDate).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long',
  });

  return (
    <>
      {/* Кнопка передачи */}
      <button
        onClick={handleOpen}
        className="px-3 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 rounded-xl transition-all"
        title="Передать место"
      >
        <ArrowLeftRight size={13} />
        <span className="hidden sm:inline">Передать</span>
      </button>

      {/* Модалка */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Оверлей */}
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Карточка */}
          <div className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl">

            {/* Закрыть */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-slate-300 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>

            {success ? (
              /* Успех */
              <div className="text-center py-4">
                <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
                <p className="text-white font-bold">Место передано!</p>
                <p className="text-sm text-slate-300 mt-1">
                  Новый участник получит подтверждение.
                </p>
              </div>
            ) : (
              /* Форма */
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h3 className="text-base font-black text-white mb-1">
                    Передать место
                  </h3>
                  <p className="text-xs text-slate-300">
                    {tourTitle} · {dateFormatted}
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                      Имя нового участника
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Имя Фамилия"
                      className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50 transition-all"
                      disabled={isPending}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                      Телефон нового участника
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+373 777 00 000"
                      className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50 transition-all"
                      disabled={isPending}
                    />
                  </div>

                  {error && (
                    <p className="text-xs text-red-400">{error}</p>
                  )}
                </div>

                <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-3">
                  <p className="text-xs text-amber-300 leading-relaxed">
                    После передачи ваша бронь будет отменена.
                    Возврат предоплаты — согласно условиям отмены.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-all"
                >
                  {isPending ? (
                    <Loader size={15} className="animate-spin" />
                  ) : (
                    <>
                      <ArrowLeftRight size={14} />
                      Передать место
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
```

## File: src/features/account/components/WishlistToggle.tsx
```typescript
'use client';

import { useTransition } from 'react';
import { Heart, Loader } from 'lucide-react';
import { toggleWishlist } from '@/features/account/actions/wishlistActions';

interface WishlistToggleProps {
  tourId: string;
  memberId: string;
  watchlistId?: string;
  inWishlist: boolean;
}

export default function WishlistToggle({
  tourId,
  memberId,
  watchlistId,
  inWishlist,
}: WishlistToggleProps) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleWishlist({ tourId, memberId, watchlistId, inWishlist });
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className="shrink-0 p-1 text-slate-300 hover:text-rose-400 transition-colors disabled:opacity-50"
      title={inWishlist ? 'Убрать из вишлиста' : 'Добавить в вишлист'}
    >
      {isPending ? (
        <Loader size={14} className="animate-spin" />
      ) : (
        <Heart
          size={14}
          className={inWishlist ? 'text-rose-400 fill-rose-400' : ''}
        />
      )}
    </button>
  );
}
```

## File: src/features/account/actions/transferSpot.ts
```typescript
'use server';

import { prisma } from '@/lib/prisma';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { publishToTelegram } from '@/features/admin/actions/telegram';

interface TransferInput {
  bookingId: string;
  newPhone: string;
  newName: string;
}

type TransferResult =
  | { success: true }
  | { success: false; error: string };

export async function transferBookingSpot(input: TransferInput): Promise<TransferResult> {
  // Проверяем авторизацию
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Необходима авторизация' };

  const { bookingId, newPhone, newName } = input;

  // Находим профиль
  const profile = await prisma.memberProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) return { success: false, error: 'Профиль не найден' };

  // Находим бронь — убеждаемся что она принадлежит этому участнику
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      memberId: profile.id,
      status: { in: ['pending', 'confirmed'] },
    },
    include: {
      tour: { select: { id: true, title: true, slug: true } },
      tourDate: { select: { id: true, startDate: true, spotsLeft: true, spots: true } },
    },
  });

  if (!booking) {
    return { success: false, error: 'Бронь не найдена или уже отменена' };
  }

  // Транзакция: отмена старой брони + создание новой
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Отменяем старую бронь
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'cancelled' },
      });

      // 2. Создаём новую бронь для нового участника
    const newBooking = await tx.booking.create({
  data: {
    name: newName,
    phone: newPhone,
    tourId: booking.tourId,
    tourDateId: booking.tourDateId,
    ticketsAdult: booking.ticketsAdult,
    ticketsChild: booking.ticketsChild,
    ticketsFamily: booking.ticketsFamily,
    ticketsMember: booking.ticketsMember,
    totalPrice: booking.totalPrice,
    source: 'transfer',
    status: 'confirmed',
    comment: `Передано от ${profile.name ?? profile.phone}`,
  },
});

      // 3. Привязываем новую бронь к профилю если новый участник уже зарегистрирован
      const newProfile = await tx.memberProfile.findUnique({
        where: { phone: newPhone },
      });
      if (newProfile) {
        await tx.booking.update({
          where: { id: newBooking.id },
          data: { memberId: newProfile.id },
        });
      }
    });

    // Уведомление в Telegram (не блокируем основной флоу)
    try {
      const dateStr = booking.tourDate
        ? booking.tourDate.startDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
        : 'дата не указана';

      await publishToTelegram(
        `🔄 Передача места\n` +
        `Тур: ${booking.tour.title} (${dateStr})\n` +
        `От: ${profile.name ?? profile.phone}\n` +
        `Кому: ${newName} ${newPhone}`
      );
    } catch {
      // Telegram уведомление не критично
    }

    revalidatePath('/account/bookings');
    return { success: true };

  } catch (err) {
    console.error('[transferBookingSpot]', err);
    return { success: false, error: 'Не удалось передать место. Попробуйте ещё раз.' };
  }
}
```

## File: src/features/account/components/AchievementsBox.tsx
```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Waves, Anchor, Sailboat, 
  Snowflake, Wind, Mountain, 
  Map, MapPin, 
  Footprints, Activity, 
  Flame, Tent, Lock, ChevronRight, X, CheckCircle2
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export interface UserAchievements {
  waterTours: number;
  winterTours: number;
  pmrTours: number;
  totalKm: number;
  totalNights: number;
}

// Конфигурация эволюции бейджей
const CATEGORIES = [
  {
    id: 'water',
    title: 'Водные туры',
    unit: 'сплав.',
    current: (stats: UserAchievements) => stats.waterTours || 0,
    tiers: [
      { min: 1, name: 'Матрос', icon: Sailboat, color: 'text-blue-300', bg: 'from-blue-600 to-indigo-900', shadow: 'shadow-blue-500/20' },
      { min: 3, name: 'Капитан', icon: Anchor, color: 'text-blue-400', bg: 'from-blue-500 to-blue-800', shadow: 'shadow-blue-500/40' },
      { min: 5, name: 'Хранитель реки', icon: Waves, color: 'text-cyan-300', bg: 'from-cyan-400 to-blue-700', shadow: 'shadow-cyan-500/50' },
    ]
  },
  {
    id: 'winter',
    title: 'Зимние походы',
    unit: 'тур.',
    current: (stats: UserAchievements) => stats.winterTours || 0,
    tiers: [
      { min: 1, name: 'Пингвин', icon: Wind, color: 'text-sky-300', bg: 'from-sky-600 to-slate-800', shadow: 'shadow-sky-500/20' },
      { min: 3, name: 'Полярник', icon: Snowflake, color: 'text-sky-400', bg: 'from-sky-500 to-indigo-800', shadow: 'shadow-sky-500/40' },
      { min: 5, name: 'Снежный барс', icon: Mountain, color: 'text-blue-200', bg: 'from-blue-400 to-sky-700', shadow: 'shadow-blue-400/50' },
    ]
  },
  {
    id: 'pmr',
    title: 'По Приднестровью',
    unit: 'тур.',
    current: (stats: UserAchievements) => stats.pmrTours || 0,
    tiers: [
      { min: 3, name: 'Краевед', icon: Map, color: 'text-emerald-300', bg: 'from-emerald-600 to-teal-900', shadow: 'shadow-emerald-500/20' },
      { min: 5, name: 'Знаток края', icon: MapPin, color: 'text-emerald-400', bg: 'from-emerald-500 to-emerald-800', shadow: 'shadow-emerald-500/40' },
    ]
  },
  {
    id: 'distance',
    title: 'Километраж',
    unit: 'км',
    current: (stats: UserAchievements) => stats.totalKm || 0,
    tiers: [
      { min: 50, name: 'Прогульщик', icon: Footprints, color: 'text-amber-300', bg: 'from-amber-600 to-orange-900', shadow: 'shadow-amber-500/20' },
      { min: 100, name: 'Железные ноги', icon: Activity, color: 'text-amber-400', bg: 'from-amber-500 to-orange-800', shadow: 'shadow-amber-500/40' },
      { min: 150, name: 'Следопыт', icon: Mountain, color: 'text-yellow-200', bg: 'from-yellow-500 to-amber-700', shadow: 'shadow-yellow-500/50' },
    ]
  },
  {
    id: 'nights',
    title: 'Ночевки в палатке',
    unit: 'ноч.',
    current: (stats: UserAchievements) => stats.totalNights || 0,
    tiers: [
      { min: 5, name: 'Мастер костра', icon: Flame, color: 'text-orange-300', bg: 'from-orange-600 to-red-900', shadow: 'shadow-orange-500/20' },
      { min: 10, name: 'Дикарь', icon: Tent, color: 'text-orange-400', bg: 'from-orange-500 to-red-800', shadow: 'shadow-orange-500/40' },
    ]
  }
];

export default function AchievementsBox({ stats }: { stats: UserAchievements }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Блокировка скролла при открытой модалке
  useEffect(() => {
    if (selectedCategory) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [selectedCategory]);

  // Просчет состояний для карточек
  const badges = CATEGORIES.map(category => {
    const currentVal = category.current(stats);
    
    // Находим индекс максимального достигнутого уровня
    const currentTierIndex = category.tiers.reduce((latestIndex, tier, index) => {
      if (currentVal >= tier.min) return index;
      return latestIndex;
    }, -1);

    const isUnlocked = currentTierIndex >= 0;
    const activeTier = isUnlocked ? category.tiers[currentTierIndex] : category.tiers[0];
    const nextTier = category.tiers[currentTierIndex + 1];

    // Высчитываем процент до следующей цели (или 100% если макс)
    let progressPercent = 100;
    if (!isUnlocked) {
      progressPercent = (currentVal / activeTier.min) * 100;
    } else if (nextTier) {
      // Прогресс внутри текущего уровня
      progressPercent = (currentVal / nextTier.min) * 100;
    }

    return {
      ...category,
      currentVal,
      isUnlocked,
      activeTier,
      nextTier,
      progressPercent: Math.min(Math.max(progressPercent, 0), 100) // Ограничиваем 0-100
    };
  });

  const unlockedCount = badges.filter(b => b.isUnlocked).length;
  const activeModalData = badges.find(b => b.id === selectedCategory);

  // МОДАЛКА ЭВОЛЮЦИИ (Выкидываем в Portal)
  const modalContent = activeModalData && mounted ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setSelectedCategory(null)}>
      <div className="relative w-full max-w-sm flex flex-col bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Шапка модалки */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-slate-900/95">
          <div>
            <h2 className="text-lg font-black text-white tracking-tight">{activeModalData.title}</h2>
            <p className="text-xs text-slate-300 mt-0.5">Ваш прогресс: {Math.floor(activeModalData.currentVal)} {activeModalData.unit}</p>
          </div>
          <button onClick={() => setSelectedCategory(null)} className="p-2 -mr-2 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Дерево эволюции */}
        <div className="p-6 space-y-4">
          {activeModalData.tiers.map((tier, idx) => {
            const isTierUnlocked = activeModalData.currentVal >= tier.min;
            const TierIcon = tier.icon;
            
            return (
              <div key={idx} className={cn(
                "relative flex items-center gap-4 p-4 rounded-2xl border transition-all",
                isTierUnlocked ? "bg-slate-800/60 border-white/10" : "bg-slate-900/40 border-white/5 opacity-60 grayscale"
              )}>
                {/* Линия соединения (дерево) */}
                {idx !== activeModalData.tiers.length - 1 && (
                  <div className="absolute left-9 top-14 bottom-[-16px] w-px bg-slate-700 z-0" />
                )}

                <div className={cn(
                  "relative z-10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br shadow-lg",
                  tier.bg, tier.color, isTierUnlocked ? tier.shadow : ""
                )}>
                  <TierIcon size={20} />
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className={cn("text-sm font-bold", isTierUnlocked ? "text-white" : "text-slate-300")}>{tier.name}</h4>
                    {isTierUnlocked ? (
                      <CheckCircle2 size={14} className="text-teal-500" />
                    ) : (
                      <Lock size={12} className="text-slate-600" />
                    )}
                  </div>
                  <p className="text-xs text-slate-300">
                    Цель: {tier.min} {activeModalData.unit}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  ) : null;

  return (
    <div className="bg-transparent md:bg-slate-800/40 md:border md:border-slate-700/50 md:rounded-3xl md:p-6 md:shadow-lg">
      
      {/* Шапка блока */}
      <div className="flex items-center justify-between mb-4 px-2 md:px-0">
        <div>
          <h3 className="text-white font-bold tracking-wider flex items-center gap-2">
            Достижения
          </h3>
          <p className="text-sm text-slate-300 mt-0.5">Собрано {unlockedCount} из {CATEGORIES.length}</p>
        </div>
        <ChevronRight size={20} className="text-slate-600 md:hidden" />
      </div>

      {/* Горизонтальный скролл на мобилке, сетка на десктопе */}
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-4 px-2 md:px-0 md:pb-0 md:grid md:grid-cols-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {badges.map((badge) => {
          const Icon = badge.activeTier.icon;
          
          return (
            <button 
              key={badge.id}
              onClick={() => setSelectedCategory(badge.id)}
              className={cn(
                "snap-start shrink-0 w-[120px] md:w-auto relative flex flex-col items-center p-4 rounded-[20px] border transition-all duration-300 group overflow-hidden focus:outline-none",
                badge.isUnlocked 
                  ? "bg-slate-900/80 border-white/10 hover:border-white/20 hover:bg-slate-800/80" 
                  : "bg-slate-900/40 border-white/5 opacity-70 grayscale hover:grayscale-0 hover:opacity-100"
              )}
            >
              {/* Замочек для закрытых */}
              {!badge.isUnlocked && (
                <div className="absolute top-3 right-3 text-slate-600">
                  <Lock size={12} />
                </div>
              )}
              
              {/* Градиентный "Щит" с иконкой */}
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-500 bg-gradient-to-br",
                badge.activeTier.bg,
                badge.isUnlocked ? badge.activeTier.shadow : "shadow-none"
              )}>
                <Icon size={26} strokeWidth={1.5} className={badge.activeTier.color} />
              </div>
              
              {/* Название */}
              <h4 className={cn("text-xs font-bold text-center mb-1 w-full truncate", badge.isUnlocked ? "text-white" : "text-slate-300")}>
                {badge.activeTier.name}
              </h4>
              
              {/* Тонкая линия прогресса в самом низу карточки */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-950/50">
                <div 
                  className={cn("h-full transition-all duration-1000", badge.isUnlocked ? "bg-teal-500" : "bg-slate-700")}
                  style={{ width: `${badge.progressPercent}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Рендер модалки */}
      {mounted && createPortal(modalContent, document.body)}

    </div>
  );
}
```

## File: src/features/account/components/OnboardingModal.tsx
```typescript
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { User, Phone, CheckCircle2, ArrowRight, Settings, Loader2 } from 'lucide-react';
import { saveOnboardingDataAction } from '@/features/account/actions/onboarding';

interface OnboardingModalProps {
  initialName?: string; // Сюда можно передать никнейм из Google/Telegram, если он есть
}

export default function OnboardingModal({ initialName = '' }: OnboardingModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (name.trim().length < 2) {
      setError('Пожалуйста, введите ваше реальное имя и фамилию.');
      return;
    }

    const cleanedPhone = phone.replace(/[^\d+]/g, '');
    if (cleanedPhone.length < 9) {
      setError('Пожалуйста, введите корректный номер телефона.');
      return;
    }

    startTransition(async () => {
      const res = await saveOnboardingDataAction(cleanedPhone, name);
      if (res.success) {
        setIsSuccess(true);
      } else {
        setError(res.error || 'Произошла ошибка. Попробуйте еще раз.');
      }
    });
  };

  const handleGoToSettings = () => {
    setIsOpen(false);
    router.push('/account/settings');
    router.refresh();
  };

  const handleGoToDashboard = () => {
    setIsOpen(false);
    router.push('/account/dashboard');
    router.refresh();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Глоу-эффект на фоне */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 blur-[80px] rounded-full pointer-events-none" />

        {isSuccess ? (
          <div className="text-center relative z-10 py-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-400 mb-6 shadow-inner border border-emerald-500/20">
              <CheckCircle2 size={40} />
            </div>
            
            {/* Берем только первое слово (имя), если человек ввел "Иван Иванов" */}
            <h2 className="text-2xl font-black text-white mb-3">Отлично, {name.split(' ')[0]}!</h2>
            
            <p className="text-sm text-slate-300 mb-8 leading-relaxed">
              Ваши прошлые поездки успешно найдены и привязаны к кабинету. <br /><br />
              <span className="text-slate-300">Чтобы гиды могли подготовить для вас правильную еду и нужное снаряжение, заполните вашу походную карточку.</span>
            </p>

            <div className="space-y-3">
              <button
                onClick={handleGoToSettings}
                className="w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(20,184,166,0.2)] active:scale-[0.98]"
              >
                <Settings size={18} /> Перейти в Настройки
              </button>
              <button
                onClick={handleGoToDashboard}
                className="w-full flex items-center justify-center gap-2 bg-transparent hover:bg-white/5 border border-transparent hover:border-white/10 text-slate-300 hover:text-white font-bold py-3.5 rounded-xl transition-all"
              >
                Позже (На Дашборд) <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-white mb-2">Давайте знакомиться!</h2>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Введите ваше реальное имя (для списков группы) и номер телефона, чтобы мы нашли и привязали ваши предыдущие туры.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-300 ml-1 mb-1.5 flex items-center gap-1.5">
                    <User size={12} /> Имя и Фамилия
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Например: Иван Иванов"
                    disabled={isPending}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-300 ml-1 mb-1.5 flex items-center gap-1.5">
                    <Phone size={12} /> Ваш телефон
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+373 777 00000"
                    disabled={isPending}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                  <p className="text-xs text-rose-400 text-center font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-300 text-slate-950 font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(20,184,166,0.2)] active:scale-[0.98] mt-2"
              >
                {isPending ? <Loader2 size={18} className="animate-spin" /> : 'Продолжить'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
```

## File: src/features/account/actions/saveTestResult.ts
```typescript
'use server';

import { prisma } from '@/lib/prisma';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface SaveTestResultInput {
  testSlug: string;
  result: {
    type: string;
    badge?: string;
    description?: string;
    score?: Record<string, number>;
    [key: string]: unknown;
  };
}

type SaveTestResultOutput =
  | { success: true }
  | { success: false; error: string; needsAuth?: boolean };

export async function saveTestResult(
  input: SaveTestResultInput
): Promise<SaveTestResultOutput> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Необходима авторизация', needsAuth: true };
  }

  const { testSlug, result } = input;

  if (!testSlug) {
    return { success: false, error: 'Не указан slug теста' };
  }

  const profile = await prisma.memberProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) {
    return { success: false, error: 'Профиль не найден', needsAuth: true };
  }

  // ✅ Проверяем, сдавал ли пользователь этот тест ранее
  const existingTest = await prisma.testResult.findUnique({
    where: {
      memberId_testSlug: {
        memberId: profile.id,
        testSlug,
      },
    },
  });

  const REWARD_FOR_TEST = 1;

  try {
    // Выполняем в транзакции: сохраняем результат + пополняем баланс (если впервые)
    await prisma.$transaction(async (tx) => {
      await tx.testResult.upsert({
        where: {
          memberId_testSlug: {
            memberId: profile.id,
            testSlug,
          },
        },
        create: {
          memberId: profile.id,
          testSlug,
          result: result as any,
        },
        update: {
          result: result as any,
        },
      });

      // Если теста в базе не было — начисляем баланс
      if (!existingTest) {
        await tx.memberProfile.update({
          where: { id: profile.id },
          data: { balance: { increment: REWARD_FOR_TEST } }
        });
      }
    });

    revalidatePath('/account/tests');
    // ✅ Обновляем дашборд, чтобы свежий баланс сразу подтянулся в интерфейсе
    revalidatePath('/account/dashboard');
    
    return { success: true };
  } catch (error) {
    console.error('Ошибка сохранения теста:', error);
    return { success: false, error: 'Произошла ошибка при сохранении' };
  }
}
```

## File: src/features/account/components/ReferralCard.tsx
```typescript
"use client";

import { useState } from "react";
import { Copy, Share2, Check, Gift } from "lucide-react";

interface ReferralCardProps {
  promoCode: string;
  rewardAmount?: number;
  friendReward?: number;
}

export default function ReferralCard({
  promoCode, 
  rewardAmount = 10,
  friendReward = 10 
}: ReferralCardProps) {
  const [copied, setCopied] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const shareText = `Присоединяйся к премиальному тур-клубу! Используй мой промокод ${promoCode} при бронировании и получи скидку ${friendReward} ₽ на первое приключение.`;

  const showToast = () => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promoCode);
      setCopied(true);
      showToast();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Не удалось скопировать промокод", err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Мой промокод Evatur",
          text: shareText,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Ошибка при шаринге", err);
        }
      }
    } else {
      // Фолбэк, если Web Share API не поддерживается (например, десктоп без поддержки)
      handleCopy();
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-white/10 p-6 md:p-8 shadow-2xl">
      {/* Декоративный фоновый градиент */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex-1 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Gift size={14} />
            Реферальная программа
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white">
            Приглашайте друзей в первый тур с нами
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed max-w-md">
            Поделитесь промокодом. Друг получит скидку <span className="text-white font-medium">{friendReward} ₽</span> на первый тур, а мы начислим <span className="text-teal-400 font-medium">{rewardAmount} ₽</span> на ваш баланс после его поездки.
          </p>
        </div>

        <div className="w-full md:w-auto bg-black/40 rounded-2xl p-4 border border-white/5 flex flex-col gap-3">
          <div className="text-center">
            <p className="text-xs text-slate-300 uppercase tracking-widest mb-1">Ваш промокод</p>
            <p className="text-2xl font-mono font-bold text-white tracking-widest">{promoCode}</p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white py-2.5 px-4 rounded-xl text-sm font-medium transition-colors"
            >
              {copied ? <Check size={16} className="text-teal-400" /> : <Copy size={16} />}
              {copied ? "Скопирован" : "Копировать"}
            </button>
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white py-2.5 px-4 rounded-xl text-sm font-medium transition-colors shadow-[0_0_15px_rgba(13,148,136,0.3)]"
            >
              <Share2 size={16} />
              Поделиться
            </button>
          </div>
        </div>
      </div>

      {/* Кастомный Toast (появляется снизу) */}
      <div 
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg transition-all duration-300 ${
          toastVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none"
        }`}
      >
        <Check size={16} />
        Ссылка скопирована! Другу +{friendReward} ₽
      </div>
    </div>
  );
}
```

## File: src/features/account/components/ReviewFromCabinetButton.tsx
```typescript
'use client';

import { useState, useTransition } from 'react';
import { Star, X, Loader, Clock, MessageSquareHeart } from 'lucide-react';
import { submitReviewFromCabinet } from '@/features/account/actions/submitReview';

interface ReviewFromCabinetButtonProps {
  tourId: string;
  tourTitle: string;
  memberName: string;
}

export default function ReviewFromCabinetButton({
  tourId,
  tourTitle,
  memberName,
}: ReviewFromCabinetButtonProps) {
  const [isOpen, setIsOpen]   = useState(false);
  const [text, setText]       = useState('');
  const [rating, setRating]   = useState(0); 
  const [hoveredRating, setHoveredRating] = useState(0); 
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    setIsOpen(true);
    setError('');
    setText('');
    setRating(0);
    setSuccess(false);
  }

  function handleClose() {
    if (isPending) return;
    setIsOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Пожалуйста, поставьте оценку от 1 до 5 звезд');
      return;
    }

    if (text.trim().length < 10) {
      setError('Напишите чуть больше — минимум 10 символов');
      return;
    }

    startTransition(async () => {
      const result = await submitReviewFromCabinet({ tourId, text: text.trim(), rating });

      if (!result.success) {
        setError(result.error ?? 'Не удалось отправить отзыв');
        return;
      }

      setSuccess(true);
      setTimeout(() => setIsOpen(false), 4000); // Даем время прочитать сообщение
    });
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:text-amber-300 rounded-xl transition-all shadow-sm"
      >
        <MessageSquareHeart size={14} />
        <span className="text-xs font-bold tracking-wide">Оценить тур</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={handleClose} />

          <div className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button onClick={handleClose} className="absolute top-4 right-4 text-slate-300 hover:text-white transition-colors">
              <X size={16} />
            </button>

            {success ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-400">
                  <Clock size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Отзыв на проверке</h3>
                  <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                    Спасибо за ваше мнение! Мы опубликуем отзыв после быстрой модерации, и бонус <span className="text-amber-400 font-bold">+10 ₽</span> будет зачислен на ваш баланс.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Star size={16} className="text-amber-400" />
                    <h3 className="text-base font-black text-white">Оцените тур</h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-tight truncate">{tourTitle}</p>
                </div>

                <div className="flex justify-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="p-1 transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star 
                        size={32} 
                        className={`transition-colors duration-200 ${
                          star <= (hoveredRating || rating) 
                            ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' 
                            : 'fill-slate-800 text-slate-700'
                        }`} 
                      />
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">Ваш отзыв</label>
                  <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="Что вам больше всего понравилось?"
                    rows={4}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 transition-all resize-none"
                    disabled={isPending}
                  />
                  <div className="flex items-center justify-between mt-1">
                    {error && <p className="text-xs text-red-400">{error}</p>}
                    <span className="text-[12px] text-slate-600 ml-auto">{text.length}/500</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending || rating === 0 || text.trim().length < 10}
                  className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:hover:bg-amber-500 text-slate-900 font-bold py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                >
                  {isPending ? <Loader size={16} className="animate-spin" /> : 'Отправить на модерацию'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
```

## File: src/features/account/components/SettingsForm.tsx
```typescript
"use client";

import React, { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  User, Phone, Mail, Apple, Shirt, 
  LifeBuoy, Footprints, Backpack, Save, Loader2,
  Send, Instagram, MessageCircle, CheckCircle2
} from 'lucide-react';
import { useToast } from '@/shared/context/ToastContext';
import { updateProfileSettingsAction } from '@/features/account/actions/updateSettings';
import { clsx } from 'clsx';

const INVENTORY_OPTIONS = [
  "Трекинговые палки",
  "Походный рюкзак (от 40л)",
  "Летний спальник",
  "Зимний спальник",
  "Трекинговая обувь",
  "Туристический коврик",
  "Палатка"
];

const CLOTHES_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL+"];
const SHOE_SIZES = Array.from({ length: 13 }, (_, i) => String(35 + i)); // от 35 до 47

const formSchema = z.object({
  name: z.string().min(2, "Имя обязательно"),
  email: z.string().email("Неверный формат email").or(z.literal("")).optional().nullable(),
  telegram: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  viber: z.string().optional().nullable(),
  foodPref: z.string().optional().nullable(),
  shoeSize: z.string().optional().nullable(),
  clothesSize: z.string().optional().nullable(),
  lifeJacketSize: z.string().optional().nullable(),
  inventory: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof formSchema>;

export default function SettingsForm({ profile }: { profile: any }) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: profile.name || "",
      email: profile.email || "",
      telegram: profile.telegram || "",
      instagram: profile.instagram || "",
      viber: profile.viber || "",
      foodPref: profile.foodPref || "",
      shoeSize: profile.shoeSize || "",
      clothesSize: profile.clothesSize || "",
      lifeJacketSize: profile.lifeJacketSize || "",
      inventory: Array.isArray(profile.inventory) ? profile.inventory : [], 
    }
  });

  const selectedInventory = watch("inventory") || [];
  const isTelegramConnected = Boolean(profile.tgChatId);

  const toggleInventoryItem = (item: string) => {
    if (selectedInventory.includes(item)) {
      setValue("inventory", selectedInventory.filter((i) => i !== item), { shouldDirty: true });
    } else {
      setValue("inventory", [...selectedInventory, item], { shouldDirty: true });
    }
  };

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const res = await updateProfileSettingsAction(data);
      if (res.success) {
        showToast("Настройки успешно сохранены", "success");
      } else {
        showToast(res.error || "Ошибка при сохранении", "error");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-28 md:pb-12">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* ── СТРОКА 1: TELEGRAM BOT (НА ВСЮ ШИРИНУ) ── */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            {isTelegramConnected && (
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />
            )}
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className={clsx(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
                  isTelegramConnected ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-[#2AABEE]/10 border border-[#2AABEE]/20 text-[#2AABEE]"
                )}>
                  {isTelegramConnected ? <CheckCircle2 size={24} /> : <Send size={24} className="-ml-1" />}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">Telegram Бот</h2>
                  <p className="text-sm sm:text-sm text-slate-300 mt-0.5">
                    {isTelegramConnected 
                      ? 'Персональный помощник успешно подключен' 
                      : 'Мгновенные уведомления о статусе брони и новых турах'}
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                {isTelegramConnected ? (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 size={18} /> Подключен
                  </div>
                ) : (
                  <a 
                    href={`https://t.me/authevaclub_bot?start=user_${profile.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center justify-center gap-2 w-full md:w-auto bg-[#2AABEE] hover:bg-[#229ED9] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-[0_0_15px_rgba(42,171,238,0.2)]"
                  >
                    <Send size={18} className="-ml-1" /> Подключить бота
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── СТРОКА 2: ЛЕВАЯ КОЛОНКА (КОНТАКТЫ) ── */}
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 shadow-xl h-full">
            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
              <User className="text-teal-500" size={20} />
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Контакты</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-300 ml-1 mb-1 block">Имя и Фамилия *</label>
                <input 
                  {...register("name")}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 outline-none transition-all"
                />
                {errors.name && <p className="text-sm text-rose-500 mt-1 ml-1">{errors.name?.message}</p>}
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-300 ml-1 mb-1 flex items-center gap-1.5">
                  <Phone size={12} /> Ваш логин (Телефон)
                </label>
                <input 
                  value={profile.phone || "Не указан"}
                  disabled
                  className="w-full bg-slate-950/50 border border-transparent rounded-xl px-4 py-3 text-slate-300 text-sm cursor-not-allowed"
                  title="Телефон нельзя изменить, так как он используется для входа"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-300 ml-1 mb-1 flex items-center gap-1.5">
                  <Mail size={12} /> Email
                </label>
                <input 
                  {...register("email")}
                  placeholder="Для чеков и билетов"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 outline-none transition-all"
                />
                {errors.email && <p className="text-sm text-rose-500 mt-1 ml-1">{errors.email?.message}</p>}
              </div>

              {/* Соцсети */}
              <div className="pt-4 mt-2 border-t border-white/5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-300 ml-1 mb-3 block">
                    Соцсети (Для чатов групп)
                </label>
                <div className="space-y-3">
                    <div className="relative group">
                        <Send size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-sky-400 transition-colors" />
                        <input 
                            {...register("telegram")}
                            placeholder="@username в Telegram"
                            className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 outline-none transition-all"
                        />
                    </div>
                    <div className="relative group">
                        <Instagram size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-pink-400 transition-colors" />
                        <input 
                            {...register("instagram")}
                            placeholder="@username в Instagram"
                            className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500/20 outline-none transition-all"
                        />
                    </div>
                    <div className="relative group">
                        <MessageCircle size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-purple-400 transition-colors" />
                        <input 
                            {...register("viber")}
                            placeholder="Номер в Viber (если отличается)"
                            className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all"
                        />
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── СТРОКА 2: ПРАВАЯ КОЛОНКА (ПИТАНИЕ + АНТРОПОМЕТРИЯ) ── */}
        <div className="space-y-6">
          
          <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
              <Apple className="text-emerald-500" size={20} />
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Питание</h2>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-300 ml-1 mb-2 block">
                Диета и аллергии
              </label>
              <textarea 
                {...register("foodPref")}
                placeholder="Например: вегетарианец, не ем лук, аллергия на орехи. Если особенностей нет — оставьте поле пустым."
                className="w-full min-h-[140px] bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 outline-none transition-all resize-none"
              />
            </div>
          </div>

          <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
              <Shirt className="text-blue-500" size={20} />
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Антропометрия</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-300 ml-1 mb-1 flex items-center gap-1.5"><Shirt size={12}/> Размер одежды</label>
                  <div className="relative">
                    <select {...register("clothesSize")} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-teal-500 outline-none appearance-none cursor-pointer">
                      <option value="">Не указан</option>
                      {CLOTHES_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-300 ml-1 mb-1 flex items-center gap-1.5"><LifeBuoy size={12}/> Спасжилет</label>
                  <div className="relative">
                    <select {...register("lifeJacketSize")} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-teal-500 outline-none appearance-none cursor-pointer">
                      <option value="">Не указан</option>
                      {CLOTHES_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-300 ml-1 mb-1 flex items-center gap-1.5"><Footprints size={12}/> Размер обуви</label>
                <div className="relative">
                  <select {...register("shoeSize")} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-teal-500 outline-none appearance-none cursor-pointer">
                    <option value="">Не указан</option>
                    {SHOE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ── СТРОКА 3: ИНВЕНТАРЬ (НА ВСЮ ШИРИНУ) ── */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
              <Backpack className="text-amber-500" size={20} />
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Мой инвентарь</h2>
            </div>

            <p className="text-sm text-slate-300 mb-5 leading-relaxed">
              Отметьте снаряжение, которое у вас уже есть. Мы не будем предлагать вам его в аренду перед выездами.
            </p>

            <div className="flex flex-wrap gap-2.5">
              {INVENTORY_OPTIONS.map((item) => {
                const isActive = selectedInventory.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleInventoryItem(item)}
                    className={clsx(
                      "px-4 py-2.5 rounded-xl text-sm font-bold transition-all border",
                      isActive 
                        ? "bg-amber-500/10 border-amber-500/50 text-amber-400 shadow-inner" 
                        : "bg-slate-950 border-white/10 text-slate-300 hover:border-white/30 hover:text-white"
                    )}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* ── КНОПКА СОХРАНЕНИЯ ── */}
      <div className="pt-6 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="w-full sm:w-auto px-8 py-4 flex items-center justify-center gap-3 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-300 text-slate-950 font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] active:scale-[0.98]"
        >
          {isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          <span>{isPending ? "Сохранение..." : "Сохранить настройки"}</span>
        </button>
      </div>

    </form>
  );
}
```

## File: src/app/account/bookings/[id]/page.tsx
```typescript
// src/app/account/bookings/[id]/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  ChevronLeft, MapPin, Users, Phone, 
  MessageCircle, AlertTriangle, 
  Info, CalendarClock, Lock, Backpack,
  CheckSquare, MessageSquare
} from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatTourDate } from "@/utils/date";
import QRCode from "react-qr-code"; // Настоящий QR-код

// Компоненты
import { PaymentActionBlock } from "@/features/account/components/PaymentActionBlock";
import TourLegalLinks from "@/features/tours/components/TourDetails/TourLegalLinks"; 

type Guest = {
  name: string;
  ticketType?: string;
  equipment?: string;
  [key: string]: unknown;
};

function getStatusBadge(status: string) {
  const s = status.toLowerCase();
  const baseClasses = "px-3 py-1 rounded-full text-[12px] font-bold uppercase tracking-widest border";
  
  if (s === "pending") return <span className={`${baseClasses} bg-amber-500/10 text-amber-400 border-amber-500/20`}>Новая (Наличные)</span>;
  if (s === "cancelled") return <span className={`${baseClasses} bg-slate-500/10 text-slate-300 border-slate-500/20`}>Отменено</span>;
  if (s === "awaiting_payment") return <span className={`${baseClasses} bg-sky-500/10 text-sky-400 border-sky-500/20`}>Ожидает оплаты</span>;
  if (s === "moderation") return <span className={`${baseClasses} bg-purple-500/10 text-purple-400 border-purple-500/20 animate-pulse`}>Проверка чека</span>;
  if (s === "rejected") return <span className={`${baseClasses} bg-rose-500/10 text-rose-400 border-rose-500/20`}>Оплата отклонена</span>;
  if (s === "confirmed") return <span className={`${baseClasses} bg-emerald-500/10 text-emerald-400 border-emerald-500/20`}>Оплачено</span>;
  return <span className={`${baseClasses} bg-slate-800 text-slate-300`}>{status}</span>;
}

export default async function BookingDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await prisma.memberProfile.findUnique({
    where: { userId: user.id },
    select: { id: true }
  });

  if (!profile) redirect("/login");

  // ✅ ЗАПРОС: Тянем всё, включая meetingPoint и чек-листы
  const booking = await prisma.booking.findFirst({
    where: { id: params.id, memberId: profile.id },
    include: {
      tour: true,
      tourDate: true
    }
  });

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Lock className="w-16 h-16 text-slate-700 mb-6" />
        <h1 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Доступ закрыт</h1>
        <Link href="/account" className="px-6 py-3 bg-teal-500 text-slate-900 font-bold uppercase tracking-widest text-xs rounded-xl">Вернуться</Link>
      </div>
    );
  }

  const guests = (booking.guests as Guest[]) || [];
  const status = booking.status.toLowerCase();
  
  // ✅ ЛОГИСТИКА: Синхронизируем дату и старт
  const tourDateObj = booking.tourDate;
  const dateStr = tourDateObj?.startDate ? formatTourDate(new Date(tourDateObj.startDate)) : "Даты уточняются";
  const timeStr = tourDateObj?.time || "08:00";
  const startPoint = tourDateObj?.meetingPoint || booking.tour.meetingPoint || booking.tour.location || "Уточняется менеджером";

  // ✅ ЧЕК-ЛИСТ: Парсим из базы
  const checklist = Array.isArray(booking.tour.checklist) ? booking.tour.checklist : [];

  // ✅ ЛОГИКА ЧАТА: Показываем если Оплачено ИЛИ (Новая + Наличные)
  const showChatButton = (status === 'confirmed' || (status === 'pending' && booking.paymentMethod === 'cash')) && tourDateObj?.groupChatUrl;

  const displayId = booking.shortId ? String(booking.shortId) : booking.id.substring(0, 5).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto pb-12 animate-in fade-in duration-500 px-4">
      
      <Link href="/account" className="inline-flex items-center gap-2 text-slate-300 hover:text-white mb-6 text-sm font-bold uppercase tracking-widest transition-colors">
        <ChevronLeft size={16} /> Назад к билетам
      </Link>

      <div className="space-y-6">
        {/* 🎫 БИЛЕТ-КАРТОЧКА */}
        <div className="bg-slate-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
          <div className="absolute left-0 top-[120px] -translate-x-1/2 w-6 h-6 bg-slate-950 rounded-full border-r border-white/5" />
          <div className="absolute right-0 top-[120px] translate-x-1/2 w-6 h-6 bg-slate-950 rounded-full border-l border-white/5" />
          
          <div className="p-6 sm:p-8 border-b border-white/5 border-dashed relative">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
              <div className="flex-1">
                <div className="text-xs font-bold text-teal-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                  Booking Reference #{displayId}
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight uppercase italic tracking-tighter">
                  {booking.tour.title}
                </h1>
              </div>
              <div className="flex flex-col items-end gap-3">
                {getStatusBadge(booking.status)}
                {/* ✅ ЕДИНЫЙ QR КОД */}
                <div className="p-2 bg-white rounded-xl shadow-lg">
                   <QRCode size={80} value={`https://evatur.club/admin/scan?id=${displayId}`} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5">
                <CalendarClock className="text-teal-500 mb-2" size={18} />
                <p className="text-[12px] text-slate-400 uppercase font-bold tracking-widest mb-1">Дата и Время старта</p>
                <p className="text-sm font-bold text-white">{dateStr} в {timeStr}</p>
              </div>
              <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5">
                <MapPin className="text-teal-500 mb-2" size={18} />
                <p className="text-[12px] text-slate-400 uppercase font-bold tracking-widest mb-1">Точка сбора</p>
                <p className="text-sm font-bold text-white leading-snug">{startPoint}</p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 bg-gradient-to-b from-slate-900 to-slate-950 space-y-8">
            
            {/* ✅ СЕКРЕТНЫЙ ЧАТ ГРУППЫ */}
            {showChatButton && (
              <div className="animate-in slide-in-from-bottom-4 duration-700">
                <a 
                  href={tourDateObj.groupChatUrl!} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-center gap-3 w-full py-4 bg-[#2AABEE] hover:bg-[#229ED9] text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-[#2AABEE]/20 transition-all active:scale-95"
                >
                  <MessageSquare size={20} /> Вступить в чат группы
                </a>
                <p className="text-center text-[12px] text-slate-400 uppercase font-bold mt-3 tracking-wider">
                  Там будет вся оперативная инфо от гида
                </p>
              </div>
            )}

            {/* УЧАСТНИКИ */}
            <div>
              <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                <Users size={14} /> Список участников
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {guests.length > 0 ? guests.map((guest, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-black text-xs">{idx + 1}</div>
                      <p className="text-sm font-bold text-white">{guest.name} <span className="text-[12px] text-slate-400 uppercase ml-2">{guest.ticketType}</span></p>
                    </div>
                    {guest.equipment && (
                      <span className="px-2 py-1 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded text-[9px] font-bold uppercase tracking-tighter">
                        🦺 Жилет: {guest.equipment}
                      </span>
                    )}
                  </div>
                )) : (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-black text-xs">1</div>
                    <p className="text-sm font-bold text-white">{booking.name} <span className="text-[12px] text-slate-400 uppercase ml-2">Заказчик</span></p>
                  </div>
                )}
              </div>
            </div>

            {/* ✅ ЧЕК-ЛИСТ (Что взять) */}
            {checklist.length > 0 && (
              <div>
                <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <CheckSquare size={14} /> Что взять с собой
                </h3>
                <div className="bg-slate-950/40 rounded-2xl p-5 border border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {checklist.map((block: any, i: number) => (
                    <div key={i} className="space-y-1">
                      <p className="text-[12px] font-black text-teal-500 uppercase tracking-wider">{block.title}</p>
                      <p className="text-xs text-slate-300 leading-relaxed">{block.items}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ЭКОНОМИКА И ОПЛАТА */}
            <div>
              <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                <Info size={14} /> Экономика билета
              </h3>
              <div className="bg-slate-950 rounded-2xl p-6 border border-white/5 space-y-4 mb-6">
                <div className="flex justify-between text-sm"><span className="text-slate-400">Стоимость:</span><span className="text-white font-bold">{booking.totalPrice} {booking.tour.currency}</span></div>
                {booking.discount > 0 && <div className="flex justify-between text-sm text-emerald-400"><span>Скидка:</span><span className="font-bold">-{booking.discount} {booking.tour.currency}</span></div>}
                <div className="flex justify-between text-sm"><span className="text-slate-400">Оплачено:</span><span className="text-white font-bold">{booking.amountPaid} {booking.tour.currency}</span></div>
                <div className="h-px bg-slate-800" />
                <div className="flex justify-between items-center"><span className="text-slate-300 font-bold">Остаток:</span><span className="text-teal-400 font-black text-xl">{Math.max(0, booking.totalPrice - booking.discount - booking.amountPaid)} {booking.tour.currency}</span></div>
              </div>
              
              <PaymentActionBlock 
                bookingId={booking.id}
                shortId={booking.shortId || 0}
                status={booking.status}
                paymentMethod={booking.paymentMethod || 'cash'}
                totalPrice={booking.totalPrice - booking.discount}
                amountPaid={booking.amountPaid}
                currency={booking.tour.currency || 'MDL'}
                receiptUrl={booking.receiptUrl}
                biletpmrLink={booking.tour.biletpmrLink}
                apbQrLink={booking.tour.apbQrLink}
                apbQrImage={booking.tour.apbQrImage}
              />
            </div>
          </div>
        </div>

        {/* ✅ ПРАВОВОЙ БЛОК */}
        <TourLegalLinks />

        {/* ПОДДЕРЖКА */}
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 mt-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-300"><AlertTriangle size={20} /></div>
            <div>
              <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Нужна помощь?</p>
              <p className="text-sm font-bold text-white">Служба заботы Турклуба</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a href="tel:+37377770141" className="flex-1 sm:flex-none px-6 py-3 bg-white/5 text-white rounded-xl text-[12px] font-black uppercase tracking-widest transition-all hover:bg-white/10 flex items-center justify-center gap-2">
              <Phone size={14} /> Звонок
            </a>
            <a href="https://t.me/romansvtirase" target="_blank" rel="noreferrer" className="flex-1 sm:flex-none px-6 py-3 bg-[#2AABEE]/10 text-[#2AABEE] rounded-xl text-[12px] font-black uppercase tracking-widest transition-all hover:bg-[#2AABEE]/20 flex items-center justify-center gap-2">
              <MessageCircle size={14} /> Написать
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## File: src/app/account/history/page.tsx
```typescript
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Hourglass, Star } from 'lucide-react';
import ReviewFromCabinetButton from '@/features/account/components/ReviewFromCabinetButton';

// ─── утилиты ─────────────────────────────────────────────────────────
function formatDate(d: Date) {
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getSeason(d: Date): { label: string; emoji: string } {
  const m = d.getMonth();
  if (m >= 2 && m <= 4) return { label: 'весна', emoji: '🌿' };
  if (m >= 5 && m <= 7) return { label: 'лето',  emoji: '☀️'  };
  if (m >= 8 && m <= 10) return { label: 'осень', emoji: '🍂' };
  return { label: 'зима', emoji: '❄️' };
}

// ─── загрузка данных ─────────────────────────────────────────────────
async function getHistory(userId: string) {
  const profile = await prisma.memberProfile.findUnique({
    where: { userId },
  });
  if (!profile) return null;

  const now = new Date();

  // Все прошедшие брони
  const bookings = await prisma.booking.findMany({
    where: {
      memberId: profile.id,
      status: { not: 'cancelled' },
      tourDate: { startDate: { lt: now } },
    },
    orderBy: { tourDate: { startDate: 'desc' } },
    include: {
      tour: {
        select: {
          id: true,
          title: true,
          slug: true,
          location: true,
          coverImage: true,
          category: { select: { title: true, color: true } },
        },
      },
      tourDate: {
        select: { startDate: true },
      },
    },
  });

  // Достаем отзывы с их статусами (isActive)
  const userReviews = await prisma.review.findMany({
    where: {
      tourId: { in: bookings.map(b => b.tourId) },
      memberId: profile.id, 
    },
    select: { tourId: true, isActive: true, rating: true },
  });
  
  // Делаем удобную мапу для быстрого поиска статуса
  const reviewsMap = new Map(userReviews.map(r => [r.tourId, r]));

  return { profile, bookings, reviewsMap };
}

// ─── страница ────────────────────────────────────────────────────────
export default async function HistoryPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account/history');

  const data = await getHistory(user.id);
  if (!data) redirect('/login?next=/account/history');

  const { bookings, reviewsMap, profile } = data;

  return (
    <div className="space-y-6 max-w-4xl">

     {/* Заголовок */}
      <div className="mb-6 px-2 md:px-0">
        <h1 className="text-2xl font-black text-white mb-1">Архив поездок</h1>
        <p className="text-sm text-slate-300">
          {bookings.length > 0
            ? 'Ваши прошедшие туры и воспоминания'
            : 'Здесь появятся ваши прошедшие туры'}
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-10 text-center mx-2 md:mx-0">
          <p className="text-4xl mb-4">🗺️</p>
          <p className="text-white font-bold mb-2">Ваша история пока пуста</p>
          <p className="text-sm text-slate-300 mb-6">
            После прохождения первого тура здесь появится ваша летопись приключений
          </p>
          <Link
            href="/tour"
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all"
          >
            Найти первый тур
          </Link>
        </div>
      ) : (
        <div className="space-y-3 px-2 md:px-0">
          {bookings.map((booking) => {
            const review = reviewsMap.get(booking.tourId);
            const season = booking.tourDate ? getSeason(booking.tourDate.startDate) : null;
            const catStyle = booking.tour.category?.color === 'teal' ? 'bg-teal-500/20 text-teal-400' : 'bg-blue-500/20 text-blue-400';

            return (
              <div
                key={booking.id}
                className="bg-slate-900/60 border border-white/5 rounded-2xl p-3 flex gap-4 items-center transition-colors hover:bg-slate-900/80"
              >
                {/* Компактное квадратное фото */}
                <Link href={`/tour/${booking.tour.slug}`} className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-800 hidden sm:block">
                  {booking.tour.coverImage && (
                    <Image src={booking.tour.coverImage} alt={booking.tour.title} fill className="object-cover" sizes="80px" />
                  )}
                </Link>

                {/* Контент */}
                <div className="flex-1 min-w-0 py-1">
                  <div className="flex items-center gap-2 mb-1">
                    {booking.tour.category && (
                      <span className={`text-[12px] font-bold px-2 py-0.5 rounded-md ${catStyle}`}>
                        {booking.tour.category.title}
                      </span>
                    )}
                    {season && booking.tourDate && (
                      <span className="text-xs text-slate-300 shrink-0">
                        {season.emoji} {formatDate(booking.tourDate.startDate)}
                      </span>
                    )}
                  </div>

                  <Link href={`/tour/${booking.tour.slug}`} className="block text-sm sm:text-base font-black text-white hover:text-teal-400 transition-colors truncate mb-1">
                    {booking.tour.title}
                  </Link>

                  {booking.tour.location && (
                    <span className="flex items-center gap-1 text-xs text-slate-300">
                      <MapPin size={12} /> {booking.tour.location}
                    </span>
                  )}
                </div>

                {/* Блок отзыва (Кнопка или Статус) */}
                <div className="shrink-0 flex flex-col items-end gap-2">
                  {!review ? (
                    <ReviewFromCabinetButton
                      tourId={booking.tourId}
                      tourTitle={booking.tour.title}
                      memberName={profile.name ?? ''}
                    />
                  ) : review.isActive ? (
                    <div className="flex items-center gap-1.5 text-[12px] sm:text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 sm:px-3 py-1.5 rounded-lg border border-emerald-500/20">
                      <Star size={12} className="fill-emerald-400" />
                      Опубликован
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[12px] sm:text-xs text-amber-400 font-bold bg-amber-500/10 px-2 sm:px-3 py-1.5 rounded-lg border border-amber-500/20" title="Ждет проверки модератором">
                      <Hourglass size={12} className="animate-pulse" />
                      На модерации
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

## File: src/app/account/layout.tsx
```typescript
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import AccountNav from '@/features/account/components/AccountNav';
import OnboardingModal from '@/features/account/components/OnboardingModal';
import type { Metadata } from 'next';
import type { MemberProfile } from '@prisma/client';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/account');
  }

  // 1. Пытаемся найти профиль
  let profile: MemberProfile | null = await prisma.memberProfile.findUnique({
    where: { userId: user.id },
  });

  // 2. Если профиля нет — это первый вход. Создаем профиль и привязываем данные.
  if (!profile) {
    const phone = user.phone ?? '';
    
    profile = await prisma.memberProfile.create({
      data: {
        userId: user.id,
        phone,
        level: 'Первопроходец',
      },
    });

    // Безопасно переносим старые брони только в момент регистрации
    if (phone) {
      await prisma.booking.updateMany({
        where: { phone, memberId: null },
        data: { memberId: profile.id },
      });
    }
  }

  const needsOnboarding = !profile.phone;

  return (
    <div className="min-h-screen bg-slate-950 relative flex">
      <AccountNav
        profile={{
          name: profile.name,
          level: profile.level,
          totalTours: profile.totalTours,
        }}
      />

      {/* ✅ Главный контент с улучшенными, гибкими классами Tailwind */}
      <main 
        className="flex-1 w-full max-w-5xl mx-auto 
                   px-4 md:px-6 lg:px-8 
                   pt-24 md:pt-28 lg:pt-32 
                   pb-20 md:pb-12 
                   md:ml-64 
                   relative z-10 transition-all duration-300"
      >
        {children}
        
        {/* Показываем онбординг только если нет телефона */}
        {needsOnboarding && <OnboardingModal />}
      </main>
    </div>
  );
}
```

## File: src/features/account/actions/submitReview.ts
```typescript
'use server';

import { prisma } from '@/lib/prisma';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface SubmitReviewInput {
  tourId: string;
  text: string;
  rating: number; 
}

type SubmitReviewResult =
  | { success: true } 
  | { success: false; error: string };

export async function submitReviewFromCabinet(
  input: SubmitReviewInput
): Promise<SubmitReviewResult> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Необходима авторизация' };

  const { tourId, text, rating } = input;

  if (!text || text.trim().length < 10) {
    return { success: false, error: 'Слишком короткий отзыв' };
  }
  if (text.length > 500) {
    return { success: false, error: 'Отзыв слишком длинный (максимум 500 символов)' };
  }

  const profile = await prisma.memberProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) return { success: false, error: 'Профиль не найден' };

  const booking = await prisma.booking.findFirst({
    where: {
      memberId: profile.id,
      tourId,
      status: { not: 'cancelled' },
      tourDate: { startDate: { lt: new Date() } },
    },
  });
  if (!booking) {
    return { success: false, error: 'Отзыв можно оставить только на тур, в котором вы участвовали' };
  }

  const existing = await prisma.review.findFirst({
    where: {
      tourId,
      memberId: profile.id, 
    },
  });

  if (existing) {
    return { success: false, error: 'Вы уже оставили отзыв на этот тур' };
  }

  const tour = await prisma.tour.findUnique({
    where: { id: tourId },
    include: { category: { select: { slug: true } } },
  });
  const reviewCategory = tour?.category?.slug ?? 'general';

try {
    // ✅ Выполняем в транзакции: сохраняем отзыв + пополняем баланс на 10 MDL
    await prisma.$transaction(async (tx) => {
      await tx.review.create({
        data: {
          name: profile.name ?? profile.phone ?? 'Участник клуба',
          text: text.trim(),
          rating: rating,
          source: 'website',
          tourId,
          memberId: profile.id, 
          category: reviewCategory,
          isActive: false, // ждет модерации админом
        },
      });

      // ✅ Начисляем бонусы за честный отзыв
      await tx.memberProfile.update({
        where: { id: profile.id },
        data: { balance: { increment: 10 } }
      });
    });

    revalidatePath('/account/history');
    revalidatePath(`/tour/${tour?.slug ?? ''}`);
    revalidatePath('/account/dashboard'); // ✅ Обновляем кэш дашборда, чтобы юзер сразу увидел деньги

    return { success: true };
  } catch (error) {
    console.error('[submitReviewFromCabinet] Error:', error);
    return { success: false, error: 'Не удалось сохранить отзыв. Попробуйте позже.' };
  }
}
```

## File: src/features/account/components/BookingCard.tsx
```typescript
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
import QRCode from "react-qr-code"; 

interface BookingCardProps {
  bookingId: string;
  booking: {
    id: string;
    shortId: number | null;
    status: string;
    totalPrice: number;
    finalPrice?: number | null;
    discount?: number; // ✅ Исправили на discount (как в БД) и сделали необязательным
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
  cancelled: { label: 'Отменено', color: 'text-slate-300', bg: 'bg-slate-400/10', border: 'border-slate-400/30', icon: X },
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
  
  // ✅ Переводим discount из БД в переменную для верстки
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
    <div className="relative flex flex-col md:flex-row bg-slate-900 rounded-3xl overflow-hidden border border-white/10 shadow-xl group transition-all hover:border-white/20 hover:shadow-2xl">
      
      {/* ✅ ГЛАВНАЯ ССЫЛКА НА БИЛЕТ (Растянута на всю карточку) */}
      <Link href={`/account/bookings/${bookingId}`} className="absolute inset-0 z-0 focus:outline-none" aria-hidden="true" />

      {/* ─── ЛЕВАЯ ЧАСТЬ (Инфо о туре) ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col sm:flex-row p-4 sm:p-6 gap-6 relative z-10 pointer-events-none">
        
        {/* Изображение */}
        <div className="w-full sm:w-48 h-48 sm:h-auto rounded-2xl overflow-hidden relative shrink-0 bg-slate-800 flex items-center justify-center pointer-events-auto">
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
          <div className="flex items-center justify-between mb-2 pointer-events-auto">
            <div className="flex items-center gap-2 text-teal-400">
              <MapPin size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">{tour?.meetingPoint || tour?.location || 'Место старта'}</span>
            </div>
            
            {appliedBonuses > 0 && (
              <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-[12px] font-bold uppercase tracking-wider">
                <Gift size={12} /> Скидка {appliedBonuses} ₽
              </div>
            )}
          </div>
          
          {/* ✅ ССЫЛКА НА ТУР (Локальная, работает только при точном клике на текст) */}
          <h3 className="text-xl sm:text-2xl font-black text-white leading-tight mb-4 pointer-events-auto w-fit">
            <Link href={`/tour/${tour?.slug}`} className="hover:text-teal-400 transition-colors relative z-20">
               {tour?.title || 'Название тура'}
            </Link>
          </h3>

          <div className="grid grid-cols-2 gap-y-3 gap-x-4">
            <div>
              <p className="text-[12px] text-slate-300 font-bold uppercase tracking-widest mb-1">Дата и Время</p>
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <Calendar size={16} className="text-slate-300 shrink-0" />
                <span className="truncate">{formattedDate}, {time}</span>
              </div>
            </div>

            <div>
              <p className="text-[12px] text-slate-300 font-bold uppercase tracking-widest mb-1">Места</p>
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <Users size={16} className="text-slate-300 shrink-0" />
                <span>{guestsCount} чел.</span>
              </div>
            </div>
            
            <div>
              <p className="text-[12px] text-slate-300 font-bold uppercase tracking-widest mb-1">Сумма</p>
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <CreditCard size={16} className="text-slate-300 shrink-0" />
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

            <div>
              <p className="text-[12px] text-slate-300 font-bold uppercase tracking-widest mb-1">Оплата</p>
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

      {/* ─── ПРАВАЯ ЧАСТЬ (Контрольный талон) ──────────── */}
      <div className="w-full md:w-64 bg-slate-800/20 p-6 flex flex-col justify-between items-center text-center relative z-10 pointer-events-none">
        
        <div className="hidden md:flex flex-col items-center mb-6 w-full">
          <div className={clsx("flex justify-center items-center gap-2 px-4 py-2 w-full rounded-xl border", statusInfo.bg, statusInfo.border)}>
            <StatusIcon size={16} className={statusInfo.color} />
            <span className={clsx("text-xs font-bold uppercase tracking-widest", statusInfo.color)}>
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* ✅ НАСТОЯЩИЙ QR Code */}
        <div className="p-2 bg-white rounded-xl mb-6 shadow-inner hidden md:block opacity-90 transition-all duration-300">
           <QRCode 
             size={90} 
             value={`https://evatur.club/admin/scan?id=${displayId}`} 
             viewBox={`0 0 90 90`} 
             level="M" 
           />
        </div>

        <div className="w-full flex md:flex-col justify-between items-center">
          <div className="text-left md:text-center mb-0 md:mb-4">
            <p className="text-[12px] text-slate-300 font-bold uppercase tracking-widest mb-1">Booking Ref</p>
            <p className="text-sm font-mono text-slate-300 font-bold tracking-wider">#{displayId}</p>
          </div>

          {/* Визуальная кнопка "Подробнее" */}
          <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-widest group-hover:text-teal-300 transition-colors pointer-events-auto">
            Подробнее 
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

    </div>
  );
}
```

## File: src/app/account/tests/page.tsx
```typescript
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { 
  FlaskConical, ArrowRight, RefreshCw, 
  Compass, Brain, PawPrint, Tent, Backpack, 
  Activity, ShieldAlert, Dumbbell, HeartPulse, BookOpen 
} from 'lucide-react';
import { clsx } from 'clsx';

// ─── Строгие типы для JSON из БД ────────────────────────────────────
interface TestResultData {
  type?: string;
  badge?: string;
  description?: string;
  score?: Record<string, number>;
  [key: string]: unknown;
}

// ─── конфиг квизов (Теперь с современными иконками) ─────────────────
const QUIZ_CONFIG: Record<string, {
  title: string;
  icon: React.ElementType;
  description: string;
  href: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  'tourist-type': {
    title: 'Тип туриста',
    icon: Compass,
    description: 'Кто ты в путешествии — романтик, исследователь или организатор?',
    href: '/fun?quiz=tourist-type',
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/20',
  },
  'psych-profile': {
    title: 'Психологический профиль',
    icon: Brain,
    description: 'Как ты реагируешь на трудности и незнакомые ситуации в дороге?',
    href: '/fun?quiz=psych-profile',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
  },
  'totem': {
    title: 'Тотемное животное',
    icon: PawPrint,
    description: 'Какой дух-хранитель сопровождает тебя в походах?',
    href: '/fun?quiz=totem',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
  'survival': {
    title: 'Выживание',
    icon: Tent,
    description: 'Насколько ты готов к нештатным ситуациям на маршруте?',
    href: '/fun?quiz=survival',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
  },
  'backpack': {
    title: 'Что в рюкзаке?',
    icon: Backpack,
    description: 'Твой стиль сборов и что это говорит о характере.',
    href: '/fun?quiz=backpack',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  'body-signals': {
    title: 'Сигналы тела',
    icon: Activity,
    description: 'Уровень физической готовности к активным маршрутам.',
    href: '/fun?quiz=body-signals',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
  },
  'fears': {
    title: 'Разбор страхов',
    icon: ShieldAlert,
    description: 'Психологический разбор твоих опасений перед походом.',
    href: '/fun?quiz=fears',
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/20',
  },
  'physical': {
    title: 'Физическая готовность',
    icon: Dumbbell,
    description: 'Оценка твоей выносливости и готовности к нагрузкам.',
    href: '/fun?quiz=physical',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
  },
  'signals': {
    title: 'Анализ самочувствия',
    icon: HeartPulse,
    description: 'Анализ твоего самочувствия в туре.',
    href: '/fun?quiz=signals',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/20',
  },
  'debrief': {
    title: 'Рефлексия опыта',
    icon: BookOpen,
    description: 'Осознание того, что открыл для тебя последний поход.',
    href: '/fun?quiz=debrief',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/20',
  },
};

// ─── загрузка данных ─────────────────────────────────────────────────
async function getTestResults(userId: string) {
  const profile = await prisma.memberProfile.findUnique({
    where: { userId },
  });
  if (!profile) return null;

  const results = await prisma.testResult.findMany({
    where: { memberId: profile.id },
    orderBy: { createdAt: 'desc' },
  });

  return { profile, results };
}

function formatDate(d: Date) {
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// ─── страница ────────────────────────────────────────────────────────
export default async function TestsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account/tests');

  const data = await getTestResults(user.id);
  if (!data) redirect('/login?next=/account/tests');

  const { results } = data;

  const passedSlugs = new Set(results.map(r => r.testSlug));
  const unpassedQuizzes = Object.entries(QUIZ_CONFIG).filter(
    ([slug]) => !passedSlugs.has(slug)
  );

  return (
    <div className="space-y-8 max-w-5xl">

      {/* Заголовок */}
      <div>
        <h1 className="text-2xl font-black text-white mb-1">ДНК Туриста</h1>
        <p className="text-sm text-slate-300">
          {results.length > 0
            ? `Открыто ${results.length} из ${Object.keys(QUIZ_CONFIG).length} граней вашей личности`
            : 'Пройдите тесты в Fan-секторе, чтобы собрать свой профиль'}
        </p>
      </div>

      {/* ── Пройденные тесты (RPG-Витрина) ─────────────────────────── */}
      {results.length > 0 && (
        <section className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map(result => {
              const config = QUIZ_CONFIG[result.testSlug];
              if (!config) return null;

              const res = result.result as unknown as TestResultData;
              const typeName = res.type ?? 'Результат сохранен';
              const Icon = config.icon;

              return (
                <div
                  key={result.id}
                  className="bg-slate-900/60 border border-white/5 rounded-3xl p-5 flex flex-col relative overflow-hidden group hover:border-white/10 transition-colors"
                >
                  {/* Фоновое свечение */}
                  <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl opacity-20 rounded-full pointer-events-none ${config.bgColor.replace('/10', '')}`} />

                  {/* Шапка карточки */}
                  <div className="flex items-center gap-3 mb-4 relative z-10">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${config.bgColor} ${config.color}`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">{config.title}</h3>
                      <p className="text-[12px] text-slate-300">{formatDate(result.createdAt)}</p>
                    </div>
                  </div>

                  {/* Главный Результат */}
                  <div className="mb-5 relative z-10">
                    <p className={`text-xl font-black uppercase tracking-wide ${config.color}`}>
                      {typeName}
                    </p>
                    {res.badge && (
                      <p className="text-sm text-slate-300 mt-1 font-medium">
                        {res.badge}
                      </p>
                    )}
                  </div>

                  {/* RPG Статы (Компактные шкалы) */}
                  {!!res.score && typeof res.score === 'object' && Object.keys(res.score).length > 0 && (
                    <div className="mb-6 relative z-10 grid grid-cols-2 gap-x-4 gap-y-3">
                      {Object.entries(res.score)
                        .filter(([key]) => key.toLowerCase() !== 'total') // Прячем общий тотал, оставляем только хар-ки
                        .slice(0, 6)
                        .map(([key, value]) => (
                          <div key={key} className="space-y-1.5">
                            <div className="flex items-center justify-between text-[12px] font-bold uppercase tracking-wider">
                              <span className="text-slate-300 truncate pr-2">{key}</span>
                              <span className={config.color}>{value}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden shadow-inner">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ${config.bgColor.replace('/10', '/60')}`}
                                style={{ width: `${Math.min(value || 0, 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Кнопка "Пройти заново" внизу */}
                  <div className="mt-auto pt-4 border-t border-white/5 relative z-10">
                    <Link
                      href={config.href}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-colors border border-transparent hover:border-white/5"
                    >
                      <RefreshCw size={14} /> Перепройти тест
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Непройденные квизы ───────────────────────────────────── */}
      {unpassedQuizzes.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-white/5">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            {results.length > 0 ? 'Ещё не пройдены' : 'Доступные тесты'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {unpassedQuizzes.map(([slug, config]) => {
              const Icon = config.icon;
              return (
                <Link
                  key={slug}
                  href={config.href}
                  className="flex items-center gap-4 bg-slate-900/40 border border-white/5 hover:border-white/10 rounded-2xl p-4 transition-all group"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner transition-transform group-hover:scale-110 ${config.bgColor} ${config.color}`}>
                    <Icon size={24} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white group-hover:text-teal-400 transition-colors truncate">
                      {config.title}
                    </p>
                    <p className="text-xs text-slate-300 truncate mt-0.5">
                      {config.description}
                    </p>
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-slate-600 group-hover:text-teal-400 transition-colors shrink-0"
                  />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* CTA если вообще нет результатов */}
      {results.length === 0 && (
        <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/10 flex items-center justify-center shrink-0 mb-4 shadow-inner border border-teal-500/20">
            <FlaskConical size={32} className="text-teal-400" />
          </div>
          <p className="text-lg font-black text-white mb-2">
            Узнай свой туристический профиль
          </p>
          <p className="text-sm text-slate-300 mb-6 max-w-sm">
            Пройди тесты в Fan-секторе — результаты автоматически сохранятся здесь в виде красивой статистики.
          </p>
          <Link
            href="/fun"
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-black tracking-widest uppercase px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)]"
          >
            Начать <ArrowRight size={16} />
          </Link>
        </div>
      )}

    </div>
  );
}
```

## File: src/features/account/components/AccountNav.tsx
```typescript
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Ticket, 
  History, 
  Heart, 
  Settings, 
  LogOut,
  Compass,
  FlaskConical // ✅ ДОБАВЛЕНА ИКОНКА
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type AccountNavProps = {
  profile: {
    name: string | null;
    level: string;
    totalTours: number;
  };
};

const NAV_LINKS = [
  { name: 'Дашборд', href: '/account/dashboard', icon: LayoutDashboard },
  // Удалили 'Мои туры' (/account/bookings)
  { name: 'Мои поездки', href: '/account/history', icon: History }, // Переименовали
  { name: 'Вишлист', href: '/account/wishlist',  icon: Heart },
  { name: 'Мои тесты', href: '/account/tests',  icon: FlaskConical },
  { name: 'Настройки', href: '/account/settings',   icon: Settings }, 
];

export default function AccountNav({ profile }: AccountNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <>
      {/* ─── ДЕСКТОПНАЯ ВЕРСИЯ (Левый сайдбар) ─────────────────────────── */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 z-50 bg-slate-950/80 backdrop-blur-xl border-r border-white/5">
        
        {/* Логотип и мини-профиль */}
        <div className="p-6 border-b border-white/5">
          <Link href="/" className="flex items-center gap-2 text-white hover:text-teal-400 transition-colors mb-6">
            <Compass size={28} className="text-teal-500" />
            <span className="font-black tracking-widest uppercase text-lg">EVA</span>
          </Link>
          
          <div>
            <p className="text-sm font-bold text-white leading-tight">
              {profile.name || 'Турист'}
            </p>
            <p className="text-xs text-teal-400 font-medium">
              {profile.level} · {profile.totalTours} туров
            </p>
          </div>
        </div>

        {/* Ссылки навигации */}
        <nav className="flex-1 flex flex-col gap-2 p-4">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive 
                    ? 'bg-teal-500/10 text-teal-400' 
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={18} />
                {link.name}
              </Link>
            );
          })}
        </nav>
        
        {/* Кнопка выхода */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-slate-300 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={18} />
            Выйти
          </button>
        </div>
      </aside>

      {/* ─── МОБИЛЬНАЯ ВЕРСИЯ (Нижний свайп-бар) ────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-t border-white/10 pb-safe">
        <div className="flex items-center overflow-x-auto snap-x snap-mandatory overscroll-x-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-2 py-2 gap-1">
          
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`snap-start shrink-0 flex flex-col items-center justify-center w-[72px] h-14 rounded-2xl transition-all relative ${
                  isActive 
                    ? 'text-teal-400' 
                    : 'text-slate-300 hover:text-slate-300'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-teal-500/10 rounded-2xl -z-10 animate-in fade-in zoom-in duration-300" />
                )}
                <Icon size={20} className={isActive ? 'mb-1' : 'mb-1 opacity-80'} />
                <span className="text-[12px] font-bold tracking-wide">
                  {link.name}
                </span>
              </Link>
            );
          })}

          <div className="shrink-0 w-px h-8 bg-white/10 mx-1" />

          <button
            onClick={handleLogout}
            className="snap-start shrink-0 flex flex-col items-center justify-center w-[72px] h-14 rounded-2xl text-slate-600 hover:text-red-400 transition-colors"
          >
            <LogOut size={20} className="mb-1" />
            <span className="text-[12px] font-bold tracking-wide">
              Выход
            </span>
          </button>
          
          <div className="shrink-0 w-2" />
        </div>
      </nav>
    </>
  );
}
```

## File: src/features/account/components/VirtualCard.tsx
```typescript
"use client";

import React, { useState, useRef, MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Crown, Mountain, Flame, Map, Compass, Info, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import LevelsInfoModal from '@/components/modals/LevelsInfoModal'; // ✅ Подключаем новую модалку
import MemberQrCode from '@/features/account/components/MemberQrCode';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface VirtualCardProps {
  name: string | null;
  level: string;
  totalTours: number;
  totalKm: number;
  memberId: string | null;
  bookingShortId?: number | null;  // Booking.shortId — короткий номер
  tourTitle?: string | null;       // Booking.tour.title
  tourStartDate?: Date | null;     // Booking.tourDate.startDate
}

// 1. Внедрение четкой системы уровней и Визуальный апгрейд
const LEVELS_CONFIG = [
  // ✅ ИСПРАВЛЕНО: Первый уровень теперь премиальный темно-изумрудный, а не блекло-серый
  { name: 'Первопроходец', min: 0, max: 2, color: 'text-emerald-400', bg: 'from-emerald-700 to-teal-900', border: 'border-emerald-500/30', icon: Map },
  { name: 'Походник', min: 3, max: 6, color: 'text-emerald-400', bg: 'from-emerald-600 to-teal-900', border: 'border-emerald-500/30', icon: Compass },
  { name: 'Бывалый', min: 7, max: 14, color: 'text-blue-400', bg: 'from-blue-600 to-indigo-900', border: 'border-blue-500/30', icon: Mountain },
  { name: 'Ветеран', min: 15, max: 29, color: 'text-purple-400', bg: 'from-purple-600 to-fuchsia-900', border: 'border-purple-500/30', icon: Flame },
  { name: 'Легенда клуба', min: 30, max: 9999, color: 'text-amber-400', bg: 'from-amber-500 to-orange-900', border: 'border-amber-500/50', icon: Crown },
];

  export default function VirtualCard({
    name,
    level,
    totalTours,
    totalKm,
    bookingShortId,
    tourTitle,
    tourStartDate,
    memberId,
  }: VirtualCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [transformStyle, setTransformStyle] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  const safeTours = totalTours || 0;
  const safeKm = totalKm || 0;
  const displayId = memberId ? memberId.split('-')[0].toUpperCase() : 'ID_PENDING';

  // Находим текущий уровень и следующий
  const currentLevelIndex = LEVELS_CONFIG.findIndex(l => safeTours >= l.min && safeTours <= l.max) !== -1
    ? LEVELS_CONFIG.findIndex(l => safeTours >= l.min && safeTours <= l.max)
    : 0;

  const currentConfig = LEVELS_CONFIG[currentLevelIndex];
  const nextConfig = LEVELS_CONFIG[currentLevelIndex + 1];
  const Icon = currentConfig.icon;

  // Логика прогресса
  const toursNeeded = nextConfig ? nextConfig.min - safeTours : 0;
  const progressPercent = nextConfig
    ? ((safeTours - currentConfig.min) / (nextConfig.min - currentConfig.min)) * 100
    : 100;

  // 3D эффект при наведении мыши (только для десктопа)
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isFlipped) return; // Отключаем 3D-наклон, если карта перевернута
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;

    setTransformStyle(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
  };

  const handleMouseLeave = () => {
    setTransformStyle(`perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`);
  };

  return (
    <div className="w-full max-w-md mx-auto relative perspective-1000">

      {/* Обертка для 3D-наклона мышью */}
      <div
        ref={cardRef}
        className="relative w-full aspect-[1.6/1] transition-transform duration-300 ease-out preserve-3d"
        style={{
          transform: isFlipped ? 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)' : transformStyle
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Интерактивность: framer-motion для переворота */}
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-full h-full relative preserve-3d cursor-pointer shadow-2xl rounded-2xl"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* ─── ЛИЦЕВАЯ СТОРОНА ────────────────────────────────────────── */}
          <div className={cn(
            "absolute inset-0 w-full h-full rounded-2xl p-6 flex flex-col justify-between overflow-hidden backface-hidden border",
            "bg-gradient-to-br", currentConfig.bg, currentConfig.border
          )}>
            {/* Декоративный паттерн */}
            <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/20 blur-[50px] rounded-full pointer-events-none" />

            <div className="relative z-10 flex justify-between items-start">
              <div className="flex flex-col">
                <span className="text-white/80 text-[12px] font-bold uppercase tracking-[0.3em]">Турклуб</span>
                <span className="text-white text-xl font-black tracking-tighter leading-none">ЭВА</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/20 backdrop-blur-sm rounded-full border border-white/10">
                  <Icon size={14} className={currentConfig.color} />
                  <span className={cn("text-xs font-black uppercase tracking-widest", currentConfig.color)}>
                    {currentConfig.name}
                  </span>
                </div>

                {/* ✅ Кнопка Info: отключена, так как переворот работает по клику, но оставлена в коде */}
                {/*
                <button
                  onClick={(e) => { e.stopPropagation(); setIsFlipped(true); }}
                  className="w-7 h-7 flex items-center justify-center bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-sm border border-white/10 transition-colors text-white/80 hover:text-white"
                >
                  <Info size={14} />
                </button>
                */}
              </div>
            </div>

            <div className="relative z-10 flex justify-between items-end gap-4">
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-white/50 text-[12px] uppercase font-bold tracking-widest">Участник</span>
                {/* ✅ ИСПРАВЛЕНО: Имя переносится на две строки (text-balance) и не обрезается (truncate убран) */}
                <span className="text-white text-lg md:text-xl font-black uppercase tracking-widest drop-shadow-md line-clamp-2 text-balance break-words leading-tight">
                  {name || 'ТУРИСТ'}
                </span>
              </div>
              <div className="text-right flex flex-col gap-1 shrink-0">
                <span className="text-white/90 text-sm font-bold">{safeTours} ТУРОВ</span>
                <span className="text-white/60 text-xs font-medium">{Math.floor(safeKm)} КМ</span>
              </div>
            </div>
          </div>

          {/* ─── ОБОРОТНАЯ СТОРОНА (ПРОПУСК И QR) ─────────────────────────── */}
          <div className={cn(
            "absolute inset-0 w-full h-full rounded-2xl p-6 flex flex-col items-center justify-center overflow-hidden backface-hidden border rotate-y-180",
            "bg-slate-900 border-slate-700"
          )}>
            {/* Магнитная полоса (декор) */}
            <div className="absolute inset-x-0 top-6 h-10 bg-black/40" />

            <button
              onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }}
              className="absolute top-4 right-4 p-1.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-slate-300 hover:text-white z-20"
            >
              <X size={16} />
            </button>

<div className="relative z-10 bg-white p-2.5 rounded-xl mt-8 mb-4 shadow-lg">
          {bookingShortId ? (
            <MemberQrCode
              bookingShortId={bookingShortId}
              tourTitle={tourTitle ?? ''}
              tourStartDate={tourStartDate ?? null}
              size={140}
            />
          ) : (
            // Нет активных броней — показываем иконку-заглушку lucide-react
            <QrCode size={140} className="text-slate-950" />
          )}
        </div>

            <p className="text-slate-300 text-xs uppercase tracking-[0.2em] font-mono text-center font-bold">
              ID: {displayId}
            </p>
           </div>
        </motion.div>
      </div>

      {/* ─── Шкала прогресса и Кнопка Модалки ────────────────────────────── */}
      <div className="mt-8 px-2 flex flex-col gap-4">
        {nextConfig ? (
          <div className="flex flex-col gap-2.5">
            <div className="flex justify-between items-end">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Прогресс статуса</span>
              <span className="text-[12px] text-slate-300 font-bold uppercase tracking-widest">
                Еще {toursNeeded} {toursNeeded === 1 ? 'тур' : toursNeeded > 1 && toursNeeded < 5 ? 'тура' : 'туров'} до «{nextConfig.name}»
              </span>
            </div>
            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
              <div
                className={cn("h-full transition-all duration-1000 ease-out bg-gradient-to-r", currentConfig.bg)}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest bg-amber-500/10 py-3.5 rounded-xl border border-amber-500/20 shadow-inner">
            <Crown size={16} /> Максимальный уровень
          </div>
        )}

        {/* ✅ НОВОЕ: Встроенная модалка с информацией об уровнях (прямо под прогресс-баром) */}
        <LevelsInfoModal />
      </div>

      {/* Глобальные стили для поддержки 3D во всех браузерах */}
      <style dangerouslySetInnerHTML={{__html: `
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}} />
    </div>
  );
}
```

## File: src/app/account/wishlist/page.tsx
```typescript
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Heart, Bell, MapPin, Clock, TrendingUp, ArrowRight,
  Hourglass, BookOpen 
} from 'lucide-react';
import WishlistToggle from '@/features/account/components/WishlistToggle';
import CategoryPills from '@/components/account/CategoryPills';
import CancelWaitlistButton from '@/features/account/components/CancelWaitlistButton';

// ─── загрузка данных ─────────────────────────────────────────────────
async function getWishlistData(userId: string) {
  const profile = await prisma.memberProfile.findUnique({
    where: { userId },
  });
  if (!profile) return null;

  // 1. Лист ожидания (Waitlist)
  const waitlists = await prisma.waitlist.findMany({
    where: {
      OR: [
        { memberId: profile.id },
        ...(profile.phone ? [{ phone: profile.phone }] : [])
      ]
    },
    include: {
      tour: { select: { title: true, slug: true, coverImage: true, location: true } },
      tourDate: { select: { startDate: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // 2. Вишлист туров
  const tourWishlist = await prisma.watchList.findMany({
    where: { memberId: profile.id, tourId: { not: null } },
    orderBy: { createdAt: 'desc' },
    include: {
      tour: {
        select: {
          id: true,
          title: true,
          slug: true,
          location: true,
          coverImage: true,
          duration: true,
          distance: true,
          price: true,
          currency: true,
          isActive: true,
          category: { select: { title: true, color: true } },
          tourDates: {
            where: { startDate: { gte: new Date() }, isActive: true },
            orderBy: { startDate: 'asc' },
            take: 1,
            select: { startDate: true, spotsLeft: true },
          },
        },
      },
    },
  });

  // 3. Избранные Статьи Блога
  const favoritePosts = await prisma.favoritePost.findMany({
    where: { memberId: profile.id },
    include: {
      post: { select: { id: true, title: true, slug: true, image: true, read_time: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // 4. Категории для Pill-тегов
  const categorySubscriptions = await prisma.watchList.findMany({
    where: { memberId: profile.id, categoryId: { not: null } },
    select: { categoryId: true }
  });

  const allCategories = await prisma.tourCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, slug: true, title: true, icon: true, color: true },
  });

  const subscribedCategoryIds = categorySubscriptions.map(s => s.categoryId).filter(Boolean) as string[];

  return {
    profile,
    waitlists,
    tourWishlist,
    favoritePosts,
    allCategories,
    subscribedCategoryIds,
  };
}

function formatDate(d: Date) {
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

// ─── цвета категорий ──────────────────────────────────────
const CAT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  teal:   { bg: 'bg-teal-500/10',   text: 'text-teal-400',   border: 'border-teal-500/20'   },
  blue:   { bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/20'   },
  green:  { bg: 'bg-green-500/10',  text: 'text-green-400',  border: 'border-green-500/20'  },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  sky:    { bg: 'bg-sky-500/10',    text: 'text-sky-400',    border: 'border-sky-500/20'    },
};

function getCatStyle(color: string) {
  return CAT_COLORS[color] ?? CAT_COLORS.teal;
}

// ─── страница ────────────────────────────────────────────────────────
export default async function WishlistPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account/wishlist');

  const data = await getWishlistData(user.id);
  if (!data) redirect('/login?next=/account/wishlist');

  const {
    profile,
    waitlists,
    tourWishlist,
    favoritePosts,
    allCategories,
    subscribedCategoryIds,
  } = data;

  return (
    <div className="space-y-8 max-w-4xl pb-10">

      {/* ── Заголовок ── */}
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Мои желания</h1>
        <p className="text-sm text-slate-300">
          Туры и статьи, за которыми вы следите, и ваши листы ожидания.
        </p>
      </div>

      {/* ── ТЕКСТОВАЯ ПОДСКАЗКА PRO TELEGRAM ── */}
      <div className="flex items-start gap-3 bg-slate-800/40 border border-white/5 rounded-2xl p-4">
        <Bell size={18} className="text-teal-500 shrink-0 mt-0.5" />
        <p className="text-sm text-slate-300 leading-relaxed">
          Уведомления об освободившихся местах и новых датах туров приходят в Telegram. 
          <Link href="/account/settings" className="text-teal-400 hover:text-teal-300 font-bold ml-1.5 transition-colors whitespace-nowrap">
            Настроить →
          </Link>
        </p>
      </div>

      {/* ── ЛИСТ ОЖИДАНИЯ ── */}
      {waitlists.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Hourglass size={18} className="text-amber-500 animate-pulse" />
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest">
              Лист ожидания ({waitlists.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {waitlists.map((w: any) => (
              <div key={w.id} className="flex items-center gap-4 bg-slate-900/60 border border-amber-500/20 rounded-xl p-3">
                <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-800">
                  {w.tour.coverImage && (
                    <Image src={w.tour.coverImage} alt={w.tour.title} fill className="object-cover opacity-80" sizes="56px" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{w.tour.title}</p>
                  <p className="text-xs text-amber-400/80 font-medium mt-0.5">
                    {w.tourDate ? `Хотел на ${formatDate(w.tourDate.startDate)}` : 'Жду новые даты'}
                  </p>
                </div>
                <div className="shrink-0 pr-1">
                    <CancelWaitlistButton id={w.id} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── СОХРАНЁННЫЕ ТУРЫ ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Heart size={14} className="text-rose-400" />
            Туры
            {tourWishlist.length > 0 && (
              <span className="text-xs font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                {tourWishlist.length}
              </span>
            )}
          </h2>
          <Link href="/tour" className="text-xs text-teal-400 hover:text-teal-300 transition-colors">
            Все туры →
          </Link>
        </div>

        {tourWishlist.length === 0 ? (
          <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-8 text-center">
            <Heart size={32} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-300 text-sm mb-2">Нет сохранённых туров</p>
            <p className="text-xs text-slate-600 mb-4">Нажмите ♡ на странице тура чтобы добавить в вишлист</p>
            <Link href="/tour" className="inline-flex items-center gap-2 text-sm font-bold text-teal-400 hover:text-teal-300 transition-colors">
              Смотреть туры <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tourWishlist.map(item => {
              if (!item.tour) return null;
              const { tour } = item;
              const nextDate = tour.tourDates[0];
              const catStyle = getCatStyle(tour.category?.color ?? 'teal');
              const isLowSpots = nextDate && nextDate.spotsLeft <= 3 && nextDate.spotsLeft > 0;

              return (
                <div key={item.id} className="bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden flex">
                  {/* Фото */}
                  <div className="relative w-24 sm:w-28 shrink-0">
                    {tour.coverImage ? (
                      <Image src={tour.coverImage} alt={tour.title} fill className="object-cover" sizes="112px" />
                    ) : (
                      <div className="absolute inset-0 bg-slate-800" />
                    )}
                  </div>

                  {/* Контент */}
                  <div className="flex-1 p-4 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      {tour.category && (
                        <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${catStyle.bg} ${catStyle.text}`}>
                          {tour.category.title}
                        </span>
                      )}
                      <WishlistToggle
                        tourId={tour.id}
                        memberId={profile.id}
                        watchlistId={item.id}
                        inWishlist={true}
                      />
                    </div>

                    <Link href={`/tour/${tour.slug}`} className="block text-sm font-black text-white hover:text-teal-400 transition-colors truncate mb-2">
                      {tour.title}
                    </Link>

                    <div className="flex flex-wrap gap-2 text-xs text-slate-300 mb-2">
                      {tour.location && <span className="flex items-center gap-1"><MapPin size={10} /> {tour.location}</span>}
                      {tour.duration && <span className="flex items-center gap-1"><Clock size={10} /> {tour.duration}</span>}
                      {tour.distance && <span className="flex items-center gap-1"><TrendingUp size={10} /> {tour.distance} км</span>}
                    </div>

                    <div className="flex items-center justify-between">
                      {nextDate ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-teal-400 font-medium">{formatDate(nextDate.startDate)}</span>
                          {isLowSpots && (
                            <span className="text-[12px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full">
                              Осталось {nextDate.spotsLeft} мест
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600">Дат пока нет</span>
                      )}
                      <Link href={`/tour/${tour.slug}`} className="text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors">
                        {nextDate ? 'Записаться' : 'Подробнее'} →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── ИЗБРАННЫЕ СТАТЬИ БЛОГА ── */}
      {favoritePosts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <BookOpen size={18} className="text-blue-500" />
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest">
              Сохраненные статьи ({favoritePosts.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {favoritePosts.map((sp: any) => (
              <Link key={sp.id} href={`/blog/${sp.post.slug}`} className="group flex items-start gap-4 bg-slate-900/40 border border-white/5 hover:border-white/10 rounded-xl p-3 transition-colors">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-800">
                  {sp.post.image && (
                    <Image src={sp.post.image} alt={sp.post.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" sizes="64px" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-sm font-bold text-slate-200 group-hover:text-white line-clamp-2 transition-colors leading-snug">{sp.post.title}</p>
                  <p className="text-[12px] text-slate-300 font-bold uppercase tracking-wider mt-1.5">
                    {sp.post.read_time ? `${sp.post.read_time} мин чтения` : 'Статья'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

    {/* ── ПОДПИСКИ НА КАТЕГОРИИ ── */}
      <section className="space-y-4 pt-4 border-t border-white/5">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-teal-400" />
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            Направления (Подписки)
          </h2>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Мы пришлём уведомление, когда появятся новые даты в выбранных категориях.
        </p>

        <CategoryPills
          categories={allCategories}
          subscribedIds={subscribedCategoryIds}
          memberId={profile.id}
        />

        {/* ✅ ВЕРНУЛИ ТВОЮ ФРАЗУ ПРО КАНАЛ */}
        <p className="text-xs text-slate-600 mt-5">
          Уведомления о новых турах и постах приходят в наш Telegram канал. Убедитесь что вы подписаны на{' '}
          <a
            href="https://t.me/evaturclub"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-500 hover:text-teal-400 font-medium transition-colors"
          >
            @evaturclub
          </a>
          .
        </p>
      </section>

    </div>
  );
}
```

## File: src/app/account/dashboard/page.tsx
```typescript
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  ArrowRight, Wallet, Tent, Map, Moon, Hourglass, 
  Info, ChevronDown, Star, FlaskConical, Gift, Mountain
} from 'lucide-react';

import VirtualCard from '@/features/account/components/VirtualCard';
import BookingCard from '@/features/account/components/BookingCard';
import CancelWaitlistButton from '@/features/account/components/CancelWaitlistButton';
import AchievementsBox from '@/features/account/components/AchievementsBox';
import ReferralCard from '@/features/account/components/ReferralCard';

// ✅ ОТКЛЮЧАЕМ КЭШИРОВАНИЕ, ЧТОБЫ ДАННЫЕ ВСЕГДА БЫЛИ СВЕЖИМИ
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ─── вспомогательные функции ─────────────────────────────────────────

function formatDate(d: Date) {
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

// ─── загрузка данных ─────────────────────────────────────────────────
async function getDashboardData(userId: string) {
  // ✅ ДОБАВЛЕНО: Подтягиваем promoCode вместе с профилем
  const profile = await prisma.memberProfile.findUnique({
    where: { userId },
    include: { promoCode: true }
  });

  if (!profile) return null;

  // ✅ ЛОГИКА АВТОГЕНЕРАЦИИ ПРОМОКОДА
  let promoCode = profile.promoCode;
  
  if (!promoCode) {
    const cleanName = profile.name ? profile.name.replace(/\s+/g, '').substring(0, 4).toUpperCase() : 'CLUB';
    const shortId = profile.id.substring(0, 4).toUpperCase();
    const baseCode = `EVA-${cleanName}-${shortId}`;

    try {
      promoCode = await prisma.promoCode.create({
        data: {
          code: baseCode,
          memberId: profile.id,
          discount: 10, // Скидка другу (можно менять)
          reward: 10,   // Бонус владельцу
        }
      });
    } catch (e) {
      // Фолбэк: если такой код случайно уже существует, добавляем рандомные цифры
      promoCode = await prisma.promoCode.create({
        data: {
          code: `${baseCode}-${Math.floor(Math.random() * 1000)}`,
          memberId: profile.id,
          discount: 500,
          reward: 500,
        }
      });
    }
  }

  const now = new Date();

  // 1. Все предстоящие брони
  const upcomingBookings = await prisma.booking.findMany({
    where: {
      memberId: profile.id,
      // ✅ Теперь клиент видит бронь, даже если еще не оплатил или чек на проверке
      status: { in: ['pending', 'confirmed', 'awaiting_payment', 'moderation'] },
      OR: [
        { tourDate: { startDate: { gte: now } } },
        { tourDateId: null } 
      ]
    },
    orderBy: { tourDate: { startDate: 'asc' } },
    include: {
     tour: {
        select: {
          title: true, slug: true, location: true, meetingPoint: true, coverImage: true, // ✅ ДОБАВИЛИ meetingPoint
          difficulty: true, duration: true, checklist: true, documents: true, currency: true
        },
            },
      tourDate: {
        select: {
          startDate: true, endDate: true, time: true,
          guide: { select: { name: true, image: true } },
        },
      },
    },
  });

  // 2. Лист ожидания
  let waitlists: any[] = [];
  if (profile.phone) {
    waitlists = await prisma.waitlist.findMany({
      where: { phone: profile.phone },
      include: {
        tour: { select: { title: true, slug: true, coverImage: true, location: true } },
        tourDate: { select: { startDate: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 3. Статистика (СИНХРОН С ИСТОРИЕЙ)
  const pastConfirmedBookings = await prisma.booking.findMany({
  where: { 
      memberId: profile.id, 
      // ✅ Ачивки и КМ считаем только по реально посещенным (оплаченным) турам
      status: 'confirmed',
      tourDate: { startDate: { lt: now } }
    },
    include: { 
      tour: { select: { title: true, location: true, distance: true, duration: true } },
      tourDate: { select: { startDate: true, endDate: true } }
    },
  });

  // 4. Агрегация статистики и Ачивок
  let totalKm = 0;
  let totalNights = 0;
  const totalTours = pastConfirmedBookings.length;

  let waterTours = 0;
  let winterTours = 0;
  let pmrTours = 0;

  for (const b of pastConfirmedBookings) {
    const km = parseFloat(b.tour?.distance ?? '0');
    totalKm += isNaN(km) ? 0 : km;

    if (b.tourDate?.startDate && b.tourDate?.endDate) {
      const diffTime = Math.abs(b.tourDate.endDate.getTime() - b.tourDate.startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      totalNights += diffDays;
    } else if (b.tour?.duration) {
      const d = parseInt(b.tour.duration) - 1;
      totalNights += (isNaN(d) || d < 0 ? 0 : d);
    }

    const title = b.tour?.title?.toLowerCase() || '';
    const location = b.tour?.location?.toLowerCase() || '';
    
    if (title.includes('сплав') || title.includes('байдарк') || title.includes('сап') || title.includes('sup')) {
      waterTours++;
    }
    if (location.includes('приднестровь') || location.includes('тирасполь') || location.includes('дубоссар') || location.includes('строенцы') || location.includes('рашков')) {
      pmrTours++;
    }
    if (b.tourDate?.startDate) {
      const month = b.tourDate.startDate.getMonth();
      if (month === 11 || month === 0 || month === 1) { 
        winterTours++;
      }
    }
  }

  return {
    profile,
    promoCode, // Возвращаем реальный промокод из БД
    upcomingBookings,
    waitlists,
    stats: {
      totalTours,
      totalKm: Math.round(totalKm),
      balance: profile.balance || 0, 
      totalNights,
    },
    achievements: {
      waterTours,
      winterTours,
      pmrTours,
      totalKm: Math.round(totalKm),
      totalNights
    }
  };
}

// ─── страница ────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account/dashboard'); 

  const data = await getDashboardData(user.id);
  if (!data) redirect('/login?next=/account/dashboard');

  const { profile, promoCode, upcomingBookings, waitlists, stats, achievements } = data;
  const displayName = profile.name ?? 'Участник';

  const nearestBooking = upcomingBookings.length > 0 ? upcomingBookings[0] : null;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-10">
      <div className="px-2 md:px-0">
        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Личный кабинет</h1>
        <p className="text-slate-300 mt-2">Управляйте своими путешествиями и привилегиями</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 xl:gap-8 items-start">
        
        <div className="w-full xl:w-5/12 order-1 shrink-0 px-2 md:px-0">
          <VirtualCard 
            name={displayName} 
            level={profile.level} 
            totalTours={stats.totalTours}
            totalKm={stats.totalKm}      
            memberId={profile.id}
            bookingShortId={nearestBooking?.shortId ?? null}
            tourTitle={nearestBooking?.tour?.title ?? null}
            tourStartDate={nearestBooking?.tourDate?.startDate ?? null}
          />
        </div>

        <div className="w-full xl:w-7/12 flex flex-col gap-6 order-2">
          
          <div className="order-1 xl:order-2 px-2 md:px-0">
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-5 sm:p-6 shadow-lg">
              <h3 className="text-slate-300 font-bold text-xs sm:text-sm mb-4 sm:mb-6 uppercase tracking-wider flex items-center gap-2">
                <Mountain size={16} className="text-teal-500" /> Вы прошли с нами
              </h3>
              
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="flex flex-col gap-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
                    <Tent size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-white leading-none">{stats.totalTours}</div>
                    <div className="text-[12px] sm:text-xs text-slate-300 font-bold uppercase tracking-wider mt-1.5">Туров</div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner">
                    <Map size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-white leading-none">{stats.totalKm}</div>
                    <div className="text-[12px] sm:text-xs text-slate-300 font-bold uppercase tracking-wider mt-1.5">Км</div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
                    <Moon size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-white leading-none">{stats.totalNights}</div>
                    <div className="text-[12px] sm:text-xs text-slate-300 font-bold uppercase tracking-wider mt-1.5">Ночей</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="order-2 xl:order-1 px-2 md:px-0">
            <div className="bg-slate-900 border border-amber-500/20 rounded-3xl overflow-hidden shadow-lg">
              
              <div className="p-5 flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-transparent">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0 shadow-inner">
                    <Wallet size={24} />
                  </div>
                  <div>
                    <h3 className="text-amber-500/80 font-bold text-[12px] sm:text-xs uppercase tracking-widest mb-0.5">Ваш баланс</h3>
                    <div className="text-2xl sm:text-3xl font-black text-white flex items-baseline gap-1.5">
                      {stats.balance} <span className="text-sm sm:text-base font-bold text-amber-500/50">₽</span>
                    </div>
                  </div>
                </div>
              </div>

              <details className="group border-t border-amber-500/10">
                <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors list-none [&::-webkit-details-marker]:hidden">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                    <Info size={14} /> Как получать бонусы?
                  </span>
                  <ChevronDown size={16} className="text-slate-300 group-open:rotate-180 transition-transform duration-300" />
                </summary>
                
                <div className="px-4 pb-5 pt-1 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                  
                  <div className="flex items-start gap-3 bg-slate-800/40 p-3 rounded-2xl border border-white/5">
                    <Star size={18} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-white mb-0.5">Отзывы о турах</p>
                      <p className="text-xs text-slate-300 leading-snug">Получите +10 ₽ за честный отзыв на сайте после прохождения маршрута.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-800/40 p-3 rounded-2xl border border-white/5">
                    <FlaskConical size={18} className="text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-white mb-0.5">Fan-сектор</p>
                      <p className="text-xs text-slate-300 leading-snug">Проходите веселые тесты в личном кабинете и получайте +1 ₽ за каждый.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-800/40 p-3 rounded-2xl border border-white/5">
                    <Gift size={18} className="text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-white mb-0.5">Пригласить друга</p>
                      <p className="text-xs text-slate-300 leading-snug">Дайте другу промокод на 5% скидку. После его первой поездки вы получите бонус!</p>
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <span className="inline-block px-3 py-1 bg-amber-500/10 text-amber-500/80 text-[12px] font-bold uppercase tracking-widest rounded-lg border border-amber-500/20">
                      Оплачивайте до 10% от стоимости тура
                    </span>
                  </div>

                </div>
              </details>
            </div>
          </div>

        </div>
      </div>

      <section className="pt-2">
        <AchievementsBox stats={achievements} />
      </section>

      {/* ✅ ПЕРЕДАЕМ РЕАЛЬНЫЕ ДАННЫЕ В КАРТОЧКУ */}
      <section className="pt-2 px-2 md:px-0">
        <ReferralCard 
          promoCode={promoCode.code} 
          rewardAmount={promoCode.reward} 
          friendReward={promoCode.discount} 
        />
      </section>

      {waitlists.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-white/5 px-2 md:px-0">
          <div className="flex items-center gap-2 mb-2">
            <Hourglass size={18} className="text-amber-500 animate-pulse" />
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Лист ожидания
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {waitlists.map((w: any) => (
              <div key={w.id} className="flex items-center gap-4 bg-slate-900/60 border border-amber-500/20 rounded-2xl p-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{w.tour.title}</p>
                  <p className="text-xs text-amber-400/80 font-medium mt-1">
                    {w.tourDate ? formatDate(w.tourDate.startDate) : 'Жду новые даты'}
                  </p>
                </div>
                <div className="shrink-0">
                  <CancelWaitlistButton id={w.id} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-6 pt-4 border-t border-white/5 px-2 md:px-0">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
          Предстоящие поездки
        </h2>

     {upcomingBookings.length === 0 ? (
          <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-8 text-center">
            <p className="text-slate-300 text-sm mb-4">У вас пока нет запланированных туров</p>
            <Link href="/tour" className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(13,148,136,0.3)]">
              Выбрать приключение <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {upcomingBookings.map(booking => {
              const guestsCount = booking.ticketsAdult + booking.ticketsChild + booking.ticketsMember + (booking.ticketsFamily * 3);
              return (
                <BookingCard 
                  key={booking.id} 
                  bookingId={booking.id} // ✅ Теперь ID брони передается железобетонно
                  booking={{ ...booking, guestsCount }} 
                />
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
```
