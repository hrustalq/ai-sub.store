import type {
  CounterpartyEntity,
  ExcelImportTypeValue,
  PlanEntity,
  VendorEntity,
} from '../entities';
import type { ExcelImportResult } from '../admin/excel.service';

export const ADMIN_PANEL_MESSAGE =
  '*Панель администратора*\n\nУправление каталогом, контрагентами и импортом из Excel.';

export function adminVendorsListMessage(vendors: VendorEntity[]): string {
  if (vendors.length === 0) {
    return '*Вендоры*\n\nСписок пуст.';
  }

  const lines = vendors.map(
    (v) => `${v.active ? '✅' : '⛔'} ${v.emoji} *${v.name}* (\`${v.id}\`)`,
  );
  return ['*Вендоры*', '', ...lines].join('\n');
}

export function adminPlansListMessage(plans: PlanEntity[]): string {
  if (plans.length === 0) {
    return '*Тарифные планы*\n\nСписок пуст.';
  }

  const lines = plans.map(
    (p) =>
      `${p.active ? '✅' : '⛔'} *${p.name}* — ${p.priceRub} ₽ / ${p.durationDays} дн.\n\`${p.id}\` · вендор: \`${p.vendorId}\``,
  );
  return ['*Тарифные планы*', '', ...lines].join('\n');
}

export function adminCounterpartiesListMessage(
  items: CounterpartyEntity[],
): string {
  if (items.length === 0) {
    return '*Контрагенты*\n\nСписок пуст.';
  }

  const lines = items.map((c) => {
    const contact = c.contactInfo ? ` · ${c.contactInfo}` : '';
    return `${c.active ? '✅' : '⛔'} *${c.name}*${contact}\n\`${c.id}\``;
  });
  return ['*Контрагенты (поставщики учётных данных)*', '', ...lines].join('\n');
}

export function adminExcelImportPromptMessage(
  type: ExcelImportTypeValue,
): string {
  const labels: Record<ExcelImportTypeValue, string> = {
    vendors: 'вендоров',
    plans: 'тарифных планов',
    counterparties: 'контрагентов',
    credentials: 'учётных данных',
  };
  return [
    `*Импорт ${labels[type]}*`,
    '',
    'Отправьте Excel-файл (.xlsx) по шаблону.',
    'Для отмены — /cancel.',
  ].join('\n');
}

export function adminExcelImportResultMessage(
  result: ExcelImportResult,
): string {
  const lines = [
    '*Результат импорта*',
    '',
    `Создано: ${result.created}`,
    `Обновлено: ${result.updated}`,
  ];

  if (result.errors.length > 0) {
    lines.push('', '*Ошибки:*');
    for (const err of result.errors.slice(0, 10)) {
      lines.push(`• строка ${err.row}: ${err.message}`);
    }
    if (result.errors.length > 10) {
      lines.push(`… и ещё ${result.errors.length - 10} ошибок`);
    }
  }

  return lines.join('\n');
}
