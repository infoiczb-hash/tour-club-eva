process.env.DATABASE_URL = process.env.TEST_DATABASE_URL!;
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL!;

// APB
process.env.APB_MERCHANT_ID      = 'TEST_MERCHANT';
process.env.APB_IS_TEST          = '1';
process.env.APB_MERCHANT_PASS    = 'secret-pass-123';
process.env.APB_PAYMENT_URL      = 'https://pay.apb.com/payment';
process.env.APB_SOAP_URL         = 'https://pay.apb.com/soap';

// Next.js public
process.env.NEXT_PUBLIC_SITE_URL          = 'https://evatur.club';
process.env.NEXT_PUBLIC_SUPABASE_URL      = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// Telegram
process.env.TELEGRAM_BOT_TOKEN        = 'test-token';
process.env.TELEGRAM_AUTH_BOT         = 'test-auth-bot';
process.env.TELEGRAM_ADMIN_CHAT_ID    = '12345';
process.env.TELEGRAM_PUBLIC_BOT_TOKEN = 'test-public-token';
process.env.TELEGRAM_WEBHOOK_SECRET   = 'test-webhook-secret';

// Прочее
process.env.CRON_SECRET               = 'test-cron-secret';
process.env.UPSTASH_REDIS_REST_URL    = 'https://test.upstash.io';
process.env.UPSTASH_REDIS_REST_TOKEN  = 'test-redis-token';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';