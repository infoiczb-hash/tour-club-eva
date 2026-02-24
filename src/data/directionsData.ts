import { 
    Waves, Anchor, Mountain, Compass, Tent, Briefcase, 
    ShieldCheck, Sparkles, Map, Users, Heart, Camera,
    CheckCircle2, Target, Zap
} from 'lucide-react';

// ==========================================
// 1. СТРОГИЕ ТИПЫ (Gold Senior TypeScript)
// ==========================================
export type ThemeColor = 'sup' | 'kayak' | 'kids' | 'hiking' | 'local' | 'corporate';

export interface DirectionTheme {
    hex: string;          // Главный акцентный цвет (кнопки, иконки)
    glow: string;         // Цвет для теней и свечений (rgba/tailwind)
    bgGradient: string;   // Легкий оттенок для фоновых градиентов
}

export interface BentoFeature {
    icon: any;
    title: string;
    description: string;
    image?: string;       // Если есть картинка - будет красивая фото-карточка
}

export interface DirectionData {
    id: string;
    slug: string;
    theme: ThemeColor;
    hero: {
        badge: string;
        title: string;
        subtitle: string;
        videoUrl?: string;    // Задел на будущее (видео-луп)
        imageUrl: string;     // Фото по умолчанию
    };
    intro?: {
        title: string;
        description: string;
    };
    features: BentoFeature[];
    fleet?: {                 // Блок для SUP и БайДАРОК (Арсенал)
        name: string;
        image: string;
        desc: string;
    }[];
    gallery: string[];
}

// ==========================================
// 2. ЦВЕТОВОЙ МАРШРУТИЗАТОР (Магия свечений)
// ==========================================
export const THEMES: Record<ThemeColor, DirectionTheme> = {
    sup: {
        hex: '#06b6d4', // Cyan 500 (Неоновый синий)
        glow: 'rgba(6, 182, 212, 0.4)',
        bgGradient: 'from-cyan-950/20'
    },
    kayak: {
        hex: '#14b8a6', // Teal 500 (Морская волна)
        glow: 'rgba(20, 184, 166, 0.4)',
        bgGradient: 'from-teal-950/20'
    },
    corporate: {
        hex: '#8b5cf6', // Violet 500 (Премиальный фиолетовый)
        glow: 'rgba(139, 92, 246, 0.4)',
        bgGradient: 'from-violet-950/20'
    },
    kids: {
        hex: '#f59e0b', // Amber 500 (Теплый оранжево-желтый)
        glow: 'rgba(245, 158, 11, 0.4)',
        bgGradient: 'from-amber-950/20'
    },
    hiking: {
        hex: '#10b981', // Emerald 500 (Изумрудный горный)
        glow: 'rgba(16, 185, 129, 0.4)',
        bgGradient: 'from-emerald-950/20'
    },
    local: {
        hex: '#34d399', // Emerald 400 (Мягкий зеленый для "тишины")
        glow: 'rgba(52, 211, 153, 0.4)',
        bgGradient: 'from-emerald-900/20'
    }
};

// ==========================================
// 3. БАЗА ДАННЫХ (Контент)
// ==========================================
export const directionsData: DirectionData[] = [
    {
        id: 'sup',
        slug: 'sup',
        theme: 'sup',
        hero: {
            badge: 'SUP-ПРОГУЛКИ',
            title: 'СКОЛЬЗИ ПО ВОДЕ',
            subtitle: 'Идеальный баланс релакса и активности на сапборде. Подойдет каждому, даже если вы впервые видите весло.',
            imageUrl: 'https://res.cloudinary.com/dwrei7k2z/image/upload/v1771674650/sup_zwz9yw.webp',
        },
        features: [
            { icon: Sparkles, title: 'ЛЕГКИЙ СТАРТ', description: 'Обучаем за 15 минут. Вы встанете на доску и уверенно поплывете уже на первом занятии.' },
            { icon: Heart, title: 'ПОЛНЫЙ РЕЛАКС', description: 'Шум воды, пение птиц и плавная гребля отлично снимают стресс после рабочей недели.' },
            { icon: Target, title: 'РАБОТАЮТ ВСЕ МЫШЦЫ', description: 'Незаметно для себя вы тренируете баланс, мышцы кора, спину и руки.' },
            { icon: Camera, title: 'ИДЕАЛЬНО ДЛЯ ФОТО', description: 'Самые красивые рассветы и закаты получаются именно с воды.' }
        ],
        fleet: [
            { name: 'Универсальный SUP', image: '/fleet/sup-board.png', desc: 'Устойчивая доска для комфортного старта и спокойных прогулок.' }
        ],
        gallery: [
            'https://res.cloudinary.com/dwrei7k2z/image/upload/v1771674650/sup_zwz9yw.webp',
        ]
    },
    {
        id: 'kayaking',
        slug: 'kayaking',
        theme: 'kayak',
        hero: {
            badge: 'СПЛАВЫ',
            title: 'СПЛАВЫ НА БАЙДАРКАХ',
            subtitle: 'Перезагрузка на реке для тех, кто ищет командный дух, новые пейзажи и песни у костра.',
            imageUrl: 'https://res.cloudinary.com/dwrei7k2z/image/upload/v1771674642/kayak_p2bkyz.webp',
        },
        features: [
            { icon: Mountain, title: 'ОТДЫХ НА ПРИРОДЕ 100%', description: 'Мы берем на себя всю логистику и лагерь. Ваша задача — просто грести и наслаждаться.' },
            { icon: ShieldCheck, title: 'АБСОЛЮТНО БЕЗОПАСНО', description: 'Надежные лодки, сертифицированные гиды и спасательные жилеты для каждого.' },
            { icon: Users, title: 'ДЛЯ ВСЕЙ СЕМЬИ', description: 'Сплав не требует спортивной подготовки. В байдарку можно смело сажать детей.' }
        ],
        fleet: [
            { name: 'Байдарка ТАЙМЕНЬ', image: '/fleet/kayak-1.png', desc: 'Классика речных сплавов. Вместительная и надежная.' },
            { name: 'Байдарка ХАТАНГА', image: '/fleet/kayak-2.png', desc: 'Быстрая, маневренная и устойчивая к порогам.' }
        ],
        gallery: [
            'https://res.cloudinary.com/dwrei7k2z/image/upload/v1771674642/kayak_p2bkyz.webp',
        ]
    },
    {
        id: 'corporate',
        slug: 'organizers',
        theme: 'corporate',
        hero: {
            badge: 'B2B & КОРПОРАТИВЫ',
            title: 'СОБЫТИЯ, КОТОРЫЕ МЕНЯЮТ КОМАНДЫ',
            subtitle: 'Когда вы везете группу в лес, вы должны быть Лидером, а не завхозом. Мы заберем всю рутину на себя.',
            imageUrl: 'https://res.cloudinary.com/dwrei7k2z/image/upload/v1771674641/organ_zrvvfc.webp',
        },
        features: [
            { icon: Users, title: 'ТИМБИЛДИНГ', description: 'Сплачиваем коллектив через преодоление препятствий и жизнь в лагере. Идеально для проектных команд.' },
            { icon: Compass, title: 'РЕТРИТЫ И ПРАКТИКИ', description: 'Вывозим клубы и духовных практиков на природу. Обеспечиваем тишину, комфорт и вегетарианское меню.' },
            { icon: Zap, title: 'СТРАТСЕССИИ', description: 'Вывозим топ-менеджмент в горы для мозгового штурма. Никаких отвлекающих факторов, только фокус на цели.' }
        ],
        gallery: []
    },
    {
        id: 'hiking',
        slug: 'hiking',
        theme: 'hiking',
        hero: {
            badge: 'ГОРЫ И ПОХОДЫ',
            title: 'ВДОХНОВЛЯЙСЯ ГОРАМИ',
            subtitle: 'Там, где не ловит связь, появляется возможность услышать себя. Откройте для себя дикую природу без фильтров.',
            imageUrl: 'https://res.cloudinary.com/dwrei7k2z/image/upload/v1771674641/hiking_modikx.webp',
        },
        features: [
            { icon: Compass, title: 'БЕЗ СВЯЗИ И СУЕТЫ', description: 'Полный цифровой детокс. Только вы, вершины и скрип ботинок по камням.' },
            { icon: ShieldCheck, title: 'НАДЕЖНЫЕ ГИДЫ', description: 'С вами идут профессионалы. Мы знаем тропы, читаем погоду и гарантируем безопасность.' },
            { icon: Heart, title: 'ЭМОЦИИ БЕЗ ФИЛЬТРОВ', description: 'Рассветы над облаками, чай из горных трав и вечерние разговоры у костра, которые вы не забудете.' }
        ],
        gallery: [
            'https://res.cloudinary.com/dwrei7k2z/image/upload/v1771674641/hiking_modikx.webp',
        ]
    },
    {
        id: 'kids',
        slug: 'kids',
        theme: 'kids',
        hero: {
            badge: 'JUNIOR АКАДЕМИЯ',
            title: 'ВМЕСТО ЭКРАНА — КОСТЕР',
            subtitle: 'Детские и семейные походы, где ребенок учится самостоятельности, находит реальных друзей и влюбляется в природу.',
            imageUrl: 'https://res.cloudinary.com/dwrei7k2z/image/upload/v1771674646/kids_e7lr51.webp',
        },
        features: [
            { icon: Tent, title: 'ПОЛЕВАЯ ШКОЛА', description: 'Учим ставить палатку, разводить костер без спичек и ориентироваться по компасу.' },
            { icon: Users, title: 'КОМАНДНЫЙ ДУХ', description: 'Дети учатся помогать друг другу, распределять дежурства и работать в коллективе.' },
            { icon: ShieldCheck, title: 'БЕЗОПАСНОСТЬ 100%', description: 'Двойной контроль гидов, адаптированный маршрут и аптечка на все случаи жизни.' }
        ],
        gallery: [
            'https://res.cloudinary.com/dwrei7k2z/image/upload/v1771674646/kids_e7lr51.webp',
        ]
    },
    {
        id: 'local',
        slug: 'local',
        theme: 'local',
        hero: {
            badge: 'ТИШИНА РЯДОМ',
            title: 'ПЕРЕЗАГРУЗКА ЗА 24 ЧАСА',
            subtitle: 'Не нужно лететь на край света, чтобы отдохнуть. Мы нашли идеальные места для побега из города прямо у вас под боком.',
            imageUrl: 'https://res.cloudinary.com/dwrei7k2z/image/upload/v1771674647/local_i9ul0e.webp',
        },
        features: [
            { icon: Zap, title: 'БЫСТРЫЙ СТАРТ', description: 'Вам не нужен отпуск. Уезжаем в пятницу вечером, возвращаемся в воскресенье полными сил.' },
            { icon: Map, title: 'МЕСТА СИЛЫ', description: 'Секретные локации без толп туристов. Только природа, тишина и наша команда.' },
            { icon: Camera, title: 'ВКУС И ЭСТЕТИКА', description: 'Красивые кемпинги, гирлянды, эстетичная посуда и ресторанная еда, приготовленная на огне.' }
        ],
        gallery: [
            'https://res.cloudinary.com/dwrei7k2z/image/upload/v1771674647/local_i9ul0e.webp',
        ]
    }
];

// Функция-помощник для получения данных направления по slug
export function getDirectionBySlug(slug: string): DirectionData | undefined {
    return directionsData.find(d => d.slug === slug);
}