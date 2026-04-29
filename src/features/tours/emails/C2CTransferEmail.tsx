import * as React from 'react';
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text, Tailwind, Button } from '@react-email/components';

interface C2CTransferEmailProps {
  name: string;
  senderName: string;
  tourTitle: string;
  tourDate: string;
  siteUrl: string;
  shortId: string;
}

export const C2CTransferEmail = ({ name, senderName, tourTitle, tourDate, siteUrl, shortId }: C2CTransferEmailProps) => (
  <Html>
    <Head />
    <Preview>🎁 Вам передали билет на тур «{tourTitle}»!</Preview>
    <Tailwind>
      <Body className="bg-white font-sans text-slate-900">
        <Container className="mx-auto my-10 p-4 max-w-[600px]">
          <Heading className="text-2xl font-bold tracking-tight text-slate-900 m-0 mb-8">
            Вам подарок! 🎁
          </Heading>
          <Section className="mb-8">
            <Text className="text-base leading-relaxed m-0 mb-6">
              Привет, {name}! <b>{senderName}</b> передал вам своё место в туре <b>«{tourTitle}»</b>, который состоится <b>{tourDate}</b>.
            </Text>
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 text-center shadow-sm">
              <Text className="m-0 mb-1 text-[10px] uppercase tracking-widest text-slate-400 font-bold">Ваш билет</Text>
              <Text className="m-0 mb-6 text-xl font-black text-slate-900">#{shortId}</Text>
              <Button href={`${siteUrl}/account/bookings`} className="bg-slate-900 text-white font-bold py-4 px-8 rounded-xl w-full text-center">
                🎫 Открыть билет и детали
              </Button>
            </div>
            <Text className="text-xs text-slate-400 mt-6 leading-relaxed">
              * Если у вас ещё нет аккаунта, просто войдите на сайт под своим Email — билет уже привязан к нему.
            </Text>
          </Section>
          <Hr className="border-slate-100 my-8" />
          <Section className="text-center">
            <Text className="text-[10px] text-slate-300">Турклуб ЭВА. До встречи на маршруте!</Text>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);