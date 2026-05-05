import * as React from 'react';
import {
  Body, Container, Head, Heading, Hr, Html,
  Preview, Section, Text, Tailwind, Button, Link,
} from '@react-email/components';

interface GuestItem {
  name: string;
  type?: string;   // 'adult' | 'child' | 'family' | 'member'
  age?: string;
  isMain?: boolean;
}

interface BookingTicketEmailProps {
  name: string;
  tourTitle: string;
  tourDate: string;
  shortId: string | number;
  totalPrice: number;
  currency: string;
  paymentMethod: string;
  ticketsCount: number;
  siteUrl: string;
  appliedDiscount?: number;
  guests?: GuestItem[];
  biletpmrLink?: string | null;
  apbQrLink?: string | null;
  isGuest?: boolean;
}

const ticketTypeLabels: Record<string, string> = {
  adult:  'Взрослый',
  child:  'Детский',
  family: 'Семейный',
  member: 'Клубный',
};

const paymentLabels: Record<string, string> = {
  biletpmr: 'BiletPMR',
  qr:       'Клевер / АПБ)',
  cash:     'Наличными гиду',
  foreign:  'Перевод из-за рубежа',
};

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
  appliedDiscount,
  guests = [],
  biletpmrLink,
  apbQrLink,
  isGuest = false,
}: BookingTicketEmailProps) => {
  const managerLink = "https://t.me/romansvtirase";
  const cancellationPolicyLink = `${siteUrl}/faq#cancellation`;

  return (
    <Html>
      <Head />
   <Preview>{`Ваша заявка #${shortId} на тур «${tourTitle}» принята`}</Preview>
      <Tailwind>
        <Body className="bg-white font-sans text-slate-900">
          <Container className="mx-auto my-10 p-4 max-w-[600px]">
            <Heading className="text-2xl font-bold tracking-tight text-slate-900 m-0 mb-8">
              Заявка принята 🎉
            </Heading>

            <Section className="mb-8">
              <Text className="text-base leading-relaxed m-0 mb-4">
                Привет, {name}! Мы получили вашу заявку на участие в приключении. Места забронированы на 48 часов до подтверждения оплаты.
              </Text>
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <Text className="m-0 mb-1 text-[10px] uppercase tracking-widest text-slate-400 font-bold">Тур и дата</Text>
                <Text className="m-0 mb-4 text-lg font-bold text-slate-900">{tourTitle} — {tourDate}</Text>
                
                <Text className="m-0 mb-1 text-[10px] uppercase tracking-widest text-slate-400 font-bold">К оплате</Text>
                <Text className="m-0 text-xl font-bold text-teal-600">
                  {totalPrice} {currency} {appliedDiscount ? <span className="text-xs font-medium text-slate-400 line-through ml-2">{(totalPrice + appliedDiscount)}</span> : null}
                </Text>
              </div>
            </Section>

          {/* Состав участников (Минималистично) */}
            {guests.length > 0 && (
              <Section className="mb-8">
                <Text className="m-0 mb-3 text-xs uppercase tracking-widest text-slate-400 font-bold">Участники ({ticketsCount})</Text>
                {guests.map((guest, idx) => (
                  <div key={idx} className={`flex justify-between py-2 text-sm ${idx === guests.length - 1 ? '' : 'border-b border-slate-50'}`}>
                    <span className="font-medium">{guest.name}</span>
                    <span className="text-slate-500">{guest.type ? ticketTypeLabels[guest.type] : 'Билет'}</span>
                  </div>
                ))}
              </Section>
            )}

            {/* Блок оплаты */}
            <Section className="mb-8">
              <Text className="m-0 mb-4 text-sm font-bold uppercase tracking-wider">Способ оплаты: {paymentLabels[paymentMethod]}</Text>
              <Text className="m-0 mb-4 text-sm text-slate-600 leading-relaxed bg-teal-50 p-4 rounded-xl border border-teal-100">
                💡 <b>Как подтвердить оплату?</b> <br/> 
                Если у вас не работает наш Telegram-бот, просто оплатите тур по кнопке ниже и загрузите скриншот чека напрямую в <b>Личном кабинете</b> на сайте. Мы увидим его мгновенно.
              </Text>
              {paymentMethod === 'biletpmr' && (
                <Button href={biletpmrLink || managerLink} className="bg-slate-900 text-white font-bold py-4 px-8 rounded-xl w-full text-center">
                  Оплатить картой онлайн
                </Button>
              )}

              {paymentMethod === 'qr' && (
                <Button href={apbQrLink || managerLink} className="bg-slate-900 text-white font-bold py-4 px-8 rounded-xl w-full text-center">
                  Открыть реквизиты (QR)
                </Button>
              )}

              {(paymentMethod === 'cash' || paymentMethod === 'foreign') && (
                <div className="space-y-4">
                   <Text className="m-0 text-sm text-slate-600 leading-relaxed italic">
                    {paymentMethod === 'cash' 
                      ? "Оплата наличными гиду в день старта. Накануне мы попросим подтвердить участие — это важно." 
                      : "Для перевода из-за рубежа, пожалуйста, свяжитесь с нашим менеджером для получения инструкций."}
                  </Text>
                  <Button href={managerLink} className="border-2 border-slate-900 text-slate-900 font-bold py-4 px-8 rounded-xl w-full text-center">
                    Написать менеджеру
                  </Button>
                </div>
              )}
            </Section>

            <Hr className="border-slate-100 my-8" />

            <Section className="text-center">
              <Link href={cancellationPolicyLink} className="text-xs text-slate-400 underline mr-4">Политика отмены</Link>
              <Link href={`${siteUrl}/account/bookings`} className="text-xs text-slate-400 underline">Личный кабинет</Link>
              <Text className="text-[10px] text-slate-300 mt-6 leading-relaxed">
                Турклуб ЭВА. Приключения начинаются здесь. <br/>
                Вопросы? @romansvtirase в Telegram.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default BookingTicketEmail;