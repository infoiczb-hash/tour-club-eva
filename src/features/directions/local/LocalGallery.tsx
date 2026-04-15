import Image from 'next/image';
import { Camera,ArrowRight } from 'lucide-react';
import SwipeHint from '@/shared/ui/SwipeHint'; 

// FIX: Убрали ручные /f_auto,q_60/ из URL — cloudinary-loader добавит трансформации сам
// с правильным width под конкретный брейкпоинт устройства
const GALLERY_IMAGES = [
    "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771669025/2_e0imrh.jpg",
    "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771669311/3_hwlb7w.webp",
    "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771669023/5_blvvir.jpg",
    "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771669309/4_k5ylnt.webp",
    "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771669024/1_kac1bp.webp",
    "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771669024/6_imtnsk.jpg",
];

export default function LocalGallery() {
    return (
        <section className="py-8 md:py-16 bg-slate-950 border-t border-white/5 relative overflow-hidden">
            
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-900/10 md:blur-[150px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both text-left mb-8 md:mb-12 max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full mb-4 md:mb-6 backdrop-blur-md">
                        <Camera className="w-4 h-4 text-stone-400" />
                        <span className="text-[12px] md:text-[14px] font-bold tracking-widest text-stone-300 uppercase">
                            Без фильтров и постановки
                        </span>
                    </div>
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter mb-4">
                        Живые <span className="text-emerald-500">Моменты</span>
                    </h2>
                    <p className="text-[14px] md:text-base text-stone-400 font-medium leading-relaxed">
                        Никакого позирования — только настоящие эмоции, красивые виды и атмосфера наших выездов.
                    </p>
                </div>

                <div className="relative">
                    <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-10 md:pb-0 -mx-4 px-4 md:grid md:grid-cols-3 md:gap-4 md:mx-0 md:px-0 md:auto-rows-[300px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {GALLERY_IMAGES.map((src, i) => {
                            const isWide = i === 0 || i === 3 || i === 5;
                            
                            return (
                                <div
                                    key={i}
                                    className={[
                                        "relative shrink-0 snap-center w-[85vw] h-[400px] md:w-auto md:h-full rounded-[2rem] overflow-hidden group border border-white/10 isolate bg-slate-900 cursor-pointer shadow-xl",
                                        isWide ? "md:col-span-2" : "md:col-span-1"
                                    ].join(' ')}
                                >
                                    <Image 
                                        src={src} 
                                        alt={`Фото из похода ${i + 1}`}
                                        fill 
                                        className="object-cover transition-transform duration-1000 group-hover:scale-110" 
                                        sizes={isWide
                                            ? "(max-width: 640px) 85vw, (max-width: 1024px) 85vw, 66vw"
                                            : "(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 33vw"}
                                        // FIX: Все галерейные фото — lazy, они ниже fold
                                        loading="lazy"
                                        // FIX: quality 55 — с тёмным оверлеем артефакты невидимы
                                        quality={55}
                                    />
                                    <div className="absolute inset-0 bg-slate-950/10 group-hover:bg-transparent transition-colors duration-500" />
                                </div>
                            );
                        })}
                    </div>
                       <SwipeHint />
                </div>

            </div>
        </section>
    );
}