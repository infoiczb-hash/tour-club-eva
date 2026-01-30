import React, { useState, useEffect } from 'react';
import { UploadCloud, Loader, Image as ImageIcon } from 'lucide-react';
import Button from './ui/Button';

const EventFormModal = ({ onClose, onSubmit, onUpload, initialData = null }) => {
    // Дефолтное состояние
    const defaultState = { 
        title: '', subtitle: '', 
        type: 'hiking_1', label: '',
        date: '', time: '08:00', duration: '', 
        location: '', guide: '', difficulty: 'средняя', distance: '',
        price_adult: '', price_child: '', price_family: '', price_old: '', 
        spots: 20, 
        image_url: '', 
        description: '', route: '', included: '', additional_expenses: '', program: '', faq: ''
    };

    const [form, setForm] = useState(defaultState);
    const [uploading, setUploading] = useState(false);
    const isEditMode = !!initialData;

    useEffect(() => {
        if (initialData) {
            setForm({
                ...defaultState,
                ...initialData,
                // Массивы в строки
                included: initialData.included?.join(', ') || '',
                additional_expenses: initialData.additionalExpenses?.join(', ') || '',
                // Цены
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
        
        // Преобразование строк в массивы
        data.included = form.included.split(',').map(s=>s.trim()).filter(Boolean);
        data.additional_expenses = form.additional_expenses.split(',').map(s=>s.trim()).filter(Boolean);
        
        // Удаляем UI мусор
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

    const Input = ({ label, ...props }) => (
        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">{label}</label>
            <input className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition text-sm" {...props} />
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto shadow-2xl custom-scrollbar">
                <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">
                    {isEditMode ? '✏️ Редактирование тура' : '➕ Создание тура'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* 1. ГЛАВНОЕ */}
                    <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
                        <h3 className="text-sm font-bold text-teal-700">1. Основная информация</h3>
                        <Input label="Название тура (Заголовок)" placeholder="ЭКСКУРСИЯ В СТАМБУЛ" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} required/>
                        <Input label="Краткое описание (Подзаголовок)" placeholder="2-3 строки для карточки..." value={form.subtitle} onChange={e=>setForm({...form, subtitle: e.target.value})} />
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Тип тура</label>
                                <select className="w-full p-3 border border-gray-200 rounded-xl bg-white" value={form.type} onChange={e=>setForm({...form, type: e.target.value})}>
                                    <option value="hiking_1">🎒 1 день</option>
                                    <option value="water">🛶 На воде</option>
                                    <option value="weekend">🏕️ Выходные</option>
                                    <option value="expedition">🏔️ Экспедиция</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Маркетинг метка</label>
                                <select className="w-full p-3 border border-gray-200 rounded-xl bg-white" value={form.label} onChange={e=>setForm({...form, label: e.target.value})}>
                                    <option value="">(Нет)</option>
                                    <option value="эксклюзив">🔥 Эксклюзив</option>
                                    <option value="новинка">✨ Новинка</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 2. ЛОГИСТИКА */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-teal-700">2. Где и Когда</h3>
                        <div className="grid grid-cols-2 gap-3">
                             <Input label="Дата старта" type="date" value={form.date} onChange={e=>setForm({...form, date: e.target.value})} required/>
                             <Input label="Время сбора" type="time" value={form.time} onChange={e=>setForm({...form, time: e.target.value})}/>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                             <Input label="Длительность" placeholder="напр. 2 дня / 1 ночь" value={form.duration} onChange={e=>setForm({...form, duration: e.target.value})}/>
                             <Input label="Дистанция" placeholder="напр. 15 км" value={form.distance} onChange={e=>setForm({...form, distance: e.target.value})}/>
                        </div>
                        <Input label="Место сбора (Локация)" value={form.location} onChange={e=>setForm({...form, location: e.target.value})} required/>
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Гид" value={form.guide} onChange={e=>setForm({...form, guide: e.target.value})}/>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Сложность</label>
                                <select className="w-full p-3 border border-gray-200 rounded-xl bg-white" value={form.difficulty} onChange={e=>setForm({...form, difficulty: e.target.value})}>
                                    <option value="легкая">🟢 Легкая</option>
                                    <option value="средняя">🟡 Средняя</option>
                                    <option value="сложная">🔴 Сложная</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 3. ДЕНЬГИ */}
                    <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
                        <h3 className="text-sm font-bold text-teal-700">3. Стоимость и Места</h3>
                        <div className="grid grid-cols-2 gap-3">
                             <Input label="Цена Взрослый (Обычный)" type="number" value={form.price_adult} onChange={e=>setForm({...form, price_adult: e.target.value})} required/>
                             <Input label="Старая цена (зачеркнута)" type="number" value={form.price_old} onChange={e=>setForm({...form, price_old: e.target.value})}/>
                             <Input label="Цена Детский" type="number" value={form.price_child} onChange={e=>setForm({...form, price_child: e.target.value})}/>
                             <Input label="Цена Семейный" type="number" value={form.price_family} onChange={e=>setForm({...form, price_family: e.target.value})}/>
                        </div>
                        <Input label="Всего мест" type="number" value={form.spots} onChange={e=>setForm({...form, spots: e.target.value})} required/>
                    </div>

                    {/* 4. КОНТЕНТ */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-teal-700">4. Подробности</h3>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Полное описание</label>
                            <textarea className="w-full p-3 border border-gray-200 rounded-xl h-24 text-sm" value={form.description} onChange={e=>setForm({...form, description: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Программа тура (Каждый день с новой строки)</label>
                            <textarea className="w-full p-3 border border-gray-200 rounded-xl h-32 text-sm font-mono" placeholder="День 1: Встреча...&#10;День 2: Поход..." value={form.program} onChange={e=>setForm({...form, program: e.target.value})} />
                        </div>
                        <Input label="Включено (через запятую)" placeholder="Трансфер, Обед, Гид..." value={form.included} onChange={e=>setForm({...form, included: e.target.value})} />
                        <Input label="Доп. расходы (через запятую)" placeholder="Сувениры, Ужин..." value={form.additional_expenses} onChange={e=>setForm({...form, additional_expenses: e.target.value})} />
                    </div>

                    {/* 5. ФОТО */}
                    <div className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer ${form.image_url ? 'border-teal-500 bg-teal-50' : 'hover:bg-gray-50'}`}>
                        {uploading ? <Loader className="animate-spin mx-auto"/> : (
                            <div className="relative">
                                <input type="file" className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" onChange={handleFile}/>
                                {form.image_url ? (
                                    <img src={form.image_url} className="h-40 w-full object-cover rounded-lg shadow-sm" alt="Cover"/>
                                ) : (
                                    <div className="text-gray-400 flex flex-col items-center">
                                        <ImageIcon size={32} className="mb-2"/>
                                        <span className="text-sm font-bold">Нажмите для загрузки обложки</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Отмена</Button>
                        <Button isLoading={uploading} variant="primary" className="flex-1">Сохранить Тур</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventFormModal;
