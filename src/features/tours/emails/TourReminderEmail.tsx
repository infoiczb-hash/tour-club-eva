import * as React from 'react';
import {
  Body, Container, Head, Heading, Hr, Html,
  Preview, Section, Text, Tailwind, Button, Link,
} from '@react-email/components';

interface ChecklistItem {
  title: string;
  items: string;
}

interface TourReminderEmailProps {
  name: string;
  tourTitle: string;
  meetingPoint: string;
  meetingTime: string;
  daysLeft: number;
  paymentMethod: string;
  price: number;
  currency: string;
  bookingLink: string;
  tourDate?: string;
  importantInfo?: string | null;
  checklist?: ChecklistItem[];
  groupChatUrl?: string | null;
  siteUrl: string;
}

export const TourReminderEmail = ({
  name,
  tourTitle,
  meetingPoint,
  meetingTime,
  daysLeft,
  paymentMethod,
  price,
  currency,
  bookingLink,
  tourDate,
  importantInfo,
  checklist = [],
  groupChatUrl,
  siteUrl,
}: TourReminderEmailProps) => {
  const isTomorrow = daysLeft === 1;
  const isUnpaid = paymentMethod === 'cash' || paymentMethod === 'foreign';
  const cancellationPolicyLink = `${siteUrl}/faq#cancellation`;

  return (
    <Html>
      <Head />
      <Preview>
        {isTomorrow
          ? `Завтра старт! Сбор в ${meetingTime}, «${tourTitle}»`
          : `До тура «${tourTitle}» осталось 3 дня — пора собирать рюкзак 🏕️`}
      </Preview>
      <Tailwind>
        <Body className="bg-white font-sans text-slate-900">
          <Container className="mx-auto my-10 p-4 max-w-[600px]">
            <Heading className="text-2xl font-bold tracking-tight text-slate-900 m-0 mb-8">
              {isTomorrow ? 'Завтра в путь! 🔥' : 'Скоро отправляемся! 🏕️'}
            </Heading>

            <Section className="mb-8">
              <Text className="text-base leading-relaxed m-0 mb-4">
                Привет, {name}! {isTomorrow 
                  ? `Уже завтра мы встречаемся на маршруте «${tourTitle}». Проверьте детали сбора.` 
                  : `До нашего приключения «${tourTitle}» осталось 3 дня. Самое время проверить снаряжение.`}
              </Text>
              
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <Text className="m-0 mb-1 text-[10px] uppercase tracking-widest text-slate-400 font-bold">Дата и время</Text>
                <Text className="m-0 mb-4 text-lg font-bold text-slate-900">{tourDate || 'Ближайшие выходные'} в {meetingTime}</Text>
                
                <Text className="m-0 mb-1 text-[10px] uppercase tracking-widest text-slate-400 font-bold">Место сбора</Text>
                <Text className="m-0 text-sm font-bold text-slate-700">{meetingPoint}</Text>
              </div>
            </Section>

            {/* Блок для неоплаченных броней (Критично) */}
            {isUnpaid && (
              <Section className="mb-8 bg-amber-50 rounded-2xl p-6 border border-amber-100">
                <Text className="m-0 mb-2 text-sm font-bold text-amber-900 uppercase tracking-tight">Нужно подтверждение</Text>
                <Text className="m-0 mb-4 text-xs text-amber-800 leading-relaxed font-medium">
                  У вас выбрана <b>оплата на месте ({price} {currency})</b>. Пожалуйста, подтвердите своё участие по ссылке ниже, чтобы мы сохранили за вами место в трансфере.
                </Text>
                <Button href={bookingLink} className="bg-amber-500 text-slate-900 font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-wider">
                    Я точно буду
                </Button>
              </Section>
            )}

            {/* Групповой чат */}
            {groupChatUrl && !isUnpaid && (
              <Section className="mb-8">
                <Text className="m-0 mb-3 text-xs uppercase tracking-widest text-slate-400 font-bold">Связь с группой</Text>
                <Button href={groupChatUrl} className="bg-[#2AABEE] text-white font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-wider">
                  Вступить в чат в Telegram
                </Button>
              </Section>
            )}

            {/* Чеклист снаряжения (Если есть) */}
            {checklist.length > 0 && (
              <Section className="mb-8 bg-slate-50 rounded-2xl p-6">
                <Text className="m-0 mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Что взять с собой</Text>
                {checklist.map((item, idx) => (
                  <div key={idx} className="mb-3 last:mb-0">
                    <Text className="m-0 text-[11px] font-bold text-slate-900 uppercase tracking-tight">{item.title}</Text>
                    <Text className="m-0 text-xs text-slate-600 leading-relaxed">{item.items}</Text>
                  </div>
                ))}
              </Section>
            )}

            {importantInfo && (
              <Section className="mb-8 border-l-4 border-slate-200 pl-6">
                <Text className="m-0 text-xs text-slate-500 italic">
                  ⚠️ <b>Памятка гида:</b> {importantInfo}
                </Text>
              </Section>
            )}

           {/* Основная кнопка (если не выведена кнопка подтверждения) */}
            {!(isTomorrow && isUnpaid) && (
              <Button href={bookingLink} className="bg-teal-500 text-white font-bold px-6 py-3 rounded-xl uppercase tracking-wider block w-full text-center">
                Открыть билет и детали
              </Button>
            )}

            <Hr className="border-slate-100 my-8" />

            <Section className="text-center">
              <Link href={cancellationPolicyLink} className="text-xs text-slate-400 underline mr-4">Политика отмены</Link>
              <Link href="https://t.me/romansvtirase" className="text-xs text-slate-400 underline">Написать менеджеру</Link>
              <Text className="text-[10px] text-slate-300 mt-6 leading-relaxed">
                Турклуб ЭВА. До встречи на старте! 🌲
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default TourReminderEmail;