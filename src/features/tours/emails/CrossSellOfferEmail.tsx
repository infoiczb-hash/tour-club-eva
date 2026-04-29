// src/features/tours/emails/CrossSellOfferEmail.tsx
import * as React from 'react';
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text, Tailwind, Button, Img } from '@react-email/components';

interface RecommendedTour {
  title: string;
  difficulty: string;
  slug: string;
  image: string;
}

interface CrossSellOfferEmailProps {
  name: string;
  lastTourTitle: string;
  recommendedTours: RecommendedTour[];
  siteUrl: string;
}

export const CrossSellOfferEmail = ({ name, lastTourTitle, recommendedTours, siteUrl }: CrossSellOfferEmailProps) => (
  <Html>
    <Head />
    <Preview>{name}, вы готовы к новым вершинам! Посмотрите, что мы подобрали 🧗</Preview>
    <Tailwind>
      <Body className="bg-slate-50 font-sans text-slate-900">
        <Container className="mx-auto my-10 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-xl">
          <Section className="text-center mb-6">
            <Heading className="text-2xl font-black text-slate-900 m-0 uppercase tracking-wider">ТУРКЛУБ EVA</Heading>
            <Text className="text-teal-600 font-bold m-0 mt-2 text-lg">Это было круто! 🔥</Text>
          </Section>
          <Section>
            <Text className="text-base">Привет, <strong>{name}</strong>!</Text>
            <Text className="text-base text-slate-600 leading-relaxed">
              Поздравляем с завершением тура <strong>«{lastTourTitle}»</strong>. Мы считаем, что вы готовы повысить планку сложности и заработать больше опыта для нового уровня!
            </Text>
          </Section>
          
          <Section className="my-6">
            <Text className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 text-center">Рекомендуем для вас:</Text>
            {recommendedTours.map((tour) => (
              <Section key={tour.slug} className="mb-4 p-4 border border-slate-100 rounded-xl bg-slate-50">
                <Text className="m-0 font-bold text-slate-900">{tour.title}</Text>
                <Text className="m-0 text-xs text-teal-600 font-medium">Сложность: {tour.difficulty}</Text>
                <Button href={`${siteUrl}/tour/${tour.slug}`} className="mt-3 text-teal-500 text-xs font-bold underline">
                  Узнать больше →
                </Button>
              </Section>
            ))}
          </Section>

          <Button href={`${siteUrl}/tour`} className="bg-slate-900 text-white font-bold px-6 py-4 rounded-xl uppercase tracking-wider block w-full text-center">
            Все туры клуба
          </Button>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);