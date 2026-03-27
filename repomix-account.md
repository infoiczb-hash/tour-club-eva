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
- Only files matching these patterns are included: src/app/account/**/*, src/features/account/**/*, src/types/account*.ts, src/lib/account*.ts, src/api/account/**/*
- Files matching these patterns are excluded: node_modules, .next, *.log
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
src/app/account/bookings/[id]/page.tsx
src/app/account/bookings/page.tsx
src/app/account/dashboard/page.tsx
src/app/account/history/page.tsx
src/app/account/layout.tsx
src/app/account/page.tsx
src/app/account/settings/page.tsx
src/app/account/tests/page.tsx
src/app/account/wishlist/actions.ts
src/app/account/wishlist/components/CategoryPills.tsx
src/app/account/wishlist/page.tsx
src/features/account/actions/blogWishlist.ts
src/features/account/actions/getProfile.ts
src/features/account/actions/onboarding.ts
src/features/account/actions/saveTestResult.ts
src/features/account/actions/submitReview.ts
src/features/account/actions/toggleWishlist.ts
src/features/account/actions/transferSpot.ts
src/features/account/actions/updateSettings.ts
src/features/account/actions/waitlist.ts
src/features/account/actions/wishlistActions.ts
src/features/account/components/AccountNav.tsx
src/features/account/components/BookingCard.tsx
src/features/account/components/CancelWaitlistButton.tsx
src/features/account/components/CategorySubscribeToggle.tsx
src/features/account/components/OnboardingModal.tsx
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

## File: src/app/account/settings/page.tsx
```typescript
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import SettingsForm from '@/features/account/components/SettingsForm';

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
        <p className="text-sm text-slate-400">Ваша походная карточка. Заполните её один раз, чтобы мы учитывали это во всех турах.</p>
      </div>

      <SettingsForm profile={profile} />
    </div>
  );
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

## File: src/features/account/actions/onboarding.ts
```typescript
// src/features/account/actions/onboarding.ts
'use server';

import { prisma } from '@/lib/prisma';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Функция расчета уровня (как при регистрации)
function getLevel(tourCount: number): string {
  if (tourCount >= 30) return 'Легенда клуба';
  if (tourCount >= 15) return 'Ветеран';
  if (tourCount >= 7)  return 'Бывалый';
  if (tourCount >= 3)  return 'Походник';
  return 'Первопроходец';
}

export async function savePhoneNumberAction(phoneRaw: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Не авторизован' };

  // Очищаем номер от пробелов, чтобы искать в базе корректно
  const phone = phoneRaw.replace(/[^\d+]/g, '');
  
  if (phone.length < 10) {
    return { success: false, error: 'Введен некорректный номер телефона' };
  }

  try {
    // 1. Проверяем, не занят ли этот номер кем-то другим
    const existing = await prisma.memberProfile.findUnique({ where: { phone } });
    if (existing && existing.userId !== user.id) {
      return { success: false, error: 'Этот номер уже привязан к другому аккаунту' };
    }

    // 2. Сохраняем телефон юзеру
    const profile = await prisma.memberProfile.update({
      where: { userId: user.id },
      data: { phone }
    });

    // 3. МАГИЯ: Ищем все исторические брони по этому номеру, у которых еще нет memberId
    const linked = await prisma.booking.updateMany({
      where: { 
        phone: phone, 
        memberId: null 
      },
      data: { memberId: profile.id },
    });

    // 4. Если нашли старые брони — пересчитываем статусы и километраж
    if (linked.count > 0) {
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
    return { success: true, linkedCount: linked.count };
    
  } catch (error) {
    console.error('Onboarding Action Error:', error);
    return { success: false, error: 'Произошла ошибка при сохранении номера' };
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
      className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/60 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
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
          : 'bg-slate-900/60 border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-300'
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

## File: src/features/account/components/OnboardingModal.tsx
```typescript
// src/features/account/components/OnboardingModal.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { Phone, ArrowRight, Loader2, Sparkles, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { savePhoneNumberAction } from '../actions/onboarding';

export default function OnboardingModal() {
  const [phone, setPhone] = useState('+373 ');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const [successData, setSuccessData] = useState<{ linkedCount: number } | null>(null);
  
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Введите корректный номер телефона');
      return;
    }

    startTransition(async () => {
      const res = await savePhoneNumberAction(phone);
      
      if (res.success) {
        setSuccessData({ linkedCount: res.linkedCount || 0 });
        // Даем пользователю прочитать сообщение об успехе и перезагружаем страницу
        setTimeout(() => {
          window.location.reload(); // Надежно очищаем кэш layout'а
        }, 2500);
      } else {
        setError(res.error || 'Произошла ошибка');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[2rem] shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-300">
        
        {successData ? (
          <div className="text-center py-6 animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-teal-500/20 border border-teal-500/30 rounded-full flex items-center justify-center text-teal-400 mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
              Профиль связан!
            </h2>
            <p className="text-slate-400 font-medium leading-relaxed">
              {successData.linkedCount > 0 
                ? `Мы нашли и прикрепили к вашему аккаунту ${successData.linkedCount} прошлых туров. Добро пожаловать!` 
                : 'Номер успешно сохранен. Теперь ваши будущие брони будут привязаны к этому профилю.'}
            </p>
            <p className="text-xs text-teal-500 mt-6 animate-pulse font-bold uppercase tracking-widest">
              Открываем личный кабинет...
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-500 mb-4 shadow-inner">
                <Sparkles size={28} />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
                Финальный штрих
              </h2>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                Вы успешно вошли! Оставьте свой номер телефона, чтобы мы могли связать этот аккаунт с вашими прошлыми и будущими походами.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">
                  Номер телефона (с кодом)
                </label>
                <div className="relative group">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-500 transition-colors" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isPending}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white font-medium focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all placeholder:text-slate-600"
                    placeholder="+373 777 00 000"
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs font-bold">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isPending || phone.length < 10}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black uppercase tracking-widest py-4 rounded-xl transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(20,184,166,0.3)] active:scale-[0.98]"
              >
                {isPending ? <Loader2 size={18} className="animate-spin" /> : <><MapPin size={18} /> Сохранить и войти</>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
```

## File: src/features/account/components/ReferralCard.tsx
```typescript
'use client';

import { useState } from 'react';
import { Gift, Copy, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/shared/context/ToastContext';

interface ReferralCardProps {
  name: string | null;
  userId: string;
}

export default function ReferralCard({ name, userId }: ReferralCardProps) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  // Генерируем красивый код вида: EVA-ALEX-9F2A
  const cleanName = name ? name.replace(/\s+/g, '').substring(0, 4).toUpperCase() : 'CLUB';
  const shortId = userId.substring(0, 4).toUpperCase();
  const promoCode = `EVA-${cleanName}-${shortId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promoCode);
      setCopied(true);
      showToast('Промокод скопирован!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showToast('Не удалось скопировать', 'error');
    }
  };

  return (
    <div className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/10 border border-violet-500/20 rounded-2xl p-5 relative overflow-hidden group">
      {/* Декоративный фон */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-500/20 blur-3xl rounded-full group-hover:bg-violet-500/30 transition-colors" />
      
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
            <Gift size={24} />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm mb-1">Подари приключение</h3>
            <p className="text-xs text-slate-300 font-medium">
              Поделись кодом с другом. Он получит скидку 5%, а ты — бонус от клуба!
            </p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="w-full sm:w-auto flex items-center justify-between sm:justify-center gap-3 px-4 py-2.5 bg-slate-950/50 hover:bg-slate-950/80 border border-violet-500/30 rounded-xl transition-all shrink-0"
        >
          <span className="font-mono font-black text-violet-300 tracking-wider">
            {promoCode}
          </span>
          {copied ? (
            <CheckCircle2 size={16} className="text-green-400" />
          ) : (
            <Copy size={16} className="text-violet-400" />
          )}
        </button>

      </div>
    </div>
  );
}
```

## File: src/features/account/components/ReviewFromCabinetButton.tsx
```typescript
'use client';

import { useState, useTransition } from 'react';
import { Star, X, Loader, CheckCircle } from 'lucide-react';
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
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    setIsOpen(true);
    setError('');
    setText('');
    setSuccess(false);
  }

  function handleClose() {
    if (isPending) return;
    setIsOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (text.trim().length < 10) {
      setError('Напишите чуть больше — минимум 10 символов');
      return;
    }

    startTransition(async () => {
      const result = await submitReviewFromCabinet({ tourId, text: text.trim() });

      if (!result.success) {
        setError(result.error ?? 'Не удалось отправить отзыв');
        return;
      }

      setSuccess(true);
      setTimeout(() => setIsOpen(false), 2000);
    });
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
      >
        <Star size={12} />
        <span>Отзыв</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Оверлей */}
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Карточка */}
          <div className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl">

            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>

            {success ? (
              <div className="text-center py-4">
                <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
                <p className="text-white font-bold">Спасибо за отзыв!</p>
                <p className="text-sm text-slate-400 mt-1">
                  Ваш отзыв будет опубликован после модерации.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Star size={16} className="text-amber-400" />
                    <h3 className="text-base font-black text-white">Оставить отзыв</h3>
                  </div>
                  <p className="text-xs text-slate-400">{tourTitle}</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Ваш отзыв
                  </label>
                  <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="Расскажите как прошёл тур, что понравилось..."
                    rows={4}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50 transition-all resize-none"
                    disabled={isPending}
                    autoFocus
                  />
                  <div className="flex items-center justify-between mt-1">
                    {error && <p className="text-xs text-red-400">{error}</p>}
                    <span className="text-xs text-slate-600 ml-auto">{text.length}/500</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending || text.trim().length < 10}
                  className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-bold py-2.5 rounded-xl transition-all"
                >
                  {isPending ? (
                    <Loader size={15} className="animate-spin" />
                  ) : (
                    <>
                      <Star size={14} />
                      Отправить отзыв
                    </>
                  )}
                </button>

                <p className="text-xs text-slate-600 text-center">
                  Отзыв появится на сайте после модерации. Имя: {memberName || 'Участник'}
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
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
        className="px-3 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 rounded-xl transition-all"
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
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>

            {success ? (
              /* Успех */
              <div className="text-center py-4">
                <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
                <p className="text-white font-bold">Место передано!</p>
                <p className="text-sm text-slate-400 mt-1">
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
                  <p className="text-xs text-slate-400">
                    {tourTitle} · {dateFormatted}
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
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
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
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
      className="shrink-0 p-1 text-slate-500 hover:text-rose-400 transition-colors disabled:opacity-50"
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

## File: src/app/account/bookings/[id]/page.tsx
```typescript
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  ChevronLeft, QrCode, MapPin, Users, Phone, 
  MessageCircle, CreditCard, AlertTriangle, Info, CalendarClock 
} from "lucide-react";
// ✅ ИСПРАВЛЕННЫЕ ИМПОРТЫ:
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatTourDate } from "@/utils/date";

// Типизация для JSON-поля guests (Блок 2)
type Guest = {
  name: string;
  ticketType?: string;
  equipment?: string[];
  [key: string]: unknown;
};

// Функция для красивых бейджиков статуса
function getStatusBadge(status: string) {
  switch (status.toUpperCase()) {
    case "PENDING":
    case "ОЖИДАЕТ ОПЛАТЫ":
      return <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-bold uppercase tracking-widest">Ожидает оплаты</span>;
    case "CONFIRMED":
    case "ПОДТВЕРЖДЕНО":
      return <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold uppercase tracking-widest">Подтверждено</span>;
    case "COMPLETED":
    case "ЗАВЕРШЕНО":
      return <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-bold uppercase tracking-widest">Завершено</span>;
    case "CANCELLED":
    case "ОТМЕНЕНО":
      return <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-bold uppercase tracking-widest">Отменено</span>;
    default:
      return <span className="px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-full text-xs font-bold uppercase tracking-widest">{status}</span>;
  }
}

// Форматирование даты
function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(date));
}

// ⚠️ ИСПРАВЛЕНИЕ АРХИТЕКТУРЫ: В Next 15+ params — это Promise
export default async function BookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  // Распаковываем параметры через await, чтобы получить строковый id
  const resolvedParams = await params;
  const id = resolvedParams.id;

  // ✅ ИСПРАВЛЕННЫЙ ВЫЗОВ SUPABASE
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // 2. Идем в Prisma за бронью и привязанным туром (используем распакованный id)
  const booking = await prisma.booking.findUnique({
    where: { id: id },
    include: {
      tour: true,
      tourDate: true, // ✅ Запрашиваем конкретные даты выезда
    },
  });

  // 3. Если брони нет вообще
  if (!booking) {
    return (
      <div className="w-full max-w-3xl mx-auto py-12 flex flex-col items-center justify-center text-center">
        <AlertTriangle size={64} className="text-slate-600 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Бронирование не найдено</h1>
        <p className="text-slate-400 mb-6">Возможно, оно было удалено или вы перешли по неверной ссылке.</p>
        <Link href="/account/bookings" className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold uppercase tracking-widest rounded-xl transition-colors">
          Вернуться к списку
        </Link>
      </div>
    );
  }

  // 4. ПРОВЕРКА БЕЗОПАСНОСТИ: Если бронь чужая
  if (booking.memberId && booking.memberId !== session.user.id) {
    // Внимание: мы проверяем memberId, так как в схеме Prisma связь идет через него
    // Но так как у нас есть только session.user.id (Supabase Auth ID), нам нужно получить профиль
    const profile = await prisma.memberProfile.findUnique({ where: { userId: session.user.id } });
    
    if (profile && booking.memberId !== profile.id) {
      return (
        <div className="w-full max-w-3xl mx-auto py-12 flex flex-col items-center justify-center text-center bg-slate-900/50 rounded-3xl border border-red-500/20 p-8">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Доступ запрещен</h1>
          <p className="text-slate-400 mb-6">Эта бронь оформлена на другой аккаунт. Вы не можете просматривать ее детали.</p>
          <Link href="/account/bookings" className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase tracking-widest rounded-xl transition-colors">
            Мои туры
          </Link>
        </div>
      );
    }
  }

  // Парсим гостей из JSON (Prisma.JsonValue -> unknown -> Guest[])
  const guests = (booking.guests as unknown as Guest[]) || [];
  const tour = booking.tour;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-12">
      
      {/* ПУНКТ 1: ШАПКА И БАЗОВАЯ ИНФА */}
      <div className="space-y-6">
        <Link href="/account/bookings" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium">
          <ChevronLeft size={16} />
          Назад ко всем турам
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase leading-tight mb-2">
              {tour?.title || "Неизвестный тур"}
            </h1>
  <div className="flex items-center gap-2 text-slate-300 font-medium">
  
  <CalendarClock size={18} className="text-teal-500 shrink-0" />
  
  {/* Если у брони есть конкретная дата (TourDate) */}
  {booking.tourDate ? (
    <span className="capitalize">
      {formatTourDate(booking.tourDate.startDate, booking.tourDate.endDate)}
    </span>
  ) : (
    /* Если это бронь с открытой датой */
    <span>Открытая дата</span>
  )}

  {/* Выводим длительность через точку, если она есть у тура */}
  {tour?.duration && (
    <>
      <span className="text-slate-600">·</span>
      <span className="text-slate-400">{tour.duration}</span>
    </>
  )}
</div>
          </div>
          <div className="shrink-0">
            {getStatusBadge(booking.status)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ЛЕВАЯ КОЛОНКА (2/3 ширины) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* ПУНКТ 4: ЛОГИСТИКА И СВЯЗЬ */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 lg:p-8">
            <h2 className="text-lg font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <MapPin className="text-teal-500" /> Организация маршрута
            </h2>
            
            <div className="space-y-6">
              {/* Точка сбора */}
              <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Точка сбора и время</div>
                <div className="text-white font-medium mb-3">
                  {tour?.meetingPoint || "Точное место сбора появится за 3 дня до старта"}
                </div>
                <button className="text-sm text-teal-400 hover:text-teal-300 font-medium transition-colors">
                  📍 Открыть в Яндекс.Навигаторе
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Контакты гида */}
                <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 flex flex-col justify-center items-start gap-2">
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">Связь с гидом</div>
                  <div className="text-white font-medium flex items-center gap-2">
                    <Phone size={16} className="text-slate-400" />
                    Назначим гида скоро
                  </div>
                </div>

                {/* Чат группы */}
                <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex flex-col justify-center items-start gap-2">
                  <div className="text-xs text-blue-400/80 font-bold uppercase tracking-widest">Чат участников</div>
                  <div className="flex items-center gap-2 text-slate-300 font-medium">
                    <MessageCircle size={16} className="text-slate-500" />
                    Ссылка скоро появится
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ПУНКТ 3: УЧАСТНИКИ (JSON Guests) */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 lg:p-8">
            <h2 className="text-lg font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Users className="text-teal-500" /> Участники тура
            </h2>
            
            {guests && guests.length > 0 ? (
              <div className="space-y-3">
                {guests.map((guest, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                    <div className="flex flex-col">
                      <span className="text-white font-bold">{guest.name || "Участник"}</span>
                      {guest.ticketType && (
                        <span className="text-xs text-slate-400">{guest.ticketType}</span>
                      )}
                    </div>
                    {guest.equipment && guest.equipment.length > 0 && (
                      <div className="flex gap-2">
                        {guest.equipment.map((item, i) => (
                          <span key={i} className="px-2 py-1 bg-teal-500/10 text-teal-400 text-[10px] uppercase font-bold tracking-widest rounded-md">
                            {item}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 text-slate-400 text-sm">
                Детальная информация об участниках не найдена.
              </div>
            )}
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА (1/3 ширины) */}
        <div className="space-y-6">
          
          {/* ПУНКТ 2: ПОСАДОЧНЫЙ ТАЛОН */}
          <div className="bg-gradient-to-b from-teal-900 to-slate-900 border border-teal-500/30 rounded-3xl p-1 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/20 blur-3xl rounded-full pointer-events-none"></div>
            
            <div className="bg-slate-950/50 rounded-[22px] p-6 lg:p-8 flex flex-col items-center text-center relative z-10">
              <div className="text-xs text-teal-400 font-bold uppercase tracking-[0.2em] mb-4">Boarding Pass</div>
              
              {/* Заглушка QR-кода */}
              <div className="bg-white p-4 rounded-2xl mb-4 shadow-lg">
                <QrCode size={140} className="text-slate-900" />
              </div>
              
              <div className="text-slate-300 font-mono text-sm tracking-widest mb-6 bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
                ID: {booking.id.split('-')[0].toUpperCase()}
              </div>
              
              <div className="flex items-start gap-2 text-left bg-teal-500/10 border border-teal-500/20 p-3 rounded-xl w-full">
                <Info size={16} className="text-teal-400 shrink-0 mt-0.5" />
                <p className="text-xs text-teal-100/70 leading-relaxed">
                  Сделайте скриншот этого талона на случай, если на месте старта не будет интернета.
                </p>
              </div>
            </div>
          </div>

          {/* ПУНКТ 5: ФИНАНСЫ */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <CreditCard size={16} className="text-slate-400" /> Оплата
            </h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Стоимость тура:</span>
                <span className="text-white font-medium">{booking.totalPrice?.toLocaleString('ru-RU')} ₽</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Оплачено:</span>
                <span className="text-white font-medium">
                  {booking.amountPaid?.toLocaleString('ru-RU')} ₽
                </span>
              </div>
              <div className="h-px w-full bg-slate-700/50 my-2"></div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-medium">Осталось:</span>
                <span className="text-amber-400 font-bold text-lg">
                  {(booking.totalPrice - booking.amountPaid)?.toLocaleString('ru-RU')} ₽
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
```

## File: src/app/account/wishlist/actions.ts
```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function toggleCategorySubscription(categoryId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) throw new Error("Unauthorized");

  // ОПТИМИЗАЦИЯ: Добавили select, чтобы не тянуть лишние данные (размеры, еду и тд) из базы
  const profile = await prisma.memberProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true }
  });

  if (!profile) throw new Error("Profile not found");

  // Проверяем, есть ли уже такая подписка
  const existing = await prisma.watchList.findUnique({
    where: {
      memberId_categoryId: {
        memberId: profile.id,
        categoryId: categoryId
      }
    },
    select: { id: true } // ОПТИМИЗАЦИЯ: Нам нужен только факт существования и ID
  });

  if (existing) {
    // Если есть — удаляем (отписка)
    await prisma.watchList.delete({
      where: { id: existing.id }
    });
  } else {
    // Если нет — создаем (подписка)
    await prisma.watchList.create({
      data: {
        memberId: profile.id,
        categoryId: categoryId
      }
    });
  }

  // Обновляем кэш страницы (теперь, с useOptimistic на клиенте, UI не будет ждать этот шаг)
  revalidatePath("/account/wishlist");
}
```

## File: src/app/account/wishlist/components/CategoryPills.tsx
```typescript
"use client";

import { useTransition, useOptimistic } from "react";
import { toggleCategorySubscription } from "@/app/account/wishlist/actions";

interface Category {
  id: string;
  title: string;
}

interface CategoryPillsProps {
  categories: Category[];
  subscribedIds: string[];
}

export default function CategoryPills({ categories, subscribedIds }: CategoryPillsProps) {
  const [, startTransition] = useTransition();

  // 1. Добавляем оптимистичное состояние
  // Оно берет актуальные данные с сервера (subscribedIds) и позволяет менять их мгновенно на клиенте
  const [optimisticSubscribedIds, toggleOptimistic] = useOptimistic(
    subscribedIds,
    (state: string[], categoryId: string) =>
      state.includes(categoryId)
        ? state.filter((id) => id !== categoryId) // Если был подписан - убираем
        : [...state, categoryId]                  // Если не был - добавляем
  );

  const handleToggle = (categoryId: string) => {
    startTransition(async () => {
      // 2. Мгновенно меняем UI для пользователя
      toggleOptimistic(categoryId);
      
      // 3. Отправляем запрос на сервер в фоне
      await toggleCategorySubscription(categoryId);
    });
  };

  return (
    <div className="flex flex-wrap gap-2 md:gap-3 mt-4">
      {categories.map((category) => {
        // 4. Проверяем подписку по ОПТИМИСТИЧНОМУ массиву, а не серверному
        const isSubscribed = optimisticSubscribedIds.includes(category.id);

        return (
          <button
            key={category.id}
            onClick={() => handleToggle(category.id)}
            // Убрал disabled={isPending}, чтобы юзер мог быстро выбрать несколько категорий подряд
            className={`
              relative px-5 py-2.5 rounded-full text-sm font-bold uppercase tracking-widest transition-all duration-300
              overflow-hidden
              ${isSubscribed 
                ? "bg-teal-500/10 text-teal-400 border border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.15)]" 
                : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800 hover:text-slate-300 hover:border-slate-600"
              }
            `}
          >
            {isSubscribed && (
              <span className="absolute inset-0 bg-teal-400/10 animate-pulse pointer-events-none" />
            )}
            {category.title}
          </button>
        );
      })}
    </div>
  );
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
```

## File: src/features/account/components/SettingsForm.tsx
```typescript
// src/features/account/components/SettingsForm.tsx
"use client";

import React, { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  User, Phone, Mail, Apple, Shirt, 
  LifeBuoy, Footprints, Backpack, Save, Loader2,
  Send, Instagram, MessageCircle
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-12">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* БЛОК 1: Личные данные и Соцсети */}
        <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
            <User className="text-teal-500" size={20} />
            <h2 className="text-lg font-black text-white uppercase tracking-wider">Контакты</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1 mb-1 block">Имя и Фамилия *</label>
              <input 
                {...register("name")}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 outline-none transition-all"
              />
              {errors.name && <p className="text-xs text-rose-500 mt-1 ml-1">{errors.name?.message}</p>}
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1 mb-1 flex items-center gap-1.5">
                <Phone size={12} /> Ваш логин (Телефон)
              </label>
              <input 
                value={profile.phone || "Не указан"}
                disabled
                className="w-full bg-slate-950/50 border border-transparent rounded-xl px-4 py-3 text-slate-500 text-sm cursor-not-allowed"
                title="Телефон нельзя изменить, так как он используется для входа"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1 mb-1 flex items-center gap-1.5">
                <Mail size={12} /> Email
              </label>
              <input 
                {...register("email")}
                placeholder="Для чеков и билетов"
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 outline-none transition-all"
              />
              {errors.email && <p className="text-xs text-rose-500 mt-1 ml-1">{errors.email?.message}</p>}
            </div>

            {/* БЛОК СОЦСЕТЕЙ */}
            <div className="pt-4 mt-2 border-t border-white/5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1 mb-3 block">
                    Соцсети (Для чатов групп)
                </label>
                <div className="space-y-3">
                    <div className="relative group">
                        <Send size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors" />
                        <input 
                            {...register("telegram")}
                            placeholder="@username в Telegram"
                            className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 outline-none transition-all"
                        />
                    </div>
                    <div className="relative group">
                        <Instagram size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-pink-400 transition-colors" />
                        <input 
                            {...register("instagram")}
                            placeholder="@username в Instagram"
                            className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500/20 outline-none transition-all"
                        />
                    </div>
                    <div className="relative group">
                        <MessageCircle size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
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

        {/* БЛОК 2: Питание */}
        <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
            <Apple className="text-emerald-500" size={20} />
            <h2 className="text-lg font-black text-white uppercase tracking-wider">Питание</h2>
          </div>

          <div className="space-y-2 h-full flex flex-col">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1 mb-1 block">
              Диета и аллергии
            </label>
            <textarea 
              {...register("foodPref")}
              placeholder="Например: вегетарианец, не ем лук, аллергия на орехи. Если особенностей нет — оставьте поле пустым."
              className="w-full flex-1 min-h-[120px] bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 outline-none transition-all resize-none"
            />
            <p className="text-[10px] text-slate-500 ml-1 mt-2 leading-relaxed">
              Гиды увидят эту информацию при закупке продуктов на тур. Это очень важно для вашей безопасности.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* БЛОК 3: Размеры одежды */}
        <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
            <Shirt className="text-blue-500" size={20} />
            <h2 className="text-lg font-black text-white uppercase tracking-wider">Антропометрия</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1 mb-1 flex items-center gap-1.5"><Shirt size={12}/> Размер одежды</label>
                <div className="relative">
                  <select {...register("clothesSize")} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-teal-500 outline-none appearance-none cursor-pointer">
                    <option value="">Не указан</option>
                    {CLOTHES_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1 mb-1 flex items-center gap-1.5"><LifeBuoy size={12}/> Спасжилет</label>
                <div className="relative">
                  <select {...register("lifeJacketSize")} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-teal-500 outline-none appearance-none cursor-pointer">
                    <option value="">Не указан</option>
                    {CLOTHES_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1 mb-1 flex items-center gap-1.5"><Footprints size={12}/> Размер обуви</label>
              <div className="relative">
                <select {...register("shoeSize")} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-teal-500 outline-none appearance-none cursor-pointer">
                  <option value="">Не указан</option>
                  {SHOE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* БЛОК 4: Инвентарь */}
        <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
            <Backpack className="text-amber-500" size={20} />
            <h2 className="text-lg font-black text-white uppercase tracking-wider">Мой инвентарь</h2>
          </div>

          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Отметьте снаряжение, которое у вас уже есть. Мы не будем предлагать вам его в аренду.
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
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                    isActive 
                      ? "bg-amber-500/10 border-amber-500/50 text-amber-400" 
                      : "bg-slate-950 border-white/10 text-slate-400 hover:border-white/30 hover:text-white"
                  )}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* КНОПКА СОХРАНЕНИЯ */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/80 backdrop-blur-xl border-t border-white/10 md:static md:bg-transparent md:border-none md:p-0 md:backdrop-blur-none z-40">
        <button
          type="submit"
          disabled={isPending}
          className="w-full md:w-auto md:min-w-[250px] md:ml-auto flex items-center justify-center gap-3 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] active:scale-[0.98]"
        >
          {isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          <span>{isPending ? "Сохранение..." : "Сохранить настройки"}</span>
        </button>
      </div>

    </form>
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
import { MapPin, Clock, ChevronRight, TrendingUp } from 'lucide-react';
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

  // Все прошедшие брони, отсортированные от новых к старым
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
          duration: true,
          distance: true,
          category: { select: { title: true, color: true } },
        },
      },
      tourDate: {
        select: {
          startDate: true,
          guide: { select: { name: true, image: true } },
        },
      },
    },
  });

  // Проверяем какие туры уже имеют отзыв от этого участника
const tourIdsWithReview = await prisma.review.findMany({
    where: {
      tourId: { in: bookings.map(b => b.tourId) },
      // ✅ ИСПРАВЛЕНО: Ищем строго по ID профиля, а не по имени
      memberId: profile.id, 
    } as any, // as any на случай если TS еще не обновил типы Prisma
    select: { tourId: true },
  });
  const reviewedTourIds = new Set(tourIdsWithReview.map(r => r.tourId));

  // Агрегированная статистика
  const totalKm = bookings.reduce((sum, b) => {
    const km = parseFloat(b.tour.distance ?? '0');
    return sum + (isNaN(km) ? 0 : km);
  }, 0);

  // Уникальные сезоны
  const seasons = new Set(
    bookings
      .filter(b => b.tourDate)
      .map(b => `${getSeason(b.tourDate!.startDate).label} ${b.tourDate!.startDate.getFullYear()}`)
  );

  return {
    profile,
    bookings,
    reviewedTourIds,
    stats: {
      total: bookings.length,
      totalKm: Math.round(totalKm),
      seasons: seasons.size,
    },
  };
}

// ─── страница ────────────────────────────────────────────────────────
export default async function HistoryPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account/history');

  const data = await getHistory(user.id);
  if (!data) redirect('/login?next=/account/history');

  const { bookings, reviewedTourIds, stats, profile } = data;

  return (
    <div className="space-y-6">

     {/* Заголовок */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white mb-1">История туров</h1>
        <p className="text-sm text-slate-400">
          {stats.total > 0
            ? 'Ваша летопись приключений в цифрах и фактах'
            : 'Здесь появятся ваши прошедшие туры'}
        </p>
      </div>

      {/* 🔥 НОВЫЙ БЛОК СТАТИСТИКИ (Выводится только если есть туры) */}
      {stats.total > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 flex flex-col gap-1">
              <span className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest">Всего туров</span>
              <p className="text-2xl sm:text-3xl font-black text-white">{stats.total}</p>
          </div>
          <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 flex flex-col gap-1">
              <span className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest">Километраж</span>
              <p className="text-2xl sm:text-3xl font-black text-white">{stats.totalKm} <span className="text-sm text-slate-400 font-medium">км</span></p>
          </div>
          <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 flex flex-col gap-1">
              <span className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest">Сезонов</span>
              <p className="text-2xl sm:text-3xl font-black text-white">{stats.seasons}</p>
          </div>
        </div>
      )}

      {bookings.length === 0 ? (
        /* Твое оригинальное пустое состояние — ничего не тронуто! */
        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-10 text-center">
          <p className="text-4xl mb-4">🗺️</p>
          <p className="text-white font-bold mb-2">Ваша история пока пуста</p>
          <p className="text-sm text-slate-400 mb-6">
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
        <div className="space-y-3">
          {bookings.map((booking, idx) => {
            const isFirst = idx === bookings.length - 1;
            const hasReview = reviewedTourIds.has(booking.tourId);
            const season = booking.tourDate ? getSeason(booking.tourDate.startDate) : null;
            const categoryColor: Record<string, string> = {
              teal:    'bg-teal-500/20 text-teal-400',
              blue:    'bg-blue-500/20 text-blue-400',
              green:   'bg-green-500/20 text-green-400',
              orange:  'bg-orange-500/20 text-orange-400',
              purple:  'bg-purple-500/20 text-purple-400',
            };
            const catStyle = categoryColor[booking.tour.category?.color ?? 'teal']
              ?? 'bg-teal-500/20 text-teal-400';

            return (
              <div
                key={booking.id}
                className="bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden"
              >
                <div className="flex gap-0">

                  {/* Миниатюра */}
                  <div className="relative w-24 sm:w-32 shrink-0">
                    {booking.tour.coverImage ? (
                      <Image
                        src={booking.tour.coverImage}
                        alt={booking.tour.title}
                        fill
                        className="object-cover"
                        sizes="128px"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-slate-800" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-900/20" />

                    {/* Метка "Начало пути" */}
                    {isFirst && (
                      <div className="absolute top-2 left-0 right-0 flex justify-center">
                        <span className="text-[10px] font-black bg-teal-500 text-white px-1.5 py-0.5 rounded-full">
                          Старт
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Контент */}
                  <div className="flex-1 p-4 min-w-0">

                    {/* Верхняя строка: категория + дата */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      {booking.tour.category && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${catStyle}`}>
                          {booking.tour.category.title}
                        </span>
                      )}
                      {season && booking.tourDate && (
                        <span className="text-xs text-slate-500 shrink-0">
                          {season.emoji} {formatDate(booking.tourDate.startDate)}
                        </span>
                      )}
                    </div>

                    {/* Название */}
                    <Link
                      href={`/tour/${booking.tour.slug}`}
                      className="block text-sm font-black text-white hover:text-teal-400 transition-colors truncate mb-2"
                    >
                      {booking.tour.title}
                    </Link>

                    {/* Мета */}
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-3">
                      {booking.tour.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={10} /> {booking.tour.location}
                        </span>
                      )}
                      {booking.tour.distance && (
                        <span className="flex items-center gap-1">
                          <TrendingUp size={10} /> {booking.tour.distance} км
                        </span>
                      )}
                      {booking.tour.duration && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} /> {booking.tour.duration}
                        </span>
                      )}
                    </div>

                    {/* Гид + кнопки */}
                    <div className="flex items-center justify-between gap-2">
                      {/* Гид */}
                      {booking.tourDate?.guide ? (
                        <div className="flex items-center gap-1.5">
                          {booking.tourDate.guide.image ? (
                            <Image
                              src={booking.tourDate.guide.image}
                              alt={booking.tourDate.guide.name}
                              width={20}
                              height={20}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center">
                              <span className="text-[9px] font-bold text-teal-400">
                                {booking.tourDate.guide.name[0]}
                              </span>
                            </div>
                          )}
                          <span className="text-xs text-slate-500">
                            {booking.tourDate.guide.name}
                          </span>
                        </div>
                      ) : (
                        <div />
                      )}

                      {/* Кнопки */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Кнопка отзыва */}
                        {!hasReview ? (
                          <ReviewFromCabinetButton
                            tourId={booking.tourId}
                            tourTitle={booking.tour.title}
                            memberName={profile.name ?? ''}
                          />
                        ) : (
                          <span className="text-xs text-teal-400/60 flex items-center gap-1">
                            ✓ Отзыв
                          </span>
                        )}

                        <Link
                          href={`/tour/${booking.tour.slug}`}
                          className="text-slate-600 hover:text-slate-300 transition-colors"
                        >
                          <ChevronRight size={16} />
                        </Link>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

// ─── склонение ───────────────────────────────────────────────────────
function plural(n: number, one: string, few: string, many: string) {
  const abs = Math.abs(n) % 100;
  const mod = abs % 10;
  if (abs >= 11 && abs <= 19) return many;
  if (mod === 1) return one;
  if (mod >= 2 && mod <= 4) return few;
  return many;
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

  // Не залогинен — возвращаем специальный флаг
  // Клиент покажет: "Войди чтобы сохранить результат"
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

  // Upsert — если тест уже пройден, перезаписываем результат
  await prisma.testResult.upsert({
    where: {
      memberId_testSlug: {
        memberId: profile.id,
        testSlug,
      },
    },
    create: {
      memberId: profile.id,
      testSlug,
      result: result as any, // ✅ ИСПРАВЛЕНИЕ: кастуем в any для Prisma JSON
    },
    update: {
      result: result as any, // ✅ ИСПРАВЛЕНИЕ: кастуем в any для Prisma JSON
    },
  });

  revalidatePath('/account/tests');
  return { success: true };
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

  const { tourId, text } = input;

  if (!text || text.trim().length < 10) {
    return { success: false, error: 'Слишком короткий отзыв' };
  }
  if (text.length > 500) {
    return { success: false, error: 'Отзыв слишком длинный (максимум 500 символов)' };
  }

  // Находим профиль
  const profile = await prisma.memberProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) return { success: false, error: 'Профиль не найден' };

  // Проверяем что участник действительно был на этом туре
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

  // Проверяем что отзыв ещё не оставлен
 const existing = await prisma.review.findFirst({
  where: {
    tourId,
    // Добавляем запасной вариант "Участник", чтобы 100% была строка, а не null
    name: profile.name ?? profile.phone ?? 'Участник',
  },
});

if (existing) {
  return { success: false, error: 'Вы уже оставили отзыв на этот тур' };
}

  // Определяем категорию тура для отзыва
  const tour = await prisma.tour.findUnique({
    where: { id: tourId },
    include: { category: { select: { slug: true } } },
  });
  const reviewCategory = tour?.category?.slug ?? 'general';

  // Создаём отзыв (isActive: false — пройдёт модерацию в админке)
  await prisma.review.create({
    data: {
      name: profile.name ?? 'Участник клуба',
      text: text.trim(),
      source: 'website',
      tourId,
      category: reviewCategory,
      isActive: false, // модерация
    },
  });

  revalidatePath('/account/history');
  revalidatePath(`/tour/${tour?.slug ?? ''}`);

  return { success: true };
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

## File: src/app/account/bookings/page.tsx
```typescript
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, MapPin, Clock, ArrowRight, Hourglass } from 'lucide-react';
import CancelWaitlistButton from '@/features/account/components/CancelWaitlistButton';
// ✅ ДОБАВЛЕНО: Импорт нашей новой премиальной карточки (Boarding Pass)
import BookingCard from '@/features/account/components/BookingCard'; 

// ─── вспомогательные функции ─────────────────────────────────────────
function formatDate(d: Date) {
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatPrice(price: number, currency: string) {
  return `${price.toLocaleString('ru-RU')} ${currency}`;
}

// ─── загрузка данных ─────────────────────────────────────────────────
async function getBookings(userId: string) {
  const profile = await prisma.memberProfile.findUnique({
    where: { userId },
  });
  if (!profile) return null;

  const now = new Date();

  // Предстоящие
  const upcoming = await prisma.booking.findMany({
    where: {
      memberId: profile.id,
      status: { in: ['pending', 'confirmed'] },
      OR: [
        { tourDate: { startDate: { gte: now } } },
        { tourDateId: null }, // брони без конкретной даты
      ],
    },
    orderBy: { tourDate: { startDate: 'asc' } },
    include: {
      tour: {
        select: {
          title: true, slug: true, location: true,
          coverImage: true, duration: true, currency: true,
        },
      },
      tourDate: {
        select: {
          startDate: true, endDate: true, time: true, spotsLeft: true,
          guide: { select: { name: true, image: true } },
        },
      },
    },
  });

  // Прошедшие (последние 5)
  const past = await prisma.booking.findMany({
    where: {
      memberId: profile.id,
      tourDate: { startDate: { lt: now } },
    },
    orderBy: { tourDate: { startDate: 'desc' } },
    take: 5,
    include: {
      tour: {
        select: { title: true, slug: true, coverImage: true, location: true, currency: true },
      },
      tourDate: { select: { startDate: true } },
    },
  });

  // Лист ожидания
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

  return { profile, upcoming, past, waitlists };
}

// ─── страница ────────────────────────────────────────────────────────
export default async function BookingsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account/bookings');

  const data = await getBookings(user.id);
  if (!data) redirect('/login?next=/account/bookings');

  const { upcoming, past, waitlists } = data;

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-2xl font-black text-white mb-1">Мои брони</h1>
        <p className="text-sm text-slate-400">Управляйте участием в турах и заявками</p>
      </div>

      {/* ── Лист ожидания (если есть) ─────────────────────────────── */}
      {waitlists.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Hourglass size={16} className="text-amber-500 animate-pulse" />
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Лист ожидания
            </h2>
          </div>

          <div className="space-y-3 max-w-4xl">
            {waitlists.map(waitlist => (
              <div
                key={waitlist.id}
                className="flex items-center gap-4 bg-slate-900/40 border border-amber-500/20 rounded-xl p-4 transition-all hover:bg-slate-900/60"
              >
                <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-800">
                  {waitlist.tour.coverImage ? (
                    <Image
                      src={waitlist.tour.coverImage}
                      alt={waitlist.tour.title}
                      fill
                      className="object-cover opacity-80"
                      sizes="48px"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-amber-500/10" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {waitlist.tour.title}
                  </p>
                  <p className="text-xs text-amber-400/80 font-medium">
                    {waitlist.tourDate ? formatDate(waitlist.tourDate.startDate) : 'Даты уточняются'}
                  </p>
                </div>
                <div className="shrink-0">
                  <CancelWaitlistButton id={waitlist.id} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Предстоящие ─────────────────────────────────────────── */}
      <section className="space-y-4 max-w-4xl"> {/* 👈 ОГРАНИЧИТЕЛЬ ШИРИНЫ ДЛЯ БИЛЕТОВ */}
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
          Предстоящие
        </h2>

        {upcoming.length === 0 ? (
          <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-8 text-center">
            <p className="text-slate-400 text-sm mb-4">Нет предстоящих бронирований</p>
            <Link
              href="/tour"
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all"
            >
              Найти тур <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-6"> {/* 👈 ОТСТУПЫ МЕЖДУ БИЛЕТАМИ */}
            {upcoming.map(booking => {
              
              // Вычисляем общее количество мест для передачи в карточку
              const guestsCount =
                booking.ticketsAdult +
                booking.ticketsChild +
                booking.ticketsMember +
                (booking.ticketsFamily * 3);

              // Расширяем объект брони для прокидывания в компонент
              const bookingData = { ...booking, guestsCount };

              return <BookingCard key={booking.id} booking={bookingData} />;
            })}
          </div>
        )}
      </section>

      {/* ── Прошедшие ───────────────────────────────────────────── */}
      {past.length > 0 && (
        <section className="space-y-3 max-w-4xl">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Прошедшие
          </h2>

          {past.map(booking => (
            <Link
              key={booking.id}
              href={`/tour/${booking.tour.slug}`}
              className="flex items-center gap-3 bg-slate-900/40 border border-white/5 hover:border-white/10 rounded-xl p-3 transition-all group"
            >
              <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-slate-800">
                {booking.tour.coverImage && (
                  <Image
                    src={booking.tour.coverImage}
                    alt={booking.tour.title}
                    fill
                    className="object-cover opacity-60"
                    sizes="44px"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-300 truncate group-hover:text-white transition-colors">
                  {booking.tour.title}
                </p>
                <p className="text-xs text-slate-600">
                  {booking.tourDate ? formatDate(booking.tourDate.startDate) : '—'}
                  {booking.tour.location && ` · ${booking.tour.location}`}
                </p>
              </div>
              <span className="text-xs text-slate-600 group-hover:text-slate-400 transition-colors shrink-0">
                {formatPrice(booking.totalPrice, booking.tour.currency ?? 'MDL')}
              </span>
            </Link>
          ))}

          <Link
            href="/account/history"
            className="block text-center text-xs text-teal-400 hover:text-teal-300 transition-colors py-2"
          >
            Вся история туров →
          </Link>
        </section>
      )}

    </div>
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

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface VirtualCardProps {
  name: string | null;
  level: string;
  totalTours: number;
  totalKm: number;
  memberId: string | null;
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

export default function VirtualCard({ name, level: _level, totalTours, totalKm, memberId }: VirtualCardProps) {
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
                <span className="text-white/80 text-[10px] font-bold uppercase tracking-[0.3em]">Турклуб</span>
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
                <span className="text-white/50 text-[10px] uppercase font-bold tracking-widest">Участник</span>
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
              className="absolute top-4 right-4 p-1.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white z-20"
            >
              <X size={16} />
            </button>

            <div className="relative z-10 bg-white p-2.5 rounded-xl mt-8 mb-4 shadow-lg">
              <QrCode size={80} className="text-slate-950" />
            </div>

            <p className="text-slate-400 text-xs uppercase tracking-[0.2em] font-mono text-center font-bold">
              ID: {displayId}
            </p>
            <p className="text-slate-500 text-[9px] mt-2 text-center max-w-[80%] uppercase tracking-widest">
              Покажите этот код гиду на старте маршрута
            </p>
          </div>
        </motion.div>
      </div>

      {/* ─── Шкала прогресса и Кнопка Модалки ────────────────────────────── */}
      <div className="mt-8 px-2 flex flex-col gap-4">
        {nextConfig ? (
          <div className="flex flex-col gap-2.5">
            <div className="flex justify-between items-end">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Прогресс статуса</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
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

## File: src/app/account/tests/page.tsx
```typescript
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { FlaskConical, ArrowRight, RefreshCw } from 'lucide-react';

// ─── Строгие типы для JSON из БД ────────────────────────────────────
interface TestResultData {
  type?: string;
  badge?: string;
  description?: string;
  fullAnalysis?: string;
  score?: Record<string, number>;
  [key: string]: unknown; // на случай расширения данных
}

// ─── конфиг квизов ──────────────────────────────────────────────────
// Синхронизирован с FunClient / fun компонентами
const QUIZ_CONFIG: Record<string, {
  title: string;
  emoji: string;
  description: string;
  href: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  'tourist-type': {
    title: 'Тип туриста',
    emoji: '🧭',
    description: 'Кто ты в путешествии — романтик, исследователь или организатор?',
    href: '/fun?quiz=tourist-type',
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/20',
  },
  'psych-profile': {
    title: 'Психологический профиль',
    emoji: '🧠',
    description: 'Как ты реагируешь на трудности и незнакомые ситуации в дороге?',
    href: '/fun?quiz=psych-profile',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
  },
  'totem': {
    title: 'Тотемное животное',
    emoji: '🦅',
    description: 'Какой дух-хранитель сопровождает тебя в походах?',
    href: '/fun?quiz=totem',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
  'survival': {
    title: 'Выживание',
    emoji: '🏕️',
    description: 'Насколько ты готов к нештатным ситуациям на маршруте?',
    href: '/fun?quiz=survival',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
  },
  'backpack': {
    title: 'Что в рюкзаке?',
    emoji: '🎒',
    description: 'Твой стиль сборов и что это говорит о характере.',
    href: '/fun?quiz=backpack',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  'body-signals': {
    title: 'Сигналы тела',
    emoji: '💪',
    description: 'Уровень физической готовности к активным маршрутам.',
    href: '/fun?quiz=body-signals',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
  },
  'fears': {
    title: 'Разбор страхов',
    emoji: '🛡️',
    description: 'Психологический разбор твоих опасений перед походом.',
    href: '/fun?quiz=fears',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  'physical': {
    title: 'Физическая готовность',
    emoji: '💪',
    description: 'Оценка твоей выносливости и готовности к нагрузкам.',
    href: '/fun?quiz=physical',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
  },
  'signals': {
    title: 'Сигналы тела',
    emoji: '🩺',
    description: 'Анализ твоего самочувствия в туре.',
    href: '/fun?quiz=signals',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/20',
  },
  'debrief': {
    title: 'Рефлексия опыта',
    emoji: '📖',
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
    day: 'numeric', month: 'long', year: 'numeric',
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

  // Набор пройденных slug-ов для быстрой проверки
  const passedSlugs = new Set(results.map(r => r.testSlug));

  // Непройденные квизы
  const unpassedQuizzes = Object.entries(QUIZ_CONFIG).filter(
    ([slug]) => !passedSlugs.has(slug)
  );

  return (
    <div className="space-y-8">

      {/* Заголовок */}
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Мои тесты</h1>
        <p className="text-sm text-slate-400">
          {results.length > 0
            ? `Пройдено ${results.length} из ${Object.keys(QUIZ_CONFIG).length} тестов`
            : 'Пройдите тесты в Fan-секторе — результаты сохранятся здесь'}
        </p>
      </div>

      {/* ── Пройденные тесты ─────────────────────────────────────── */}
      {results.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Результаты
          </h2>

          {results.map(result => {
            const config = QUIZ_CONFIG[result.testSlug];
            if (!config) return null;

            // Строгая типизация JSON-объекта из БД
            const res = result.result as unknown as TestResultData;
            
            const typeName   = res.type ?? '';
            const badge      = res.badge ?? config.emoji;

            return (
              <div
                key={result.id}
                className={`bg-slate-900/60 border rounded-2xl p-5 ${config.borderColor}`}
              >
                <div className="flex items-start gap-4">

                  {/* Бейдж */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${config.bgColor}`}>
                    {badge}
                  </div>

                  {/* Контент */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">{config.title}</p>
                        <p className={`text-base font-black ${config.color}`}>
                          {typeName || 'Результат'}
                        </p>
                      </div>
                      
                      {/* Кнопка перепройти */}
                      <Link
                        href={config.href}
                        className="shrink-0 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                        title="Пройти заново"
                      >
                        <RefreshCw size={12} />
                        <span className="hidden sm:inline">Заново</span>
                      </Link>
                    </div>

                    {/* Описание из конфига (безопасный рендер без &&) */}
                    {config.description ? (
                      <p className="text-xs text-slate-400 leading-relaxed mt-1 mb-2">
                        {config.description}
                      </p>
                    ) : null}

                    {/* ИИ-Анализ (без дублирования, чистый блок) */}
                    {res.fullAnalysis ? (
                      <div className="mt-3 mb-2 p-4 bg-slate-950 rounded-xl border border-white/5 text-[13px] text-slate-300 leading-relaxed italic whitespace-pre-wrap">
                        {res.fullAnalysis}
                      </div>
                    ) : null}

                    <p className="text-xs text-slate-600">
                      Пройден {formatDate(result.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Вывод Score, если он есть */}
                {!!res.score && typeof res.score === 'object' ? (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.entries(res.score)
                        .slice(0, 6)
                        .map(([key, value]) => (
                          <div key={key} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500 capitalize">{key}</span>
                              <span className={`font-bold ${config.color}`}>{value}%</span>
                            </div>
                            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${config.bgColor.replace('/10', '/60')}`}
                                style={{ width: `${Math.min(value || 0, 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </section>
      )}

      {/* ── Непройденные квизы ───────────────────────────────────── */}
      {unpassedQuizzes.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            {results.length > 0 ? 'Ещё не пройдены' : 'Доступные тесты'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {unpassedQuizzes.map(([slug, config]) => (
              <Link
                key={slug}
                href={config.href}
                className="flex items-center gap-3 bg-slate-900/40 border border-white/5 hover:border-white/10 rounded-xl p-4 transition-all group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${config.bgColor}`}>
                  {config.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white group-hover:text-teal-400 transition-colors truncate">
                    {config.title}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {config.description}
                  </p>
                </div>
                <ArrowRight
                  size={14}
                  className="text-slate-600 group-hover:text-teal-400 transition-colors shrink-0"
                />
              </Link>
            ))}
          </div>

          {results.length === 0 && (
            <p className="text-xs text-slate-600 pt-2">
              После прохождения теста нажмите кнопку «Сохранить результат» — он появится здесь.
            </p>
          )}
        </section>
      )}

      {/* Все пройдены */}
      {unpassedQuizzes.length === 0 && results.length > 0 && (
        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-6 text-center">
          <p className="text-2xl mb-2">🏆</p>
          <p className="text-white font-bold mb-1">Все тесты пройдены!</p>
          <p className="text-sm text-slate-400">
            Следите за обновлениями — новые тесты появляются в Fan-секторе
          </p>
          <Link
            href="/fun"
            className="inline-flex items-center gap-2 mt-4 text-sm font-bold text-teal-400 hover:text-teal-300 transition-colors"
          >
            Fan-сектор <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* CTA если вообще нет результатов */}
      {results.length === 0 && (
        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0">
            <FlaskConical size={22} className="text-teal-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white mb-1">
              Узнай свой туристический профиль
            </p>
            <p className="text-xs text-slate-400">
              Пройди тесты в Fan-секторе — результаты автоматически сохранятся здесь
            </p>
          </div>
          <Link
            href="/fun"
            className="shrink-0 flex items-center gap-1.5 text-sm font-bold text-teal-400 hover:text-teal-300 transition-colors"
          >
            Перейти <ArrowRight size={14} />
          </Link>
        </div>
      )}

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
  Hourglass, Send, BookOpen, CheckCircle2 
} from 'lucide-react';
import WishlistToggle from '@/features/account/components/WishlistToggle';
import CategoryPills from './components/CategoryPills';
import CancelWaitlistButton from '@/features/account/components/CancelWaitlistButton';

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'evaturclub_bot';

// ─── загрузка данных ─────────────────────────────────────────────────
async function getWishlistData(userId: string) {
  const profile = await prisma.memberProfile.findUnique({
    where: { userId },
  });
  if (!profile) return null;

  // 1. Лист ожидания (Waitlist) - ТЕПЕРЬ УМНЫЙ (по memberId и phone)
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

  // 2. Вишлист туров (ОРИГИНАЛ - с подтягиванием ближайшей даты и мест)
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

// ─── цвета категорий (ОРИГИНАЛ) ──────────────────────────────────────
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

  const isTelegramConnected = Boolean(profile.tgChatId);
  const telegramLink = `https://t.me/${BOT_USERNAME}?start=user_${profile.id}`;

  return (
    <div className="space-y-8 max-w-4xl pb-10">

      {/* ── Заголовок ── */}
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Мои желания</h1>
        <p className="text-sm text-slate-400">
          Туры и статьи, за которыми вы следите, и ваши листы ожидания.
        </p>
      </div>

      {/* ── УМНЫЙ TELEGRAM БАННЕР ── */}
      <div className={`relative overflow-hidden rounded-2xl border p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition-colors ${
        isTelegramConnected 
          ? 'bg-emerald-950/30 border-emerald-500/20' 
          : 'bg-slate-900 border-teal-500/20'
      }`}>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-teal-500/10 blur-3xl rounded-full pointer-events-none" />
        
        <div className="flex items-start gap-4 relative z-10">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
            isTelegramConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-teal-500/20 text-teal-400'
          }`}>
            {isTelegramConnected ? <CheckCircle2 size={24} /> : <Send size={24} className="-ml-1" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">
              {isTelegramConnected ? 'Telegram подключен' : 'Уведомления в Telegram'}
            </h3>
            <p className="text-sm text-slate-400 max-w-md">
              {isTelegramConnected 
                ? 'Вы первыми узнаете о новых датах для туров из вашего листа ожидания.'
                : 'Подключите бота, чтобы мгновенно узнавать, когда открывается запись на тур из листа ожидания.'}
            </p>
          </div>
        </div>

        {!isTelegramConnected && (
          <a 
            href={telegramLink}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 shrink-0 w-full sm:w-auto text-center px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black uppercase tracking-widest rounded-xl transition-all active:scale-95"
          >
            Подключить
          </a>
        )}
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

      {/* ── СОХРАНЁННЫЕ ТУРЫ (Оригинал) ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Heart size={14} className="text-rose-400" />
            Туры
            {tourWishlist.length > 0 && (
              <span className="text-xs font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
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
            <p className="text-slate-400 text-sm mb-2">Нет сохранённых туров</p>
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
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${catStyle.bg} ${catStyle.text}`}>
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

                    <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-2">
                      {tour.location && <span className="flex items-center gap-1"><MapPin size={10} /> {tour.location}</span>}
                      {tour.duration && <span className="flex items-center gap-1"><Clock size={10} /> {tour.duration}</span>}
                      {tour.distance && <span className="flex items-center gap-1"><TrendingUp size={10} /> {tour.distance} км</span>}
                    </div>

                    <div className="flex items-center justify-between">
                      {nextDate ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-teal-400 font-medium">{formatDate(nextDate.startDate)}</span>
                          {isLowSpots && (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full">
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
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1.5">
                    {sp.post.read_time ? `${sp.post.read_time} мин чтения` : 'Статья'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── ПОДПИСКИ НА КАТЕГОРИИ (Чистый UI с Pill-тегами) ── */}
      <section className="space-y-4 pt-4 border-t border-white/5">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-teal-400" />
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Направления (Подписки)
          </h2>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Мы пришлём уведомление в Telegram когда появятся новые даты в выбранных категориях.
        </p>

        {/* Рендерим наши новые минималистичные Pill-теги */}
        <CategoryPills categories={allCategories} subscribedIds={subscribedCategoryIds} />

        <p className="text-xs text-slate-600 mt-4">
          Уведомления приходят в Telegram. Убедитесь что вы подписаны на{' '}
          <a
            href="https://t.me/evaturclub"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-500 hover:text-teal-400 transition-colors"
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
  { name: 'Мои туры', href: '/account/bookings',  icon: Ticket },
  { name: 'История', href: '/account/history',   icon: History },
  { name: 'Вишлист', href: '/account/wishlist',  icon: Heart },
  // ✅ ДОБАВЛЕНА ВКЛАДКА "ТЕСТЫ"
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
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
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
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
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
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-teal-500/10 rounded-2xl -z-10 animate-in fade-in zoom-in duration-300" />
                )}
                <Icon size={20} className={isActive ? 'mb-1' : 'mb-1 opacity-80'} />
                <span className="text-[10px] font-bold tracking-wide">
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
            <span className="text-[10px] font-bold tracking-wide">
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

## File: src/app/account/dashboard/page.tsx
```typescript
// src/app/account/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin, Clock, TrendingUp,
  ChevronRight, Calendar, ArrowRight,
  Star, Flame, Timer, Backpack, 
  FileText, Download, Wallet, Tent, Map, Moon
} from 'lucide-react';
import VirtualCard from '@/features/account/components/VirtualCard';
import ReferralCard from '@/features/account/components/ReferralCard';

// ─── уровни ─────────────────────────────────────────────────────────
const LEVELS = [
  { name: 'Первопроходец', min: 0,  max: 2  },
  { name: 'Походник',      min: 3,  max: 6  },
  { name: 'Бывалый',       min: 7,  max: 14 },
  { name: 'Ветеран',       min: 15, max: 29 },
  { name: 'Легенда клуба', min: 30, max: 9999 }, // Увеличили max для последнего уровня, чтобы не ломался расчет
];

const LEVEL_STYLES: Record<string, { bar: string; badge: string; glow: string }> = {
  'Первопроходец': { bar: 'bg-teal-500',   badge: 'text-teal-400 bg-teal-400/10 border-teal-400/20',   glow: 'shadow-teal-500/20'   },
  'Походник':      { bar: 'bg-green-500',  badge: 'text-green-400 bg-green-400/10 border-green-400/20', glow: 'shadow-green-500/20'  },
  'Бывалый':       { bar: 'bg-blue-500',   badge: 'text-blue-400 bg-blue-400/10 border-blue-400/20',   glow: 'shadow-blue-500/20'   },
  'Ветеран':       { bar: 'bg-purple-500', badge: 'text-purple-400 bg-purple-400/10 border-purple-400/20', glow: 'shadow-purple-500/20' },
  'Легенда клуба': { bar: 'bg-amber-500',  badge: 'text-amber-400 bg-amber-400/10 border-amber-400/20', glow: 'shadow-amber-500/20'  },
};

// ─── вспомогательные функции ─────────────────────────────────────────

function getDaysLeft(targetDate: Date) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function pluralDays(n: number) {
  const abs = Math.abs(n) % 100;
  const mod = abs % 10;
  if (abs >= 11 && abs <= 19) return 'дней';
  if (mod === 1) return 'день';
  if (mod >= 2 && mod <= 4) return 'дня';
  return 'дней';
}

function pluralThings(n: number) {
  const abs = Math.abs(n) % 100;
  const mod = abs % 10;
  if (abs >= 11 && abs <= 19) return 'вещей';
  if (mod === 1) return 'вещь';
  if (mod >= 2 && mod <= 4) return 'вещи';
  return 'вещей';
}

function formatDate(d: Date) {
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

// ─── загрузка данных ─────────────────────────────────────────────────
async function getDashboardData(userId: string) {
  const profile = await prisma.memberProfile.findUnique({
    where: { userId },
  });

  if (!profile) return null;

  const now = new Date();

  // 1. Ближайший предстоящий тур (confirmed или pending)
  const upcomingBooking = await prisma.booking.findFirst({
    where: {
      memberId: profile.id,
      status: { in: ['pending', 'confirmed'] },
      OR: [
        { tourDate: { startDate: { gte: now } } },
        { tourDateId: null } 
      ]
    },
    orderBy: { tourDate: { startDate: 'asc' } },
    include: {
      tour: {
        select: {
          title: true,
          slug: true,
          location: true,
          coverImage: true,
          difficulty: true,
          duration: true,
          checklist: true,
          documents: true,
        },
      },
      tourDate: {
        select: {
          startDate: true,
          endDate: true,
          time: true,
          guide: {
            select: { name: true, image: true },
          },
        },
      },
    },
  });

  // 2. 🔥 ЧЕСТНАЯ ИСТОРИЯ: ТОЛЬКО 'confirmed' и ТОЛЬКО прошедшие
  const pastConfirmedBookings = await prisma.booking.findMany({
    where: { 
      memberId: profile.id, 
      status: 'confirmed',
      tourDate: { startDate: { lt: now } }
    },
    include: { 
      tour: { select: { distance: true, duration: true } },
      tourDate: { select: { startDate: true, endDate: true } }
    },
  });

  // 3. 🔥 АГРЕГАЦИЯ ЧЕСТНОЙ СТАТИСТИКИ
  let totalKm = 0;
  let totalNights = 0;
  const totalTours = pastConfirmedBookings.length;

  for (const b of pastConfirmedBookings) {
    // Считаем километры
    const km = parseFloat(b.tour?.distance ?? '0');
    totalKm += isNaN(km) ? 0 : km;

    // Считаем ночевки: Приоритет реальным датам, фолбэк на текстовое поле duration
    if (b.tourDate?.startDate && b.tourDate?.endDate) {
      const diffTime = Math.abs(b.tourDate.endDate.getTime() - b.tourDate.startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      totalNights += diffDays;
    } else if (b.tour?.duration) {
      const d = parseInt(b.tour.duration) - 1;
      totalNights += (isNaN(d) || d < 0 ? 0 : d);
    }
  }

  // 4. Последние 3 брони (для ленты внизу дашборда)
  const recentBookings = await prisma.booking.findMany({
    where: { memberId: profile.id, status: { not: 'cancelled' } },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: {
      tour: {
        select: { title: true, slug: true, coverImage: true, location: true },
      },
      tourDate: { select: { startDate: true } },
    },
  });

  return {
    profile,
    upcomingBooking,
    stats: {
      totalTours,
      totalKm: Math.round(totalKm),
      balance: profile.balance || 0, 
      totalNights,
    },
    recentBookings,
  };
}

// ─── страница ────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account/dashboard'); 

  const data = await getDashboardData(user.id);
  if (!data) redirect('/login?next=/account/dashboard');

  const { profile, upcomingBooking, stats, recentBookings } = data;
  const displayName = profile.name ?? 'Участник';
  const inventoryCount = profile.inventory?.length || 0;

  // 🔥 РАСЧЕТ ПРОГРЕССА ДО СЛЕДУЮЩЕГО УРОВНЯ
  const currentLevelIndex = LEVELS.findIndex(l => stats.totalTours >= l.min && stats.totalTours <= l.max);
  const safeIndex = currentLevelIndex !== -1 ? currentLevelIndex : (stats.totalTours >= LEVELS[LEVELS.length - 1].max ? LEVELS.length - 1 : 0);
  const currentConfig = LEVELS[safeIndex];
  const nextConfig = LEVELS[safeIndex + 1];

  const toursNeeded = nextConfig ? nextConfig.min - stats.totalTours : 0;
  const progressPercent = nextConfig 
    ? Math.max(0, Math.min(100, ((stats.totalTours - currentConfig.min) / (nextConfig.min - currentConfig.min)) * 100))
    : 100;

return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Личный кабинет</h1>
        <p className="text-slate-400 mt-2">Управляйте своими путешествиями и привилегиями</p>
      </div>

      {/* Основная сетка Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* ЛЕВАЯ КОЛОНКА: Карточка (Прогресс и Модалка уже внутри нее) */}
        {/* На мобилке идет ВТОРОЙ (order-2), на десктопе ПЕРВОЙ (xl:order-1) */}
        <div className="xl:col-span-5 flex flex-col gap-4 order-2 xl:order-1">
          <div className="w-full max-w-md mx-auto xl:mx-0">
            {/* Твои переменные могут немного отличаться названиями (например, profile.name), 
                оставляй те, которые получаешь из Prisma */}
            <VirtualCard 
              name={displayName} 
              level={profile.level} 
              totalTours={stats.totalTours}
              totalKm={stats.totalKm}      
              memberId={profile.id}
            />
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА: Статистика и Баланс */}
        {/* На мобилке идет ПЕРВОЙ (order-1), на десктопе ВТОРОЙ (xl:order-2) */}
        <div className="xl:col-span-7 flex flex-col gap-6 order-1 xl:order-2">
          
          {/* Блок: Ваш баланс (Выделен визуально) */}
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500/20 rounded-3xl p-6 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 p-6 opacity-20 pointer-events-none">
              <Wallet size={80} className="text-amber-500" />
            </div>
            <h3 className="text-amber-500/80 font-medium text-sm mb-1 uppercase tracking-wider">Ваш баланс</h3>
            <div className="text-4xl font-black text-white flex items-baseline gap-2">
              {profile.balance || 0} <span className="text-xl font-medium text-amber-500/50">₽</span>
            </div>
            <p className="text-sm text-amber-500/60 mt-3 max-w-[80%]">
              Используйте баланс для оплаты до 50% стоимости следующих приключений.
            </p>
          </div>

          {/* Блок: Статистика походов */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 shadow-lg">
            <h3 className="text-slate-400 font-medium text-sm mb-6 uppercase tracking-wider">Вы прошли с нами</h3>
            
            <div className="grid grid-cols-3 gap-4">
              {/* Туры */}
              <div className="flex flex-col gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
                  <Tent size={24} />
                </div>
                <div>
                  <div className="text-3xl font-black text-white">{stats.totalTours || 0}</div>
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Туров</div>
                </div>
              </div>

              {/* Километры */}
              <div className="flex flex-col gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner">
                  <Map size={24} />
                </div>
                <div>
                  <div className="text-3xl font-black text-white">{Math.floor(stats.totalKm || 0)}</div>
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Километров</div>
                </div>
              </div>

              {/* Ночи (если переменной totalNights пока нет, временно будет 0) */}
              <div className="flex flex-col gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
                  <Moon size={24} />
                </div>
                <div>
                  {/* Замени stats.totalNights на правильную переменную, если она называется иначе */}
                  <div className="text-3xl font-black text-white">{stats.totalNights || 0}</div>
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Ночей</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
      
      {/* ── Ближайший тур ───────────────────────────────────────── */}
      {upcomingBooking ? (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Ближайший тур
            </h2>
            <Link
              href="/account/bookings"
              className="text-xs text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-1"
            >
              Все брони <ChevronRight size={12} />
            </Link>
          </div>

          <div className="bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden">
            {/* Фото */}
            {upcomingBooking.tour.coverImage && (
              <div className="relative h-40 w-full">
                <Image
                  src={upcomingBooking.tour.coverImage}
                  alt={upcomingBooking.tour.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 700px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                
                {/* Плашка обратного отсчета */}
                {upcomingBooking.tourDate && getDaysLeft(upcomingBooking.tourDate.startDate) >= 0 && (
                  <div className="absolute top-4 right-4 bg-teal-500 text-slate-950 text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-[0_0_15px_rgba(20,184,166,0.5)] flex items-center gap-1.5 z-10">
                    <Timer size={14} className="animate-pulse" />
                    {getDaysLeft(upcomingBooking.tourDate.startDate) === 0
                      ? 'Тур уже сегодня!'
                      : `Через ${getDaysLeft(upcomingBooking.tourDate.startDate)} ${pluralDays(getDaysLeft(upcomingBooking.tourDate.startDate))}`}
                  </div>
                )}

                {/* Дата поверх фото */}
                {upcomingBooking.tourDate && (
                  <div className="absolute bottom-3 left-4 flex items-center gap-2">
                    <Calendar size={14} className="text-teal-400" />
                    <span className="text-sm font-bold text-white">
                      {formatDate(upcomingBooking.tourDate.startDate)}
                      {upcomingBooking.tourDate.time && ` · ${upcomingBooking.tourDate.time}`}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="p-4 space-y-3">
              <h3 className="text-lg font-black text-white leading-tight">
                {upcomingBooking.tour.title}
              </h3>

              <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                {upcomingBooking.tour.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {upcomingBooking.tour.location}
                  </span>
                )}
                {upcomingBooking.tour.duration && (
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {upcomingBooking.tour.duration}
                  </span>
                )}
              </div>

            {upcomingBooking.tourDate?.guide && (
                <div className="flex items-center gap-2 pt-1">
                  {upcomingBooking.tourDate.guide.image ? (
                    <Image
                      src={upcomingBooking.tourDate.guide.image}
                      alt={upcomingBooking.tourDate.guide.name}
                      width={28}
                      height={28}
                      // ✅ ДОБАВИЛИ w-7 h-7 и flex-shrink-0
                      className="w-7 h-7 rounded-full object-cover flex-shrink-0" 
                    />
                  ) : (
                    // ✅ Сюда тоже добавили flex-shrink-0 на всякий случай
                    <div className="w-7 h-7 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-teal-400">
                        {upcomingBooking.tourDate.guide.name[0]}
                      </span>
                    </div>
                  )}
                  <span className="text-xs text-slate-400">
                    Гид: <span className="text-white font-medium">
                      {upcomingBooking.tourDate.guide.name}
                    </span>
                  </span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Link
                  href={`/tour/${upcomingBooking.tour.slug}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold py-2.5 rounded-xl transition-all"
                >
                  О туре <ArrowRight size={14} />
                </Link>
                <Link
                  href="/account/bookings"
                  className="px-4 flex items-center justify-center text-sm font-medium text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 rounded-xl transition-all"
                >
                  Управление
                </Link>
              </div>
            </div>
          </div>

          {/* Умный чек-лист снаряжения */}
          <div className="mt-4 bg-slate-900/60 border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-500 shrink-0">
                <Backpack size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm mb-1">Снаряжение для тура</h3>
                {inventoryCount > 0 ? (
                  <p className="text-xs text-slate-400 font-medium">
                    В вашем базовом инвентаре <strong className="text-teal-400">{inventoryCount} {pluralThings(inventoryCount)}</strong>. Сверьтесь со списком тура!
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 font-medium">
                    Ваш базовый инвентарь пуст. Обязательно проверьте, что нужно взять с собой!
                  </p>
                )}
              </div>
            </div>
            <Link
              href={`/tour/${upcomingBooking.tour.slug}#essentials`}
              className="w-full md:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-white/5 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors text-center shrink-0"
            >
              Смотреть список
            </Link>
          </div>

          {/* Документы тура */}
          {(() => {
            interface TourDoc { title?: string; url?: string; }
            const docs = upcomingBooking.tour.documents as unknown as TourDoc[] | null;

            if (!Array.isArray(docs) || docs.length === 0) return null;

            return (
              <div className="mt-4 bg-slate-900/60 border border-white/5 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={18} className="text-blue-400" />
                  <h3 className="text-white font-bold text-sm">Материалы для скачивания</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {docs.map((doc, idx) => {
                    if (!doc.url) return null;
                    return (
                      <a
                        key={idx}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-white/5 transition-all group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                          <Download size={14} className="group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">
                            {doc.title || 'Документ к туру'}
                          </p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                            Открыть файл
                          </p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </section>
      ) : (
        /* Нет предстоящих туров */
        <section className="bg-slate-900/60 border border-white/5 rounded-2xl p-6 text-center">
          <p className="text-slate-400 text-sm mb-4">Нет предстоящих туров</p>
          <Link
            href="/tour"
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all"
          >
            Найти тур <ArrowRight size={14} />
          </Link>
        </section>
      )}

      {/* ── Последние туры ──────────────────────────────────────── */}
      {recentBookings.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              История туров
            </h2>
            <Link
              href="/account/history"
              className="text-xs text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-1"
            >
              Все туры <ChevronRight size={12} />
            </Link>
          </div>

          <div className="space-y-2">
            {recentBookings.map(booking => (
              <Link
                key={booking.id}
                href={`/tour/${booking.tour.slug}`}
                className="flex items-center gap-3 bg-slate-900/60 border border-white/5 hover:border-white/10 rounded-xl p-3 transition-all group"
              >
                {/* Миниатюра */}
                <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-800">
                  {booking.tour.coverImage && (
                    <Image
                      src={booking.tour.coverImage}
                      alt={booking.tour.title}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate group-hover:text-teal-400 transition-colors">
                    {booking.tour.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {booking.tourDate
                      ? formatDate(booking.tourDate.startDate)
                      : 'Дата не указана'
                    }
                    {booking.tour.location && ` · ${booking.tour.location}`}
                  </p>
                </div>

                <ChevronRight size={14} className="text-slate-600 group-hover:text-teal-400 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
```
