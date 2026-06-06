import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  SWAGGER_DOWNLOAD_LINK_CSS,
  SWAGGER_DOWNLOAD_LINK_JS,
  SWAGGER_JSON_PATH,
} from './swagger-ui-download-link';
import {
  CounterpartySchema,
  CredentialSchema,
  CredentialStockSchema,
  ExcelImportResultSchema,
  HealthLiveSchema,
  HealthReadySchema,
  OrderSchema,
  PlanSchema,
  SupportMessageSchema,
  SupportTicketSchema,
  TelegramUserSchema,
  UserSessionSchema,
  VendorSchema,
} from '../entities/schemas';

export const SWAGGER_PATH = 'api/docs';
export { SWAGGER_JSON_PATH } from './swagger-ui-download-link';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('AI Sub Store API')
    .setDescription(
      [
        'REST API магазина подписок на AI-инструменты (Cursor, Claude, ChatGPT, Gemini).',
        '',
        'Основной канал продаж — Telegram-бот. Данный API предназначен для администрирования:',
        'управление заказами, инвентарём учётных данных и просмотр каталога.',
        '',
        'Для защищённых эндпоинтов передайте заголовок `x-admin-api-key`,',
        'если в окружении задана переменная `ADMIN_API_KEY`.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'x-admin-api-key',
        description: 'Ключ администратора для доступа к защищённым эндпоинтам',
      },
      'admin-api-key',
    )
    .addTag('Система', 'Проверка работоспособности сервиса')
    .addTag('Каталог', 'Вендоры и тарифные планы')
    .addTag('Заказы', 'Создание и управление заказами')
    .addTag('Учётные данные', 'Инвентарь аккаунтов подписок')
    .addTag('Поддержка', 'Обращения пользователей через Telegram-бот')
    .addTag('Администрирование — вендоры', 'CRUD вендоров AI-инструментов')
    .addTag('Администрирование — планы', 'CRUD тарифных планов')
    .addTag(
      'Администрирование — контрагенты',
      'Поставщики учётных данных (контрагенты)',
    )
    .addTag(
      'Администрирование — Excel',
      'Шаблоны и импорт вендоров, планов, контрагентов и credentials',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [
      VendorSchema,
      PlanSchema,
      OrderSchema,
      CredentialSchema,
      TelegramUserSchema,
      UserSessionSchema,
      CredentialStockSchema,
      HealthLiveSchema,
      HealthReadySchema,
      SupportTicketSchema,
      SupportMessageSchema,
      CounterpartySchema,
      ExcelImportResultSchema,
    ],
  });

  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    customSiteTitle: 'AI Sub Store — API',
    jsonDocumentUrl: SWAGGER_JSON_PATH,
    customCss: SWAGGER_DOWNLOAD_LINK_CSS,
    customJsStr: SWAGGER_DOWNLOAD_LINK_JS,
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      defaultModelsExpandDepth: 2,
    },
  });
}
