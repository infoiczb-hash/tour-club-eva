"use client";

import { useState, useEffect, useCallback } from "react";

const PROFILE_KEY = "eva_tourist_profile";

// Описываем, что мы собираем о пользователе
export interface TouristProfile {
  fears?: string[];           // Страхи (из FearDebrief)
  physicalLevel?: string;     // Уровень (ready, almost, prepare из PhysicalReadiness)
  bodySymptoms?: string[];    // Симптомы (из BodySignals)
  touristType?: string;       // Психотип (из старого квиза)
  updatedAt?: number;         // Время последнего обновления
  bodySignals?: string[];
}

// Безопасное чтение (защита от падения на сервере в Next.js)
const getStoredProfile = (): TouristProfile => {
  if (typeof window === "undefined") return {};
  try {
    const item = window.localStorage.getItem(PROFILE_KEY);
    return item ? JSON.parse(item) : {};
  } catch (error) {
    console.warn("Failed to read profile from localStorage", error);
    return {};
  }
};

export function useProfile() {
  const [profile, setProfile] = useState<TouristProfile>({});
  const [isMounted, setIsMounted] = useState(false); // Защита от гидратации

  useEffect(() => {
    setIsMounted(true);
    setProfile(getStoredProfile());

    // Слушаем изменения из других вкладок браузера
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === PROFILE_KEY) setProfile(getStoredProfile());
    };

    // Слушаем изменения внутри текущей страницы
    const handleCustomChange = () => setProfile(getStoredProfile());

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("eva_profile_updated", handleCustomChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("eva_profile_updated", handleCustomChange);
    };
  }, []);

  // Функция обновления (принимает только те поля, которые изменились)
  const updateProfile = useCallback((updates: Partial<TouristProfile>) => {
    if (typeof window === "undefined") return;
    
    const current = getStoredProfile();
    const next: TouristProfile = { ...current, ...updates, updatedAt: Date.now() };
    
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    // Вызываем кастомное событие, чтобы другие компоненты сразу перерисовались
    window.dispatchEvent(new Event("eva_profile_updated")); 
  }, []);

  const clearProfile = useCallback(() => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(PROFILE_KEY);
    window.dispatchEvent(new Event("eva_profile_updated"));
  }, []);

  // Считаем "заполненность" профиля (например, из 4 тестов)
  const calculateProgress = () => {
    let score = 0;
    if (profile.fears && profile.fears.length > 0) score++;
    if (profile.physicalLevel) score++;
    if (profile.bodySymptoms && profile.bodySymptoms.length > 0) score++;
    if (profile.touristType) score++;
    return (score / 4) * 100;
  };

  return {
    isMounted,           // Используем, чтобы не рендерить профиль на сервере
    profile,             // Текущие данные пользователя
    updateProfile,       // Метод сохранения
    clearProfile,        // Метод сброса
    progress: calculateProgress(), // Процент заполненности профиля
  };
}