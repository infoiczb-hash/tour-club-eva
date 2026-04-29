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
const SHOE_SIZES = Array.from({ length: 13 }, (_, i) => String(35 + i));

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

// ── Переиспользуемые классы ──────────────────────────────────────────────────
const cardCls = "bg-slate-900/60 border border-white/5 rounded-3xl p-6 shadow-xl";
const cardHeaderCls = "flex items-center gap-3 mb-6 border-b border-white/5 pb-4";
const cardTitleCls = "text-lg font-black text-white uppercase tracking-wide";
const labelCls = "text-xs font-bold uppercase tracking-wide text-slate-300 ml-1 mb-1.5 block";
const labelFlexCls = "text-xs font-bold uppercase tracking-wide text-slate-300 ml-1 mb-1.5 flex items-center gap-1.5";
const inputCls = "w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 outline-none transition-all";
const selectCls = "w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 outline-none cursor-pointer transition-all";
// ────────────────────────────────────────────────────────────────────────────

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

        {/* ── TELEGRAM BOT (на всю ширину) ───────────────────────────── */}
        <div className="lg:col-span-2">
          <div className={clsx(cardCls, "relative overflow-hidden")}>
            {isTelegramConnected && (
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />
            )}
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className={clsx(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                  isTelegramConnected
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    : "bg-[#2AABEE]/10 border border-[#2AABEE]/20 text-[#2AABEE]"
                )}>
                  {isTelegramConnected
                    ? <CheckCircle2 size={24} />
                    : <Send size={24} className="-ml-1" />}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wide">
                    Telegram Бот
                  </h2>
                  <p className="text-sm text-slate-300 mt-0.5">
                    {isTelegramConnected
                      ? 'Персональный помощник успешно подключен'
                      : 'Мгновенные уведомления о статусе брони и новых турах'}
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                {isTelegramConnected ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 size={18} /> Подключен
                  </div>
                ) : (
                  <a
                    href={`https://t.me/authevaclub_bot?start=user_${profile.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full sm:w-auto bg-[#2AABEE] hover:bg-[#229ED9] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-[0_0_15px_rgba(42,171,238,0.2)] active:scale-[0.98]"
                  >
                    <Send size={18} className="-ml-1" /> Подключить бота
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── ЛЕВАЯ КОЛОНКА: КОНТАКТЫ ────────────────────────────────── */}
        <div className="space-y-6">
          <div className={clsx(cardCls, "h-full")}>
            <div className={cardHeaderCls}>
              <User className="text-teal-500 shrink-0" size={20} />
              <h2 className={cardTitleCls}>Контакты</h2>
            </div>

            <div className="space-y-4">

              {/* Имя */}
              <div>
                <label className={labelCls}>Имя и Фамилия *</label>
                <input
                  {...register("name")}
                  placeholder="Иван Иванов"
                  className={inputCls}
                />
                {errors.name && (
                  <p className="text-sm text-rose-400 mt-1.5 ml-1">{errors.name.message}</p>
                )}
              </div>

              {/* Телефон — только для чтения */}
              <div>
                <label className={labelFlexCls}>
                  <Phone size={12} /> Ваш логин (Телефон)
                </label>
                <input
                  value={profile.phone || "Не указан"}
                  disabled
                  title="Телефон нельзя изменить — он используется для входа"
                  className="w-full bg-slate-950/40 border border-white/5 rounded-xl px-4 py-3 text-slate-400 text-sm cursor-not-allowed select-none"
                />
              </div>

              {/* Email */}
              <div>
                <label className={labelFlexCls}>
                  <Mail size={12} /> Email
                </label>
                <input
                  {...register("email")}
                  placeholder="Для чеков и билетов"
                  className={inputCls}
                />
                {errors.email && (
                  <p className="text-sm text-rose-400 mt-1.5 ml-1">{errors.email.message}</p>
                )}
              </div>

              {/* Соцсети */}
              <div className="pt-4 mt-2 border-t border-white/5">
                <label className={labelCls}>Соцсети (для чатов групп)</label>
                <div className="space-y-3">

                  {/* Telegram */}
                  <div className="relative group">
                    <Send
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors pointer-events-none"
                    />
                    <input
                      {...register("telegram")}
                      placeholder="@username в Telegram"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 outline-none transition-all"
                    />
                  </div>

                  {/* Instagram */}
                  <div className="relative group">
                    <Instagram
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-pink-400 transition-colors pointer-events-none"
                    />
                    <input
                      {...register("instagram")}
                      placeholder="@username в Instagram"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm placeholder:text-slate-500 focus:border-pink-500 focus:ring-1 focus:ring-pink-500/20 outline-none transition-all"
                    />
                  </div>

                  {/* Viber */}
                  <div className="relative group">
                    <MessageCircle
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors pointer-events-none"
                    />
                    <input
                      {...register("viber")}
                      placeholder="Номер в Viber (если отличается)"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm placeholder:text-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all"
                    />
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── ПРАВАЯ КОЛОНКА: ПИТАНИЕ + АНТРОПОМЕТРИЯ ───────────────── */}
        <div className="space-y-6">

          {/* Питание */}
          <div className={cardCls}>
            <div className={cardHeaderCls}>
              <Apple className="text-emerald-500 shrink-0" size={20} />
              <h2 className={cardTitleCls}>Питание</h2>
            </div>
            <div>
              <label className={labelCls}>Диета и аллергии</label>
              <textarea
                {...register("foodPref")}
                placeholder="Например: вегетарианец, не ем лук, аллергия на орехи. Если особенностей нет — оставьте поле пустым."
                className="w-full min-h-[140px] bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 outline-none transition-all resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Антропометрия */}
          <div className={cardCls}>
            <div className={cardHeaderCls}>
              <Shirt className="text-blue-400 shrink-0" size={20} />
              <h2 className={cardTitleCls}>Антропометрия</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">

                <div>
                  <label className={labelFlexCls}>
                    <Shirt size={12} /> Размер одежды
                  </label>
                  <select {...register("clothesSize")} className={selectCls}>
                    <option value="">Не указан</option>
                    {CLOTHES_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className={labelFlexCls}>
                    <LifeBuoy size={12} /> Спасжилет
                  </label>
                  <select {...register("lifeJacketSize")} className={selectCls}>
                    <option value="">Не указан</option>
                    {CLOTHES_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

              </div>

              <div>
                <label className={labelFlexCls}>
                  <Footprints size={12} /> Размер обуви
                </label>
                <select {...register("shoeSize")} className={selectCls}>
                  <option value="">Не указан</option>
                  {SHOE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* ── ИНВЕНТАРЬ (на всю ширину) ──────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className={cardCls}>
            <div className={cardHeaderCls}>
              <Backpack className="text-amber-500 shrink-0" size={20} />
              <h2 className={cardTitleCls}>Мой инвентарь</h2>
            </div>

            <p className="text-sm text-slate-300 mb-5 leading-relaxed">
              Отметьте снаряжение, которое у вас уже есть — гид учтёт это при подготовке тура.
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
                      "px-4 py-2.5 rounded-xl text-sm font-bold transition-all border active:scale-95",
                      isActive
                        ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                        : "bg-slate-950 border-white/10 text-slate-300 hover:border-white/25 hover:text-white"
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

      {/* ── КНОПКА СОХРАНЕНИЯ ──────────────────────────────────────────── */}
      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="w-full sm:w-auto px-8 py-4 flex items-center justify-center gap-3 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black uppercase tracking-wide rounded-xl transition-all shadow-[0_0_20px_rgba(20,184,166,0.25)] hover:shadow-[0_0_28px_rgba(20,184,166,0.45)] active:scale-[0.98]"
        >
          {isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          <span className="text-sm sm:text-base">
            {isPending ? "Сохранение..." : "Сохранить настройки"}
          </span>
        </button>
      </div>

    </form>
  );
}