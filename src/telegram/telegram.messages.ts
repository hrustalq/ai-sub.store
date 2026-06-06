import { formatPriceRub } from '../common/format-price';
import {
  CredentialEntity,
  OrderEntity,
  OrderStatus,
  PlanEntity,
  SessionStep,
  SupportMessageEntity,
  SupportTicketEntity,
  SupportTicketStatus,
  VendorEntity,
} from '../entities';
import { getStepHint } from '../session/scenarios/scenario-registry';

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING_PAYMENT]: 'ожидает оплаты',
  [OrderStatus.PAID]: 'оплачен',
  [OrderStatus.FULFILLED]: 'выполнен',
  [OrderStatus.CANCELLED]: 'отменён',
  [OrderStatus.FAILED]: 'ошибка',
};

export const WELCOME_MESSAGE = [
  '👋 Добро пожаловать в *AI Sub Store*!',
  '',
  'Премиум-подписки на AI-инструменты:',
  '• Cursor Pro',
  '• Claude Pro',
  '• ChatGPT Plus',
  '• Gemini Advanced',
  '',
  'Выберите провайдера, план, оплатите — и получите учётные данные сразу после подтверждения.',
  '',
  'Оформляя заказ, вы принимаете пользовательское соглашение и политику конфиденциальности (/legal).',
].join('\n');

/** Telegram profile short description (max 120 chars). Shown when sharing the bot link. */
export const BOT_SHORT_DESCRIPTION =
  'Премиум AI-подписки: Cursor, Claude, ChatGPT, Gemini. Каталог, оплата и доступ — в одном боте.';

const TELEGRAM_PROFILE_DESCRIPTION_LIMIT = 512;

export function stripTelegramMarkdown(text: string): string {
  return text
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1');
}

/** Plain-text description for empty bot chat (setMyDescription), derived from WELCOME_MESSAGE. */
export function getBotProfileDescription(): string {
  const plain = stripTelegramMarkdown(WELCOME_MESSAGE);
  if (plain.length <= TELEGRAM_PROFILE_DESCRIPTION_LIMIT) {
    return plain;
  }
  return `${plain.slice(0, TELEGRAM_PROFILE_DESCRIPTION_LIMIT - 1)}…`;
}

export const LEGAL_MENU_MESSAGE = [
  '📄 *Правовая информация*',
  '',
  'Перед покупкой ознакомьтесь с документами:',
  '• Политика конфиденциальности — какие данные мы обрабатываем',
  '• Пользовательское соглашение — условия заказов, оплаты и выдачи подписок',
].join('\n');

export function vendorListMessage(vendors: VendorEntity[]): string {
  const lines = vendors.map((v) => `${v.emoji} *${v.name}* — ${v.description}`);
  return ['🛍 *Выберите провайдера:*', '', ...lines].join('\n');
}

export function planListMessage(
  vendor: VendorEntity,
  plans: PlanEntity[],
): string {
  const lines = plans.map(
    (p) =>
      `• *${p.name}* — ${formatPriceRub(p.priceRub)}\n  ${p.description} (${p.durationDays} дн.)`,
  );
  return [
    `Планы *${vendor.emoji} ${vendor.name}*:`,
    '',
    ...lines,
    '',
    'Выберите план ниже:',
  ].join('\n');
}

export function yookassaPaymentMessage(
  orderId: string,
  plan: PlanEntity,
  amountLabel: string,
): string {
  return [
    '💳 *Оплата через ЮKassa*',
    '',
    `Заказ: \`${orderId}\``,
    `План: ${plan.name}`,
    `Сумма: *${amountLabel}*`,
    '',
    'Нажмите кнопку ниже, чтобы перейти на защищённую страницу оплаты.',
    'После успешной оплаты учётные данные придут в этот чат автоматически.',
  ].join('\n');
}

export function orderSummaryMessage(
  vendor: VendorEntity,
  plan: PlanEntity,
  orderId: string,
): string {
  return [
    '📦 *Сводка заказа*',
    '',
    `Провайдер: ${vendor.emoji} ${vendor.name}`,
    `План: ${plan.name}`,
    `Срок: ${plan.durationDays} дн.`,
    `Цена: *${formatPriceRub(plan.priceRub)}*`,
    '',
    `ID заказа: \`${orderId}\``,
    '',
    'Подтвердите, чтобы перейти к оплате.',
  ].join('\n');
}

export function credentialsMessage(
  vendor: VendorEntity,
  plan: PlanEntity,
  credential: CredentialEntity,
): string {
  return [
    '✅ *Оплата подтверждена!*',
    '',
    `Подписка *${vendor.name}* готова.`,
    '',
    `План: ${plan.name}`,
    `Действует: ${plan.durationDays} дн.`,
    '',
    '🔐 *Учётные данные:*',
    `Email: \`${credential.email}\``,
    `Пароль: \`${credential.password}\``,
    '',
    '⚠️ Храните данные в секрете. Не передавайте их третьим лицам.',
  ].join('\n');
}

export function ordersListMessage(orders: OrderEntity[]): string {
  if (orders.length === 0) {
    return '📋 У вас пока нет заказов.\n\nНажмите *Каталог подписок*, чтобы начать.';
  }

  const lines = orders.map((o) => {
    const statusEmoji =
      o.status === OrderStatus.FULFILLED
        ? '✅'
        : o.status === OrderStatus.PENDING_PAYMENT
          ? '⏳'
          : o.status === OrderStatus.PAID
            ? '💳'
            : o.status === OrderStatus.CANCELLED
              ? '❌'
              : '⚠️';
    const statusLabel = ORDER_STATUS_LABELS[o.status] ?? o.status;
    return `${statusEmoji} \`${o.id.slice(0, 8)}…\` — ${o.vendorId} / ${o.planId} — ${statusLabel}`;
  });

  return ['📋 *Ваши заказы:*', '', ...lines].join('\n');
}

const SUPPORT_STATUS_LABELS: Record<SupportTicketStatus, string> = {
  [SupportTicketStatus.OPEN]: 'открыто',
  [SupportTicketStatus.RESOLVED]: 'решено',
  [SupportTicketStatus.CLOSED]: 'закрыто',
};

export const SUPPORT_WELCOME_MESSAGE = [
  '🆘 *Поддержка AI Sub Store*',
  '',
  'Опишите проблему — мы ответим в этом чате.',
  '',
  'Частые вопросы:',
  '• Оплата не подтверждается — укажите ID заказа из «Мои заказы»',
  '• Не пришли учётные данные — проверьте статус заказа',
  '• Проблема с аккаунтом — опишите симптомы и провайдера',
].join('\n');

export function supportTicketsListMessage(
  tickets: SupportTicketEntity[],
): string {
  if (tickets.length === 0) {
    return '📨 У вас пока нет обращений.\n\nНажмите *Написать обращение*, чтобы связаться с нами.';
  }

  const lines = tickets.map((ticket) => {
    const statusLabel = SUPPORT_STATUS_LABELS[ticket.status] ?? ticket.status;
    return `• \`${ticket.id.slice(0, 8)}…\` — ${statusLabel}`;
  });

  return ['📨 *Ваши обращения:*', '', ...lines].join('\n');
}

export function supportDescribeIssueMessage(): string {
  return [
    '✍️ *Новое обращение*',
    '',
    'Опишите проблему одним сообщением.',
    'Если есть — укажите ID заказа (из «Мои заказы»).',
    '',
    '/cancel — отменить',
  ].join('\n');
}

export function supportFollowUpMessage(ticketId: string): string {
  return [
    '➕ *Дополнение к обращению*',
    '',
    `ID: \`${ticketId}\``,
    '',
    'Отправьте следующее сообщение с деталями.',
    '/cancel — отменить',
  ].join('\n');
}

export function supportTicketCreatedMessage(ticketId: string): string {
  return [
    '✅ *Обращение принято*',
    '',
    `ID: \`${ticketId}\``,
    '',
    'Мы ответим в этом чате. Вы можете дополнить обращение через меню поддержки.',
  ].join('\n');
}

export function supportReplyToUserMessage(text: string): string {
  return ['💬 *Ответ поддержки:*', '', text].join('\n');
}

export function adminNewTicketMessage(
  ticket: SupportTicketEntity,
  text: string,
): string {
  const orderLine = ticket.relatedOrderId
    ? `\nЗаказ: \`${ticket.relatedOrderId}\``
    : '';
  return [
    '🆕 *Новое обращение*',
    '',
    `ID: \`${ticket.id}\``,
    `Пользователь: \`${ticket.telegramUserId}\``,
    orderLine,
    '',
    text,
  ]
    .filter(Boolean)
    .join('\n');
}

export function adminUserFollowUpMessage(
  ticket: SupportTicketEntity,
  text: string,
): string {
  return [
    '📩 *Дополнение к обращению*',
    '',
    `ID: \`${ticket.id}\``,
    `Пользователь: \`${ticket.telegramUserId}\``,
    '',
    text,
  ].join('\n');
}

export function adminTicketsListMessage(
  tickets: SupportTicketEntity[],
): string {
  if (tickets.length === 0) {
    return '📭 Нет открытых обращений.';
  }

  const lines = tickets.map((ticket) => {
    return `• \`${ticket.id.slice(0, 8)}…\` — user \`${ticket.telegramUserId}\``;
  });

  return [
    '📬 *Открытые обращения:*',
    '',
    ...lines,
    '',
    'Выберите обращение или нажмите *Обновить*.',
  ].join('\n');
}

export function adminTicketDetailMessage(ticket: SupportTicketEntity): string {
  const statusLabel = SUPPORT_STATUS_LABELS[ticket.status] ?? ticket.status;
  const orderLine = ticket.relatedOrderId
    ? `Заказ: \`${ticket.relatedOrderId}\`\n`
    : '';

  return [
    '📋 *Обращение*',
    '',
    `ID: \`${ticket.id}\``,
    `Пользователь: \`${ticket.telegramUserId}\``,
    `Статус: ${statusLabel}`,
    orderLine.trimEnd(),
    '',
    'Выберите действие ниже.',
  ]
    .filter((line) => line !== undefined)
    .join('\n');
}

const MAX_MESSAGE_PREVIEW = 300;

function truncateMessage(text: string): string {
  if (text.length <= MAX_MESSAGE_PREVIEW) {
    return text;
  }
  return `${text.slice(0, MAX_MESSAGE_PREVIEW)}…`;
}

export function adminTicketMessagesMessage(
  ticket: SupportTicketEntity,
  messages: SupportMessageEntity[],
): string {
  if (messages.length === 0) {
    return [
      '📜 *История обращения*',
      '',
      `ID: \`${ticket.id}\``,
      '',
      'Сообщений пока нет.',
    ].join('\n');
  }

  const lines = messages.map((message) => {
    const author = message.fromAdmin ? '👤 Поддержка' : '👥 Пользователь';
    return `${author}:\n${truncateMessage(message.text)}`;
  });

  return [
    '📜 *История обращения*',
    '',
    `ID: \`${ticket.id}\``,
    `Пользователь: \`${ticket.telegramUserId}\``,
    '',
    ...lines,
  ].join('\n\n');
}

export function adminChatModeEnteredMessage(
  ticket: SupportTicketEntity,
): string {
  return [
    '💬 *Режим чата*',
    '',
    `Обращение: \`${ticket.id}\``,
    `Пользователь: \`${ticket.telegramUserId}\``,
    '',
    'Отправляйте сообщения — они уйдут пользователю.',
    '/cancel или кнопка *Выйти* — выход из чата.',
  ].join('\n');
}

export function adminChatModeExitedMessage(): string {
  return [
    '🚪 *Чат завершён*',
    '',
    'Используйте /tickets для списка обращений.',
  ].join('\n');
}

export function adminReplySentMessage(): string {
  return '✓ Ответ отправлен пользователю.';
}

export function sessionStepHintMessage(step: SessionStep): string {
  const hint = getStepHint(step);
  if (!hint) {
    return 'Используйте кнопки меню или /start для главного экрана.';
  }

  return `ℹ️ ${hint}\n\n/cancel — отменить текущий выбор`;
}
