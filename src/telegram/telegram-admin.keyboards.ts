import { Markup } from 'telegraf';
import { ExcelImportType } from '../entities';
import type { CounterpartyEntity, PlanEntity, VendorEntity } from '../entities';

export function adminPanelKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('Вендоры', 'admin:manage:vendors'),
      Markup.button.callback('Планы', 'admin:manage:plans'),
    ],
    [
      Markup.button.callback('Контрагенты', 'admin:manage:counterparties'),
      Markup.button.callback('Обращения', 'admin:tickets'),
    ],
    [Markup.button.callback('Excel-шаблоны', 'admin:excel:templates')],
    [Markup.button.callback('Импорт Excel', 'admin:excel:import')],
  ]);
}

export function adminVendorsKeyboard(vendors: VendorEntity[]) {
  const rows = vendors
    .slice(0, 8)
    .map((v) => [
      Markup.button.callback(
        `${v.active ? '⛔' : '✅'} ${v.emoji} ${v.name}`,
        `admin:vendor:toggle:${v.id}`,
      ),
    ]);
  rows.push([
    Markup.button.callback('← Админ-панель', 'admin:panel'),
    Markup.button.callback('Обновить', 'admin:manage:vendors'),
  ]);
  return Markup.inlineKeyboard(rows);
}

export function adminPlansKeyboard(plans: PlanEntity[]) {
  const rows = plans
    .slice(0, 8)
    .map((p) => [
      Markup.button.callback(
        `${p.active ? '⛔' : '✅'} ${p.name}`,
        `admin:plan:toggle:${p.id}`,
      ),
    ]);
  rows.push([
    Markup.button.callback('← Админ-панель', 'admin:panel'),
    Markup.button.callback('Обновить', 'admin:manage:plans'),
  ]);
  return Markup.inlineKeyboard(rows);
}

export function adminCounterpartiesKeyboard(items: CounterpartyEntity[]) {
  const rows = items
    .slice(0, 8)
    .map((c) => [
      Markup.button.callback(
        `${c.active ? '⛔' : '✅'} ${c.name}`,
        `admin:counterparty:toggle:${c.id}`,
      ),
    ]);
  rows.push([
    Markup.button.callback('← Админ-панель', 'admin:panel'),
    Markup.button.callback('Обновить', 'admin:manage:counterparties'),
  ]);
  return Markup.inlineKeyboard(rows);
}

export function adminExcelTemplatesKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(
        'Вендоры',
        `admin:excel:template:${ExcelImportType.VENDORS}`,
      ),
      Markup.button.callback(
        'Планы',
        `admin:excel:template:${ExcelImportType.PLANS}`,
      ),
    ],
    [
      Markup.button.callback(
        'Контрагенты',
        `admin:excel:template:${ExcelImportType.COUNTERPARTIES}`,
      ),
      Markup.button.callback(
        'Credentials',
        `admin:excel:template:${ExcelImportType.CREDENTIALS}`,
      ),
    ],
    [Markup.button.callback('← Админ-панель', 'admin:panel')],
  ]);
}

export function adminExcelImportKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(
        'Вендоры',
        `admin:excel:import:${ExcelImportType.VENDORS}`,
      ),
      Markup.button.callback(
        'Планы',
        `admin:excel:import:${ExcelImportType.PLANS}`,
      ),
    ],
    [
      Markup.button.callback(
        'Контрагенты',
        `admin:excel:import:${ExcelImportType.COUNTERPARTIES}`,
      ),
      Markup.button.callback(
        'Credentials',
        `admin:excel:import:${ExcelImportType.CREDENTIALS}`,
      ),
    ],
    [Markup.button.callback('← Админ-панель', 'admin:panel')],
  ]);
}
