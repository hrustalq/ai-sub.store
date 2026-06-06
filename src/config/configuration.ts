export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  logging: {
    level: process.env.LOG_LEVEL ?? 'info',
    format: process.env.LOG_FORMAT ?? 'json',
  },
  database: {
    url: process.env.DATABASE_URL ?? 'file:./dev.db',
  },
  publicBaseUrl:
    process.env.PUBLIC_BASE_URL ?? process.env.TELEGRAM_WEBHOOK_DOMAIN,
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    webhookDomain: process.env.TELEGRAM_WEBHOOK_DOMAIN,
    webhookPath: process.env.TELEGRAM_WEBHOOK_PATH ?? '/telegram/webhook',
  },
  payment: {
    yookassa: {
      shopId: process.env.YOOKASSA_SHOP_ID,
      secretKey: process.env.YOOKASSA_SECRET_KEY,
    },
  },
  adminTelegramIds: process.env.ADMIN_TELEGRAM_IDS ?? '',
  adminApiKey: process.env.ADMIN_API_KEY,
});
