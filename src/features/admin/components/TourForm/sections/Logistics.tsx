import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { FormInput } from '../ui/FormUI';
import { MapPin, Calendar, Plus, Trash2, User } from 'lucide-react';
import { clsx } from 'clsx';

// Принимаем список гидов как проп, так как это данные с сервера
interface LogisticsProps {
  guides: { id: string; name: string }[];
}

export const Logistics = ({ guides }: LogisticsProps) => {
  const { control, register, formState: { errors } } = useFormContext();
  
  // Управление массивом дат
  const { fields, append, remove } = useFieldArray({
    control,
    name: "dates"
  });

  return (
    <div className="space-y-8">
      
      {/* 1. Блок ЛОГИСТИКА (Исправляем потерянные поля) */}
      <div>
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
          <MapPin className="text-teal-500" size={20} />
          <h3 className="font-bold text-slate-700">Логистика и Маршрут</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FormInput name="location" label="Локация (Регион)" placeholder="Карпаты, Румыния" />
          <FormInput name="meetingPoint" label="Место сбора" placeholder="Кишинев, Цирк" />
          <FormInput name="duration" label="Длительность" placeholder="3 дня / 2 ночи" />
          
          {/* 👇 ВОТ ПОТЕРЯННОЕ ПОЛЕ */}
          <FormInput name="route" label="Нитка маршрута" placeholder="Город А - Город Б - Город В" />
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
             <FormInput name="distance" label="Дистанция (км)" placeholder="15 км" />
             <FormInput name="difficulty" label="Сложность" placeholder="medium" />
        </div>
      </div>

      {/* 2. Блок ДАТЫ И ГИДЫ */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="text-teal-500" size={20} />
            <h3 className="font-bold text-slate-700">Даты и Гиды</h3>
          </div>
          <button 
            type="button" 
            onClick={() => append({ start: '', end: '', guide_id: '' })}
            className="flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-500 bg-teal-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={14} /> Добавить дату
          </button>
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-12 gap-3 items-end bg-slate-50 p-3 rounded-xl border border-slate-100 relative group">
              
              <div className="col-span-6 md:col-span-3">
                <FormInput 
                  name={`dates.${index}.start`} 
                  label={index === 0 ? "Старт" : ""} 
                  type="date" 
                />
              </div>
              
              <div className="col-span-6 md:col-span-3">
                <FormInput 
                  name={`dates.${index}.end`} 
                  label={index === 0 ? "Конец" : ""} 
                  type="date" 
                />
              </div>
              
              {/* Выбор ГИДА для конкретной даты */}
              <div className="col-span-10 md:col-span-4">
                 <label className="text-xs font-bold uppercase text-slate-500 mb-1.5 block">
                    {index === 0 ? "Гид" : ""}
                 </label>
                 <div className="relative">
                   <select 
                     {...register(`dates.${index}.guide_id`)}
                     className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-teal-500"
                   >
                     <option value="">Без гида</option>
                     {guides.map(g => (
                       <option key={g.id} value={g.id}>{g.name}</option>
                     ))}
                   </select>
                   <User className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={14} />
                 </div>
              </div>

              <div className="col-span-2 md:col-span-2 flex justify-end">
                <button 
                  type="button" 
                  onClick={() => remove(index)}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Удалить дату"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}

          {fields.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-slate-400 text-sm">Даты еще не добавлены</p>
              <button 
                type="button"
                onClick={() => append({ start: '', end: '', guide_id: '' })}
                className="text-teal-500 font-bold text-sm mt-2 hover:underline"
              >
                Добавить первую дату
              </button>
            </div>
          )}
        </div>
        <p className="text-[10px] text-slate-400 mt-2">
          * Гид, выбранный в <strong>первой дате</strong>, будет считаться основным гидом тура.
        </p>
      </div>
    </div>
  );
};