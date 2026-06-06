import { Markup } from 'telegraf';
import { formatPriceRub } from '../common/format-price';
import { PlanEntity, SupportTicketEntity, VendorEntity } from '../entities';

export function vendorKeyboard(vendors: VendorEntity[]) {
  const rows = vendors.map((v) => [
    Markup.button.callback(`${v.emoji} ${v.name}`, `vendor:${v.id}`),
  ]);

  return Markup.inlineKeyboard(rows);
}

export function planKeyboard(plans: PlanEntity[]) {
  const buttons = plans.map((p) =>
    Markup.button.callback(
      `${p.name} — ${formatPriceRub(p.priceRub)}`,
      `plan:${p.id}`,
    ),
  );

  return Markup.inlineKeyboard([
    ...buttons.map((b) => [b]),
    [Markup.button.callback('← К провайдерам', 'back:vendors')],
  ]);
}

export function yookassaPaymentKeyboard(confirmationUrl: string) {
  return Markup.inlineKeyboard([
    [Markup.button.url('💳 Оплатить', confirmationUrl)],
    [Markup.button.callback('← К планам', 'back:plans')],
  ]);
}

export function confirmOrderKeyboard(orderId: string) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ Оплатить', `pay:${orderId}`),
      Markup.button.callback('❌ Отменить', `cancel:${orderId}`),
    ],
    [Markup.button.callback('← К планам', 'back:plans')],
  ]);
}

export function mainMenuKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🛒 Каталог подписок', 'browse')],
    [Markup.button.callback('📋 Мои заказы', 'orders')],
    [Markup.button.callback('🆘 Поддержка', 'support')],
    [Markup.button.callback('📄 Правовая информация', 'legal')],
  ]);
}

export function legalMenuKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔒 Политика конфиденциальности', 'legal:privacy')],
    [Markup.button.callback('📜 Пользовательское соглашение', 'legal:terms')],
    [Markup.button.callback('← Главное меню', 'legal:home')],
  ]);
}

export function supportMenuKeyboard(hasOpenTicket: boolean) {
  const rows = [
    [Markup.button.callback('✍️ Написать обращение', 'support:new')],
    [Markup.button.callback('📨 Мои обращения', 'support:list')],
  ];

  if (hasOpenTicket) {
    rows.unshift([
      Markup.button.callback('➕ Добавить к открытому', 'support:followup'),
    ]);
  }

  rows.push([Markup.button.callback('← Главное меню', 'support:home')]);
  return Markup.inlineKeyboard(rows);
}

export function adminTicketsKeyboard(tickets: SupportTicketEntity[]) {
  const rows = tickets.map((ticket) => [
    Markup.button.callback(
      `📩 ${ticket.id.slice(0, 8)}… · ${ticket.telegramUserId}`,
      `admin:ticket:${ticket.id}`,
    ),
  ]);

  rows.push([Markup.button.callback('🔄 Обновить', 'admin:tickets')]);
  return Markup.inlineKeyboard(rows);
}

export function adminTicketKeyboard(ticketId: string) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('💬 Войти в чат', `admin:chat:${ticketId}`),
      Markup.button.callback('📜 Сообщения', `admin:msgs:${ticketId}`),
    ],
    [Markup.button.callback('✅ Закрыть', `admin:close:${ticketId}`)],
    [Markup.button.callback('📬 К списку', 'admin:tickets')],
  ]);
}

export function adminChatModeKeyboard(ticketId: string) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('📜 История', `admin:msgs:${ticketId}`),
      Markup.button.callback('🚪 Выйти', 'admin:exit'),
    ],
    [Markup.button.callback('✅ Закрыть', `admin:close:${ticketId}`)],
  ]);
}
