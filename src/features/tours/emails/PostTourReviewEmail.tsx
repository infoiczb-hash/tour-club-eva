import * as React from 'react';
import {
  Body, Container, Head, Heading, Hr, Html,
  Preview, Section, Text, Tailwind, Button, Link
} from '@react-email/components';

interface PostTourReviewEmailProps {
  name: string;
  tourTitle: string;
  totalTours: number; 
  level: string;
  nextLevelName?: string | null;
  toursToNext?: number | null; 
  bookingLink: string;
  pointsToEarn?: number;
}

export const PostTourReviewEmail = ({
  name,
  tourTitle,
  totalTours,
  level,
  nextLevelName,
  toursToNext,
  bookingLink,
  pointsToEarn = 50,
}: PostTourReviewEmailProps) => {
  
  // Умная корректировка ссылки
  const historyLink = bookingLink.replace('/bookings', '/history');

  // Функция для правильного склонения слов (тур, тура, туров)
  const declension = (n: number, one: string, two: string, five: string) => {
    n = Math.abs(n) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return five;
    if (n1 > 1 && n1 < 5) return two;
    if (n1 === 1) return one;
    return five;
  };

  return (
    <Html>
      <Head />
      <Preview>Как прошёл тур «{tourTitle}»? Напишите отзыв и получите бонусы!</Preview>
      <Tailwind>
        <Body className="bg-white font-sans text-slate-900">
          <Container className="mx-auto my-10 p-4 max-w-[600px]">
            <Heading className="text-2xl font-bold tracking-tight text-slate-900 m-0 mb-8">
              С возвращением! 🏕️
            </Heading>

            <Section className="mb-8">
              <Text className="text-base leading-relaxed m-0 mb-4">
                Привет, {name}! Надеемся, что наше приключение «{tourTitle}» прошло отлично и вы успели перезагрузиться.
              </Text>
              
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest m-0">
                  Ваш статус в клубе
                </Text>
                <Heading className="text-2xl font-black text-slate-900 m-0 mt-1 uppercase italic">
                  {level}
                </Heading>
                <Text className="text-sm text-slate-500 m-0 mt-2">
                  Вы прошли с нами {totalTours} {declension(totalTours, 'тур', 'тура', 'туров')}. 
                  {toursToNext 
                    ? ` Осталось ${toursToNext} ${declension(toursToNext, 'тур', 'тура', 'туров')} до статуса «${nextLevelName}».`
                    : ' У вас максимальный статус — вы легенда!'}
                  <br /><br />Поделитесь впечатлениями о поездке и получите бонусы на счет!
                </Text>
              </div>
            </Section>

            <Section className="mb-8">
              <Text className="text-sm leading-relaxed m-0 mb-6 text-slate-600">
                Помогите нам стать ещё лучше — поделитесь впечатлениями о работе гида, организации и маршруте. Это займёт буквально пару минут.
              </Text>
              
              <Button
                href={historyLink}
                className="bg-slate-900 text-white font-bold py-4 px-8 rounded-xl w-full text-center"
              >
                Написать отзыв (+{pointsToEarn} баллов)
              </Button>
            </Section>

            <Hr className="border-slate-100 my-8" />

            <Section className="text-center">
              <Link href="https://t.me/romansvtirase" className="text-xs text-slate-400 underline">Связаться с руководством</Link>
              <Text className="text-xs text-slate-300 mt-6 leading-relaxed">
                Турклуб ЭВА. Спасибо, что путешествуете с нами. <br />
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};