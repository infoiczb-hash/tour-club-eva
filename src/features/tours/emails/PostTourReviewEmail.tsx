import * as React from 'react';
import {
  Body, Container, Head, Heading, Hr, Html,
  Preview, Section, Text, Tailwind, Button, Link
} from '@react-email/components';

interface PostTourReviewEmailProps {
  name: string;
  tourTitle: string;
  points: number;
  level: string;
  bookingLink: string;
  pointsToEarn?: number;
  nextLevelPoints?: number;
  pointsNeeded?: number;
}

export const PostTourReviewEmail = ({
  name,
  tourTitle,
  points,
  level,
  bookingLink,
  pointsToEarn = 50,
  nextLevelPoints = 500,
  pointsNeeded,
}: PostTourReviewEmailProps) => {
  const remaining = pointsNeeded ?? (nextLevelPoints - points > 0 ? nextLevelPoints - points : 0);
  
  // Умная корректировка ссылки (направляем в историю поездок, а не в активные брони)
  const historyLink = bookingLink.replace('/bookings', '/history');

  return (
    <Html>
      <Head />
    <Preview>
  {`${name}, как прошёл тур «${tourTitle}»? Напишите отзыв и получите +${pointsToEarn} баллов!`}
</Preview>
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
                <Text className="m-0 mb-1 text-[10px] uppercase tracking-widest text-slate-400 font-bold">Ваш статус</Text>
                <Text className="m-0 mb-4 text-lg font-bold text-slate-900">
                  {level} <span className="text-teal-600 font-black">({points} баллов)</span>
                </Text>
                
                <Text className="m-0 mb-1 text-[10px] uppercase tracking-widest text-slate-400 font-bold">До следующего уровня</Text>
                <Text className="m-0 text-sm font-medium text-slate-700">
                  Осталось {remaining} баллов. Оставьте отзыв, чтобы получить ещё <span className="text-teal-600 font-bold">+{pointsToEarn}</span>!
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
              <Text className="text-[10px] text-slate-300 mt-6 leading-relaxed">
                Турклуб ЭВА. Спасибо, что путешествуете с нами. <br />
                До новых встреч на маршрутах! 🌲
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default PostTourReviewEmail;