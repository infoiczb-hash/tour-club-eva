import { env } from '@/lib/env';
import { render } from '@react-email/components'; // 🔥 ДОБАВЛЕНО
import { BookingConfirmedEmail } from '@/features/tours/emails/BookingConfirmedEmail'; // 🔥 ДОБАВЛЕНО
import { TourReminderEmail } from '@/features/tours/emails/TourReminderEmail';
import { PostTourReviewEmail } from '@/features/tours/emails/PostTourReviewEmail';


export type AppEvent = 
  | 'BOOKING_CREATED'
  | 'PAYMENT_MODERATION_RECEIVED'
  | 'BOOKING_CONFIRMED'
  | 'PAYMENT_REJECTED'
  | 'BOOKING_CANCELLED'
  | 'PAYMENT_REMINDER_24H'
  | 'BOOKING_AUTO_CANCELLED'
  | 'TOUR_TOMORROW_REMINDER'
  | 'NEW_DATES_PUBLISHED'
  | 'WAITLIST_ALERT'
  | 'REVIEW_REQUEST'
  | 'CASHBACK_RECEIVED'
  | 'C2C_TICKET_TRANSFER'
  | 'BROADCAST_MESSAGE'
  | 'TOUR_3DAY_REMINDER'
  | 'POST_TOUR_REVIEW'
  | 'REVIEW_PUBLISHED'
  | 'WIN_BACK_OFFER'
  | 'CROSS_SELL_OFFER';

  export interface NotificationContent {
  inApp: {
    type: 'info' | 'success' | 'error' | 'warning' | 'bonus' | 'system';
    title: string;
    message: string;
    link: string;
  };
  telegram: {
    text: string;
    // Кнопки опциональны, внутри может быть url ИЛИ callback_data
    buttons?: Array<Array<{ text: string; url?: string; callback_data?: string }>>;
  };
  push: {
    title: string;
    body: string;
  } | null;
  email: {
    subject: string;
    html: string;
    forceSend?: boolean;
  } | null;
}

export const NotificationTemplates = {
  // 🔥 ДОБАВИЛИ async и Promise
  async compile(eventId: AppEvent, data: any = {}, profile: any = {}): Promise<NotificationContent | null> {
    const siteUrl = env.NEXT_PUBLIC_SITE_URL || 'https://evatur.club';
    const accountLink = `${siteUrl}/account/bookings`;
    const managerLink = 'https://t.me/romansvtirase';
    
    // 2. ПЕРСОНАЛИЗАЦИЯ И БЕЗОПАСНЫЕ ДАННЫЕ
    const shortId = data.shortId || data.bookingId?.substring(0, 4) || '---';
    const firstName = profile.name ? profile.name.split(' ')[0] : 'Путешественник';
    const tourTitle = data.tourTitle || 'выбранный тур';
    const currency = data.currency || 'MDL';
    const price = data.totalPrice || 0;

    // 3. ЕДИНЫЙ СТИЛЬ ЗАГОЛОВКОВ (Бренд)
    const ICONS = {
      info: '🏕',
      success: '🎉',
      warning: '⚠️',
      error: '❌',
      money: '💳',
      gift: '🎁',
      time: '⏳',
      fire: '🔥'
    };

    switch (eventId) {

      case 'BOOKING_CREATED': {
        let paymentText = '';
        let buttons = [];

        if (data.paymentMethod === 'biletpmr') {
          paymentText = `Если Вам удобно оплатить картой онлайн, можно перейти по ссылке ниже. После оплаты просто отправьте нам билет сюда.`;
          if (data.biletpmrLink) buttons.push([{ text: '🎫 Оплатить (BiletPMR)', url: data.biletpmrLink }]);
        } else if (data.paymentMethod === 'qr') {
          paymentText = `Вы выбрали оплату по системе Клевер (QR-код). Пожалуйста, переведите сумму по реквизитам и отправьте скриншот перевода прямо в этот чат.`;
          buttons.push([{ text: '📱 Реквизиты (Клевер)', url: data.apbQrLink || 'https://qrpay.apb.online/QRT489793839169332' }]);
        } else if (data.paymentMethod === 'cash') {
          paymentText = `Договорились! Подготовьте сумму без сдачи к дню старта. Накануне выезда мы пришлем запрос на подтверждение участия — не пропустите!`;
        } else if (data.paymentMethod === 'foreign') {
          paymentText = `Видим, что вам нужен перевод из другой страны. Свяжитесь с нашим менеджером, мы быстро подберем удобный способ.`;
          buttons.push([{ text: '💬 Написать менеджеру', url: managerLink }]);
        }

        return {
          inApp: { type: 'info', title: 'Заявка создана', message: `Ожидаем оплату за тур «${tourTitle}».`, link: `/account/bookings/${data.bookingId}` },
          telegram: {
            text: `${ICONS.info} Привет, ${firstName}! Ваша заявка <b>#${shortId}</b> на тур «${tourTitle}» успешно создана.\n\n${ICONS.money} <b>К оплате:</b> ${price} ${currency}\n\n${paymentText}`,
            buttons: buttons.length > 0 ? buttons : undefined
          },
          push: { title: `${ICONS.info} Места забронированы`, body: `Ждем оплату за тур ${tourTitle}` },
          email: null 
        };
      }

      case 'PAYMENT_MODERATION_RECEIVED':
        return {
          inApp: { type: 'info', title: 'Чек проверяется', message: `Чек для брони #${shortId} на проверке.`, link: `/account/bookings/${data.bookingId}` },
          telegram: {
            text: `${ICONS.success} Фото чека получено, ${firstName}!\nВзяли на проверку оплату для заявки <b>#${shortId}</b>. Как только админ её подтвердит, мы сразу пришлём уведомление.`,
          },
          push: { title: `${ICONS.time} Чек проверяется`, body: 'Сообщим, как только подтвердим оплату.' },
          email: null
        };

case 'BOOKING_CONFIRMED': {
        const meetingInfo = data.meetingPoint || 'Уточняется гидом';
        const meetingTime = data.meetingTime || '08:30';
        
        // Формируем блок со списком снаряжения или важной инфой (для Telegram)
        let importantSection = data.importantInfo 
          ? `🎒 <b>Важно:</b> ${data.importantInfo}` 
          : `🎒 <b>Важно:</b> Возьмите с собой хорошее настроение!`;
        
        // Если в туре заполнен чеклист (список снаряжения), выводим его:
        if (Array.isArray(data.checklist) && data.checklist.length > 0) {
          importantSection = `🎒 <b>Список снаряжения:</b>\n` + data.checklist.map((c: any) => `• <b>${c.title}</b>: ${c.items}`).join('\n');
          
          if (data.importantInfo) {
             importantSection += `\n\n⚠️ <b>Дополнительно:</b> ${data.importantInfo}`;
          }
        }
        
        let buttons = [];
        
        // 1. Ссылка на чат группы (если гид уже добавил её в дату тура)
        if (data.groupChatUrl) {
            buttons.push([{ text: '💬 Вступить в чат группы', url: data.groupChatUrl }]);
        }
        
        // 2. Связь с менеджером и билет
        buttons.push([{ text: '👨‍💻 Связь с менеджером', url: managerLink }]);
        buttons.push([{ text: '🎫 Открыть билет', url: accountLink }]);

        return {
          inApp: { 
            type: 'success', 
            title: 'Бронь подтверждена', 
            message: `Места в туре «${tourTitle}» закреплены за вами.`, 
            link: `/account/bookings/${data.bookingId}` 
          },
          telegram: {
            text: `🎉 <b>Оплата получена!</b>\n\nВаше место в туре «${tourTitle}» официально забронировано.\n\n📍 <b>Место сбора:</b> ${meetingInfo}\n⏰ <b>Время:</b> ${meetingTime}\n\n${importantSection}`,
            buttons: buttons
          },
          push: { 
            title: `${ICONS.success} Тур оплачен!`, 
            body: `Места на ${tourTitle} официально ваши.` 
          },
          // 🔥 ИНТЕГРАЦИЯ EMAIL ШАБЛОНА
          email: {
            subject: `Ваше участие подтверждено: ${tourTitle} 🎉`,
          html: await render(
              <BookingConfirmedEmail
                name={firstName}
                tourTitle={tourTitle}
                meetingPoint={meetingInfo}
                meetingTime={meetingTime}
                importantInfo={data.importantInfo}
                groupChatUrl={data.groupChatUrl}
                siteUrl={siteUrl}
                shortId={shortId}
              />
            ),
            forceSend: true // Всегда дублируем важный "билет" на почту
          }
        };
      }
      case 'PAYMENT_REJECTED':
        return {
          inApp: { type: 'error', title: 'Ошибка оплаты', message: `Чек для тура «${tourTitle}» не подошел.`, link: `/account/bookings/${data.bookingId}` },
          telegram: {
            text: `${ICONS.warning} <b>Ой, с чеком что-то не так 🙈</b>\n\n${firstName}, мы не смогли подтвердить оплату заявки <b>#${shortId}</b> на тур «${tourTitle}».\nВозможно, скриншот обрезан, размыт или платеж завис в банке.\n\nПожалуйста, отправьте фото чека еще раз прямо в этот чат или напишите нам, если нужна помощь.`,
            buttons: [[{ text: '💬 Написать менеджеру', url: managerLink }]]
          },
          push: { title: `${ICONS.warning} Ошибка с чеком`, body: `Нужно отправить чек заново (бронь #${shortId})` },
          email: null
        };

      case 'BOOKING_CANCELLED':
        return {
          inApp: { type: 'error', title: 'Бронь отменена', message: `Тур «${tourTitle}» отменен.`, link: `/account/history` },
          telegram: {
            text: `${ICONS.error} <b>Бронирование #${shortId} отменено.</b>\n\nТур: ${tourTitle}.\nЕсли ваши планы поменялись — ничего страшного, ждем вас в следующий раз! Если это ошибка — срочно пишите менеджеру.`,
            buttons: [[{ text: '💬 Написать менеджеру', url: managerLink }]]
          },
          push: { title: `${ICONS.error} Бронь отменена`, body: `Заявка #${shortId} аннулирована.` },
          email: null 
        };

      case 'PAYMENT_REMINDER_24H':
        return {
          inApp: { type: 'info', title: 'Ожидаем оплату', message: `Бронь сгорит через 24 часа.`, link: `/account/bookings/${data.bookingId}` },
          telegram: {
            text: `${ICONS.time} <b>Места могут сгореть!</b>\n\n${firstName}, прошли сутки с момента бронирования тура «${tourTitle}» (Бронь <b>#${shortId}</b>).\n\nВаши места пока держим, но у вас есть всего <b>24 часа</b> на оплату. После этого система автоматически вернет их в продажу.\n\nЗабыли или есть трудности с переводом? Напишите нам 👇`,
            buttons: [[{ text: '💬 Помощь с оплатой', url: managerLink }]]
          },
          push: { title: `${ICONS.time} Бронь сгорит через 24ч!`, body: `Успейте оплатить тур ${tourTitle}.` },
          email: null
        };

      case 'BOOKING_AUTO_CANCELLED':
        return {
          inApp: { type: 'error', title: 'Бронь аннулирована', message: `Время на оплату истекло.`, link: `/account/history` },
          telegram: {
            text: `${ICONS.error} <b>Бронь автоматически отменена</b>\n\n${firstName}, время ожидания истекло. Оплата за тур «${tourTitle}» не поступила, поэтому мы вернули места в свободную продажу.\n\nМы не прощаемся — горы никуда не убегут! 🏔 Будем рады видеть вас, когда появится настроение и время.`,
            buttons: [[{ text: '💬 Выбрать другой тур', url: `${siteUrl}/tour` }]]
          },
          push: { title: `${ICONS.error} Время вышло`, body: `Бронь #${shortId} отменена системой.` },
          email: null
        };

     case 'TOUR_TOMORROW_REMINDER': {
        const meeting = data.meetingPoint || 'Уточняется в чате';
        const time = data.meetingTime || 'Утром';
        
        // 🔥 Проверяем статус: наличные или иностранцы
        const isUnpaid = data.paymentMethod === 'cash' || data.paymentMethod === 'foreign';
        
        let customText = '';
        let buttons = [];

        // ЖЕСТКОЕ НАПОМИНАНИЕ ЗА 24 ЧАСА ДЛЯ НЕОПЛАЧЕННЫХ
        if (isUnpaid) {
           customText = `\n\n⚠️ <b>ФИНАЛЬНОЕ ПОДТВЕРЖДЕНИЕ:</b> Вы выбрали оплату на месте (<b>${price} ${currency}</b>). Пожалуйста, подтвердите свое участие прямо сейчас, чтобы мы закрепили за вами место в трансфере. 👇`;
           buttons.push(
             [{ text: '✅ Я точно буду', callback_data: `cash_confirm_${data.bookingId}` }],
             [{ text: '❌ Планы изменились', callback_data: `cash_cancel_${data.bookingId}` }]
           );
        } else {
           customText = `\n\nОплата успешно подтверждена. Выспитесь и до встречи!`;
           if (data.groupChatUrl) buttons.push([{ text: '💬 Перейти в чат группы', url: data.groupChatUrl }]);
        }

        return {
          inApp: { type: 'info', title: 'Завтра тур!', message: `Сбор в ${time}. Место: ${meeting}`, link: `/account/bookings/${data.bookingId}` },
          telegram: {
            text: `🔥 <b>Завтра старт!</b>\n\n${firstName}, ждем вас на маршруте «<b>${tourTitle}</b>».\n\n📍 <b>Сбор:</b> ${meeting}\n⏰ <b>Время:</b> ${time}${customText}`,
            buttons: buttons.length > 0 ? buttons : undefined
          },
          push: { title: `Завтра тур! 🔥`, body: `Сбор в ${time}. Проверьте снаряжение.` },
          // 🔥 ИНТЕГРАЦИЯ EMAIL ШАБЛОНА
          email: {
             subject: `Завтра тур: ${tourTitle} 🔥`,
             html: await render(<TourReminderEmail name={firstName} tourTitle={tourTitle} meetingPoint={meeting} meetingTime={time} daysLeft={1} paymentMethod={data.paymentMethod} price={price} currency={currency} bookingLink={accountLink} />),
             forceSend: true
          }
        };
      }

      case 'NEW_DATES_PUBLISHED':
      case 'WAITLIST_ALERT':
        return {
          inApp: { type: 'info', title: '🔥 Места появились!', message: `Доступны места на тур «${tourTitle}».`, link: `/tour/${data.tourSlug}` },
          telegram: {
            text: `${ICONS.fire} <b>Появились места!</b>\n\n${firstName}, мы добавили даты или освободились места на маршрут <b>«${tourTitle}»</b>, которым вы интересовались.\n\nКто успеет первым — тот и едет 🌲`,
            buttons: [[{ text: '⚡️ Забронировать', url: `${siteUrl}/tour/${data.tourSlug}` }]]
          },
          push: { title: `${ICONS.fire} Появились места!`, body: `Успейте забронировать тур ${tourTitle}.` },
          email: null
        };

      case 'C2C_TICKET_TRANSFER':
        return {
          inApp: { type: 'info', title: 'Вам передали билет!', message: `Место на тур «${tourTitle}».`, link: `/account/bookings/${data.bookingId}` },
          telegram: {
            text: `${ICONS.gift} <b>Вам передали билет!</b>\n\n${firstName}, друг передал вам свое место на тур «<b>${tourTitle}</b>». Вся логистика и детали уже ждут вас в кабинете.`,
            buttons: [[{ text: '🎫 Открыть билет', url: accountLink }]]
          },
          push: { title: `${ICONS.gift} Новый билет!`, body: `Вам передали место в туре ${tourTitle}` },
          email: null
        };

      case 'REVIEW_REQUEST':
        return {
          inApp: { type: 'bonus', title: 'Оставьте отзыв', message: `Оцените тур «${tourTitle}» и получите +5 ₽.`, link: `/account/history` },
          telegram: {
            text: `${ICONS.info} <b>Как прошли выходные?</b>\n\n${firstName}, тур «<b>${tourTitle}</b>» завершен. Поделитесь честными впечатлениями на сайте и получите <b>+10 ₽</b> на бонусный баланс!`,
            buttons: [[{ text: '⭐️ Оценить тур (+5 ₽)', url: `${siteUrl}/account/history` }]]
          },
          push: { title: `${ICONS.gift} Как прошел тур?`, body: `Оцените ${tourTitle} и получите +5 ₽` },
          email: null
        };

      case 'CASHBACK_RECEIVED':
        return {
          inApp: { type: 'bonus', title: '+ Бонусы начислены', message: `Вам начислено +${data.amount} ₽.`, link: `/account` },
          telegram: {
            text: `${ICONS.gift} <b>Вам начислены бонусы!</b>\n\n${firstName}, кто-то из друзей поехал в тур по вашему промокоду.\nВам начислено <b>+${data.amount} ₽</b> на баланс!`,
            buttons: [[{ text: '👤 В кабинет', url: `${siteUrl}/account` }]]
          },
          push: { title: `${ICONS.gift} +${data.amount} ₽ на баланс!`, body: `Вашим промокодом воспользовались.` },
          email: null
        };

      case 'BROADCAST_MESSAGE':
        return {
          inApp: { type: 'system', title: 'Сообщение от гида', message: data.message || 'Новое сообщение', link: `/account/bookings` },
          telegram: {
            text: `📢 <b>Важное сообщение по туру!</b>\n\n${data.message}`
          },
          push: { title: '📢 Сообщение от гида', body: 'Важная информация по вашему туру' },
          email: null
        };

case 'TOUR_3DAY_REMINDER': {
        const meeting = data.meetingPoint || 'Уточняется гидом';
        const time = data.meetingTime || '08:30';
        
        // 🔥 Проверяем статус: наличные или иностранцы (без предоплаты)
        const isUnpaid = data.paymentMethod === 'cash' || data.paymentMethod === 'foreign';
        
        let buttons = [];
        if (data.groupChatUrl) {
          buttons.push([{ text: '💬 Чат группы (уже создан)', url: data.groupChatUrl }]);
        }
        
        // Кнопки подтверждения для неоплаченных броней
        if (isUnpaid) {
           buttons.push(
             [{ text: '✅ Подтверждаю, буду!', callback_data: `cash_confirm_${data.bookingId}` }],
             [{ text: '❌ Не смогу поехать', callback_data: `cash_cancel_${data.bookingId}` }]
           );
        }

        return {
          inApp: { 
            type: 'info', 
            title: 'Скоро в путь!', 
            message: `До старта тура «${tourTitle}» осталось 3 дня.`, 
            link: `/account/bookings/${data.bookingId}` 
          },
          telegram: {
            text: `${ICONS.info} <b>${firstName}, скоро отправляемся!</b>\n\nДо нашего приключения «<b>${tourTitle}</b>» осталось всего 3 дня. Самое время проверить снаряжение и подготовить рюкзак.\n\n📍 <b>Сбор:</b> ${meeting}\n⏰ <b>Старт:</b> ${time}\n\n${isUnpaid ? `⚠️ Так как у вас выбрана <b>оплата на месте</b>, пожалуйста, подтвердите ваше участие кнопкой ниже, чтобы мы забронировали за вами место в транспорте 👇` : 'Мы уже готовим всё необходимое для вашего отдыха!'}`,
            buttons: buttons.length > 0 ? buttons : undefined
          },
          push: { title: '3 дня до тура! 🏕', body: `Ждем вас на маршруте ${tourTitle}` },
          // 🔥 ИНТЕГРАЦИЯ EMAIL ШАБЛОНА
          email: {
             subject: `Подготовка к туру: ${tourTitle} 🏕️`,
             html: await render(<TourReminderEmail name={firstName} tourTitle={tourTitle} meetingPoint={meeting} meetingTime={time} daysLeft={3} paymentMethod={data.paymentMethod} price={price} currency={currency} bookingLink={accountLink} />),
             forceSend: true
          }
        };
      }
     
      case 'POST_TOUR_REVIEW': {
        const points = data.points || 0;
        const level = data.level || 'Новичок';
        const nextLevelPoints = data.nextLevelPoints || 500;
        const pointsNeeded = nextLevelPoints - points > 0 ? nextLevelPoints - points : 0;
        
        let buttons = [
          [{ text: '✍️ Написать отзыв', callback_data: `write_review_${data.bookingId}` }]
        ];

        return {
          inApp: { 
            type: 'bonus', 
            title: 'С возвращением!', 
            message: `Оцените тур «${tourTitle}» и получите бонусы!`, 
            link: `/account/history` 
          },
          telegram: {
            text: `🏕 <b>${firstName}, с возвращением!</b>\n\nНадеемся, наше приключение «<b>${tourTitle}</b>» прошло отлично.\n\n🏆 Ваш статус: <b>${level}</b>\n⭐️ Накоплено: <b>${points} баллов</b>\n${pointsNeeded > 0 ? `🚀 До следующего уровня осталось: ${pointsNeeded} баллов\n\n` : '\n'}Помогите нам стать еще лучше — поделитесь впечатлениями о работе гида и организации. За каждый опубликованный отзыв мы начисляем бонусы! 👇`,
            buttons: buttons
          },
          push: { title: 'Поделитесь впечатлениями! 🏕', body: `Оцените тур ${tourTitle} и получите бонусы` },
          email: {
             subject: `Как прошел ваш тур? Поделитесь впечатлениями! 🌲`,
             html: await render(<PostTourReviewEmail name={firstName} tourTitle={tourTitle} points={points} level={level} bookingLink={accountLink} />),
             forceSend: true
          }
        };
      }

      case 'REVIEW_PUBLISHED': {
        const added = data.pointsAdded || 50;
        const balance = data.newBalance || 0;
        const tour = data.tourTitle || 'туре';

        return {
          inApp: {
            type: 'success',
            title: 'Отзыв опубликован!',
            message: `Вам начислено ${added} баллов за отзыв о туре «${tour}».`,
            link: `/account/history`
          },
          telegram: {
            text: `🎉 <b>${firstName}, ваш отзыв опубликован!</b>\n\nСпасибо, что поделились впечатлениями о туре «<b>${tour}</b>». Как мы и обещали, мы начислили вам бонусные баллы.\n\n🎁 Получено: <b>+${added} баллов</b>\n💰 Текущий баланс: <b>${balance}</b>\n\nВы можете использовать их для оплаты следующих приключений!`,
            buttons: [[{ text: '🏕 Выбрать новый тур', url: `${siteUrl}/tour` }]]
          },
          push: { title: 'Отзыв одобрен! 🎉', body: `Вам начислено +${added} баллов на баланс` },
          email: null // Пока не будем спамить письмами по этому поводу, хватит ТГ и Сайта
        };
      }

      // ==========================================
      // РОБОТ-ПРОДАЖНИК: ВОЗВРАТ СПЯЩИХ (90 ДНЕЙ)
      // ==========================================
      case 'WIN_BACK_OFFER': {
        const lastTour = data.lastTourTitle || 'нами';
        const promo = data.promoCode || 'COMEBACK';
        const discount = data.discount || 50;

        return {
          inApp: {
            type: 'bonus',
            title: 'Давно не виделись! 🏕️',
            message: `Дарим ${discount} ₽ на новые туры по промокоду ${promo}`,
            link: `/tour`
          },
          telegram: {
            text: `🏕 <b>${firstName}, давно не виделись на маршруте!</b>\n\nПрошло уже 3 месяца с вашей поездки «<b>${lastTour}</b>». Мы успели соскучиться и подготовили много новых интересных маршрутов.\n\nВам, как нашему опытному путешественнику, мы дарим персональный промокод на скидку <b>${discount} ₽</b>:\n\n👉 <code>${promo}</code>\n\n<i>Промокод действует 14 дней. Выбирайте приключение и погнали с нами!</i>`,
            buttons: [[{ text: '🏕 Выбрать новый тур', url: `${siteUrl}/tour` }]]
          },
          push: { title: 'Скучаем по вам! 🏕', body: `Дарим скидку ${discount} ₽ на новые приключения` },
          email: null
        };
      }

      // ==========================================
      // РОБОТ-ПРОДАЖНИК: КРОСС-СЕЛЛ (СМЕЖНЫЕ ТУРЫ)
      // ==========================================
      case 'CROSS_SELL_OFFER': {
        const lastTour = data.lastTourTitle || 'прошлом туре';
        const categoryText = data.categoryTransitionText || 'Попробуйте новый формат отдыха!';

        return {
          inApp: {
            type: 'info',
            title: 'Новый уровень! 🚀',
            message: `Вам понравилось на «${lastTour}»? Попробуйте кое-что новое.`,
            link: `/tour`
          },
          telegram: {
            text: `🚀 <b>${firstName}, как насчет нового вызова?</b>\n\nНедавно вы были с нами на маршруте «<b>${lastTour}</b>». ${categoryText}\n\nСпециально для вас мы подобрали отличный вариант для следующих выходных. Переходите на сайт, чтобы посмотреть детали!`,
            buttons: [[{ text: '🔥 Смотреть рекомендацию', url: `${siteUrl}/tour` }]]
          },
          push: { title: 'Готовы к новому вызову? 🚀', body: `Мы подобрали для вас идеальный маршрут` },
          email: null
        };
      }

      default:
        console.warn(`[NotificationTemplates] Template for event ${eventId} not found`);
        return null;
    }
  }
};
