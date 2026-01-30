import React, { useState, useEffect } from 'react';
import { Loader, Image as ImageIcon } from 'lucide-react';
import Button from './ui/Button';

// Поле ввода (вынесено наружу, чтобы не терялся фокус)
const Input = ({ label, ...props }) => (
    <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">{label}</label>
        <input className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition text-sm font-medium" {...props} />
    </div>
);

const EventFormModal = ({ onClose, onSubmit, onUpload, initialData = null }) => {
    // Полный стейт со всеми полями
    const defaultState = { 
        title: '', subtitle: '', 
        type: 'hiking_1', label: '',
        date: '', time: '08:00', end_date: '', end_time: '',
        duration: '', 
        location: '', meeting_point: '',
        guide: '', difficulty: 'средняя', distance: '',
        price_adult: '', price_child: '', price_family: '', price_old: '', 
        spots: 20, 
        image_url: '', 
        description: '', route: '', 
        included: '', additional_expenses: '', program: '', faq: ''
    };

    const [form, setForm] = useState(defaultState);
    const [uploading, setUploading] = useState(false);
    const isEditMode = !!initialData;

    useEffect(() => {
        if (initialData) {
            let faqText = '';
            if (initialData.faq && Array.isArray(initialData.faq)) {
                faqText = initialData.faq.map(item => `В: ${item.q}\nO: ${item.a}`).join('\n\n');
            }
            setForm({
                ...defaultState,
                ...initialData,
                included: initialData.included?.join('\n') || '',
                additional_expenses: initialData.additionalExpenses?.join('\n') || '',
                faq: faqText,
                price_adult: initialData.price?.adult || '',
                price_child: initialData.price?.child || '',
                price_family: initialData.price?.family || '',
                price_old: initialData.priceOld || '',
            });
        }
    }, [initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = { ...form };
        
        // 1. Превращаем списки в массивы
        data.included = form.included.split('\n').map(s=>s.trim()).filter(Boolean);
        data.additional_expenses = form.additional_expenses.split('\n').map(s=>s.trim()).filter(Boolean);
        
        // 2. Обрабатываем FAQ
        const faqArray = [];
        const blocks = form.faq.split('\n\n');
        blocks.forEach(block => {
            const lines = block.split('\n');
            if(lines.length >= 2) {
                const q = lines[0].replace(/^(В:|Q:|\?)\s*/i, '').trim();
                const a = lines.slice(1).join(' ').replace(/^(О:|A:|!)\s*/i, '').trim();
                if(q && a) faqArray.push({ q, a });
            }
        });
        data.faq = faqArray;

        // 🔥 ВАЖНО: Очистка пустых полей дат (чтобы не было ошибки SQL)
        if (data.end_date === '') data.end_date = null;
        if (data.end_time === '') data.end_time = null;
        if (data.meeting_point === '') data.meeting_point = null;
        if (data.route === '') data.route = null;
        if (data.price_child === '') data.price_child = 0;
        if (data.price_family === '') data.price_family = 0;

        // Чистим мусор
        delete data.price; delete data.priceOld; delete data.spotsLeft; delete data.image; delete data.id; delete data.additionalExpenses;
        
        if (!isEditMode) data.spots_left = form.spots;
        else delete data.spots_left;

        await onSubmit(data);
        onClose();
    };

    const handleFile = async (e) => {
        const file = e.target.files[0];
        if(!file) return;
        setUploading(true);
        const { url } = await onUpload(file);
        if (url) setForm(p => ({...p, image_url: url}));
        setUploading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto shadow-2xl custom-scrollbar">
                <div className="flex justify-between items-center mb-6 border-b pb-2">
                    <h2 className="text-xl font-bold font-condensed uppercase text-gray-800">
                        {isEditMode ? 'Редактирование' : 'Новый тур'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-2xl">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 1. ГЛАВНОЕ */}
                    <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <Input label="Название (Заголовок)" placeholder="Сплав на байдарках" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} required/>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Тип</label>
                                <select className="w-full p-3 border border-gray-200 rounded-xl bg-white" value={form.type} onChange={e=>setForm({...form, type: e.target.value})}>
                                    <option value="hiking_1">🎒 Поход 1 день</option>
                                    <option value="water">🛶 Сплав</option>
                                    <option value="weekend">🏕️ Выходные</option>
                                    <option value="kids">👶 Детский</option>
                                    <option value="expedition">🏔️ Экспедиция</option>
                                </select>
                            </div>
                            {/* ✅ ВЕРНУЛИ ВЫПАДАЮЩИЙ СПИСОК МЕТОК */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Метка (на фото)</label>
                                <select className="w-full p-3 border border-gray-200 rounded-xl bg-white" value={form.label} onChange={e=>setForm({...form, label: e.target.value})}>
                                    <option value="">(Нет)</option>
                                    <option value="эксклюзив">🔥 Эксклюзив</option>
                                    <option value="новинка">✨ Новинка</option>
                                    <option value="топ">🏆 Топ продаж</option>
                                    <option value="хит">💥 Хит</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 2. ЛОГИСТИКА */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-teal-700 uppercase">Логистика</h3>
                        
                        {/* Старт */}
                        <div className="grid grid-cols-2 gap-3">
                             <Input label="Дата старта" type="date" value={form.date} onChange={e=>setForm({...form, date: e.target.value})} required/>
                             <Input label="Время сбора" type="time" value={form.time} onChange={e=>setForm({...form, time: e.target.value})}/>
                        </div>

                        {/* ✅ ВЕРНУЛИ ДАТУ ОКОНЧАНИЯ */}
                        <div className="grid grid-cols-2 gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100">
                             <Input label="Дата окончания (необязательно)" type="date" value={form.end_date || ''} onChange={e=>setForm({...form, end_date: e.target.value})}/>
                             <Input label="Время окончания (необязательно)" type="time" value={form.end_time || ''} onChange={e=>setForm({...form, end_time: e.target.value})}/>
                        </div>
                        
                        {/* Локации */}
                        <div className="grid grid-cols-2 gap-3 bg-blue-50 p-3 rounded-xl border border-blue-100">
                            <Input label="Локация (Куда едем?)" placeholder="напр. Старый Орхей" value={form.location} onChange={e=>setForm({...form, location: e.target.value})} required/>
                            <Input label="Место сбора (Где встреча?)" placeholder="напр. Цирк" value={form.meeting_point} onChange={e=>setForm({...form, meeting_point: e.target.value})}/>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                             <Input label="Длительность" placeholder="4 часа" value={form.duration} onChange={e=>setForm({...form, duration: e.target.value})}/>
                             <Input label="Дистанция" placeholder="15 км" value={form.distance} onChange={e=>setForm({...form, distance: e.target.value})}/>
                        </div>

                        <Input label="Маршрут (кратко)" placeholder="Тирасполь -> Бендеры -> Тирасполь" value={form.route} onChange={e=>setForm({...form, route: e.target.value})}/>
                    </div>

                    {/* 3. ДЕНЬГИ */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                        <h3 className="text-sm font-bold text-teal-700 uppercase">Стоимость</h3>
                        <div className="grid grid-cols-2 gap-3">
                             <Input label="Цена Взрослый" type="number" value={form.price_adult} onChange={e=>setForm({...form, price_adult: e.target.value})} required/>
                             <Input label="Старая цена (зачеркнута)" type="number" value={form.price_old} onChange={e=>setForm({...form, price_old: e.target.value})}/>
                        </div>
                        {/* ✅ ВЕРНУЛИ ЦЕНЫ ДЛЯ ДЕТЕЙ И СЕМЬИ */}
                        <div className="grid grid-cols-2 gap-3">
                             <Input label="Цена Детский" type="number" value={form.price_child} onChange={e=>setForm({...form, price_child: e.target.value})}/>
                             <Input label="Цена Семейный" type="number" value={form.price_family} onChange={e=>setForm({...form, price_family: e.target.value})}/>
                        </div>
                        <Input label="Всего мест" type="number" value={form.spots} onChange={e=>setForm({...form, spots: e.target.value})} required/>
                    </div>

                    {/* 4. КОНТЕНТ */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Включено (Enter - новая строка)</label>
                            <textarea className="w-full p-3 border border-gray-200 rounded-xl h-24 text-sm" value={form.included} onChange={e=>setForm({...form, included: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Доп. расходы</label>
                            <textarea className="w-full p-3 border border-gray-200 rounded-xl h-20 text-sm" value={form.additional_expenses} onChange={e=>setForm({...form, additional_expenses: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Описание</label>
                            <textarea className="w-full p-3 border border-gray-200 rounded-xl h-32 text-sm" value={form.description} onChange={e=>setForm({...form, description: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Программа (Каждый пункт с новой строки)</label>
                            <textarea className="w-full p-3 border border-gray-200 rounded-xl h-32 text-sm" value={form.program} onChange={e=>setForm({...form, program: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">FAQ (Вопрос - Enter - Ответ)</label>
                            <textarea className="w-full p-3 border border-gray-200 rounded-xl h-32 text-sm font-mono" placeholder="В: Вопрос...&#10;О: Ответ...&#10;&#10;В: Вопрос 2..." value={form.faq} onChange={e=>setForm({...form, faq: e.target.value})} />
                        </div>
                    </div>

                    {/* 5. ФОТО */}
                    <div className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:bg-gray-50 relative">
                        {uploading ? <Loader className="animate-spin mx-auto"/> : (
                            <>
                                <input type="file" className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" onChange={handleFile}/>
                                {form.image_url ? (
                                    <img src={form.image_url} className="h-40 w-full object-cover rounded-lg" alt="Preview"/>
                                ) : (
                                    <div className="text-gray-400"><ImageIcon size={32} className="mx-auto mb-2"/><span className="text-xs font-bold">Загрузить фото</span></div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-white pb-2">
                        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Отмена</Button>
                        <Button isLoading={uploading} variant="primary" className="flex-1">Сохранить</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventFormModal;
