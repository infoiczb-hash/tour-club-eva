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
            // Адаптер данных (змеиный_регистр -> верблюжийРегистр + доп. поля)
            const formatted = data.map(e => ({
                ...e,
                // UI ожидает объект цен
                price: { 
                    adult: e.price_adult, 
                    child: e.price_child || Math.round(e.price_adult * 0.8), 
                    family: e.price_family || Math.round(e.price_adult * 2.5) 
                },
                // UI ожидает spotsLeft
                spotsLeft: e.spots_left,
                spots: e.spots || 20, 
                image: e.image_url,
                // Определяем тип, если он не задан явно в БД
                type: e.type || (e.title.toLowerCase().includes('сплав') ? 'rafting' : e.title.toLowerCase().includes('вел') ? 'cycling' : 'hiking'),
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
        // Методы для админки
        deleteEvent: async (id) => {
            const { error } = await supabase.from('events').delete().eq('id', id);
            if (!error) loadEvents();
            return { error };
        },
        createEvent: async (formData) => {
            const { error } = await supabase.from('events').insert([formData]);
            if (!error) loadEvents();
            return { error };
        }
    };
};

export const ValidationUtils = {
    validateRegistration: (data, maxSpots, t) => {
        const e = {};
        if (!data.name?.trim()) e.name = t.validation.nameRequired;
        if (!data.phone?.trim()) e.phone = t.validation.phoneRequired;
        else if (!/^\+?[\d\s\-()]{7,}$/.test(data.phone)) e.phone = t.validation.invalidPhone;
        
        if (data.tickets < 1 || data.tickets > maxSpots) e.tickets = `1-${maxSpots}`;
        return e;
    }
};
