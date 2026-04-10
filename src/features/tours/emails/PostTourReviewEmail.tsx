import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
  Button,
} from '@react-email/components';

interface PostTourReviewEmailProps {
  name: string;
  tourTitle: string;
  points: number;
  level: string;
  bookingLink: string;
}

export const PostTourReviewEmail = ({
  name,
  tourTitle,
  points,
  level,
  bookingLink,
}: PostTourReviewEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Как прошел тур «{tourTitle}»? Поделитесь впечатлениями и получите бонусы!</Preview>
      <Tailwind>
        <Body className="bg-slate-50 font-sans text-slate-900">
          <Container className="mx-auto my-10 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-xl">
            <Section className="text-center mb-6">
              <Heading className="text-2xl font-black text-slate-900 m-0 uppercase tracking-wider">
                ТУРКЛУБ EVA
              </Heading>
              <Text className="text-[#2AABEE] font-bold m-0 mt-2 text-lg">
                С возвращением! 🏕️
              </Text>
            </Section>

            <Hr className="border-slate-200 my-6" />

            <Section>
              <Text className="text-base">
                Привет, <strong>{name}</strong>!
              </Text>
              <Text className="text-base text-slate-600 leading-relaxed">
                Выходные пролетели незаметно. Надеемся, вы успели отдохнуть и зарядиться энергией в нашем приключении <strong>«{tourTitle}»</strong>.
              </Text>
            </Section>

            <Section className="bg-blue-50 rounded-xl p-6 my-6 border border-blue-100 text-center">
              <Text className="m-0 mb-2 text-sm text-blue-500 font-bold uppercase tracking-widest">
                Ваш прогресс
              </Text>
              <Text className="m-0 mb-1 text-base">
                🏆 Текущий статус: <strong>{level}</strong>
              </Text>
              <Text className="m-0 text-base">
                ⭐️ Накоплено: <strong>{points} баллов</strong>
              </Text>
            </Section>

            <Section>
              <Text className="text-base text-slate-600 leading-relaxed text-center">
                Помогите нам стать еще лучше — оцените работу нашего гида и организацию поездки. За каждый опубликованный отзыв мы начисляем дополнительные бонусы, которыми можно оплатить следующие туры!
              </Text>
            </Section>

            <Section className="text-center mt-8">
              <Button
                href={bookingLink}
                className="bg-teal-500 text-white font-bold px-8 py-4 rounded-xl uppercase tracking-wider block w-full text-center"
              >
                Оценить тур и получить баллы
              </Button>
            </Section>

            <Hr className="border-slate-200 my-8" />

            <Section>
              <Text className="text-xs text-slate-400 text-center leading-relaxed">
                Спасибо, что путешествуете с нами. До новых встреч на маршрутах!
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default PostTourReviewEmail;