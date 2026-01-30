import React, { useState, useEffect } from 'react';
import { UploadCloud, Loader, Image as ImageIcon } from 'lucide-react';
import Button from './ui/Button'; // Убедись, что путь правильный

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
                included: initialData.included && Array.isArray(initialData.included) 
                    ? initialData.included.join(', ') 
                    : '',
                // Восстанавливаем цену (в базе price_adult, в UI карточки price.adult)
                price_adult: initialData.price?.adult || initialData.price_adult || ''
            });
        }
    }, [initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 1. Копируем данные формы
        const dataToSend = { ...form };

        // 2. Преобразуем included из строки в массив
        const includedArray = typeof form.included === 'string' 
            ? form.included.split(',').map(s => s.trim()).filter(Boolean)
            : form.included;
        
        dataToSend.included = includedArray;

        // 3. ОЧИСТКА: Удаляем поля, которых нет в таблице events в БД
        delete dataToSend.price;      // Это объект для UI, в БД поля price_*
        delete dataToSend.spotsLeft;  // Это camelCase для UI, в БД spots_left
        delete dataToSend.image;      // ❌ ВОТ ВИНОВНИК ОШИБКИ (в БД image_url)
        delete dataToSend.id;         // ID не обновляем

        // 4. Логика мест (spots_left)
        if (!isEditMode) {
            // При создании: свободных = всего
            dataToSend.spots_left = form.spots;
        } else {
            // При редактировании: удаляем spots_left из отправки, 
            // чтобы случайно не перезаписать текущее кол-во свободных мест старым значением
            delete dataToSend.spots_left;
        }

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
                <h2 className="text-xl font-bold mb-4 text-gray-800">
                    {isEditMode ? '✏️ Редактировать тур' : '➕ Новый тур'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition" placeholder="Название" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} required/>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <select className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-teal-500 outline-none" value={form.type} onChange={e=>setForm({...form, type: e.target.value})}>
                            <option value="hiking_1">🎒 1 день</option>
                            <option value="water">🛶 На воде</option>
                            <option value="kids">👶 Детский</option>
                            <option value="weekend">🏕️ Выходные</option>
                            <option value="expedition">🏔️ Экспедиция</option>
                        </select>
                        <input className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Локация" value={form.location} onChange={e=>setForm({...form, location: e.target.value})} required/>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <input type="date" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" value={form.date} onChange={e=>setForm({...form, date: e.target.value})} required/>
                        <input type="time" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" value={form.time} onChange={e=>setForm({...form, time: e.target.value})}/>
                    </div>

                    <input className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Имя гида" value={form.guide || ''} onChange={e=>setForm({...form, guide: e.target.value})} />
                    
                    <textarea className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none h-24 text-sm" placeholder="Описание тура..." value={form.description || ''} onChange={e=>setForm({...form, description: e.target.value})} />
                    
                    <input className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Маршрут" value={form.route || ''} onChange={e=>setForm({...form, route: e.target.value})} />
                    
                    <input className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Включено (через запятую)" value={form.included} onChange={e=>setForm({...form, included: e.target.value})} />

                    <div className="grid grid-cols-2 gap-3">
                         <input className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Длительность" value={form.duration || ''} onChange={e=>setForm({...form, duration: e.target.value})} />
                         <select className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-teal-500 outline-none" value={form.difficulty} onChange={e=>setForm({...form, difficulty: e.target.value})}>
                            <option value="легкая">Легкая</option>
                            <option value="средняя">Средняя</option>
                            <option value="сложная">Сложная</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                         <input type="number" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Цена" value={form.price_adult} onChange={e=>setForm({...form, price_adult: e.target.value})} required/>
                         <input type="number" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Всего мест" value={form.spots} onChange={e=>setForm({...form, spots: e.target.value})} required/>
                    </div>
                    
                    {/* ЗАГРУЗКА ФОТО */}
                    <div className={`border-2 border-dashed rounded-xl p-4 text-center transition relative group overflow-hidden ${form.image_url ? 'border-teal-500 bg-teal-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                        {uploading ? <Loader className="animate-spin mx-auto text-teal-600"/> : (
                            <>
                                <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" onChange={handleFile}/>
                                {form.image_url ? (
                                    <div className="relative h-32 w-full">
                                        <img src={form.image_url} alt="Preview" className="h-full w-full object-cover rounded-lg"/>
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 rounded-lg">
                                            <p className="text-white text-xs font-bold flex items-center gap-1"><UploadCloud size={16}/> Изменить</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-gray-400 py-2">
                                        <ImageIcon size={24} className="mx-auto mb-2"/>
                                        <span className="text-xs font-medium">Нажмите или перетащите фото</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    
                    <div className="flex gap-3 pt-2">
                        <Button 
                            type="button" 
                            variant="secondary" 
                            onClick={onClose} 
                            className="flex-1"
                        >
                            Отмена
                        </Button>
                        <Button 
                            isLoading={uploading} 
                            variant="primary" 
                            className="flex-1"
                        >
                            {isEditMode ? 'Сохранить' : 'Создать'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventFormModal;
