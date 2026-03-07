// src/data/routes.ts

// 1. Создаем строгий шаблон (паспорт) нашего маршрута
export type RouteData = {
  id: string;
  title: string;
  path: string;
  images: string[];
  desc: string;
  details: {
    level: string;
    forWhom: string;
    duration: string;
    atmosphere: string;
    distance: string;
    start: string;
    finish: string;
    pathPoints: string;
    options: string;
  };
};

export const routesData: RouteData[] = [
  {
    id: "bendery-tiraspol",
    title: "Бендеры — Тирасполь",
    path: "По течению мимо крепости",
    images: [
      "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771574860/kayking2_s46h1i.jpg", 
      "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771582857/08bb4977-66a0-4b15-88fe-78347e51b917_loddpm.jpg"
    ], 
    desc: "Самый популярный маршрут. Вы увидите Бендерскую крепость с воды и пройдете через живописные петли Днестра.",
    details: { 
        level: "Средний", 
        forWhom: "Семьи, новички", 
        duration: "7-9 часов",
        atmosphere: "Петли Днестра",
        distance: "18 км",
        start: "г. Бендеры (пляж)",
        finish: "г. Тирасполь (паром)",
        pathPoints: "Бендеры → Бычок → Тирасполь",
        options: "Трансфер, Обед"
    }
  },
  {
    id: "tiraspol-slobodzea",
    title: "Тирасполь — Слободзея",
    path: "Пляжи и зеленные берега",
    images: [
        "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771574860/kayaking3_wgvuux.jpg",
        "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771582857/photo_5357450194402269114_y_dq4n2c.jpg"
    ], 
    desc: "Маршрут для тех, кто хочет тишины. Густые леса по берегам и множество мест для купания.",
    details: { 
        level: "Средний", 
        forWhom: "Любители природы", 
        duration: "7-9 часов",
        atmosphere: "Релакс",
        distance: "22 км",
        start: "г. Тирасполь",
        finish: "г. Слободзея",
        pathPoints: "Тирасполь → Суклея → Карагаш → Слободзея",
        options: "Трансфер"
    }
  },
  {
    id: "speya-bendery",
    title: "Спея — Бендеры",
    path: "Длинный путь через скалы, отмели и песочные берега",
    images: [
        "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771574859/kayking1_fxqlju.jpg",
        "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771582857/1c14a56b-0d09-4c66-ad06-c70e3cf860ff_zjyjzi.jpg"
    ],
    desc: "Масштабный маршрут с различным типом берегов. Идеально для тех, кто готов к дистанции 25+ км.",
    details: { 
        level: "Для опытных", 
        forWhom: "Активные группы", 
        duration: "7-10 часов",
        atmosphere: "Драйв",
        distance: "28 км",
        start: "с. Спея",
        finish: "г. Бендеры",
        pathPoints: "Спея → Телица → Гура-Быкулуй → Бендеры",
        options: "Пикник на маршруте"
    }
  },
  {
    id: "grigoriopol-india",
    title: "Григориополь — Индия",
    path: "Экзотический маршрут",
    images: [
         "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771574860/kayking4_gs12hy.jpg",
         "https://res.cloudinary.com/dwrei7k2z/image/upload/v1771582857/photo_5357450194402269123_y_wchsca.jpg" 
    ],
    desc: "Отмели, скалы и атмосферный пляж у деревни Индия.",
    details: { 
        level: "Легкий", 
        forWhom: "Искатели приключений", 
        duration: "5 часов",
        atmosphere: "Свобода",
        distance: "12 км",
        start: "г. Григориополь",
        finish: "с. Индия",
        pathPoints: "Григориополь → Делакеу → Индия",
        options: "Возможно питания на маршруте"
    }
  }
];