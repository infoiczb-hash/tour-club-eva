import { Skeleton } from "@/shared/ui/Skeleton"; // Убедитесь, что этот компонент поддерживает className

export const TourSkeletonCard = () => (
    <div className="bg-slate-900 border-white/5 overflow-hidden h-full flex flex-col relative">
        
        {/* 1. ФОТО */}
      <div className="relative w-full aspect-[4/3] bg-slate-800">
             {/* Имитация метки типа тура (слева сверху) */}
             <div className="absolute top-4 left-4">
                <Skeleton className="h-6 w-20 rounded-lg" />
             </div>
             {/* Имитация кнопки лайка/метки (справа сверху) */}
             <div className="absolute top-4 right-4">
                <Skeleton className="h-6 w-24 rounded-lg" />
             </div>
        </div>
        
        {/* 2. КОНТЕНТ */}
        <div className="p-6 flex flex-col flex-grow">
            
            {/* Мета-инфо (Локация и Дата) */}
            <div className="flex gap-3 mb-4">
                <Skeleton className="h-5 w-24 rounded-md" />
                <Skeleton className="h-5 w-20 rounded-md" />
            </div>

            {/* Заголовок (2 строки) */}
            <div className="space-y-2 mb-3">
                <Skeleton className="h-7 w-11/12 rounded-lg" />
                <Skeleton className="h-7 w-2/3 rounded-lg" />
            </div>
            
            {/* Описание */}
            <div className="space-y-2 mb-6 opacity-70">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
            </div>

            {/* Теги билетов (Детские/Семейные) */}
            <div className="flex gap-2 mb-auto">
                <Skeleton className="h-6 w-28 rounded-md" />
            </div>

            {/* Низ (Цена и Большая Кнопка) */}
            <div className="mt-6 pt-5 flex justify-between items-end border-t border-slate-100">
                <div className="space-y-1">
                    <Skeleton className="h-3 w-8" /> {/* "от" */}
                    <Skeleton className="h-8 w-32 rounded-lg" /> {/* Цена */}
                </div>
                {/* Кнопка (Квадратная с закруглением, как в оригинале) */}
                <Skeleton className="h-12 w-12 rounded-2xl" />
            </div>
        </div>
    </div>
);

// Сетка (адаптирована под ToursBrowser)
export const TourSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-full">
                <TourSkeletonCard />
            </div>
        ))}
    </div>
);