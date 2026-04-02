import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { FormInput, FormTextarea } from '../ui/FormUI';
import { FileText, Plus, Trash2, Hash, HelpCircle, List, Sparkles, Smile } from 'lucide-react';
import dynamic from 'next/dynamic'; // 👈 ДОБАВИЛИ

// 👈 ДОБАВИЛИ: Ленивая загрузка тяжелого редактора
const TiptapEditor = dynamic(() => import('@/shared/ui/TiptapEditor'), { 
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-slate-100 animate-pulse rounded-xl" />
});

export const Content = () => {
  const { control, register, setValue, watch } = useFormContext();
  
  const { fields: faqFields, append: appendFaq, remove: removeFaq } = useFieldArray({ control, name: "faq" });
  const { fields: progFields, append: appendProg, remove: removeProg } = useFieldArray({ control, name: "program" });
  const { fields: highFields, append: appendHigh, remove: removeHigh } = useFieldArray({ control, name: "highlights" });

  // Теги
  const tags = watch("tags") || [];
  
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = e.currentTarget.value.trim();
      if (val && !tags.includes(val)) {
        setValue('tags', [...tags, val], { shouldDirty: true });
        e.currentTarget.value = '';
      }
    }
  };
  const removeTag = (tag: string) => setValue('tags', tags.filter((t: string) => t !== tag), { shouldDirty: true });

  return (
    <div className="space-y-10">
      
      {/* 1. ГЛАВНЫЕ ВПЕЧАТЛЕНИЯ (HIGHLIGHTS) */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
             <Sparkles className="text-amber-500" size={24} />
             <h3 className="text-lg font-black text-slate-800">Главные впечатления (Highlights)</h3>
          </div>
          <button type="button" onClick={() => appendHigh({ icon: '✨', title: '', desc: '' })} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg font-bold hover:bg-amber-100 transition-colors">+ Добавить</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {highFields.map((field, index) => (
            <div key={field.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group">
              <div className="flex gap-3 mb-3">
                 <div className="w-12">
                   <FormInput name={`highlights.${index}.icon`} label="Иконка" placeholder="🏔️" className="text-center text-xl" />
                 </div>
                 <div className="flex-1">
                   <FormInput name={`highlights.${index}.title`} label="Заголовок" placeholder="Горные виды" />
                 </div>
              </div>
              <FormTextarea name={`highlights.${index}.desc`} label="Описание" rows={2} placeholder="Кратко о впечатлении..." className="min-h-[60px]" />
              
              <button type="button" onClick={() => removeHigh(index)} className="absolute top-2 right-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
            </div>
          ))}
          {highFields.length === 0 && <div className="col-span-full text-center py-6 border-2 border-dashed border-slate-200 rounded-xl text-slate-300 text-sm">Нет впечатлений</div>}
        </div>
      </div>

      {/* 2. ОПИСАНИЕ */}
      <div>
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
          <FileText className="text-teal-500" size={24} />
          <h3 className="text-lg font-black text-slate-800">Полное описание</h3>
        </div>
        <div className="prose-editor border border-slate-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 transition-all">
           <TiptapEditor 
             content={watch('description') || ''} 
             onChange={(html: string) => setValue('description', html, { shouldDirty: true })} 
           />
        </div>
      </div>

      {/* 3. ТЕГИ */}
      <div>
        <label className="text-xs font-bold uppercase text-slate-600 mb-2 flex items-center gap-2">
          <Hash size={16}/> Теги (Поиск и фильтры)
        </label>
        <div className="p-3 bg-white border border-slate-300 rounded-xl focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-100 transition-all">
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag: string) => (
              <span key={tag} className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-bold flex items-center gap-1">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="hover:text-rose-600"><Trash2 size={12}/></button>
              </span>
            ))}
          </div>
          <input 
            type="text" 
            placeholder="Введите тег и нажмите Enter..." 
            className="w-full outline-none text-sm font-medium text-slate-700 placeholder:text-slate-300"
            onKeyDown={handleAddTag}
          />
        </div>
      </div>

      {/* 4. ПРОГРАММА */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
        <div className="flex justify-between items-center mb-6">
           <h4 className="text-lg font-black text-slate-800 flex items-center gap-2"><List size={20} className="text-teal-600"/> Программа тура</h4>
           <button type="button" onClick={() => appendProg({ title: '', description: '' })} className="text-xs bg-white border border-slate-300 px-4 py-2 rounded-lg font-bold hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 transition-all shadow-sm">+ Добавить день</button>
        </div>
        
        <div className="space-y-6 relative pl-4 border-l-2 border-slate-200 ml-4">
          {progFields.map((field, index) => (
            <div key={field.id} className="relative pl-6">
              {/* Кружок с номером дня */}
              <div className="absolute -left-[33px] top-0 w-8 h-8 rounded-full bg-white border-2 border-teal-500 flex items-center justify-center font-black text-teal-700 text-xs shadow-sm z-10">
                {index + 1}
              </div>
              
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm group">
                <div className="flex justify-between items-start mb-3">
                   <div className="w-full mr-4">
                      <FormInput name={`program.${index}.title`} label={`Заголовок Дня ${index + 1}`} placeholder="Прибытие и заселение" />
                   </div>
                   <button type="button" onClick={() => removeProg(index)} className="text-slate-300 hover:text-rose-500 mt-2"><Trash2 size={18}/></button>
                </div>
                <FormTextarea name={`program.${index}.description`} label="Детали дня" rows={3} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. FAQ */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
        <div className="flex justify-between items-center mb-4">
           <h4 className="text-lg font-black text-slate-800 flex items-center gap-2"><HelpCircle size={20} className="text-indigo-500"/> FAQ</h4>
           <button type="button" onClick={() => appendFaq({ question: '', answer: '' })} className="text-xs bg-white border border-slate-300 px-4 py-2 rounded-lg font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm">+ Вопрос</button>
        </div>
        <div className="grid gap-4">
          {faqFields.map((field, index) => (
            <div key={field.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group">
              <div className="grid gap-3">
                 <FormInput name={`faq.${index}.question`} label="Вопрос" placeholder="Например: Нужна ли виза?" />
                 <FormTextarea name={`faq.${index}.answer`} label="Ответ" rows={2} />
              </div>
              <button type="button" onClick={() => removeFaq(index)} className="absolute top-2 right-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};