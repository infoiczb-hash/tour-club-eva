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

interface BookingConfirmedEmailProps {
  name: string;
  tourTitle: string;
  meetingPoint: string;
  meetingTime: string;
  importantInfo?: string | null;
  groupChatUrl?: string | null;
  siteUrl: string;
  shortId: number | string;
}

export const BookingConfirmedEmail = ({
  name,
  tourTitle,
  meetingPoint,
  meetingTime,
  importantInfo,
  groupChatUrl,
  siteUrl,
  shortId,
}: BookingConfirmedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Ваше место в туре «{tourTitle}» подтверждено!</Preview>
      <Tailwind>
        <Body className="bg-slate-50 font-sans text-slate-900">
          <Container className="mx-auto my-10 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-xl">
            <Section className="text-center mb-6">
              <Heading className="text-2xl font-black text-slate-900 m-0 uppercase tracking-wider">
                ТУРКЛУБ EVA
              </Heading>
              <Text className="text-emerald-600 font-bold m-0 mt-2">
                Бронь #{shortId} подтверждена! 🎉
              </Text>
            </Section>

            <Hr className="border-slate-200 my-6" />

            <Section>
              <Text className="text-base">
                Привет, <strong>{name}</strong>!
              </Text>
              <Text className="text-base text-slate-600 leading-relaxed">
                Мы успешно проверили вашу оплату. Участие в приключении <strong>«{tourTitle}»</strong> официально подтверждено!
              </Text>
            </Section>

            <Section className="bg-slate-50 rounded-xl p-6 my-6 border border-slate-100">
              <Text className="m-0 mb-2 text-sm text-slate-400 font-bold uppercase tracking-widest">
                Информация по сбору
              </Text>
              <Text className="m-0 mb-1 text-base"><strong>📍 Место:</strong> {meetingPoint}</Text>
              <Text className="m-0 text-base"><strong>⏰ Время:</strong> {meetingTime}</Text>
            </Section>

            {importantInfo && (
              <Section className="bg-amber-50 rounded-xl p-6 my-6 border border-amber-100">
                <Text className="m-0 mb-2 text-sm text-amber-500 font-bold uppercase tracking-widest">
                  Важно знать
                </Text>
                <Text className="m-0 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {importantInfo}
                </Text>
              </Section>
            )}

            {groupChatUrl && (
              <Section className="text-center my-6">
                <Button
                  href={groupChatUrl}
                  className="bg-[#2AABEE] text-white font-bold px-6 py-3 rounded-xl uppercase tracking-wider block w-full"
                >
                  Вступить в чат группы (Telegram)
                </Button>
                <Text className="text-xs text-slate-400 mt-2">Там будет вся оперативная инфо от гида</Text>
              </Section>
            )}

            <Section className="text-center mt-6">
              <Button
                href={`${siteUrl}/account/bookings`}
                className="bg-teal-500 text-white font-bold px-6 py-3 rounded-xl uppercase tracking-wider block w-full"
              >
                Детали и билеты в кабинете
              </Button>
            </Section>

            <Hr className="border-slate-200 my-6" />

            <Section>
              <Text className="text-xs text-slate-400 text-center leading-relaxed">
                Спасибо, что выбираете нас. До скорой встречи на маршруте! 🏕️
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default BookingConfirmedEmail;