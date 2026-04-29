import * as React from 'react';
import {
  Body, Container, Head, Heading, Hr, Html,
  Preview, Section, Text, Tailwind, Button, Link
} from '@react-email/components';

interface PaymentReminder24hEmailProps {
  name: string;
  tourTitle: string;
  shortId: string | number;
  price: number;
  currency: string;
  paymentMethod: string;
  biletpmrLink?: string | null;
  apbQrLink?: string | null;
  bookingLink: string;
  siteUrl: string;
}

export const PaymentReminder24hEmail = ({
  name,
  tourTitle,
  shortId,
  price,
  currency,
  paymentMethod,
  biletpmrLink,
  apbQrLink,
  bookingLink,
  siteUrl,
}: PaymentReminder24hEmailProps) => {
  const managerLink = "https://t.me/romansvtirase";

  return (
    <Html>
      <Head />
      <Preview>⏳ Осталось 24 часа для оплаты тура «{tourTitle}»</Preview>
      <Tailwind>
        <Body className="bg-white font-sans text-slate-900">
          <Container className="mx-auto my-10 p-4 max-w-[600px]">
            <Heading className="text-2xl font-bold tracking-tight text-slate-900 m-0 mb-8">
              Места могут сгореть ⏳
            </Heading>

            <Section className="mb-8">
              <Text className="text-base leading-relaxed m-0 mb-4">
                Привет, {name}! Прошли сутки с момента бронирования тура «{tourTitle}» (Билет <b>#{shortId}</b>).
              </Text>
              
              <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 mb-6">
                <Text className="m-0 mb-2 text-sm font-bold text-amber-900 uppercase tracking-tight">
                  Осталось 24 часа
                </Text>
                <Text className="m-0 text-sm text-amber-800 leading-relaxed font-medium">
                  Ваши места пока закреплены за вами, но время на исходе. Если оплата не поступит в течение 24 часов, система автоматически вернёт их в продажу.
                </Text>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <Text className="m-0 mb-1 text-[10px] uppercase tracking-widest text-slate-400 font-bold">Сумма к оплате</Text>
                <Text className="m-0 text-xl font-bold text-teal-600">
                  {price} {currency}
                </Text>
              </div>
            </Section>

            {/* Прямые кнопки на оплату для удобства */}
            <Section className="mb-8">
              {paymentMethod === 'biletpmr' && (
                <Button href={biletpmrLink || bookingLink} className="bg-slate-900 text-white font-bold py-4 px-8 rounded-xl w-full text-center mb-3">
                  💳 Оплатить картой онлайн
                </Button>
              )}

              {paymentMethod === 'qr' && (
                <Button href={apbQrLink || bookingLink} className="bg-slate-900 text-white font-bold py-4 px-8 rounded-xl w-full text-center mb-3">
                  📱 Открыть реквизиты (Клевер)
                </Button>
              )}

              {/* Альтернативная кнопка (вдруг не получается оплатить) */}
              <Button href={managerLink} className="bg-slate-100 text-slate-900 font-bold py-4 px-8 rounded-xl w-full text-center hover:bg-slate-200 transition-colors">
                Помощь с переводом
              </Button>
            </Section>

            <Hr className="border-slate-100 my-8" />

            <Section className="text-center">
              <Link href={bookingLink} className="text-xs text-slate-400 underline mr-4">Открыть билет</Link>
              <Link href={`${siteUrl}/faq`} className="text-xs text-slate-400 underline">Частые вопросы</Link>
              <Text className="text-[10px] text-slate-300 mt-6 leading-relaxed">
                Турклуб ЭВА. Ждём вас на маршруте!
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default PaymentReminder24hEmail;