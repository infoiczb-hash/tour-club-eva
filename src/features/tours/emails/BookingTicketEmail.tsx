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

interface BookingTicketEmailProps {
  name: string;
  tourTitle: string;
  tourDate: string;
  shortId: number;
  totalPrice: number;
  currency: string;
  paymentMethod: string;
  ticketsCount: number;
  siteUrl: string;
}

export const BookingTicketEmail = ({
  name,
  tourTitle,
  tourDate,
  shortId,
  totalPrice,
  currency,
  paymentMethod,
  ticketsCount,
  siteUrl,
}: BookingTicketEmailProps) => {
  const paymentLabels: Record<string, string> = {
    biletpmr: 'Онлайн (Картой)',
    qr: 'QR-код Агропромбанк',
    cash: 'Наличными гиду',
    foreign: 'Перевод / Иностранная карта'
  };

  return (
    <Html>
      <Head />
      <Preview>Ваш билет на тур «{tourTitle}» оформлен!</Preview>
      <Tailwind>
        <Body className="bg-slate-50 font-sans text-slate-900">
          <Container className="mx-auto my-10 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-xl">
            <Section className="text-center mb-6">
              <Heading className="text-2xl font-black text-slate-900 m-0 uppercase tracking-wider">
                ТУРКЛУБ EVA
              </Heading>
              <Text className="text-teal-600 font-bold m-0 mt-2">
                Заявка #{shortId} успешно создана
              </Text>
            </Section>

            <Hr className="border-slate-200 my-6" />

            <Section>
              <Text className="text-base">
                Привет, <strong>{name}</strong>! 👋
              </Text>
              <Text className="text-base text-slate-600 leading-relaxed">
                Вы забронировали {ticketsCount} мест(а) на приключение <strong>«{tourTitle}»</strong>. 
                Мы сохранили за вами места!
              </Text>
            </Section>

            <Section className="bg-slate-50 rounded-xl p-6 my-6 border border-slate-100">
              <Text className="m-0 mb-2 text-sm text-slate-300 font-bold uppercase tracking-widest">
                Детали брони
              </Text>
              <Text className="m-0 mb-1 text-base"><strong>Дата:</strong> {tourDate}</Text>
              <Text className="m-0 mb-1 text-base"><strong>Сумма:</strong> {totalPrice} {currency}</Text>
              <Text className="m-0 text-base"><strong>Оплата:</strong> {paymentLabels[paymentMethod] || paymentMethod}</Text>
            </Section>

            <Section className="text-center">
              <Button
                href={`${siteUrl}/account/bookings`}
                className="bg-teal-500 text-white font-bold px-6 py-3 rounded-xl uppercase tracking-wider"
              >
                Открыть личный кабинет
              </Button>
            </Section>

            <Hr className="border-slate-200 my-6" />

            <Section>
              <Text className="text-xs text-slate-300 text-center leading-relaxed">
                Если у вас изменились планы, пожалуйста, предупредите нас заранее. <br />
                До встречи на маршруте! 🏕️
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default BookingTicketEmail;