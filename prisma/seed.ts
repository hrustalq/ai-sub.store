import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const vendors = [
  {
    id: 'cursor',
    name: 'Cursor',
    description: 'AI-редактор кода с моделями Claude и GPT',
    emoji: '⚡',
  },
  {
    id: 'claude',
    name: 'Claude',
    description: 'Подписка Anthropic Claude Pro',
    emoji: '🧠',
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    description: 'Подписка OpenAI ChatGPT Plus',
    emoji: '💬',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    description: 'Подписка Google Gemini Advanced',
    emoji: '✨',
  },
];

const plans = [
  {
    id: 'cursor-monthly',
    vendorId: 'cursor',
    name: 'Cursor Pro — 1 мес.',
    description: 'Полный доступ к Cursor Pro на 30 дней',
    durationDays: 30,
    priceRub: 1990,
  },
  {
    id: 'cursor-quarterly',
    vendorId: 'cursor',
    name: 'Cursor Pro — 3 мес.',
    description: 'Полный доступ к Cursor Pro на 90 дней',
    durationDays: 90,
    priceRub: 5290,
  },
  {
    id: 'claude-monthly',
    vendorId: 'claude',
    name: 'Claude Pro — 1 мес.',
    description: 'Claude Pro с расширенным лимитом на 30 дней',
    durationDays: 30,
    priceRub: 1990,
  },
  {
    id: 'claude-quarterly',
    vendorId: 'claude',
    name: 'Claude Pro — 3 мес.',
    description: 'Claude Pro с расширенным лимитом на 90 дней',
    durationDays: 90,
    priceRub: 5290,
  },
  {
    id: 'chatgpt-monthly',
    vendorId: 'chatgpt',
    name: 'ChatGPT Plus — 1 мес.',
    description: 'Доступ к GPT-4o и приоритет на 30 дней',
    durationDays: 30,
    priceRub: 1990,
  },
  {
    id: 'chatgpt-quarterly',
    vendorId: 'chatgpt',
    name: 'ChatGPT Plus — 3 мес.',
    description: 'Доступ к GPT-4o и приоритет на 90 дней',
    durationDays: 90,
    priceRub: 5290,
  },
  {
    id: 'gemini-monthly',
    vendorId: 'gemini',
    name: 'Gemini Advanced — 1 мес.',
    description: 'Gemini 2.5 Pro и 2 ТБ хранилища на 30 дней',
    durationDays: 30,
    priceRub: 1990,
  },
  {
    id: 'gemini-quarterly',
    vendorId: 'gemini',
    name: 'Gemini Advanced — 3 мес.',
    description: 'Gemini 2.5 Pro и 2 ТБ хранилища на 90 дней',
    durationDays: 90,
    priceRub: 5290,
  },
];

const credentials = [
  {
    id: 'cred-cursor-1',
    planId: 'cursor-monthly',
    email: 'cursor.sub1@example.com',
    password: 'CursorPass#1',
  },
  {
    id: 'cred-cursor-2',
    planId: 'cursor-quarterly',
    email: 'cursor.sub2@example.com',
    password: 'CursorPass#2',
  },
  {
    id: 'cred-claude-1',
    planId: 'claude-monthly',
    email: 'claude.sub1@example.com',
    password: 'ClaudePass#1',
  },
  {
    id: 'cred-chatgpt-1',
    planId: 'chatgpt-monthly',
    email: 'chatgpt.sub1@example.com',
    password: 'ChatGPTPass#1',
  },
  {
    id: 'cred-gemini-1',
    planId: 'gemini-monthly',
    email: 'gemini.sub1@example.com',
    password: 'GeminiPass#1',
  },
];

async function main() {
  for (const vendor of vendors) {
    await prisma.vendor.upsert({
      where: { id: vendor.id },
      create: vendor,
      update: vendor,
    });
  }

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { id: plan.id },
      create: plan,
      update: plan,
    });
  }

  for (const credential of credentials) {
    await prisma.credential.upsert({
      where: { id: credential.id },
      create: credential,
      update: {
        email: credential.email,
        password: credential.password,
        status: 'AVAILABLE',
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
