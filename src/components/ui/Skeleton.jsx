import React from 'react';

// Элемент одной карточки
export const SkeletonCard = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
        <div className="h-56 bg-gray-200 animate-pulse relative">
            <div className="absolute top-4 right-4 w-16 h-6 bg-gray-300 rounded-full"></div>
        </div>
        <div className="p-5 flex flex-col flex-grow space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="space-y-2">
                <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse"></div>
                <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse"></div>
            </div>
            <div className="mt-auto pt-4 flex justify-between items-center">
                <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
        </div>
    </div>
);

// Сетка из 6 карточек
export const SkeletonGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
        ))}
    </div>
);
