import * as React from 'react';
import {
  Body, Container, Head, Heading, Hr, Html,
  Preview, Section, Text, Tailwind, Button, Link
} from '@react-email/components';

interface BookingCancelledEmailProps {
  name: string;
  tourTitle: string;
  shortId: string | number;
  siteUrl: string;
}

export const BookingCancelledEmail = ({
  name,
  tourTitle,
  shortId,
  siteUrl,
}: BookingCancelledEmailProps) => {
  const managerLink = "https://t.me/romansvtirase";

  return (
    <Html>
      <Head />
    <Preview>{`Ваша бронь #${shortId} на тур «${tourTitle}» отменена`}</Preview>
      <Tailwind>
        <Body className="bg-white font-sans text-slate-900">
          <Container className="mx-auto my-10 p-4 max-w-[600px]">
            <Heading className="text-2xl font-bold tracking-tight text-slate-900 m-0 mb-8">
              Бронь отменена
            </Heading>

            <Section className="mb-8">
              <Text className="text-base leading-relaxed m-0 mb-4">
                Привет, {name}! Вынуждены сообщить, что ваша заявка <b>#{shortId}</b> на тур «{tourTitle}» была аннулирована.
              </Text>
              
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-6">
                <Text className="m-0 mb-2 text-sm font-bold text-slate-700 uppercase tracking-tight">
                  Почему это произошло?
                </Text>
                <Text className="m-0 text-sm text-slate-600 leading-relaxed">
                  Обычно это происходит, если истекло время ожидания оплаты (24 часа), либо вы сами попросили нас отменить заявку. Места возвращены в свободную продажу.
                </Text>
              </div>
            </Section>

            {/* Возвращаем в воронку продаж */}
            <Section className="mb-8 text-center bg-slate-900 rounded-2xl p-8">
              <Text className="m-0 mb-4 text-base font-bold text-white leading-relaxed">
                Горы никуда не убегут! 🏔️
              </Text>
              <Text className="m-0 mb-6 text-sm text-slate-300 leading-relaxed">
                Будем рады видеть вас, когда появится настроение и время. У нас всегда есть классные маршруты на выходные.
              </Text>
              <Button
                href={`${siteUrl}/tour`}
                className="bg-white text-slate-900 font-black py-4 px-8 rounded-xl w-full text-center uppercase tracking-wider"
              >
                Выбрать другое приключение
              </Button>
            </Section>

            <Hr className="border-slate-100 my-8" />

            <Section className="text-center">
              <Text className="text-xs text-slate-400 leading-relaxed mb-4">
                Считаете, что произошла ошибка?{' '}
                <Link href={managerLink} className="text-teal-600 underline font-medium">
                  Срочно напишите менеджеру
                </Link>
                , и мы постараемся всё исправить.
              </Text>
              <Text className="text-[10px] text-slate-300 mt-6 leading-relaxed">
                Турклуб ЭВА. До новых встреч!
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default BookingCancelledEmail;