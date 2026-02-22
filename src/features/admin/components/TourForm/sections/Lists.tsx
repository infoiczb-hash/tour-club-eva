import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { FormInput, FormTextarea } from '../ui/FormUI';
import { CheckCircle2, XCircle, FileText, Plus, Trash2, Backpack } from 'lucide-react';

export const Lists = () => {
  const { control } = useFormContext();

  const { fields: incFields, append: appendInc, remove: removeInc } = useFieldArray({ control, name: "included" });
  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({ control, name: "additionalExpenses" });
  const { fields: docFields, append: appendDoc, remove: removeDoc } = useFieldArray({ control, name: "documents" });
  
  // НОВЫЙ БЛОК: ЧЕК-ЛИСТ
  const { fields: checkFields, append: appendCheck, remove: removeCheck } = useFieldArray({ control, name: "checklist" });

  return (
    <div className="space-y-8">
      
      {/* 1. ФИНАНСОВЫЕ СПИСКИ (2 колонки) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Включено */}
        <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
          <div className="flex justify-between items-center mb-4">
             <h4 className="font-black text-emerald-800 flex gap-2"><CheckCircle2 size={20}/> Включено</h4>
             <button type="button" onClick={() => appendInc("")} className="text-xs font-bold text-emerald-700 bg-white border border-emerald-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-emerald-100">+ Пункт</button>
          </div>
          <div className="space-y-2">
            {incFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                 <div className="flex-1">
                   <FormInput name={`included.${index}`} label="" placeholder="Трансфер, Гид..." className="bg-white border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20" />
                 </div>
                 <button type="button" onClick={() => removeInc(index)} className="text-emerald-300 hover:text-rose-500 pt-2"><Trash2 size={18}/></button>
              </div>
            ))}
            {incFields.length === 0 && <p className="text-xs text-emerald-600/50 italic text-center py-2">Список пуст</p>}
          </div>
        </div>

        {/* Не включено */}
        <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100">
          <div className="flex justify-between items-center mb-4">
             <h4 className="font-black text-rose-800 flex gap-2"><XCircle size={20}/> Не включено</h4>
             <button type="button" onClick={() => appendExp("")} className="text-xs font-bold text-rose-700 bg-white border border-rose-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-rose-100">+ Пункт</button>
          </div>
          <div className="space-y-2">
            {expFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                 <div className="flex-1">
                   <FormInput name={`additionalExpenses.${index}`} label="" placeholder="Обед, Сувениры..." className="bg-white border-rose-200 focus:border-rose-500 focus:ring-rose-500/20" />
                 </div>
                 <button type="button" onClick={() => removeExp(index)} className="text-rose-300 hover:text-rose-500 pt-2"><Trash2 size={18}/></button>
              </div>
            ))}
             {expFields.length === 0 && <p className="text-xs text-rose-600/50 italic text-center py-2">Список пуст</p>}
          </div>
        </div>
      </div>

      {/* 2. ЧЕК-ЛИСТ (СНАРЯЖЕНИЕ) - НОВЫЙ БЛОК */}
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
                  placeholder="- Паспорт&#10;- Страховка&#10;- Билеты" 
                />
                <button type="button" onClick={() => removeCheck(index)} className="absolute top-2 right-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
              </div>
            ))}
            {checkFields.length === 0 && <div className="col-span-full text-center py-8 text-slate-400">Добавьте категории вещей</div>}
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
                <button type="button" onClick={() => removeDoc(index)} className="text-slate-300 hover:text-rose-500"><Trash2 size={16}/></button>
              </div>
            ))}
         </div>
      </div>

    </div>
  );
};