import * as React from 'react';
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text, Tailwind, Button } from '@react-email/components';

interface CashbackReceivedEmailProps {
  name: string;
  amount: number;
  siteUrl: string;
}

export const CashbackReceivedEmail = ({ name, amount, siteUrl }: CashbackReceivedEmailProps) => (
  <Html>
    <Head />
    <Preview>💰 Вам начислен бонус! Ваш баланс пополнен</Preview>
    <Tailwind>
      <Body className="bg-white font-sans text-slate-900">
        <Container className="mx-auto my-10 p-4 max-w-[600px]">
          <Heading className="text-2xl font-bold tracking-tight text-slate-900 m-0 mb-8">
            Ваш промокод сработал! 💰
          </Heading>
          <Section className="mb-8">
            <Text className="text-base leading-relaxed m-0 mb-6">
              Привет, {name}! Кто-то из ваших друзей поехал в тур по вашему промокоду. Как мы и обещали, вы получаете вознаграждение!
            </Text>
            <div className="bg-teal-50 rounded-2xl p-8 border border-teal-100 text-center">
              <Text className="m-0 mb-1 text-xs uppercase tracking-widest text-teal-600 font-bold">Начислено на баланс</Text>
              <Text className="m-0 mb-6 text-3xl font-black text-teal-600">+{amount} ₽</Text>
              <Button href={`${siteUrl}/account`} className="bg-slate-900 text-white font-bold py-4 px-8 rounded-xl w-full text-center">
                👤 В личный кабинет
              </Button>
            </div>
            <Text className="text-sm text-slate-500 mt-6 text-center italic">
              Используйте эти баллы для оплаты любого следующего приключения!
            </Text>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);