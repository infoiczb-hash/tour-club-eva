import * as React from 'react';
import {
  Body, Container, Head, Heading, Hr, Html,
  Preview, Section, Text, Tailwind, Button, Link
} from '@react-email/components';

interface PaymentRejectedEmailProps {
  name: string;
  tourTitle: string;
  shortId: string | number;
  bookingLink: string;
  siteUrl: string;
}

export const PaymentRejectedEmail = ({
  name,
  tourTitle,
  shortId,
  bookingLink,
  siteUrl,
}: PaymentRejectedEmailProps) => {
  const managerLink = "https://t.me/romansvtirase";

  return (
    <Html>
      <Head />
      <Preview>Ой! С чеком для тура «{tourTitle}» что-то не так ⚠️</Preview>
      <Tailwind>
        <Body className="bg-white font-sans text-slate-900">
          <Container className="mx-auto my-10 p-4 max-w-[600px]">
            <Heading className="text-2xl font-bold tracking-tight text-slate-900 m-0 mb-8">
              Ошибка проверки чека ⚠️
            </Heading>

            <Section className="mb-8">
              <Text className="text-base leading-relaxed m-0 mb-4">
                Привет, {name}! Мы проверили оплату для вашей заявки <b>#{shortId}</b> на тур «{tourTitle}», но не смогли её подтвердить.
              </Text>
              
              {/* Блок с предупреждением */}
              <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
                <Text className="m-0 mb-2 text-sm font-bold text-red-900 uppercase tracking-tight">
                  Почему это могло произойти?
                </Text>
                <Text className="m-0 text-sm text-red-800 leading-relaxed">
                  Возможно, скриншот обрезан, на нём не видно реквизитов или платеж пока обрабатывается банком. 
                  <br /><br />
                  Не волнуйтесь, <b>ваша бронь всё ещё активна</b>! Просто загрузите правильный скриншот перевода заново.
                </Text>
              </div>
            </Section>

            {/* CTA */}
            <Section className="mb-8">
              <Button
                href={bookingLink}
                className="bg-slate-900 text-white font-bold py-4 px-8 rounded-xl w-full text-center"
              >
                Загрузить чек заново
              </Button>
            </Section>

            <Hr className="border-slate-100 my-8" />

            <Section className="text-center">
              <Text className="text-xs text-slate-400 leading-relaxed mb-4">
                Если деньги точно списались, а чек всё равно отклоняют,{' '}
                <Link href={managerLink} className="text-teal-600 underline font-medium">
                  напишите нашему менеджеру
                </Link>
                , мы разберемся в ситуации вручную.
              </Text>
              <Text className="text-[10px] text-slate-300 mt-6 leading-relaxed">
                Турклуб ЭВА. Мы на связи!
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default PaymentRejectedEmail;