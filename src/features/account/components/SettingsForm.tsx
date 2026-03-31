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
      
      {/* ── НОВАЯ СМАРТ-СЕТКА: Две независимые колонки ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* ЛЕВАЯ КОЛОНКА (Связь и Антропометрия) */}
        <div className="space-y-6 flex flex-col">
          
          {/* БЛОК 1: Контакты */}
          <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
              <User className="text-teal-500" size={20} />
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Контакты</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1 mb-1 block">Имя и Фамилия *</label>
                <input 
                  {...register("name")}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 outline-none transition-all"
                />
                {errors.name && <p className="text-xs text-rose-500 mt-1 ml-1">{errors.name?.message}</p>}
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1 mb-1 flex items-center gap-1.5">
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
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1 mb-1 flex items-center gap-1.5">
                  <Mail size={12} /> Email
                </label>
                <input 
                  {...register("email")}
                  placeholder="Для чеков и билетов"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 outline-none transition-all"
                />
                {errors.email && <p className="text-xs text-rose-500 mt-1 ml-1">{errors.email?.message}</p>}
              </div>

              {/* Соцсети */}
              <div className="pt-4 mt-2 border-t border-white/5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1 mb-3 block">
                    Соцсети (Для чатов групп)
                </label>
                <div className="space-y-3">
                    <div className="relative group">
                        <Send size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-400 transition-colors" />
                        <input 
                            {...register("telegram")}
                            placeholder="@username в Telegram"
                            className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 outline-none transition-all"
                        />
                    </div>
                    <div className="relative group">
                        <Instagram size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-pink-400 transition-colors" />
                        <input 
                            {...register("instagram")}
                            placeholder="@username в Instagram"
                            className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500/20 outline-none transition-all"
                        />
                    </div>
                    <div className="relative group">
                        <MessageCircle size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-400 transition-colors" />
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

          {/* ✅ НОВЫЙ БЛОК: ИНТЕГРАЦИЯ С TELEGRAM */}
          <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            {isTelegramConnected && (
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />
            )}
            
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className={clsx(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner",
                isTelegramConnected ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-[#2AABEE]/10 border border-[#2AABEE]/20 text-[#2AABEE]"
              )}>
                {isTelegramConnected ? <CheckCircle2 size={20} /> : <Send size={20} className="-ml-0.5" />}
              </div>
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider">Telegram Бот</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isTelegramConnected ? 'Персональный помощник' : 'Уведомления и подписки'}
                </p>
              </div>
            </div>

            <div className="relative z-10">
              {isTelegramConnected ? (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-emerald-400/90 font-medium leading-relaxed">
                    Бот успешно подключен! Теперь вы будете моментально узнавать о новых турах и местах из листа ожидания.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Подключите бота, чтобы получать мгновенные уведомления о статусе брони и освободившихся местах.
                  </p>
                  <a 
                    href={`https://t.me/authevaclub_bot?start=user_${profile.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center justify-center gap-2 w-full bg-[#2AABEE] hover:bg-[#229ED9] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(42,171,238,0.2)]"
                  >
                    <Send size={16} className="-ml-1" /> Подключить @authevaclub_bot
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* БЛОК 3: Антропометрия */}
          <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
              <Shirt className="text-blue-500" size={20} />
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Антропометрия</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1 mb-1 flex items-center gap-1.5"><Shirt size={12}/> Размер одежды</label>
                  <div className="relative">
                    <select {...register("clothesSize")} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-teal-500 outline-none appearance-none cursor-pointer">
                      <option value="">Не указан</option>
                      {CLOTHES_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1 mb-1 flex items-center gap-1.5"><LifeBuoy size={12}/> Спасжилет</label>
                  <div className="relative">
                    <select {...register("lifeJacketSize")} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-teal-500 outline-none appearance-none cursor-pointer">
                      <option value="">Не указан</option>
                      {CLOTHES_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1 mb-1 flex items-center gap-1.5"><Footprints size={12}/> Размер обуви</label>
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

        {/* ПРАВАЯ КОЛОНКА (Питание и Инвентарь) */}
        <div className="space-y-6 flex flex-col">
          
          {/* БЛОК 2: Питание */}
          <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
              <Apple className="text-emerald-500" size={20} />
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Питание</h2>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1 mb-2 block">
                Диета и аллергии
              </label>
              {/* ✅ Убрали лишний текст снизу, сделали поле аккуратным */}
              <textarea 
                {...register("foodPref")}
                placeholder="Например: вегетарианец, не ем лук, аллергия на орехи. Если особенностей нет — оставьте поле пустым."
                className="w-full min-h-[140px] bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* БЛОК 4: Инвентарь */}
          <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 shadow-xl flex-1">
            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
              <Backpack className="text-amber-500" size={20} />
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Мой инвентарь</h2>
            </div>

            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
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
                      "px-4 py-2.5 rounded-xl text-xs font-bold transition-all border",
                      isActive 
                        ? "bg-amber-500/10 border-amber-500/50 text-amber-400 shadow-inner" 
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
      </div>

      {/* ✅ КНОПКА СОХРАНЕНИЯ (Теперь статичная, в конце формы, над мобильным меню) */}
      <div className="pt-6 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="w-full sm:w-auto px-8 py-4 flex items-center justify-center gap-3 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-400 text-slate-950 font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] active:scale-[0.98]"
        >
          {isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          <span>{isPending ? "Сохранение..." : "Сохранить настройки"}</span>
        </button>
      </div>

    </form>
  );
}