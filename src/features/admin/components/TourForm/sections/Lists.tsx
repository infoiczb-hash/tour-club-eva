import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { FormInput, FormTextarea } from '../ui/FormUI';
import { CheckCircle2, XCircle, FileText, Plus, Trash2, Backpack, ChevronDown, ListPlus } from 'lucide-react';

export const Lists = () => {
  const { control } = useFormContext();

  // --- 1. НОВЫЕ ДЕТАЛИЗИРОВАННЫЕ СПИСКИ (JSON / Аккордеоны) ---
  const { fields: incDetailed, append: appendIncDet, remove: removeIncDet } = useFieldArray({ 
    control, 
    name: "includedDetailed" 
  });
  
  const { fields: excDetailed, append: appendExcDet, remove: removeExcDet } = useFieldArray({ 
    control, 
    name: "excludedDetailed" 
  });

  // --- 2. СТАРЫЕ СПИСКИ (Для совместимости) ---
  const { fields: docFields, append: appendDoc, remove: removeDoc } = useFieldArray({ control, name: "documents" });
  const { fields: checkFields, append: appendCheck, remove: removeCheck } = useFieldArray({ control, name: "checklist" });

  // Вспомогательный компонент для рендера вложенных пунктов аккордеона
  const DetailedItemsList = ({ nestIndex, name }: { nestIndex: number, name: string }) => {
    const { fields, append, remove } = useFieldArray({
      control,
      name: `${name}.${nestIndex}.items`
    });

    return (
      <div className="space-y-2 mt-3 pl-4 border-l-2 border-slate-200">
        {fields.map((item, k) => (
          <div key={item.id} className="flex gap-2 items-center">
            <div className="flex-1">
              <FormInput 
                name={`${name}.${nestIndex}.items.${k}.label`} 
                label="" 
                placeholder="Пункт (напр. Трансфер)" 
                className="bg-white text-xs py-2"
              />
            </div>
            <div className="w-24">
              <FormInput 
                name={`${name}.${nestIndex}.items.${k}.price`} 
                label="" 
                placeholder="Цена" 
                className="bg-white text-xs py-2"
              />
            </div>
            <button 
              type="button" 
              onClick={() => remove(k)} 
              className="text-slate-300 hover:text-rose-500 transition-colors"
            >
              <XCircle size={14}/>
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => append({ label: '', price: '' })}
          className="text-[10px] font-black uppercase text-teal-600 hover:text-teal-700 flex items-center gap-1 mt-1"
        >
          <Plus size={12}/> Добавить подпункт
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-10">
      
      {/* СЕКЦИЯ: ВХОДИТ В СТОИМОСТЬ (АККОРДЕОНЫ) */}
      <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100">
        <div className="flex justify-between items-center mb-6">
           <h4 className="text-xl font-black text-emerald-900 flex gap-2 items-center">
             <CheckCircle2 size={24} className="text-emerald-500"/> Включено (Аккордеон)
           </h4>
           <button 
             type="button" 
             onClick={() => appendIncDet({ title: '', items: [] })} 
             className="text-xs font-bold text-white bg-emerald-600 px-4 py-2 rounded-xl shadow-md hover:bg-emerald-700 transition-all flex items-center gap-2"
           >
             <ListPlus size={16}/> Добавить категорию
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {incDetailed.map((field, index) => (
            <div key={field.id} className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm relative group">
              <div className="flex justify-between items-start mb-2">
                 <div className="flex-1 mr-8">
                   <FormInput 
                     name={`includedDetailed.${index}.title`} 
                     label="Заголовок категории" 
                     placeholder="Транспорт / Питание" 
                     className="font-bold border-emerald-200" 
                   />
                 </div>
                 <button 
                   type="button" 
                   onClick={() => removeIncDet(index)} 
                   className="text-slate-300 hover:text-rose-500 transition-colors"
                 >
                   <Trash2 size={18}/>
                 </button>
              </div>
              
              <DetailedItemsList nestIndex={index} name="includedDetailed" />
            </div>
          ))}
          {incDetailed.length === 0 && (
            <div className="col-span-full py-8 text-center border-2 border-dashed border-emerald-200 rounded-2xl text-emerald-400 text-sm italic">
              Нажмите кнопку выше, чтобы создать детализированный список включенных услуг
            </div>
          )}
        </div>
      </div>

      {/* СЕКЦИЯ: ДОПОЛНИТЕЛЬНЫЕ РАСХОДЫ (АККОРДЕОНЫ) */}
      <div className="bg-rose-50/50 p-6 rounded-[2rem] border border-rose-100">
        <div className="flex justify-between items-center mb-6">
           <h4 className="text-xl font-black text-rose-900 flex gap-2 items-center">
             <XCircle size={24} className="text-rose-500"/> Не включено / Доп. расходы
           </h4>
           <button 
             type="button" 
             onClick={() => appendExcDet({ title: '', items: [] })} 
             className="text-xs font-bold text-white bg-rose-600 px-4 py-2 rounded-xl shadow-md hover:bg-rose-700 transition-all flex items-center gap-2"
           >
             <ListPlus size={16}/> Добавить категорию
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {excDetailed.map((field, index) => (
            <div key={field.id} className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm relative group">
              <div className="flex justify-between items-start mb-2">
                 <div className="flex-1 mr-8">
                   <FormInput 
                     name={`excludedDetailed.${index}.title`} 
                     label="Заголовок категории" 
                     placeholder="Входные билеты / Аренда" 
                     className="font-bold border-rose-200" 
                   />
                 </div>
                 <button 
                   type="button" 
                   onClick={() => removeExcDet(index)} 
                   className="text-slate-300 hover:text-rose-500 transition-colors"
                 >
                   <Trash2 size={18}/>
                 </button>
              </div>
              
              <DetailedItemsList nestIndex={index} name="excludedDetailed" />
            </div>
          ))}
        </div>
      </div>

      {/* 2. ЧЕК-ЛИСТ (СНАРЯЖЕНИЕ) */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
         <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-3">
             <h4 className="text-lg font-black text-slate-800 flex gap-2"><Backpack size={20} className="text-blue-500"/> Что взять с собой (Чек-лист)</h4>
             <button type="button" onClick={() => appendCheck({ title: '', items: '' })} className="text-xs bg-white border border-slate-300 px-4 py-2 rounded-lg font-bold hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm">+ Категория</button>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {checkFields.map((field, index) => (
              <div key={field.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group">
                <FormInput name={`checklist.${index}.title`} label="Категория" placeholder="Одежда / Документы" className="mb-3 font-bold" />
                <FormTextarea 
                  name={`checklist.${index}.items`} 
                  label="Список вещей (каждый с новой строки)" 
                  rows={5} 
                  placeholder="- Паспорт
- Страховка
- Билеты" 
                />
                <button type="button" onClick={() => removeCheck(index)} className="absolute top-2 right-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
              </div>
            ))}
         </div>
      </div>

      {/* 3. ДОКУМЕНТЫ */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
         <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-3">
             <h4 className="text-lg font-black text-slate-800 flex gap-2"><FileText size={20} className="text-teal-500"/> Документы (PDF/Doc)</h4>
             <button type="button" onClick={() => appendDoc({ title: '', url: '' })} className="text-xs bg-white border border-slate-300 px-4 py-2 rounded-lg font-bold hover:bg-teal-50 hover:text-teal-600 transition-all shadow-sm">+ Документ</button>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {docFields.map((field, index) => (
              <div key={field.id} className="bg-white p-4 rounded-xl border border-slate-200 relative group flex gap-3 items-start">
                <div className="bg-slate-100 p-2 rounded-lg text-slate-400">
                   <FileText size={24} />
                </div>
                <div className="flex-1 space-y-2">
                  <FormInput name={`documents.${index}.title`} label="Название" placeholder="Памятка туристу" />
                  <FormInput name={`documents.${index}.url`} label="Ссылка (URL)" placeholder="https://..." className="text-xs font-mono" />
                </div>
                <button type="button" onClick={() => removeDoc(index)} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
              </div>
            ))}
         </div>
      </div>

    </div>
  );
};