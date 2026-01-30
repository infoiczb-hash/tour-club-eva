import React, { useState, useEffect } from 'react';
import { UploadCloud, Loader, ImageIcon } from 'lucide-react';

const EventFormModal = ({ onClose, onSubmit, onUpload, initialData = null }) => {
    // Начальное состояние формы
    const defaultState = { 
        title: '', date: '', time: '08:00', location: '', guide: '',
        price_adult: '', spots: 20, 
        image_url: '', type: 'hiking_1',
        duration: '', difficulty: 'средняя', description: '', route: '', included: ''
    };

    const [form, setForm] = useState(defaultState);
    const [uploading, setUploading] = useState(false);
    const isEditMode = !!initialData;

    // Если открыли в режиме редактирования — заполняем форму
    useEffect(() => {
        if (initialData) {
            setForm({
                ...initialData,
                // Преобразуем массив included обратно в строку для input
                included: initialData.included ? initialData.included.join(', ') : '',
                // Восстанавливаем цену (в базе price_adult, в UI карточки price.adult)
                price_adult: initialData.price?.adult || initialData.price_adult || ''
            });
        }
    }, [initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Преобразуем included из строки в массив
        const includedArray = form.included 
            ? form.included.split(',').map(s => s.trim()).filter(Boolean)
            : [];
            
        const dataToSend = { 
            ...form, 
            included: includedArray,
            // Если создаем новый, spots_left = spots. Если редактируем, spots_left не трогаем (или можно добавить логику изменения)
            ...(!isEditMode && { spots_left: form.spots }) 
        };

        // Удаляем UI-специфичные поля перед отправкой, если они туда попали (напр. spotsLeft, price объект)
        delete dataToSend.price; 
        delete dataToSend.spotsLeft;

        await onSubmit(dataToSend);
        onClose();
    };

    const handleFile = async (e) => {
        const file = e.target.files[0];
        if(!file) return;
        setUploading(true);
        const { url, error } = await onUpload(file);
        if (error) alert('Ошибка загрузки: ' + error.message);
        else setForm(prev => ({...prev, image_url: url}));
        setUploading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
                <h2 className="text-xl font-bold mb-4">
                    {isEditMode ? '✏️ Редактировать тур' : '➕ Новый тур'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <input className="w-full p-2 border rounded" placeholder="Название" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} required/>
                    <div className="grid grid-cols-2 gap-2">
                        <select className="w-full p-2 border rounded bg-white" value={form.type} onChange={e=>setForm({...form, type: e.target.value})}>
                            <option value="hiking_1"> Поход на 1 день</option>
                            <option value="water">На воде</option>
                            <option value="kids">Подросткам</option>
                            <option value="weekend">Туры на выходные</option>
                            <option value="expedition">Экспедиция</option>
                        </select>
                        <input className="w-full p-2 border rounded" placeholder="Локация" value={form.location} onChange={e=>setForm({...form, location: e.target.value})} required/>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <input type="date" className="w-full p-2 border rounded" value={form.date} onChange={e=>setForm({...form, date: e.target.value})} required/>
                        <input type="time" className="w-full p-2 border rounded" value={form.time} onChange={e=>setForm({...form, time: e.target.value})}/>
                    </div>
                    <input className="w-full p-2 border rounded" placeholder="Имя гида" value={form.guide || ''} onChange={e=>setForm({...form, guide: e.target.value})} />
                    
                    <textarea className="w-full p-2 border rounded h-24 text-sm" placeholder="Описание тура..." value={form.description || ''} onChange={e=>setForm({...form, description: e.target.value})} />
                    <input className="w-full p-2 border rounded" placeholder="Маршрут" value={form.route || ''} onChange={e=>setForm({...form, route: e.target.value})} />
                    <input className="w-full p-2 border rounded" placeholder="Включено (через запятую)" value={form.included} onChange={e=>setForm({...form, included: e.target.value})} />

                    <div className="grid grid-cols-2 gap-2">
                         <input className="w-full p-2 border rounded" placeholder="Длительность" value={form.duration || ''} onChange={e=>setForm({...form, duration: e.target.value})} />
                         <select className="w-full p-2 border rounded bg-white" value={form.difficulty} onChange={e=>setForm({...form, difficulty: e.target.value})}>
                            <option value="легкая">Легкая</option>
                            <option value="средняя">Средняя</option>
                            <option value="сложная">Сложная</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                         <input type="number" className="w-full p-2 border rounded" placeholder="Цена" value={form.price_adult} onChange={e=>setForm({...form, price_adult: e.target.value})} required/>
                         <input type="number" className="w-full p-2 border rounded" placeholder="Всего мест" value={form.spots} onChange={e=>setForm({...form, spots: e.target.value})} required/>
                    </div>
                    
                    <div className={`border-2 border-dashed rounded-lg p-4 text-center transition relative group overflow-hidden ${form.image_url ? 'border-teal-500 bg-teal-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                        {uploading ? <Loader className="animate-spin mx-auto text-teal-600"/> : (
                            <>
                                <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" onChange={handleFile}/>
                                {form.image_url ? <img src={form.image_url} alt="Preview" className="h-32 w-full object-cover rounded"/> : <div className="text-gray-400"><ImageIcon size={24} className="mx-auto mb-2"/><span className="text-xs">Фото</span></div>}
                            </>
                        )}
                    </div>
                    
                    <button disabled={uploading} className="w-full bg-teal-600 text-white py-3 rounded font-bold disabled:opacity-50 hover:bg-teal-700 transition">
                        {uploading ? '...' : (isEditMode ? 'Сохранить изменения' : 'Создать тур')}
                    </button>
                    <button type="button" onClick={onClose} className="w-full text-gray-500 py-2 hover:bg-gray-100 rounded transition">Отмена</button>
                </form>
            </div>
        </div>
    );
};

export default EventFormModal;
