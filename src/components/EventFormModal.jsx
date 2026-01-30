import React, { useState, useEffect, useRef } from 'react';
import { Loader, Image as ImageIcon, Bold, Smile } from 'lucide-react';
import Button from './ui/Button';

const Input = ({ label, ...props }) => (
    <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1 tracking-wider">{label}</label>
        <input className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition text-sm font-medium" {...props} />
    </div>
);

// ✅ НОВЫЙ КОМПОНЕНТ: Текстовое поле с кнопками
const RichTextarea = ({ label, value, onChange, placeholder, height = "h-32" }) => {
    const textareaRef = useRef(null);

    // Функция вставки жирного текста
    const addBold = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end);
        
        // Оборачиваем выделенное в **...**
        const newText = value.substring(0, start) + `**${selectedText || 'жирный текст'}**` + value.substring(end);
        
        // Обновляем текст
        // Эмулируем событие change, чтобы React понял обновление
        const event = { target: { value: newText } };
        onChange(event);

        // Возвращаем фокус
        setTimeout(() => textarea.focus(), 0);
    };

    // Функция вставки смайлика
    const addEmoji = (emoji) => {
        const newText = value + emoji;
        const event = { target: { value: newText } };
        onChange(event);
    };

    return (
        <div>
            <div className="flex justify-between items-end mb-1 ml-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</label>
                
                {/* ПАНЕЛЬ ИНСТРУМЕНТОВ */}
                <div className="flex gap-2">
                    <button type="button" onClick={addBold} className="p-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold flex items-center gap-1 px-2" title="Жирный">
                        <Bold size={12}/> Жирный
                    </button>
                    <div className="flex gap-1">
                        {['🔥', '✨', '🛶', '🎒', '🏕️'].map(emo => (
                            <button key={emo} type="button" onClick={() => addEmoji(emo)} className="p-1 hover:bg-gray-100 rounded text-sm transition">
                                {emo}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <textarea 
                ref={textareaRef}
                className={`w-full p-3 border border-gray-200 rounded-xl ${height} text-sm focus:ring-2 focus:ring-teal-500 outline-none transition`} 
                value={value} 
                onChange={onChange}
                placeholder={placeholder}
            />
        </div>
    );
};

const EventFormModal = ({ onClose, onSubmit, onUpload, initialData = null }) => {
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
                faqText = initialData.faq.map(item => `В: ${item.q}\nО: ${item.a}`).join('\n\n');
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
        
        data.included = form.included.split('\n').map(s=>s.trim()).filter(Boolean);
        data.additional_expenses = form.additional_expenses.split('\n').map(s=>s.trim()).filter(Boolean);
        
        const faqArray = [];
        const blocks = form.faq.split(/\n\n+/); 
        blocks.forEach(block => {
            const lines = block.split('\n');
            if(lines.length >= 2) {
                const q = lines[0].replace(/^(В:|Q:|\?)\s*/i, '').trim();
                const a = lines.slice(1).join(' ').replace(/^(О:|A:|!)\s*/i, '').trim();
                if(q && a) faqArray.push({ q, a });
            }
        });
        data.faq = faqArray;

        if (data.end_date === '') data.end_date = null;
        if (data.end_time === '') data.end_time = null;
        if (data.meeting_point === '') data.meeting_point = null;
        if (data.route === '') data.route = null;
        if (!data.price_child) data.price_child = 0;
        if (!data.price_family) data.price_family = 0;

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
                        <Input label="Краткое описание (Подзаголовок)" placeholder="2-3 строки..." value={form.subtitle} onChange={e=>setForm({...form, subtitle: e.target.value})} />
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1 tracking-wider">Тип</label>
                                <select className="w-full p-2.5 border border-gray-200 rounded-lg bg-white text-sm" value={form.type} onChange={e=>setForm({...form, type: e.target.value})}>
                                    <option value="hiking_1">🎒 Поход 1 день</option>
                                    <option value="water">🛶 Сплав</option>
                                    <option value="weekend">🏕️ Выходные</option>
                                    <option value="kids">👶 Детский</option>
                                    <option value="expedition">🏔️ Экспедиция</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1 tracking-wider">Метка</label>
                                <select className="w-full p-2.5 border border-gray-200 rounded-lg bg-white text-sm" value={form.label} onChange={e=>setForm({...form, label: e.target.value})}>
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
                        <div className="grid grid-cols-2 gap-3">
                             <Input label="Дата старта" type="date" value={form.date} onChange={e=>setForm({...form, date: e.target.value})} required/>
                             <Input label="Время сбора" type="time" value={form.time} onChange={e=>setForm({...form, time: e.target.value})}/>
                        </div>
                        <div className="grid grid-cols-2 gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100">
                             <Input label="Дата окончания" type="date" value={form.end_date || ''} onChange={e=>setForm({...form, end_date: e.target.value})}/>
                             <Input label="Время окончания" type="time" value={form.end_time || ''} onChange={e=>setForm({...form, end_time: e.target.value})}/>
                        </div>
                        <div className="grid grid-cols-2 gap-3 bg-blue-50 p-3 rounded-xl border border-blue-100">
                            <Input label="Локация (Куда?)" placeholder="Старый Орхей" value={form.location} onChange={e=>setForm({...form, location: e.target.value})} required/>
                            <Input label="Место сбора (Где?)" placeholder="Цирк" value={form.meeting_point} onChange={e=>setForm({...form, meeting_point: e.target.value})}/>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                             <Input label="Длительность" placeholder="4 часа" value={form.duration} onChange={e=>setForm({...form, duration: e.target.value})}/>
                             <Input label="Дистанция" placeholder="15 км" value={form.distance} onChange={e=>setForm({...form, distance: e.target.value})}/>
                        </div>
                        <Input label="Маршрут (кратко)" placeholder="Тирасполь -> Бендеры" value={form.route} onChange={e=>setForm({...form, route: e.target.value})}/>
                    </div>

                    {/* 3. ДЕНЬГИ */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                        <h3 className="text-sm font-bold text-teal-700 uppercase">Стоимость</h3>
                        <div className="grid grid-cols-2 gap-3">
                             <Input label="Взрослый" type="number" value={form.price_adult} onChange={e=>setForm({...form, price_adult: e.target.value})} required/>
                             <Input label="Старая цена" type="number" value={form.price_old} onChange={e=>setForm({...form, price_old: e.target.value})}/>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                             <Input label="Детский" type="number" value={form.price_child} onChange={e=>setForm({...form, price_child: e.target.value})}/>
                             <Input label="Семейный" type="number" value={form.price_family} onChange={e=>setForm({...form, price_family: e.target.value})}/>
                        </div>
                        <Input label="Всего мест" type="number" value={form.spots} onChange={e=>setForm({...form, spots: e.target.value})} required/>
                    </div>

                    {/* 4. КОНТЕНТ С КНОПКАМИ */}
                    <div className="space-y-4">
                        <Input label="Включено (Enter - новая строка)" value={form.included} onChange={e=>setForm({...form, included: e.target.value})} />
                        <Input label="Доп. расходы (Enter - новая строка)" value={form.additional_expenses} onChange={e=>setForm({...form, additional_expenses: e.target.value})} />
                        
                        {/* ✅ УЛУЧШЕННОЕ ПОЛЕ ОПИСАНИЯ */}
                        <RichTextarea 
                            label="Описание" 
                            value={form.description} 
                            onChange={e=>setForm({...form, description: e.target.value})} 
                            placeholder="Выделите текст и нажмите 'Жирный'..."
                        />
                        
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1 tracking-wider">Программа</label>
                            <textarea className="w-full p-3 border border-gray-200 rounded-xl h-32 text-sm" value={form.program} onChange={e=>setForm({...form, program: e.target.value})} />
                        </div>
                        
                        <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                            <label className="block text-[10px] font-bold text-amber-700 uppercase mb-1 ml-1 tracking-wider">FAQ</label>
                            <textarea className="w-full p-3 border border-amber-200 rounded-xl h-32 text-sm font-mono bg-white" 
                                placeholder="В: Нужна виза?&#10;О: Нет.&#10;&#10;В: Что брать?&#10;О: Рюкзак." 
                                value={form.faq} onChange={e=>setForm({...form, faq: e.target.value})} 
                            />
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
