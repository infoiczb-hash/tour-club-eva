import { Skeleton } from "@/shared/ui/Skeleton";

export const TourSkeletonCard = () => (
  // 1. Обертка в точности повторяет классы TourCard (без фиксированной высоты)
  <div className="relative flex flex-col h-full rounded-[2rem] overflow-hidden border-2 border-white/5 bg-[#0d131a]">
    
    {/* 2. Блок картинки с правильными пропорциями */}
    <div className="relative w-full aspect-[4/3] bg-slate-800/50">
      {/* Бейдж слева вверху */}
      <div className="absolute top-4 left-4">
        <Skeleton className="h-6 w-20 rounded-xl" />
      </div>
      {/* Бейдж даты слева внизу */}
      <div className="absolute bottom-4 left-4">
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>
    </div>
    
    {/* 3. Контентная часть */}
    <div className="p-5 sm:p-6 flex flex-col flex-grow">
      
      {/* Локация и длительность */}
      <div className="flex gap-4 mb-3">
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton className="h-4 w-16 rounded-md" />
      </div>

      {/* Заголовок (две строки для реалистичности) */}
      <div className="space-y-2 mb-6">
        <Skeleton className="h-6 sm:h-8 w-11/12 rounded-lg" />
        <Skeleton className="h-6 sm:h-8 w-2/3 rounded-lg" />
      </div>

      {/* Теги (Стандарт / Детский и т.д.) - прижаты к низу через mt-auto */}
      <div className="flex gap-2 mb-6 mt-auto">
        <Skeleton className="h-7 w-20 rounded-lg" />
        <Skeleton className="h-7 w-24 rounded-lg" />
      </div>

      {/* Линия-разделитель */}
      <div className="h-px w-full bg-white/5 mb-5" />

      {/* Подвал карточки: Цена и кнопка */}
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 sm:h-10 w-28 rounded-lg" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
      
    </div>
  </div>
);

export const TourSkeleton = () => (
  // Секция в точности повторяет обертку ToursBrowser
  <section className="py-8 md:py-24 bg-slate-950 min-h-screen relative overflow-hidden w-full">
    <div className="container relative z-10">
      
      {/* Заголовок секции */}
      <div className="mb-8 md:mb-14">
        <Skeleton className="h-7 w-36 rounded-full mb-4" />
        <Skeleton className="h-10 md:h-16 w-3/4 md:w-1/2 rounded-xl" />
      </div>

   {/* Сетка карточек (точно такие же gap и cols) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-5">
        {/* Рендерим 8 скелетонов (2 ряда по 4 колонки) */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <TourSkeletonCard key={i} />
        ))}
      </div>
      
    </div>
  </section>
);