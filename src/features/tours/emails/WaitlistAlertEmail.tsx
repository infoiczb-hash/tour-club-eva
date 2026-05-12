import * as React from 'react';
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text, Tailwind, Button, Link } from '@react-email/components';

interface WaitlistAlertEmailProps {
  name: string;
  tourTitle: string;
  tourSlug: string;
  siteUrl: string;
}

export const WaitlistAlertEmail = ({ name, tourTitle, tourSlug, siteUrl }: WaitlistAlertEmailProps) => (
  <Html>
    <Head />
    <Preview>🔥 Места появились! Успейте забронировать тур «{tourTitle}»</Preview>
    <Tailwind>
      <Body className="bg-white font-sans text-slate-900">
        <Container className="mx-auto my-10 p-4 max-w-[600px]">
          <Heading className="text-2xl font-bold tracking-tight text-slate-900 m-0 mb-8">
            Хорошие новости! 🔥
          </Heading>
          <Section className="mb-8">
            <Text className="text-base leading-relaxed m-0 mb-4">
              Привет, {name}! Вы интересовались туром <b>«{tourTitle}»</b>, но мест не было. 
              <br /><br />
              Кто-то из участников изменил планы, и в системе освободилось место. А может, мы добавили новую дату! В любом случае — это ваш шанс.
            </Text>
            <div className="bg-teal-50 rounded-2xl p-6 border border-teal-100 text-center">
              <Text className="m-0 mb-4 text-sm font-bold text-teal-900 uppercase tracking-widest">Действуйте быстро</Text>
              <Button href={`${siteUrl}/tour/${tourSlug}`} className="bg-slate-900 text-white font-bold py-4 px-8 rounded-xl w-full text-center">
                ⚡️ Забронировать место
              </Button>
              <Text className="m-0 mt-3 text-xs text-teal-600 font-bold uppercase">Кто успеет первым — тот и едет</Text>
            </div>
          </Section>
          <Hr className="border-slate-100 my-8" />
          <Section className="text-center">
            <Text className="text-xs text-slate-300 leading-relaxed italic">
              Турклуб ЭВА. Приключения ближе, чем кажется.
            </Text>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);