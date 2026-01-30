import React, { useState, useEffect } from 'react';
import { UploadCloud, Loader, Image as ImageIcon } from 'lucide-react';
import Button from './ui/Button';

const EventFormModal = ({ onClose, onSubmit, onUpload, initialData = null }) => {
    // Начальное состояние
    const defaultState = { 
        title: '', date: '', time: '08:00', location: '', guide: '',
        price_adult: '', price_old: '', spots: 20, 
        image_url: '', type: 'hiking_1',
        subtitle: '', label: '', // Новые поля
        duration: '', difficulty: 'средняя', description: '', route: '', included: ''
    };

    const [form, setForm] = useState(defaultState);
    const [uploading, setUploading] = useState(false);
    const isEditMode = !!initialData;

    useEffect(() => {
        if (initialData) {
            setForm({
                ...initialData,
                included: initialData.included && Array.isArray(initialData.included) ? initialData.included.join(', ') : '',
                price_adult: initialData.price?.adult || initialData.price_adult || '',
                price_old: initialData.priceOld || initialData.price_old || '',
                subtitle: initialData.subtitle || '',
                label: initialData.label || ''
            });
        }
    }, [initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const dataToSend = { ...form };
        const includedArray = typeof form.included === 'string' 
            ? form.included.split(',').map(s => s.trim()).filter(Boolean)
            : form.included;
        
        dataToSend.included = includedArray;

        // Чистим UI поля
        delete dataToSend.price; 
        delete dataToSend.priceOld; // UI camelCase -> DB snake_case
        delete dataToSend.spotsLeft;
        delete dataToSend.image; 
        delete dataToSend.id; 

        // Логика мест
        if (!isEditMode) dataToSend.spots_left = form.spots;
        else delete dataToSend.spots_left;

        await onSubmit(dataToSend);
        onClose();
    };

    const handleFile = async (e) => {
        const file = e.target.files[0];
        if(!file) return;
        setUploading(true);
        const { url, error } = await onUpload(file);
        if (error) alert(error.message);
        else setForm(prev => ({...prev, image_url: url}));
        setUploading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
                <h2 className="text-xl font-bold mb-4 text-gray-800">{isEditMode ? '✏️ Редактировать' : '➕ Новый тур'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Основное */}
                    <div className="grid grid-cols-2 gap-3">
                         <input className="col-span-2 w-full p-3 border rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-bold" placeholder="НАЗВАНИЕ ТУРА (Заголовок)" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} required/>
                         <input className="col-span-2 w-full p-3 border rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm" placeholder="Короткое описание для карточки (Подзаголовок)" value={form.subtitle} onChange={e=>setForm({...form, subtitle: e.target.value})} />
                    </div>

                    {/* Маркетинг */}
                    <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border border-dashed border-gray-200">
                        <select className="w-full p-2 border rounded-lg bg-white text-sm" value={form.label} onChange={e=>setForm({...form, label: e.target.value})}>
                            <option value="">-- Без метки --</option>
                            <option value="эксклюзив">🔥 Эксклюзив</option>
                            <option value="новинка">✨ Новинка</option>
                            <option value="топ">🏆 Топ продаж</option>
                            <option value="для новичков">👶 Для новичков</option>
                        </select>
                        <select className="w-full p-2 border rounded-lg bg-white text-sm" value={form.type} onChange={e=>setForm({...form, type: e.target.value})}>
                            <option value="hiking_1">🎒 1 день</option>
                            <option value="water">🛶 На воде</option>
                            <option value="weekend">🏕️ Выходные</option>
                            <option value="kids">👶 Детский</option>
                            <option value="expedition">🏔️ Экспедиция</option>
                        </select>
                    </div>

                    {/* Локация и Дата */}
                    <div className="grid grid-cols-2 gap-3">
                        <input className="w-full p-3 border rounded-xl" placeholder="Локация" value={form.location} onChange={e=>setForm({...form, location: e.target.value})} required/>
                        <div className="flex gap-2">
                             <input type="date" className="w-full p-3 border rounded-xl" value={form.date} onChange={e=>setForm({...form, date: e.target.value})} required/>
                             <input type="time" className="w-24 p-3 border rounded-xl" value={form.time} onChange={e=>setForm({...form, time: e.target.value})}/>
                        </div>
                    </div>

                    {/* Цены */}
                    <div className="grid grid-cols-3 gap-3">
                         <input type="number" className="w-full p-3 border rounded-xl font-bold text-teal-700" placeholder="Цена (RUB)" value={form.price_adult} onChange={e=>setForm({...form, price_adult: e.target.value})} required/>
                         <input type="number" className="w-full p-3 border rounded-xl text-red-400 decoration-dashed" placeholder="Старая цена" value={form.price_old} onChange={e=>setForm({...form, price_old: e.target.value})} />
                         <input type="number" className="w-full p-3 border rounded-xl" placeholder="Мест" value={form.spots} onChange={e=>setForm({...form, spots: e.target.value})} required/>
                    </div>

                    {/* Детали */}
                    <input className="w-full p-3 border rounded-xl" placeholder="Гид" value={form.guide || ''} onChange={e=>setForm({...form, guide: e.target.value})} />
                    <textarea className="w-full p-3 border rounded-xl h-20 text-sm" placeholder="Полное описание для модалки..." value={form.description || ''} onChange={e=>setForm({...form, description: e.target.value})} />
                    <input className="w-full p-3 border rounded-xl" placeholder="Включено (через запятую)" value={form.included} onChange={e=>setForm({...form, included: e.target.value})} />
                    <input className="w-full p-3 border rounded-xl" placeholder="Маршрут" value={form.route || ''} onChange={e=>setForm({...form, route: e.target.value})} />
                    
                    {/* Фото */}
                    <div className={`border-2 border-dashed rounded-xl p-4 text-center transition relative group overflow-hidden ${form.image_url ? 'border-teal-500 bg-teal-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                        {uploading ? <Loader className="animate-spin mx-auto text-teal-600"/> : (
                            <>
                                <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" onChange={handleFile}/>
                                {form.image_url ? <img src={form.image_url} alt="Preview" className="h-32 w-full object-cover rounded-lg"/> : <div className="text-gray-400"><ImageIcon size={24} className="mx-auto mb-1"/><span className="text-xs">Фото тура</span></div>}
                            </>
                        )}
                    </div>
                    
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Отмена</Button>
                        <Button isLoading={uploading} variant="primary" className="flex-1">Сохранить</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventFormModal;
