import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

export const useEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadEvents = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('date', { ascending: true });

        if (!error && data) {
            const formatted = data.map(e => ({
                ...e,
                price: { 
                    adult: e.price_adult, 
                    child: e.price_child || Math.round(e.price_adult * 0.8), 
                    family: e.price_family || Math.round(e.price_adult * 2.5) 
                },
                spotsLeft: e.spots_left,
                spots: e.spots, 
                image: e.image_url,
                type: e.type || 'hiking_1',
                guide: e.guide,
                difficulty: e.difficulty,
                duration: e.duration,
                included: e.included || []
            }));
            setEvents(formatted);
        }
        setLoading(false);
    }, []);

    useEffect(() => { loadEvents(); }, [loadEvents]);

    return { 
        events, 
        loading, 
        refreshEvents: loadEvents,
        
        deleteEvent: async (id) => {
            const { error } = await supabase.from('events').delete().eq('id', id);
            if (!error) loadEvents();
            return { error };
        },

        bookEvent: async ({ eventId, formData, totalPrice }) => {
            const { data, error } = await supabase.rpc('book_event', {
                event_id_input: eventId,
                user_name: formData.name,
                user_phone: formData.phone,
                ticket_count: formData.tickets,
                total_price_input: totalPrice
            });

            if (data && data.error) {
                return { error: { message: data.error } };
            }
            
            if (!error) loadEvents();
            return { data, error };
        },

        // ✅ НОВАЯ ФУНКЦИЯ ЗАГРУЗКИ
        uploadImage: async (file) => {
            // Генерируем уникальное имя: timestamp_имяфайла (удаляем пробелы)
            const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
            
            const { error } = await supabase.storage
                .from('tours-images')
                .upload(fileName, file);

            if (error) return { error };

            const { data } = supabase.storage
                .from('tours-images')
                .getPublicUrl(fileName);
                
            return { url: data.publicUrl };
        }
    };
};

export const ValidationUtils = {
    validateRegistration: (data, maxSpots, t) => {
        const e = {};
        if (!data.name?.trim()) e.name = t.validation.nameRequired;
        if (!data.phone?.trim()) e.phone = t.validation.phoneRequired;
        
        if (data.tickets < 1 || data.tickets > maxSpots) e.tickets = `1-${maxSpots}`;
        return e;
    }
};
