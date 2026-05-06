// src/features/admin/components/TourForm/sections/Logistics.tsx
import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { FormInput, FormSelect } from '../ui/FormUI'; //   ИМПОРТ FORMSELECT
import { MapPin, Calendar, Plus, Trash2, User, Zap, DollarSign } from 'lucide-react';

interface LogisticsProps {
  guides: { id: string; name: string }[];
}

export const Logistics = ({ guides }: LogisticsProps) => {
 const { control, register, getValues } = useFormContext();
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "dates"
  });

  return (
    <div className="space-y-8">
      
      {/* 1. Блок ЛОГИСТИКА */}
      <div>
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
          <MapPin className="text-teal-500" size={20} />
          <h3 className="font-bold text-slate-700">Логистика и Маршрут</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FormInput name="location" label="Локация (Регион)" placeholder="Карпаты, Румыния" />
          <FormInput name="meetingPoint" label="Место сбора" placeholder="Кишинев, Цирк" />
          <FormInput name="duration" label="Длительность" placeholder="3 дня / 2 ночи" />
          <FormInput name="route" label="Нитка маршрута" placeholder="Город А - Город Б - Город В" />
        </div>
        
        {/*   ИСПРАВЛЕНО: Удалили дубль TourFormat, Сложность стала Select */}
        <div className="grid grid-cols-2 gap-4 mt-4">
           <FormInput name="distance" label="Дистанция (км)" placeholder="не определено" />
           <FormSelect 
              name="difficulty" 
              label="Сложность" 
              options={[
                 { value: 'easy', label: 'Легкая (Easy)' },
                 { value: 'medium', label: 'Средняя (Medium)' },
                 { value: 'hard', label: 'Сложная (Hard)' },
                 { value: 'expert', label: 'Экстрим (Expert)' }
              ]} 
           />
        </div>
      </div>

      {/* 2. Блок ДАТЫ, ГИДЫ И ЦЕНООБРАЗОВАНИЕ */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="text-teal-500" size={20} />
            <h3 className="font-bold text-slate-700">Выезды (Даты, Цены, Места)</h3>
          </div>
          <button 
            type="button" 
           onClick={() => {
  // Читаем глобальное количество мест из формы (если пусто — ставим дефолт, например 15)
  const globalSpots = Number(getValues('spots')) || 15;
  
append({ 
  start: '', 
  end: '', 
  time: '', // ✅ ДОБАВИЛИ ВРЕМЯ
  guide_id: '', 
  groupChatUrl: '', 
  spots: globalSpots, 
  spotsLeft: globalSpots, 
  basePrice: undefined, 
  discountEarlyBird: undefined, 
  earlyBirdDeadline: undefined, 
  surchargeLastMinute: undefined, 
  lastMinuteTrigger: undefined 
});
}}
            className="flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-500 bg-teal-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={14} /> Добавить дату
          </button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 relative group transition-all hover:border-teal-200">
              
              <button 
                type="button" 
                onClick={() => remove(index)}
                className="absolute top-4 right-4 p-2 text-slate-800 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors z-10"
                title="Удалить дату"
              >
                <Trash2 size={18} />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pr-10 mb-4">
                <div className="md:col-span-3">
                  <FormInput name={`dates.${index}.start`} label="Старт" type="date" />
                </div>
                <div className="md:col-span-3">
                  <FormInput name={`dates.${index}.end`} label="Конец (опционально)" type="date" />
                </div>
                <div className="md:col-span-2">
                  <FormInput name={`dates.${index}.time`} label="Время" placeholder="09:00" />
                </div>
                <div className="md:col-span-4">
                   <label className="text-xs font-bold uppercase text-slate-800 mb-1.5 block">
                      Гид на выезд
                   </label>
                   <div className="relative">
                     <select 
                       {...register(`dates.${index}.guide_id`)}
                       className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-[11px] text-sm font-bold text-slate-700 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 cursor-pointer"
                     >
                       <option value="">-- Без гида --</option>
                       {guides.map(g => (
                         <option key={g.id} value={g.id}>{g.name}</option>
                       ))}
                     </select>
                     <User className="absolute right-3 top-3 text-slate-800 pointer-events-none" size={14} />
                   </div>
                </div>
              </div>

          {/*   ИСПРАВЛЕНИЕ: Сделали 4 колонки и добавили поле для чата */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pb-4 border-b border-slate-200/60">
                 <FormInput name={`dates.${index}.spots`} label="Вместимость группы" type="number" placeholder="Напр: 15" />
                 <FormInput name={`dates.${index}.spotsLeft`} label="Свободно сейчас" type="number" placeholder="Считается само" />
                 <FormInput name={`dates.${index}.basePrice`} label="Своя цена" type="number" placeholder="В валюте тура" />
                 <FormInput name={`dates.${index}.groupChatUrl`} label="Ссылка на ТГ-чат" type="text" placeholder="https://t.me/+" />
              </div>

              <div className="pt-4">
                 <h4 className="text-xs font-black uppercase text-teal-600 mb-3 flex items-center gap-1.5">
                    <Zap size={14} /> Маркетинг и Динамические цены
                 </h4>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                       <FormInput name={`dates.${index}.discountEarlyBird`} label="Early Bird Скидка (%)" type="number" placeholder="Напр: 15" />
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                       <FormInput name={`dates.${index}.earlyBirdDeadline`} label="Сгорает за (Дней)" type="number" placeholder="Напр: 30" />
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                       <FormInput name={`dates.${index}.surchargeLastMinute`} label="Last Minute Наценка (%)" type="number" placeholder="Напр: 10" />
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                       <FormInput name={`dates.${index}.lastMinuteTrigger`} label="Включается за (Дней)" type="number" placeholder="Напр: 3" />
                    </div>
                 </div>
              </div>

            </div>
          ))}

          {fields.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <p className="text-slate-800 text-sm font-medium">Даты выездов еще не добавлены</p>
             <button 
                type="button"
               onClick={() => {
                  const defaultGroupSize = Number(getValues('spots')) || 15;
                append({ 
  start: '', end: '', time: '', guide_id: '', groupChatUrl: '', // ✅ ДОБАВИЛИ time: ''
  spots: defaultGroupSize, spotsLeft: defaultGroupSize, 
  basePrice: undefined, discountEarlyBird: undefined, 
  earlyBirdDeadline: undefined, surchargeLastMinute: undefined, lastMinuteTrigger: undefined 
});
               }}
                className="text-teal-600 font-bold text-sm mt-3 hover:text-teal-500 hover:underline flex items-center justify-center gap-1 mx-auto"
              >
                <Plus size={16} /> Создать первый выезд
              </button>
            </div>
          )}
        </div>
        <p className="text-[12px] text-slate-800 mt-3 flex items-center gap-1">
          <DollarSign size={12} /> Если оставить "Свою цену" пустой, будет использоваться базовая цена из вкладки "Финансы".
        </p>
      </div>
    </div>
  );
};