# API Документация — Турклуб «Эва»

## 1. Webhooks

### 1.1. Telegram Bot (`POST /api/webhooks/telegram`)

Обрабатывает callback-запросы и сообщения от пользователей.

**Защита:**  
- Заголовок `x-telegram-bot-api-secret-token` должен совпадать с `TELEGRAM_WEBHOOK_SECRET` в .env.

**Основные сценарии:**
- `confirm_<bookingId>` – подтверждение оплаты (через inline-кнопку).
- `reject_<bookingId>` – отклонение чека.
- `write_review_<bookingId>` – инициирует сбор отзыва.
- `cash_confirm_<bookingId>` / `cash_cancel_<bookingId>` – подтверждение/отмена участия при оплате наличными.
- Текстовые сообщения с фото или документом – загрузка чека.
- `/start <shortId>` – привязка Telegram к брони.

---

### 1.2. АПБ (Клевер) (`POST /api/webhooks/apb`)

Принимает уведомления от платёжного шлюза АПБ о статусе оплаты.

**Защита:**  
- Проверка подписи (MD5) по документации АПБ.

**Параметры (в URL-encoded):**
- `invoiceid` – ID заказа (формат `EVA-<shortId>`)
- `status` – `paid` или `fail`
- `paymentsum`, `paymentcurrency`, `date`, `signature`

**Логика:**  
- При `status=paid` делает повторный запрос `GetState` к АПБ.
- Подтверждает бронь и уведомляет клиента через NotificationHub.
- При несовпадении суммы – логирует `APB_PAYMENT_FRAUD_AMOUNT` и не подтверждает.

---

## 2. Cron-задачи (защищены по `CRON_SECRET`)

| Маршрут | Расписание (vercel.json) | Назначение |
|---------|--------------------------|------------|
| `/api/keep-alive` | ежедневно 10:00 | Пинг БД, предотвращение засыпания |
| `/api/cron/reminders` | ежедневно 8:00 | Напоминания за 3 дня и за день до тура |
| `/api/cron/post-tour-reviews` | 8:30 | Запрос отзыва после завершения тура |
| `/api/cron/sales-bot` | 9:00 | Win‑back (90 дней) и Cross‑sell (7 дней) |
| `/api/cron/payment-report` | 17:00 | Сводка по ожидающим оплатам |

---

## 3. Server Actions (основные)

Все Actions защищены авторизацией через `withAdminAuth` (админка) или `withRateLimit` (публичные формы).

### 3.1. Бронирование
**`createBookingAction(input: BookingInput)`**  
- Списание мест, расчёт скидок (промокод / бонусы).
- Создание брони, генерация уникального `shortId`.
- Для `paymentMethod = 'online_card'` формирует `redirectUrl` на страницу АПБ.
- Отправка уведомлений в Telegram и через NotificationHub.

### 3.2. Администрирование туров
**`saveTour(data: TourFormValues)`**  
- Создание/обновление тура, управление датами (`tourDates`).
- При публикации оповещает подписчиков `notifySubscribersOnNewDates`.

**`updateTourStatus(id, isActive)`**  
- Публикация/снятие с публикации.

**`deleteTour(id)`**  
- Soft delete (устанавливает `deletedAt` и `isActive: false`).

### 3.3. Управление статусом брони
**`updateBookingStatusAction({ bookingId, newStatus, rejectReason? })`**  
- Пересчёт мест при отмене/реактивации.
- Отправка уведомлений клиенту (через NotificationHub или напрямую в Telegram).

### 3.4. AI-генерация
**`performAiTask(task: AiTaskType)`**  
- Режимы: `generate_tour`, `generate_blog`, `generate_image` (Flux / DALL‑E), `smm_post`, `improve_text`.
- Кеширование результатов в Redis.
- Fallback на Groq при лимитах Gemini.

---

## 4. Генерация OG-изображений

### 4.1. Динамические карточки (`/api/og`)

Принимает параметры через URL (для SMM‑пульта) или через `fetch` в коде.

**Основные параметры:**
- `format` – story / feed / post / event
- `type` – tour / blog / calendar
- `slide` – номер слайда (0 – обложка)
- `slideType` – logistics / highlights / included / checklist / price
- `title`, `image`, `price`, `currency`, `location`, `duration`, `tags` и т.д.

### 4.2. Афиша календаря (`/api/og/calendar`)

**POST** с JSON-телом:
```json
{
  "format": "story" | "feed",
  "period": "week" | "2weeks" | "month",
  "brandColor": "teal",
  "events": [ { "date": "2025-04-20", "category": "Сплав", "title": "..." } ]
}

Возвращает PNG-изображение, кэшируемое на 5 минут.

5. Вспомогательные утилиты
Функция	Путь	Назначение
slugify	@/lib/utils	Транслитерация кириллицы → латиница
cn	@/lib/utils	Объединение Tailwind-классов
formatTourDate	@/lib/date	Локализованное отображение дат тура
cloudinaryLoader	@/lib/cloudinary-loader	Формирование URL для изображений с ограничением ширины
apbClient.buildPaymentUrl	@/lib/apb/client	Генерация ссылки на оплату через АПБ
apbClient.verifyWebhookSignature	@/lib/apb/client	Проверка подписи вебхука
6. Переменные окружения (ключевые)
env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_AUTH_BOT=
TELEGRAM_ADMIN_CHAT_ID=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_TOPIC_BOOKINGS=
TELEGRAM_TOPIC_MONEY=

# АПБ (Клевер)
APB_MERCHANT_ID=
APB_MERCHANT_PASS=
APB_IS_TEST=1

# AI
GOOGLE_GENERATIVE_AI_API_KEY=
GROQ_API_KEY=
FAL_KEY=
OPENAI_API_KEY=

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
CRON_SECRET=
Полный список – в src/lib/env.ts. 

Этот файл:
- Описывает **все публичные endpoints** и webhooks.
- Перечисляет **основные Server Actions** с кратким назначением.
- Указывает **ключевые утилиты** и переменные окружения.