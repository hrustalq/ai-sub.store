# AGENTS.md

Контекст проекта для AI-агентов, работающих в этом репозитории.

## Проект

**ai-sub.store** — NestJS-приложение для продажи подписок на AI-инструменты (Cursor, Claude, ChatGPT, Gemini) через Telegram-бот. REST API используется для администрирования: каталог, заказы, инвентарь учётных данных, обращения в поддержку.

| Компонент | Путь | Роль |
|-----------|------|------|
| Backend | `src/` | NestJS 11 API + Telegram bot |
| Database | `prisma/` | Prisma 6 + SQLite |
| Entities | `src/entities/` | Доменные типы и OpenAPI-схемы |
| Docs | `http://localhost:3000/api/docs` | Swagger UI (описания на русском) |
| Docker | `docker-compose*.yml`, `Dockerfile*` | Dev/prod контейнеры + observability stack |
| Observability | `docker/grafana/`, `docker/loki/` | Логи (Loki) и метрики (Prometheus/Grafana) |

## Стек

| Слой | Технология |
|------|------------|
| Runtime | Node.js, npm |
| Framework | NestJS 11, Express |
| ORM | Prisma 6, SQLite |
| Events | @nestjs/event-emitter, EventEmitter2 |
| Bot | nestjs-telegraf, Telegraf 4 |
| Validation | class-validator, class-transformer |
| API docs | @nestjs/swagger |
| Tests | Jest, Supertest |
| Containers | Docker, Docker Compose |
| Logs | Loki 3, Promtail |
| Metrics | Prometheus, cAdvisor, node-exporter |
| Dashboards | Grafana 11 (provisioning в `docker/grafana/`) |

## Структура репозитория

```
ai-sub.store/
├── AGENTS.md
├── README.md
├── .env.example
├── package.json
├── prisma/
│   ├── schema.prisma          # Модели БД + enum'ы Prisma
│   ├── seed.ts                # Вендоры, планы, тестовые credentials
│   └── migrations/
├── src/
│   ├── main.ts                # Bootstrap, ValidationPipe, Swagger, webhook
│   ├── app.module.ts
│   ├── catalog/               # Vendor, Plan — чтение из БД
│   │   ├── catalog.controller.ts
│   │   ├── catalog.service.ts
│   │   └── dto/
│   ├── credentials/           # Инвентарь аккаунтов
│   │   ├── credentials.controller.ts
│   │   ├── credentials.service.ts
│   │   └── dto/
│   ├── orders/                # Заказы: create → pay → fulfill
│   │   ├── orders.controller.ts
│   │   ├── orders.service.ts
│   │   ├── order-workflow.service.ts  # confirmPayment (REST + bot)
│   │   └── dto/
│   ├── helpdesk/              # Обращения в поддержку (тикеты + сообщения)
│   │   ├── helpdesk.controller.ts
│   │   ├── helpdesk.service.ts
│   │   └── dto/
│   ├── events/                # Доменные события (EventEmitter)
│   │   ├── app-events.ts      # Имена событий + map payload-типов
│   │   ├── events.service.ts  # Типизированный emit / emitAsync
│   │   ├── payloads/          # OrderCreatedPayload, …
│   │   └── listeners/         # OrderLoggingListener, CredentialLoggingListener
│   ├── payment/               # Telegram Payments / manual instructions
│   ├── session/               # UserSession в БД (шаг диалога бота)
│   │   ├── contexts/          # purchase.context, helpdesk.context
│   │   ├── scenarios/         # scenario-registry (PURCHASE / HELPDESK steps)
│   │   └── listeners/         # SessionOrderListener (сброс после fulfill)
│   ├── telegram/              # @Update() handlers, keyboards, messages
│   │   └── listeners/         # TelegramOrderListener, TelegramSupportListener
│   ├── health/                # /health/live, /health/ready
│   ├── entities/              # Domain interfaces + enums
│   │   ├── *.entity.ts        # Чистые TypeScript-интерфейсы
│   │   ├── enums/             # OrderStatus, VendorId, SessionStep, …
│   │   └── schemas/           # OpenAPI-классы с @ApiProperty (русский)
│   ├── prisma/
│   │   ├── prisma.module.ts   # @Global PrismaService
│   │   └── mappers/           # Prisma record → domain entity
│   ├── config/
│   │   ├── configuration.ts
│   │   ├── env.validation.ts  # class-validator при старте
│   │   ├── swagger.config.ts
│   │   └── dto/
│   └── common/
│       ├── logging/           # nestjs-pino, LoggingInterceptor
│       ├── dto/
│       ├── guards/            # AdminApiKeyGuard
│       ├── pipes/             # VALIDATION_PIPE_OPTIONS
│       └── decorators/
├── test/                      # e2e (без полного AppModule + Telegram)
├── docker/                    # entrypoints, Loki, Promtail, Prometheus, Grafana
│   ├── entrypoint.sh          # prod: mkdir data → migrate deploy → node
│   ├── entrypoint.dev.sh      # dev: migrate deploy → npm run start:dev
│   ├── loki/loki-config.yml
│   ├── promtail/promtail-config.yml
│   ├── prometheus/prometheus.yml
│   └── grafana/
│       ├── provisioning/      # datasources (Loki, Prometheus), dashboard provider
│       └── dashboards/        # application-logs.json, server-usage.json
├── Dockerfile                 # multi-stage production image
├── Dockerfile.dev             # dev image (deps + entrypoint, код монтируется)
├── docker-compose.yml         # dev: app + observability (project: ai-sub-store)
├── docker-compose.prod.yml    # prod: built image + observability
└── graphify-out/              # Knowledge graph (см. ниже)
```

## Граф модулей

```
AppModule
├── ConfigModule (validate: validateEnv)
├── EventsModule (@Global) — EventEmitterModule.forRoot, EventsService
├── AppLoggingModule — Pino, LoggingInterceptor
├── PrismaModule (@Global)
├── HealthModule
├── HelpdeskModule → HelpdeskController
└── TelegramModule
    ├── TelegrafModule
    ├── CatalogModule → CatalogController
    ├── OrdersModule → OrdersController → OrderWorkflowService
    ├── CredentialsModule → CredentialsController
    ├── HelpdeskModule → HelpdeskService
    ├── PaymentModule
    └── SessionModule → SessionOrderListener
        ├── TelegramOrderListener (в TelegramModule)
        └── TelegramSupportListener (в TelegramModule)
```

**Поток данных при покупке (event-driven):**

```
TelegramUpdate → CatalogService (планы)
              → OrdersService.create → emit order.created
              → PaymentService (invoice / инструкции) → emit payment.*
              → OrderWorkflowService.confirmPayment()
                    → OrdersService.markPaid → emit order.paid
                    → OrdersService.fulfill → emit order.fulfilled | order.fulfillment_failed
              → TelegramOrderListener → sendMessage (credentials / ошибка)
              → SessionOrderListener → SessionService.reset → emit session.reset
```

**Поток данных при обращении в поддержку (event-driven):**

```
TelegramUpdate → /support или кнопка «Поддержка»
              → SessionService.enterScenario(HELPDESK, DESCRIBING_ISSUE)
              → пользователь отправляет текст
              → HelpdeskService.createTicket | addUserMessage → emit support.*
              → TelegramSupportListener → sendMessage (подтверждение / ответ админа)
              → уведомление ADMIN_TELEGRAM_IDS о новых тикетах и follow-up
```

Сервисы **эмитят факты** после изменения состояния в БД. Побочные эффекты (Telegram, логи, сброс сессии) — в **listeners** через `@OnEvent()`.

## Команды

Из корня репозитория:

```bash
npm install
npm run start:dev          # dev + polling (без TELEGRAM_WEBHOOK_DOMAIN)
npm run build
npm run typecheck       # tsc --noEmit
npm run start:prod
npm run test
npm run test:e2e
npm run lint

npm run db:generate        # prisma generate (также в postinstall)
npm run db:migrate         # prisma migrate dev
npm run db:seed            # ts-node prisma/seed.ts
npm run db:studio          # Prisma Studio

npm run docker:dev         # docker compose up --build (dev + hot reload)
npm run docker:dev:down    # docker compose down
npm run docker:prod        # docker compose -f docker-compose.prod.yml up --build -d
npm run docker:prod:down   # остановка prod stack
```

**Docker-заметки для агента:**

- Compose project name: `ai-sub-store` — используется в метках Loki/Prometheus (`compose_project`, `container_label_com_docker_compose_project`)
- В Docker `DATABASE_URL` переопределяется: dev → `file:/app/data/dev.db`, prod → `file:/app/data/prod.db`
- Миграции в контейнере: `prisma migrate deploy` в entrypoint (не `db:migrate`)
- Dev монтирует `.:/app` + named volume `app_node_modules` (чтобы не ломать node_modules хоста)
- Grafana: <http://localhost:3001>, дашборды в папке **AI Sub Store**
- Promtail требует `/var/run/docker.sock` — собирает логи всех контейнеров проекта

После изменений в `src/**/*.ts`:

```bash
graphify update .
```

## Переменные окружения

Шаблон: `.env.example`. Валидация: `src/config/env.validation.ts` + `EnvironmentVariablesDto`.

| Переменная | Обязательна | Примечание |
|------------|-------------|------------|
| `TELEGRAM_BOT_TOKEN` | да | Без неё приложение не стартует |
| `DATABASE_URL` | нет | Default `file:./dev.db` в validateEnv |
| `TELEGRAM_WEBHOOK_DOMAIN` | нет | Если задан — webhook вместо polling |
| `TELEGRAM_PAYMENT_PROVIDER_TOKEN` | нет | Включает sendInvoice в боте |
| `PAYMENT_WALLET_ADDRESS` | нет | Текст для ручной оплаты |
| `ADMIN_TELEGRAM_IDS` | нет | CSV Telegram user ID для `/confirm`, `/tickets`, `/reply`, `/close` и уведомлений поддержки |
| `ADMIN_API_KEY` | нет | Если задан — требуется `x-admin-api-key` на admin REST |
| `GRAFANA_PORT` | нет | Порт Grafana (default `3001`) |
| `GRAFANA_ADMIN_USER` | нет | Логин Grafana (default `admin`) |
| `GRAFANA_ADMIN_PASSWORD` | нет | Пароль Grafana; в prod обязательно сменить |

## Docker и observability

### Compose-файлы

| Файл | Сервис `app` | Особенности |
|------|--------------|-------------|
| `docker-compose.yml` | `Dockerfile.dev` | Volume `.:/app`, hot reload, `NODE_ENV=development` |
| `docker-compose.prod.yml` | `Dockerfile` | Собранный образ, только volume `app_data`, `NODE_ENV=production` |

Общие сервисы в обоих файлах: `loki`, `promtail`, `prometheus`, `cadvisor`, `node-exporter`, `grafana`.

### Дашборды Grafana

| UID | Файл | Назначение |
|-----|------|------------|
| `ai-sub-logs` | `docker/grafana/dashboards/application-logs.json` | Логи app и всего стека (Loki) |
| `ai-sub-server` | `docker/grafana/dashboards/server-usage.json` | CPU/память/сеть контейнеров + хост (Prometheus) |

Datasources провиженятся в `docker/grafana/provisioning/datasources/datasources.yml` (uid: `Loki`, `Prometheus`).

### Изменение observability

- Логи: `docker/promtail/promtail-config.yml` (docker_sd_configs + relabel по `compose_service`)
- Метрики: `docker/prometheus/prometheus.yml` (scrape cadvisor, node-exporter)
- Retention Loki: `docker/loki/loki-config.yml` (`retention_period: 168h`)
- Новый дашборд: JSON в `docker/grafana/dashboards/` + перезапуск Grafana

Не добавляй application-level metrics в NestJS без явного запроса — server usage покрывается cAdvisor/node-exporter.

## Событийная архитектура

In-process шина на `@nestjs/event-emitter`. Модуль `EventsModule` — **глобальный** (`@Global()`).

### Имена и типы

| Файл | Назначение |
|------|------------|
| `src/events/app-events.ts` | Константы `AppEvents.*` и интерфейс `AppEventPayloads` |
| `src/events/payloads/*.ts` | Payload-классы/интерфейсы по доменам |
| `src/events/events.service.ts` | `emit(event, payload)` и `emitAsync()` с проверкой типов |

### Доменные события

| Событие | Когда |
|---------|-------|
| `order.created` / `paid` / `fulfilled` / `fulfillment_failed` / `cancelled` | Жизненный цикл заказа |
| `credential.created` / `stock_depleted` | Инвентарь |
| `payment.invoice_sent` / `instructions_sent` | Шаг оплаты в боте |
| `session.scenario_entered` / `session.reset` | Состояние диалога |
| `support.ticket_created` / `message_added` / `ticket_closed` | Helpdesk: тикеты и сообщения |

### Соглашения

1. **Emit после commit** — событие только после успешной записи в БД (см. `OrdersService.fulfill`).
2. **Сервис = мутация + emit факта**; **listener = побочный эффект** (Telegram, логи, analytics).
3. **Оркестрация** между шагами — `OrderWorkflowService` (`confirmPayment`), не цепочка вызовов из `TelegramUpdate`.
4. Новый listener — `@Injectable()` + `@OnEvent(AppEvents.X, { async: true })` для I/O; зарегистрировать в providers модуля.
5. Payload-типы в `@OnEvent`-методах импортировать через `import type` (требование `isolatedModules` + `emitDecoratorMetadata`).
6. Не вызывай Telegram API из `OrdersService` — только из `telegram/listeners/`.

### Добавление реакции на событие

```typescript
@Injectable()
export class MyListener {
  @OnEvent(AppEvents.Order.Fulfilled, { async: true })
  async handle({ order }: OrderFulfilledPayload): Promise<void> {
    // side effect
  }
}
```

Зарегистрируй listener в `providers` соответствующего модуля (`EventsModule`, `TelegramModule`, …).

## Соглашения по коду

### Слои: entity vs schema vs DTO vs Prisma

| Слой | Где | Назначение |
|------|-----|------------|
| **Entity** | `src/entities/*.entity.ts` | Доменные интерфейсы, без декораторов |
| **Schema** | `src/entities/schemas/*.schema.ts` | OpenAPI: `@ApiProperty` на русском |
| **DTO** | `src/**/dto/*.dto.ts` | Вход REST API: `@ApiProperty` + class-validator |
| **Mapper** | `src/prisma/mappers/` | `toXxxEntity()` — Prisma → domain |
| **Prisma enum** | `prisma/schema.prisma` | `PENDING_PAYMENT`, `AVAILABLE`, … (SCREAMING_SNAKE) |
| **Domain enum** | `src/entities/enums/` | `pending_payment`, `available`, … (snake_case) |

Не смешивайте Prisma-типы с доменными в сервисах — всегда маппите через `prisma.mapper.ts`.

### Добавление новой сущности

1. Модель в `prisma/schema.prisma` + миграция
2. Интерфейс в `src/entities/<name>.entity.ts`
3. Enum в `src/entities/enums/` (если нужен)
4. OpenAPI-схема в `src/entities/schemas/<name>.schema.ts` (описания **на русском**)
5. Маппер в `src/prisma/mappers/prisma.mapper.ts`
6. Сервис + модуль; при REST — DTO с валидацией
7. Зарегистрировать схему в `src/config/swagger.config.ts` → `extraModels`
8. `npm run db:migrate` + обновить `prisma/seed.ts` при необходимости

### REST API

- Глобальный `ValidationPipe` в `main.ts` (`whitelist`, `forbidNonWhitelisted`, `transform`)
- Контроллеры: `@ApiTags`, `@ApiOperation`, `@ApiOkResponse({ type: XxxSchema })`
- Admin-эндпоинты: `@UseGuards(AdminApiKeyGuard)` + `@ApiSecurity('admin-api-key')`
- Описания Swagger — **на русском** (см. существующие `*.schema.ts` и `swagger.config.ts`)

### Telegram-бот

- Обработчики только в `src/telegram/telegram.update.ts`
- Клавиатуры: `telegram.keyboards.ts`, тексты: `telegram.messages.ts`
- Состояние диалога — `SessionService` (БД), не in-memory
- Выдача credentials и сообщения об ошибках — `telegram/listeners/telegram-order.listener.ts` (реакция на `order.fulfilled` / `order.fulfillment_failed`)
- Поддержка: UX в `telegram.update.ts`, доставка ответов и уведомления админов — `telegram/listeners/telegram-support.listener.ts` (реакция на `support.*`)
- Подтверждение оплаты — `OrderWorkflowService.confirmPayment()` (не прямой вызов `markPaid` + `fulfill` из update)
- Сценарии бота: `SessionScenario.PURCHASE` и `SessionScenario.HELPDESK`; шаги в `scenario-registry.ts`
- Админ-команды поддержки (`/tickets`, `/reply`, `/close`) — только для ID из `ADMIN_TELEGRAM_IDS`
- Все вызовы сервисов — `async/await` (сервисы работают с Prisma)

### Транзакции

Выдача credentials при `OrdersService.fulfill()` — одна Prisma-транзакция:

1. `CredentialsService.reserveForOrder(planId, tx)` — найти AVAILABLE, пометить ASSIGNED
2. Обновить order → FULFILLED + credentialId

### Тесты

- Unit: `src/**/*.spec.ts` — без Telegram/Prisma, моки при необходимости (в т.ч. `EventsService`)
- E2E: `test/` — лёгкий модуль (AppController), **не** импортирует `AppModule` целиком (нужен `TELEGRAM_BOT_TOKEN`)

## Graphify

В проекте есть knowledge graph: `graphify-out/`.

Перед исследованием кодовой базы:

```bash
graphify query "как работает fulfillment заказа"
graphify explain "OrdersService"
```

После правок в `src/`:

```bash
graphify update .
```

Не читай `GRAPH_REPORT.md` целиком — используй `graphify query` / `graphify-out/wiki/index.md`.

## Чего не делать

- Не хранить каталог и credentials in-memory — всё через Prisma
- Не вызывать Telegram/HTTP из domain-сервисов — только emit + listeners
- Не добавлять Prisma 7 без миграции конфига (проект на Prisma 6)
- Не дублировать enum'ы без маппера (Prisma SCREAMING_SNAKE ↔ domain snake_case)
- Не коммитить `.env`, `*.db` — они в `.gitignore`
- Не создавать коммиты/PR без явного запроса пользователя
- Не писать описания Swagger на английском — проект использует русский для API-документации

## Ключевые файлы

| Файл | Зачем смотреть |
|------|----------------|
| `prisma/schema.prisma` | Источник правды для модели данных |
| `src/events/app-events.ts` | Имена событий и типы payload |
| `src/events/events.service.ts` | Типизированный emit |
| `src/telegram/telegram.update.ts` | UX бота (без выдачи credentials) |
| `src/telegram/listeners/telegram-order.listener.ts` | Доставка credentials в Telegram |
| `src/telegram/listeners/telegram-support.listener.ts` | Уведомления админов и ответы пользователям |
| `src/helpdesk/helpdesk.service.ts` | Тикеты и сообщения + emit `support.*` |
| `src/helpdesk/helpdesk.controller.ts` | REST admin: список, reply, close |
| `src/orders/orders.service.ts` | Мутации заказов + emit |
| `src/orders/order-workflow.service.ts` | confirmPayment (pay → fulfill) |
| `src/prisma/mappers/prisma.mapper.ts` | Преобразование Prisma ↔ domain |
| `src/config/swagger.config.ts` | Настройка OpenAPI |
| `prisma/seed.ts` | Начальные вендоры, планы, credentials |
| `docker-compose.yml` | Dev stack (app + observability) |
| `docker-compose.prod.yml` | Prod stack |
| `Dockerfile` / `Dockerfile.dev` | Production / development images |
| `docker/entrypoint*.sh` | Migrate + start в контейнере |
| `docker/grafana/dashboards/*.json` | Преднастроенные дашборды |

## Типичные задачи агента

| Задача | Куда смотреть / что менять |
|--------|----------------------------|
| Новый вендор/план | `prisma/seed.ts`, `VendorId` enum, seed + migrate |
| Новый шаг в боте | `SessionStep`, `SessionScenario`, `scenario-registry.ts`, `telegram.update.ts`, `session.service.ts` |
| Поддержка / helpdesk | `helpdesk/`, `telegram-support.listener.ts`, `SessionScenario.HELPDESK`, миграция `add_helpdesk` |
| Новый REST endpoint | DTO + controller + schema + swagger tags |
| Смена БД | `prisma/schema.prisma` — осторожно, сейчас только SQLite |
| Оплата | `payment.service.ts`, `order-workflow.service.ts`, `telegram.update.ts` |
| Новая реакция на событие | `src/events/app-events.ts` + payload + listener в нужном модуле |
| Логирование домена | `src/events/listeners/*-logging.listener.ts` (Pino) |
| Docker dev/prod | `docker-compose*.yml`, `Dockerfile*`, `docker/entrypoint*.sh` |
| Логи в Grafana | `docker/promtail/promtail-config.yml`, дашборд `application-logs.json` |
| Метрики сервера | `docker/prometheus/prometheus.yml`, дашборд `server-usage.json` |
| Env для Docker | `.env.example` (`GRAFANA_*`), compose переопределяет `DATABASE_URL` |

## Связанные документы

- [README.md](./README.md) — быстрый старт, Docker, API-примеры, env
- [.env.example](./.env.example) — шаблон переменных окружения
- Swagger: `/api/docs` после `npm run start:dev`
