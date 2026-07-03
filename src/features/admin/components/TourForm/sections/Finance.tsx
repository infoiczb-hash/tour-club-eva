// src/features/admin/components/TourForm/sections/Finance.tsx
'use client';

import React, { useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { FormInput, FormSelect } from '../ui/FormUI';
import { CreditCard, Users, Crown, Baby, QrCode, Link as LinkIcon, AlertTriangle, ChevronDown, ChevronUp, Plus, Trash2, Layers } from 'lucide-react';

export const Finance = () => {
  const { control, register, watch } = useFormContext();
  const [showLegacy, setShowLegacy] = useState(false);

  // Инициализируем управление динамическим массивом категорий
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'priceCategories',
  });

  return (
    <div className="space-y-8">
      
      {/* 1. ШАПКА И БАЗОВЫЕ ФИНАНСЫ */}
      <div>
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
          <CreditCard className="text-teal-500" size={20} />
          <h3 className="font-bold text-slate-700">Финансы и Места</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Базовая цена */}
          <div className="space-y-4 p-4 bg-teal-50/50 rounded-xl border border-teal-100">
            <h4 className="text-xs font-black uppercase text-teal-600 mb-2">Базовая стоимость</h4>
            <div className="grid grid-cols-2 gap-3">
               <FormInput name="price" label="Цена (Взрослый)" type="number" placeholder="1000" />
               <FormSelect 
                  name="currency" 
                  label="Валюта" 
                  options={[
                    { value: 'RUB', label: 'RUB (₽)' },
                    { value: 'EUR', label: 'EUR (€)' },
                    { value: 'USD', label: 'USD ($)' },
                    { value: 'MDL', label: 'MDL (L)' },
                  ]} 
               />
            </div>
            <FormInput 
              name="priceOld" 
              label="Старая цена (для скидки)" 
              type="number" 
              placeholder="1500" 
              helperText="Если заполнить, появится перечеркнутая цена"
            />
          </div>

          {/* Общие места */}
          <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <h4 className="text-xs font-black uppercase text-slate-800 mb-2">Глобальные места</h4>
            <div className="grid grid-cols-2 gap-3">
               <FormInput name="spots" label="Всего мест" type="number" />
               <FormInput name="spotsLeft" label="Осталось мест" type="number" />
            </div>
            <p className="text-[11px] text-slate-600 leading-tight mt-2 font-medium">
              * Эти лимиты используются по умолчанию, если для конкретной даты во вкладке "Логистика" не задана своя вместимость.
            </p>
          </div>
        </div>
      </div>

      {/* 2. НОВЫЙ БЛОК: ГИБКИЕ КАТЕГОРИИ ЦЕН */}
      <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
           <div>
             <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
               <Layers className="text-indigo-500" size={20} /> Гибкие категории цен
             </h4>
             <p className="text-[12px] text-slate-600 mt-1 font-medium">Настройте тарифы (Взрослый, Байдарка К2, Страховка)</p>
           </div>
           
           <button 
             type="button" 
             onClick={() => append({ key: '', label: '', price: 0, spotsPerUnit: 1, minQuantity: 0, sortOrder: fields.length, isActive: true })} 
             className="text-xs font-bold text-white bg-indigo-600 px-4 py-2.5 rounded-xl shadow-md hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
           >
             <Plus size={16}/> Добавить тариф
           </button>
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => {
             // Отслеживаем чекбокс активности для визуальной стилистики
             const isActive = watch(`priceCategories.${index}.isActive`);
             
             return (
              <div key={field.id} className={`p-4 rounded-2xl border transition-all relative group ${isActive ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-100 border-slate-200 opacity-70'}`}>
                
                <button 
                  type="button" 
                  onClick={() => remove(index)} 
                  className="absolute -top-3 -right-3 w-8 h-8 bg-rose-100 hover:bg-rose-500 text-rose-600 hover:text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10"
                  title="Удалить тариф"
                >
                  <Trash2 size={14}/>
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-start">
                   {/* Label */}
                   <div className="lg:col-span-3">
                     <FormInput name={`priceCategories.${index}.label`} label="Название" placeholder="Байдарка 2-мест." />
                   </div>
                   
                   {/* Key */}
                   <div className="lg:col-span-2">
                     <FormInput name={`priceCategories.${index}.key`} label="Сист. ключ" placeholder="kayak_2" className="font-mono text-xs" />
                   </div>
                   
                   {/* Price */}
                   <div className="lg:col-span-2">
                     <FormInput name={`priceCategories.${index}.price`} label="Цена" type="number" placeholder="1800" />
                   </div>
                   
                   {/* Spots */}
                   <div className="lg:col-span-2">
                     <FormInput name={`priceCategories.${index}.spotsPerUnit`} label="Списывает мест" type="number" placeholder="2" helperText="Сколько людей в лодке" />
                   </div>
                   
                   {/* Min Qty */}
                   <div className="lg:col-span-2">
                     <FormInput name={`priceCategories.${index}.minQuantity`} label="Мин. шт" type="number" placeholder="0" helperText="Обязаловка" />
                   </div>

                   {/* Is Active Toggle */}
                   <div className="lg:col-span-1 flex flex-col items-center justify-center pt-5">
                      <label className="flex flex-col items-center cursor-pointer gap-1">
                        <input type="checkbox" {...register(`priceCategories.${index}.isActive`)} className="sr-only peer" />
                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500 relative"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Вкл</span>
                      </label>
                   </div>
                </div>
              </div>
            )
          })}
          
          {fields.length === 0 && (
            <div className="py-12 text-center border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 font-medium">
               Нет настроенных тарифов. Нажмите «Добавить тариф».
            </div>
          )}
        </div>
      </div>

      {/* 3. УСТАРЕВШИЕ ТАРИФЫ (Спрятаны под спойлер) */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
        <button
          type="button"
          onClick={() => setShowLegacy(!showLegacy)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={18} />
            <span className="font-bold text-slate-700 text-sm">Устаревшие тарифы (Legacy Fallback)</span>
          </div>
          {showLegacy ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </button>
        
        {showLegacy && (
          <div className="p-5 bg-slate-50/50 border-t border-slate-200">
            <p className="text-xs text-slate-500 mb-4 font-medium">
              Эти поля сохранены исключительно для обратной совместимости старых туров. Если вы настроили блок "Гибкие категории цен" выше, эти поля можно оставить пустыми.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
               <div className="flex gap-2 items-end">
                  <Crown size={18} className="text-amber-500 mb-3" />
                  <FormInput name="priceMember" label="Клубная цена" type="number" placeholder="900" />
               </div>
               <div className="flex gap-2 items-end">
                  <Baby size={18} className="text-pink-400 mb-3" />
                  <FormInput name="priceChild" label="Детский билет" type="number" placeholder="500" />
               </div>
               <div className="flex gap-2 items-end">
                  <Users size={18} className="text-blue-500 mb-3" />
                  <FormInput name="priceFamily" label="Семейный пакет" type="number" placeholder="2500" />
               </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. РЕКВИЗИТЫ ДЛЯ ОПЛАТЫ */}
      <div className="pt-6 border-t border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <QrCode className="text-indigo-500" size={20} />
          <h4 className="font-bold text-slate-700">Реквизиты для оплаты (Онлайн)</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-indigo-50/30 p-5 rounded-2xl border border-indigo-100">
          <div className="space-y-4">
            <h5 className="text-xs font-black uppercase text-indigo-500 flex items-center gap-1"><LinkIcon size={14}/> Bilet PMR</h5>
            <FormInput 
              name="biletpmrLink" 
              label="Ссылка на покупку билета" 
              type="text" 
              placeholder="https://biletpmr.com/..." 
              helperText="Пусто, если не продаете тут"
            />
          </div>

          <div className="space-y-4">
            <h5 className="text-xs font-black uppercase text-indigo-500 flex items-center gap-1"><LinkIcon size={14}/> Мобильный платеж APB</h5>
            <FormInput 
              name="apbQrLink" 
              label="Ссылка на оплату в приложении" 
              type="text" 
              placeholder="https://qrpay.apb.online/..." 
            />
          </div>

          <div className="space-y-4">
            <h5 className="text-xs font-black uppercase text-indigo-500 flex items-center gap-1"><QrCode size={14}/> QR-Код APB</h5>
            <FormInput 
              name="apbQrImage" 
              label="Ссылка на картинку с QR-кодом" 
              type="text" 
              placeholder="https://.../qr-code.png" 
              helperText="Показывается на экране успеха"
            />
          </div>
        </div>
      </div>

    </div>
  );
};