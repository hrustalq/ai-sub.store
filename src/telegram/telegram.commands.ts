import type { BotCommand } from 'telegraf/types';

export const BOT_COMMANDS: BotCommand[] = [
  { command: 'start', description: 'Главное меню' },
  { command: 'help', description: 'Справка по командам' },
  { command: 'browse', description: 'Каталог подписок' },
  { command: 'orders', description: 'Мои заказы' },
  { command: 'support', description: 'Поддержка' },
  { command: 'legal', description: 'Правовая информация' },
  { command: 'privacy', description: 'Политика конфиденциальности' },
  { command: 'terms', description: 'Пользовательское соглашение' },
  { command: 'cancel', description: 'Отменить текущий выбор' },
];

export const ADMIN_BOT_COMMANDS: BotCommand[] = [
  { command: 'admin', description: 'Панель администратора' },
  { command: 'tickets', description: 'Открытые обращения (админ)' },
  { command: 'reply', description: 'Ответить: /reply <id> <текст>' },
  { command: 'close', description: 'Закрыть: /close <id>' },
  { command: 'confirm', description: 'Подтвердить оплату: /confirm <id>' },
  { command: 'cancel', description: 'Отменить текущий режим' },
];

export function botCommandsHelpMessage(): string {
  const lines = BOT_COMMANDS.map(
    (cmd) => `/${cmd.command} — ${cmd.description}`,
  );
  return ['*Команды:*', ...lines].join('\n');
}
