// src/features/tours/emails/WinBackOfferEmail.tsx
import * as React from 'react';
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text, Tailwind, Button, Link } from '@react-email/components';

interface WinBackOfferEmailProps {
  name: string;
  bonusAmount?: number;
  promoCode?: string;
  siteUrl: string;
}

export const WinBackOfferEmail = ({ name, bonusAmount, promoCode, siteUrl }: WinBackOfferEmailProps) => (
  <Html>
    <Head />
    <Preview>Горы скучают по вам, {name}! Дарим бонус для возвращения 🏔️</Preview>
    <Tailwind>
      <Body className="bg-slate-50 font-sans text-slate-900">
        <Container className="mx-auto my-10 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-xl">
          <Section className="text-center mb-6">
            <Heading className="text-2xl font-black text-slate-900 m-0 uppercase tracking-wider">ТУРКЛУБ EVA</Heading>
          </Section>
          <Section>
            <Text className="text-base">Привет, <strong>{name}</strong>!</Text>
            <Text className="text-base text-slate-600 leading-relaxed">
              Мы заметили, что вы давно не выбирались с нами на тропу. Мы очень ценим каждого нашего участника и хотим, чтобы вы снова почувствовали магию гор.
            </Text>
          </Section>
          <Section className="bg-teal-50 rounded-xl p-6 my-6 border border-teal-100 text-center">
            <Text className="m-0 mb-2 text-sm text-teal-600 font-bold uppercase tracking-widest">Ваш подарок</Text>
            <Text className="m-0 text-lg font-bold text-slate-900 mb-4">
              {bonusAmount ? `+${bonusAmount} баллов на счет` : `Промокод на -10%: ${promoCode}`}
            </Text>
            <Button href={`${siteUrl}/tour`} className=" bg-teal-500 text-slate-950  font-bold px-6 py-3 rounded-xl uppercase tracking-wider block w-full text-center">
              Выбрать приключение
            </Button>
          </Section>
          <Text className="text-xs text-slate-400 text-center">Бонус действует в течение 7 дней</Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

