import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormInput, FormSelect } from '../ui/FormUI';
import { CreditCard, Users, Crown, Baby, QrCode, Link } from 'lucide-react';

export const Finance = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
        <CreditCard className="text-teal-500" size={20} />
        <h3 className="font-bold text-slate-700">Финансы и Места</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Основная цена */}
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

        {/* Дополнительные тарифы */}
        <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
           <h4 className="text-xs font-black uppercase text-slate-600 mb-2">Спец. тарифы</h4>
           <div className="space-y-3">
             <div className="flex gap-2 items-end">
                <Crown size={16} className="text-amber-500 mb-3" />
                <FormInput name="priceMember" label="Клубная цена" type="number" placeholder="900" />
             </div>
             <div className="flex gap-2 items-end">
                <Baby size={16} className="text-pink-400 mb-3" />
                <FormInput name="priceChild" label="Детский билет" type="number" placeholder="500" />
             </div>
             <div className="flex gap-2 items-end">
                <Users size={16} className="text-blue-500 mb-3" />
                <FormInput name="priceFamily" label="Семейный пакет" type="number" placeholder="2500" />
             </div>
           </div>
        </div>

        {/* Места */}
        <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <h4 className="text-xs font-black uppercase text-slate-600 mb-2">Управление местами</h4>
          <FormInput name="spots" label="Всего мест" type="number" />
          <FormInput name="spotsLeft" label="Осталось мест" type="number" />
          <p className="text-[12px] text-slate-600 leading-tight mt-2">
            * "Осталось мест" уменьшается автоматически при бронировании, но здесь можно поправить вручную.
          </p>
        </div>

      </div>

      {/* ✅ НОВЫЙ БЛОК: Реквизиты для оплаты */}
      <div className="mt-8 pt-6 border-t border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <QrCode className="text-indigo-500" size={20} />
          <h4 className="font-bold text-slate-700">Реквизиты для оплаты (Онлайн)</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-indigo-50/30 p-5 rounded-2xl border border-indigo-100/50">
          
          <div className="space-y-4">
            <h5 className="text-xs font-black uppercase text-indigo-400 flex items-center gap-1"><Link size={14}/> Bilet PMR</h5>
            <FormInput 
              name="biletpmrLink" 
              label="Ссылка на покупку билета" 
              type="text" 
              placeholder="https://biletpmr.com/..." 
              helperText="Оставьте пустым, если не продаете через этот сервис"
            />
          </div>

          <div className="space-y-4">
            <h5 className="text-xs font-black uppercase text-indigo-400 flex items-center gap-1"><Link size={14}/> Мобильный платеж APB</h5>
            <FormInput 
              name="apbQrLink" 
              label="Ссылка на оплату в приложении" 
              type="text" 
              placeholder="https://qrpay.apb.online/..." 
            />
          </div>

          <div className="space-y-4">
            <h5 className="text-xs font-black uppercase text-indigo-400 flex items-center gap-1"><QrCode size={14}/> QR-Код APB</h5>
            <FormInput 
              name="apbQrImage" 
              label="Ссылка на картинку с QR-кодом" 
              type="text" 
              placeholder="https://.../qr-code.png" 
              helperText="Эта картинка будет показана клиенту на экране успеха"
            />
          </div>

        </div>
      </div>

    </div>
  );
};