'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bed, Shirt, Coffee, Tent, BriefcaseMedical, Droplet, ArrowUp } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  description: string;
  hint: string;
  icon: React.ReactNode;
}

const steps: Step[] = [
  {
    id: 1,
    title: 'Введение',
    description: 'Главный принцип — центр тяжести близко к спине и на уровне лопаток.',
    hint: 'Распределение веса влияет на устойчивость и утомляемость.',
    icon: <ArrowUp size={24} className="text-red-500" />,
  },
  {
    id: 2,
    title: 'Спальный мешок',
    description: 'Кладём в низ рюкзака.',
    hint: 'Тяжёлое вниз, лёгкое вверх.',
    icon: <Bed size={24} className="text-green-500" />,
  },
  {
    id: 3,
    title: 'Одежда',
    description: 'Следующий слой — одежда.',
    hint: 'Свернуть плотно для компактности.',
    icon: <Shirt size={24} className="text-blue-500" />,
  },
  {
    id: 4,
    title: 'Еда и кухня',
    description: 'Средний слой — продукты и кухонное снаряжение.',
    hint: 'Лёгкие контейнеры сверху.',
    icon: <Coffee size={24} className="text-pink-500" />,
  },
  {
    id: 5,
    title: 'Палатка и коврик',
    description: 'Следующий слой — палатка и коврик.',
    hint: 'Сверните и разместите по ширине рюкзака.',
    icon: <Tent size={24} className="text-indigo-500" />,
  },
  {
    id: 6,
    title: 'Аптечка и дождевик',
    description: 'Сверху — мелкие предметы и дождевик.',
    hint: 'Сюда же аптечка и фонарик.',
    icon: <BriefcaseMedical size={24} className="text-yellow-500" />,
  },
];

export default function BackpackGuide() {
  const [currentStep, setCurrentStep] = useState(1);

  const totalSteps = steps.length;

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const goToStep = (id: number) => {
    setCurrentStep(id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">Идеальный рюкзак: Сборка по слоям</h1>
          <p className="text-gray-600 text-lg">Интерактивная инструкция с визуализацией</p>
        </header>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Левая часть: Визуализация рюкзака */}
          <div className="lg:w-1/2 flex flex-col items-center">
            <div className="relative w-full h-[500px] md:h-[600px] bg-gradient-to-b from-blue-50 to-cyan-50 rounded-xl shadow-lg p-6 flex flex-col items-center justify-end">
              {steps.map((step) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: step.id <= currentStep ? 1 : 0, y: step.id <= currentStep ? 0 : 30, scale: step.id <= currentStep ? 1 : 0.9 }}
                  transition={{ duration: 0.6, type: 'spring', stiffness: 120 }}
                  className="w-40 h-16 bg-white rounded-xl shadow-md flex items-center justify-center mb-4 cursor-pointer hover:scale-105"
                  title={step.hint}
                >
                  {step.icon}
                </motion.div>
              ))}
            </div>

            {/* Прогресс */}
            <div className="w-full mt-6">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-700 rounded-full"
                  animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="flex justify-between mt-3">
                {steps.map((step) => (
                  <button
                    key={step.id}
                    onClick={() => goToStep(step.id)}
                    className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                      currentStep === step.id
                        ? 'bg-blue-700 text-white scale-110'
                        : currentStep > step.id
                        ? 'bg-blue-400 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {step.id}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Правая часть: Инструкции */}
          <div className="lg:w-1/2 bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{steps[currentStep - 1].title}</h2>
            <p className="text-gray-700 mb-4">{steps[currentStep - 1].description}</p>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg mb-6 flex items-start gap-3">
              <Droplet size={24} className="text-yellow-500 mt-1" />
              <p>{steps[currentStep - 1].hint}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex-1 px-6 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50"
              >
                Назад
              </button>
              <button
                onClick={nextStep}
                disabled={currentStep === totalSteps}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50"
              >
                {currentStep === totalSteps ? 'Завершить' : 'Далее'}
              </button>
              <button
                onClick={() => setCurrentStep(1)}
                className="px-6 py-3 border-2 border-blue-200 text-blue-700 rounded-xl hover:bg-blue-50"
              >
                С начала
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
 