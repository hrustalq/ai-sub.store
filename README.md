# AI Sub Store

Магазин подписок на AI-инструменты: **Cursor**, **Claude**, **ChatGPT**, **Gemini**.

Основной канал продаж — **Telegram-бот**. Пользователь выбирает вендора → тариф → оплачивает → получает учётные данные аккаунта. REST API и Swagger предназначены для администрирования и интеграций.

## Возможности

- Telegram-бот с inline-клавиатурами и сценарием покупки
- Каталог вендоров и тарифных планов (SQLite + Prisma)
- Инвентарь учётных данных с атомарной выдачей при оплате
- Оплата через Telegram Payments или ручное подтверждение админом
- **Helpdesk в боте**: обращения пользователей, ответы админов в Telegram, REST API для просмотра тикетов
- **Event-driven архитектура** (`@nestjs/event-emitter`): сервисы эмитят доменные события, listeners обрабатывают Telegram, логи и сессию
- REST API с валидацией (`class-validator`) и OpenAPI-документацией на русском
- Проверка переменных окружения при старте
- Docker: dev (hot reload) и prod, мониторинг через Loki + Grafana

## Стек

| Слой | Технология |
|------|------------|
| Backend | NestJS 11, TypeScript |
| База данных | SQLite, Prisma 6 |
| События | @nestjs/event-emitter |
| Telegram | nestjs-telegraf, Telegraf 4 |
| Валидация | class-validator, class-transformer |
| Документация API | @nestjs/swagger |
| Тесты | Jest, Supertest |
| Контейнеризация | Docker, Docker Compose |
| Логи | Loki, Promtail |
| Метрики и дашборды | Prometheus, cAdvisor, node-exporter, Grafana |

## Быстрый старт

### 1. Установка

```bash
npm install
```

### 2. Переменные окружения

```bash
cp .env.example .env
```

Обязательные переменные:

| Переменная | Описание |
|------------|----------|
| `TELEGRAM_BOT_TOKEN` | Токен бота от [@BotFather](https://t.me/BotFather) |
| `DATABASE_URL` | Путь к SQLite (по умолчанию `file:./dev.db`) |

### 3. База данных

```bash
npm run db:migrate   # применить миграции
npm run db:seed      # загрузить каталог и тестовый инвентарь
```

### 4. Запуск

```bash
npm run start:dev
```

| URL | Назначение |
|-----|------------|
| http://localhost:3000 | Статус сервиса |
| http://localhost:3000/health/live | Liveness probe (процесс жив) |
| http://localhost:3000/health/ready | Readiness probe (БД доступна) |
| http://localhost:3000/health | Алиас для `/health/ready` (Docker HEALTHCHECK) |
| http://localhost:3000/api/docs | Swagger UI (русский) |

## Docker

Два compose-файла поднимают приложение вместе со стеком наблюдаемости (логи + метрики сервера).

| Файл | Режим | Описание |
|------|-------|----------|
| `docker-compose.yml` | **dev** | Hot reload, монтирование исходников, SQLite в volume |
| `docker-compose.prod.yml` | **prod** | Сборка из `Dockerfile`, без монтирования кода |

### Быстрый старт (Docker)

```bash
cp .env.example .env   # задайте TELEGRAM_BOT_TOKEN
npm run docker:dev     # локальная разработка
```

Миграции Prisma применяются автоматически при старте контейнера. База SQLite хранится в Docker volume (`/app/data/dev.db` в dev, `prod.db` в prod).

### Production

```bash
npm run docker:prod        # сборка и запуск в фоне
npm run docker:prod:down   # остановка
```

Перед выкладкой в интернет смените `GRAFANA_ADMIN_PASSWORD` в `.env`.

### URL при запуске через Docker

| URL | Назначение |
|-----|------------|
| http://localhost:3000 | API |
| http://localhost:3000/api/docs | Swagger UI |
| http://localhost:3001 | Grafana (логин: `admin` / пароль из `GRAFANA_ADMIN_PASSWORD`) |

### Мониторинг (Grafana)

Преднастроенные дашборды в папке **AI Sub Store**:

| Дашборд | Содержимое |
|---------|------------|
| **Application Logs** | Логи приложения и всего стека, объём логов по сервисам |
| **Server Usage** | CPU, память, сеть контейнеров; CPU, память, диск хоста |

Стек наблюдаемости:

| Сервис | Роль |
|--------|------|
| **Loki** | Хранение логов |
| **Promtail** | Сбор логов из Docker-контейнеров |
| **Prometheus** | Сбор метрик |
| **cAdvisor** | Метрики контейнеров |
| **node-exporter** | Метрики хоста |
| **Grafana** | Дашборды и визуализация |

Конфигурация: `docker/loki/`, `docker/promtail/`, `docker/prometheus/`, `docker/grafana/`.

## Сценарий покупки в Telegram

```
/start → Browse subscriptions → Выбор вендора → Выбор плана
       → Подтверждение заказа → Оплата → Выдача email/пароля
```

Под капотом: `OrdersService` создаёт заказ и эмитит `order.created` → после оплаты `OrderWorkflowService.confirmPayment()` эмитит `order.paid` и `order.fulfilled` → `TelegramOrderListener` отправляет учётные данные, `SessionOrderListener` сбрасывает диалог.

**Команды бота (пользователь):**

| Команда | Описание |
|---------|----------|
| `/start` | Главное меню |
| `/browse` | Каталог подписок |
| `/orders` | История заказов |
| `/support` | Поддержка (кнопка «🆘 Поддержка» в меню) |
| `/cancel` | Отмена текущего выбора |

**Команды бота (админ, `ADMIN_TELEGRAM_IDS`):**

| Команда | Описание |
|---------|----------|
| `/confirm <order-id>` | Подтверждение оплаты заказа |
| `/tickets` | Список открытых обращений |
| `/reply <ticket-id> <текст>` | Ответ пользователю |
| `/close <ticket-id>` | Закрыть обращение |

## Сценарий поддержки в Telegram

```
/support → Написать обращение → Описание проблемы (текст)
         → Тикет создан → Админы получают уведомление в Telegram
         → /reply <ticket-id> <текст> → Ответ приходит пользователю в чат
```

Пользователь может дополнить открытое обращение через «Добавить к открытому». UUID заказа в тексте автоматически привязывается к тикету.

Под капотом: `HelpdeskService` создаёт `SupportTicket` + `SupportMessage` и эмитит `support.ticket_created` → `TelegramSupportListener` уведомляет админов и доставляет ответы пользователю.

## REST API

Публичные эндпоинты каталога и системы. Заказы и учётные данные защищены заголовком `x-admin-api-key` (если задан `ADMIN_API_KEY`).

### Каталог

```bash
curl http://localhost:3000/api/catalog/vendors
curl http://localhost:3000/api/catalog/vendors/cursor/plans
curl http://localhost:3000/api/catalog/plans/cursor-monthly
```

### Заказы (admin)

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "x-admin-api-key: your_key" \
  -d '{"telegramUserId": 123456789, "telegramChatId": 123456789, "planId": "cursor-monthly"}'

curl -X POST http://localhost:3000/api/orders/<uuid>/confirm \
  -H "x-admin-api-key: your_key"
```

### Инвентарь (admin)

```bash
curl -X POST http://localhost:3000/api/credentials \
  -H "Content-Type: application/json" \
  -H "x-admin-api-key: your_key" \
  -d '{"planId": "cursor-monthly", "email": "sub@example.com", "password": "SecurePass1"}'

curl "http://localhost:3000/api/credentials/stock?planId=cursor-monthly" \
  -H "x-admin-api-key: your_key"
```

### Поддержка (admin)

```bash
# Открытые обращения
curl http://localhost:3000/api/support/tickets \
  -H "x-admin-api-key: your_key"

# История сообщений тикета
curl http://localhost:3000/api/support/tickets/<uuid>/messages \
  -H "x-admin-api-key: your_key"

# Ответ пользователю
curl -X POST http://localhost:3000/api/support/tickets/<uuid>/reply \
  -H "Content-Type: application/json" \
  -H "x-admin-api-key: your_key" \
  -d '{"text": "Проверили оплату, заказ будет выполнен в течение часа."}'

# Закрыть обращение
curl -X POST http://localhost:3000/api/support/tickets/<uuid>/close \
  -H "x-admin-api-key: your_key"
```

Полная спецификация — в [Swagger UI](http://localhost:3000/api/docs).

## Структура проекта

```
src/
├── catalog/          # Вендоры и тарифы (чтение из БД)
├── credentials/      # Инвентарь учётных данных
├── orders/           # Жизненный цикл заказов + OrderWorkflowService
├── helpdesk/         # Обращения в поддержку (тикеты, сообщения, REST)
├── events/           # AppEvents, EventsService, payloads, logging listeners
├── payment/          # Telegram Payments / инструкции по оплате
├── session/          # Состояние диалога в боте + SessionOrderListener
├── telegram/         # Обработчики бота + TelegramOrderListener, TelegramSupportListener
├── health/           # Liveness / readiness probes
├── entities/         # Доменные типы, enum'ы, OpenAPI-схемы
├── prisma/           # PrismaService, мапперы Prisma → entity
├── config/           # Конфигурация, валидация env, Swagger
└── common/           # logging (Pino), guards, pipes, decorators
prisma/
├── schema.prisma     # Схема БД
├── seed.ts           # Начальные данные
└── migrations/
docker/
├── entrypoint.sh         # prod: migrate + node dist/main
├── entrypoint.dev.sh     # dev: migrate + start:dev
├── loki/                 # конфиг Loki
├── promtail/             # сбор логов из Docker
├── prometheus/           # scrape cAdvisor, node-exporter
└── grafana/              # datasources, дашборды
Dockerfile                # production image
Dockerfile.dev            # development image
docker-compose.yml        # dev stack
docker-compose.prod.yml   # prod stack
```

## Модель данных

| Сущность | Описание |
|----------|----------|
| `Vendor` | AI-инструмент (cursor, claude, chatgpt, gemini) |
| `Plan` | Тарифный план вендора |
| `Credential` | Аккаунт в инвентаре (available → assigned) |
| `Order` | Заказ: pending → paid → fulfilled |
| `TelegramUser` | Пользователь бота |
| `UserSession` | Активный сценарий диалога (покупка / поддержка) |
| `SupportTicket` | Обращение в поддержку (open → resolved → closed) |
| `SupportMessage` | Сообщение в тикете (от пользователя или админа) |

## Архитектура событий

Доменные сервисы публикуют типизированные события через `EventsService`. Побочные эффекты вынесены в listeners:

| Событие | Реакция |
|---------|---------|
| `order.fulfilled` | `TelegramOrderListener` — отправка credentials; `SessionOrderListener` — сброс сессии |
| `order.fulfillment_failed` | `TelegramOrderListener` — сообщение об ошибке |
| `support.ticket_created` | `TelegramSupportListener` — подтверждение пользователю + уведомление админов |
| `support.message_added` | `TelegramSupportListener` — ответ админа пользователю или follow-up админам |
| `order.*`, `credential.*` | `OrderLoggingListener`, `CredentialLoggingListener` — structured logs (Pino → Loki) |

Полный список событий и соглашения — в [`AGENTS.md`](./AGENTS.md#событийная-архитектура).

## Переменные окружения

См. [`.env.example`](.env.example).

| Переменная | Обязательна | Описание |
|------------|-------------|----------|
| `TELEGRAM_BOT_TOKEN` | да | Токен Telegram-бота |
| `DATABASE_URL` | нет | SQLite (default: `file:./dev.db`) |
| `TELEGRAM_WEBHOOK_DOMAIN` | нет | Webhook для production |
| `TELEGRAM_PAYMENT_PROVIDER_TOKEN` | нет | Нативная оплата в Telegram |
| `PAYMENT_WALLET_ADDRESS` | нет | Реквизиты для ручной оплаты |
| `ADMIN_TELEGRAM_IDS` | нет | ID админов для `/confirm`, `/tickets`, `/reply`, `/close` и уведомлений поддержки |
| `ADMIN_API_KEY` | нет | Ключ для REST API |
| `GRAFANA_PORT` | нет | Порт Grafana (default: `3001`) |
| `GRAFANA_ADMIN_USER` | нет | Логин Grafana (default: `admin`) |
| `GRAFANA_ADMIN_PASSWORD` | нет | Пароль Grafana (default: `admin`) |

**Режимы Telegram:**

- **Локально** — long polling (webhook не задан)
- **Production** — задайте `TELEGRAM_WEBHOOK_DOMAIN` и `TELEGRAM_WEBHOOK_PATH`

## Скрипты

```bash
npm run start:dev      # разработка с hot reload
npm run build          # сборка
npm run typecheck      # проверка типов без emit
npm run start:prod     # production
npm run test           # unit-тесты
npm run test:e2e       # e2e-тесты
npm run lint           # ESLint

npm run db:generate    # prisma generate
npm run db:migrate     # prisma migrate dev
npm run db:seed        # загрузка seed-данных
npm run db:studio      # Prisma Studio

npm run docker:dev       # Docker: dev + Loki + Grafana
npm run docker:dev:down    # остановить dev stack
npm run docker:prod        # Docker: prod в фоне
npm run docker:prod:down     # остановить prod stack
```

## Документация для AI-агентов

См. [`AGENTS.md`](./AGENTS.md) — архитектура, соглашения и команды для работы с кодовой базой.

## Лицензия

UNLICENSED — private project.
