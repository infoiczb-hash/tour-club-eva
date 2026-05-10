import * as React from 'react';
import {
  Body, Container, Head, Heading, Hr, Html,
  Preview, Section, Text, Tailwind, Button, Link,
} from '@react-email/components';

interface GuestItem {
  name: string;
  type?: string;
}

interface ChecklistItem {
  title: string;
  items: string;
}

interface BookingConfirmedEmailProps {
  name: string;
  tourTitle: string;
  tourDate: string;
  totalPrice: number;
  currency: string;
  meetingPoint: string;
  meetingTime: string;
  shortId: string | number;
  siteUrl: string;
  ticketsCount: number;
  guests?: GuestItem[];
  importantInfo?: string | null;
  checklist?: ChecklistItem[];
  groupChatUrl?: string | null;
}

const ticketTypeLabels: Record<string, string> = {
  adult:  'Взрослый',
  child:  'Детский',
  family: 'Семейный',
  member: 'Клубный',
};

export const BookingConfirmedEmail = ({
  name,
  tourTitle,
  tourDate,
  totalPrice,
  currency,
  meetingPoint,
  meetingTime,
  shortId,
  siteUrl,
  ticketsCount,
  guests = [],
  importantInfo,
  checklist = [],
  groupChatUrl,
}: BookingConfirmedEmailProps) => {
  const accountLink = `${siteUrl}/account/bookings`;
  const cancellationPolicyLink = `${siteUrl}/faq#cancellation`;

  return (
    <Html>
      <Head />
      <Preview>Вы едете! Участие в туре «{tourTitle}» подтверждено 🎉</Preview>
      <Tailwind>
        <Body className="bg-white font-sans text-slate-900">
          <Container className="mx-auto my-10 p-4 max-w-[600px]">
            <Heading className="text-2xl font-bold tracking-tight text-slate-900 m-0 mb-8">
              Вы едете! 🎉
            </Heading>

            <Section className="mb-8">
              <Text className="text-base leading-relaxed m-0 mb-4">
                Привет, {name}! Оплата получена, ваше участие в приключении официально подтверждено.
              </Text>
              
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <Text className="m-0 mb-1 text-[10px] uppercase tracking-widest text-slate-400 font-bold">Тур и дата</Text>
                <Text className="m-0 mb-4 text-lg font-bold text-slate-900">{tourTitle} — {tourDate}</Text>
                
                <div className="flex gap-8">
                  <div>
                    <Text className="m-0 mb-1 text-[10px] uppercase tracking-widest text-slate-400 font-bold">Билет</Text>
                    <Text className="m-0 text-sm font-bold text-slate-700">#{shortId}</Text>
                  </div>
                  <div>
                    <Text className="m-0 mb-1 text-[10px] uppercase tracking-widest text-slate-400 font-bold">Оплачено</Text>
                    <Text className="m-0 text-sm font-bold text-teal-600">{totalPrice} {currency}</Text>
                  </div>
                </div>
              </div>
            </Section>

            {/* Логистика (Компактно) */}
            <Section className="mb-8 border-l-4 border-teal-500 pl-6">
              <Text className="m-0 mb-4 text-sm font-bold uppercase tracking-wider">Детали встречи</Text>
              <Text className="m-0 mb-2 text-sm">📍 <b>Место:</b> {meetingPoint}</Text>
              <Text className="m-0 mb-4 text-sm">⏰ <b>Время:</b> {meetingTime}</Text>
              
              {groupChatUrl && (
                <Button href={groupChatUrl} className="bg-[#2AABEE] text-white font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-wider">
                  Вступить в чат группы
                </Button>
              )}
            </Section>

          {/* Состав участников */}
{guests.length > 0 && (
  <Section className="mb-8">
    <Text className="m-0 mb-3 text-xs uppercase tracking-widest text-slate-400 font-bold">
      Список участников ({ticketsCount})
    </Text>
    {guests.map((guest, idx) => (
      <div 
        key={idx} 
        className={`flex justify-between py-2 text-sm ${
          idx === guests.length - 1 ? "" : "border-b border-slate-50"
        }`}
      >
        <span className="font-medium">{guest.name}</span>
        <span className="text-slate-500">
          {guest.type ? ticketTypeLabels[guest.type] : 'Билет'}
        </span>
      </div>
    ))}
  </Section>
)}

         {/* Снаряжение (Если есть) */}
            {checklist.length > 0 && (
              <Section className="mb-8 bg-slate-50 rounded-2xl p-6">
                <Text className="m-0 mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Что взять с собой</Text>
                {checklist.map((item, idx) => (
                  <div key={idx} className={idx === checklist.length - 1 ? "m-0" : "mb-3"}>
                    <Text className="m-0 text-[11px] font-bold text-slate-900 uppercase tracking-tight">{item.title}</Text>
                    <Text className="m-0 text-xs text-slate-600 leading-relaxed">{item.items}</Text>
                  </div>
                ))}
              </Section>
            )}

            {importantInfo && (
              <Section className="mb-8">
                <Text className="m-0 text-xs text-slate-500 italic">
                  ⚠️ <b>Важно:</b> {importantInfo}
                </Text>
              </Section>
            )}

            <Button href={accountLink} className="bg-slate-900 text-white font-bold py-4 px-8 rounded-xl w-full text-center">
              Открыть билет в кабинете
            </Button>

            <Hr className="border-slate-100 my-8" />

            <Section className="text-center">
              <Link href={cancellationPolicyLink} className="text-xs text-slate-400 underline mr-4">Политика отмены</Link>
              <Link href={`${siteUrl}/faq`} className="text-xs text-slate-400 underline">Помощь</Link>
              <Text className="text-[10px] text-slate-300 mt-6 leading-relaxed">
                Турклуб ЭВА. До встречи на маршруте! 🏕️
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default BookingConfirmedEmail;