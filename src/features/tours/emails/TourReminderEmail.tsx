import * as React from 'react';
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text, Tailwind, Button } from '@react-email/components';

interface TourReminderEmailProps {
  name: string;
  tourTitle: string;
  meetingPoint: string;
  meetingTime: string;
  daysLeft: number;
  paymentMethod: string;
  price: number;
  currency: string;
  bookingLink: string;
}

export const TourReminderEmail = ({
  name, tourTitle, meetingPoint, meetingTime, daysLeft, paymentMethod, price, currency, bookingLink
}: TourReminderEmailProps) => {
  const isTomorrow = daysLeft === 1;
  const isCash = paymentMethod === 'cash';

  return (
    <Html>
      <Head />
      <Preview>{isTomorrow ? 'Завтра старт! Важная информация.' : 'Подготовка к туру через 3 дня.'}</Preview>
      <Tailwind>
        <Body className="bg-slate-50 font-sans text-slate-900">
          <Container className="mx-auto my-10 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-xl">
            <Section className="text-center mb-6">
              <Heading className="text-2xl font-black text-slate-900 m-0 uppercase tracking-wider">
                ТУРКЛУБ EVA
              </Heading>
              <Text className="text-teal-600 font-bold m-0 mt-2">
                {isTomorrow ? '🔥 Завтра отправляемся!' : '🏕️ До старта осталось 3 дня'}
              </Text>
            </Section>

            <Section>
              <Text className="text-base">Привет, <strong>{name}</strong>!</Text>
              <Text className="text-base text-slate-600 leading-relaxed">
                Напоминаем о вашем участии в туре <strong>«{tourTitle}»</strong>.
              </Text>
            </Section>

            <Section className="bg-slate-50 rounded-xl p-6 my-6 border border-slate-100">
              <Text className="m-0 mb-2 text-sm text-slate-400 font-bold uppercase tracking-widest">Информация по сбору</Text>
              <Text className="m-0 mb-1 text-base"><strong>📍 Место:</strong> {meetingPoint}</Text>
              <Text className="m-0 text-base"><strong>⏰ Время:</strong> {meetingTime}</Text>
            </Section>

            {/* БЛОК ДЛЯ НАЛИЧНЫХ ЗА 24 ЧАСА */}
            {isTomorrow && isCash && (
              <Section className="bg-amber-50 rounded-xl p-6 my-6 border border-amber-200 text-center">
                <Text className="m-0 mb-2 text-sm text-amber-600 font-bold uppercase tracking-widest">
                  ⚠️ Важно: Подтверждение
                </Text>
                <Text className="m-0 text-sm text-amber-800 leading-relaxed mb-4">
                  Вы выбрали оплату наличными ({price} {currency}). Пожалуйста, перейдите в ваш Telegram-бот или Личный кабинет, чтобы подтвердить участие или отменить бронь, чтобы мы не держали пустое место в автобусе.
                </Text>
                <Button href={bookingLink} className="bg-amber-500 text-slate-900 font-bold px-6 py-3 rounded-xl uppercase tracking-wider block w-full">
                  Управление билетом
                </Button>
              </Section>
            )}

      {/* Если это НЕ (завтра И наличные), то показываем обычную кнопку */}
            {!(isTomorrow && isCash) && (
               <Section className="text-center mt-6">
                 <Button href={bookingLink} className="bg-teal-500 text-white font-bold px-6 py-3 rounded-xl uppercase tracking-wider block w-full">
                   Открыть детали в кабинете
                 </Button>
               </Section>
            )}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
export default TourReminderEmail;