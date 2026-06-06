import { BadRequestException, Injectable } from '@nestjs/common';
import { Workbook, type CellValue } from 'exceljs';
import { ExcelImportType } from '../entities';
import { AppEvents, EventsService } from '../events';
import { PrismaService } from '../prisma/prisma.service';
import { toCredentialEntity } from '../prisma/mappers/prisma.mapper';

export interface ExcelImportError {
  row: number;
  message: string;
}

export interface ExcelImportResult {
  type: ExcelImportType;
  created: number;
  updated: number;
  errors: ExcelImportError[];
}

interface TemplateDefinition {
  sheetName: string;
  filename: string;
  headers: string[];
  exampleRow?: (string | number | boolean)[];
}

const TEMPLATES: Record<ExcelImportType, TemplateDefinition> = {
  [ExcelImportType.VENDORS]: {
    sheetName: 'Вендоры',
    filename: 'vendors-template.xlsx',
    headers: ['id', 'name', 'description', 'emoji', 'active'],
    exampleRow: ['new-vendor', 'New Vendor', 'Описание вендора', '✨', true],
  },
  [ExcelImportType.PLANS]: {
    sheetName: 'Планы',
    filename: 'plans-template.xlsx',
    headers: [
      'id',
      'vendor_id',
      'name',
      'description',
      'duration_days',
      'price_rub',
      'currency',
      'active',
    ],
    exampleRow: [
      'new-vendor-monthly',
      'new-vendor',
      'План — 1 мес.',
      'Описание плана',
      30,
      1990,
      'RUB',
      true,
    ],
  },
  [ExcelImportType.COUNTERPARTIES]: {
    sheetName: 'Контрагенты',
    filename: 'counterparties-template.xlsx',
    headers: ['id', 'name', 'contact_info', 'notes', 'active'],
    exampleRow: ['', 'Поставщик аккаунтов', '@supplier', 'Заметки', true],
  },
  [ExcelImportType.CREDENTIALS]: {
    sheetName: 'Учётные данные',
    filename: 'credentials-template.xlsx',
    headers: ['plan_id', 'email', 'password', 'counterparty_id'],
    exampleRow: ['cursor-monthly', 'account@example.com', 'SecurePass#1', ''],
  },
};

@Injectable()
export class ExcelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  getTemplateFilename(type: ExcelImportType): string {
    return TEMPLATES[type].filename;
  }

  async generateTemplate(type: ExcelImportType): Promise<Buffer> {
    const def = TEMPLATES[type];
    const workbook = new Workbook();
    const sheet = workbook.addWorksheet(def.sheetName);
    sheet.addRow(def.headers);
    if (def.exampleRow) {
      sheet.addRow(def.exampleRow);
    }
    sheet.getRow(1).font = { bold: true };
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async importFromBuffer(
    type: ExcelImportType,
    buffer: Buffer,
  ): Promise<ExcelImportResult> {
    const workbook = new Workbook();
    try {
      await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    } catch {
      throw new BadRequestException('Некорректный Excel-файл (.xlsx)');
    }

    const sheet = workbook.worksheets[0];
    if (!sheet) {
      throw new BadRequestException('Файл не содержит листов');
    }

    const def = TEMPLATES[type];
    const headerRow = sheet.getRow(1);
    const headers = this.rowToStrings(headerRow);
    if (!this.headersMatch(headers, def.headers)) {
      throw new BadRequestException(
        `Неверные заголовки. Ожидаются: ${def.headers.join(', ')}`,
      );
    }

    switch (type) {
      case ExcelImportType.VENDORS:
        return this.importVendors(sheet, def.headers);
      case ExcelImportType.PLANS:
        return this.importPlans(sheet, def.headers);
      case ExcelImportType.COUNTERPARTIES:
        return this.importCounterparties(sheet, def.headers);
      case ExcelImportType.CREDENTIALS:
        return this.importCredentials(sheet, def.headers);
      default:
        throw new BadRequestException('Неизвестный тип импорта');
    }
  }

  private async importVendors(
    sheet: import('exceljs').Worksheet,
    headers: string[],
  ): Promise<ExcelImportResult> {
    const result: ExcelImportResult = {
      type: ExcelImportType.VENDORS,
      created: 0,
      updated: 0,
      errors: [],
    };

    for (let rowNum = 2; rowNum <= sheet.rowCount; rowNum++) {
      const row = sheet.getRow(rowNum);
      const values = this.rowToMap(headers, row);
      if (this.isEmptyRow(values)) {
        continue;
      }

      const id = values.id?.trim();
      if (!id) {
        result.errors.push({ row: rowNum, message: 'Поле id обязательно' });
        continue;
      }

      try {
        const data = {
          name: values.name?.trim() || id,
          description: values.description?.trim() || '',
          emoji: values.emoji?.trim() || '📦',
          active: this.parseBoolean(values.active, true),
        };
        const existing = await this.prisma.vendor.findUnique({
          where: { id },
        });
        if (existing) {
          await this.prisma.vendor.update({ where: { id }, data });
          result.updated++;
        } else {
          await this.prisma.vendor.create({ data: { id, ...data } });
          result.created++;
        }
      } catch (error) {
        result.errors.push({
          row: rowNum,
          message: error instanceof Error ? error.message : 'Ошибка сохранения',
        });
      }
    }

    return result;
  }

  private async importPlans(
    sheet: import('exceljs').Worksheet,
    headers: string[],
  ): Promise<ExcelImportResult> {
    const result: ExcelImportResult = {
      type: ExcelImportType.PLANS,
      created: 0,
      updated: 0,
      errors: [],
    };

    for (let rowNum = 2; rowNum <= sheet.rowCount; rowNum++) {
      const row = sheet.getRow(rowNum);
      const values = this.rowToMap(headers, row);
      if (this.isEmptyRow(values)) {
        continue;
      }

      const id = values.id?.trim();
      const vendorId = values.vendor_id?.trim();
      if (!id || !vendorId) {
        result.errors.push({
          row: rowNum,
          message: 'Поля id и vendor_id обязательны',
        });
        continue;
      }

      const durationDays = Number(values.duration_days);
      const priceRub = Number(values.price_rub);
      if (!Number.isFinite(durationDays) || durationDays < 1) {
        result.errors.push({
          row: rowNum,
          message: 'duration_days должно быть числом ≥ 1',
        });
        continue;
      }
      if (!Number.isFinite(priceRub) || priceRub < 0) {
        result.errors.push({
          row: rowNum,
          message: 'price_rub должно быть числом ≥ 0',
        });
        continue;
      }

      try {
        const vendor = await this.prisma.vendor.findUnique({
          where: { id: vendorId },
        });
        if (!vendor) {
          result.errors.push({
            row: rowNum,
            message: `Вендор "${vendorId}" не найден`,
          });
          continue;
        }

        const data = {
          vendorId,
          name: values.name?.trim() || id,
          description: values.description?.trim() || '',
          durationDays,
          priceRub,
          currency: values.currency?.trim() || 'RUB',
          active: this.parseBoolean(values.active, true),
        };
        const existing = await this.prisma.plan.findUnique({ where: { id } });
        if (existing) {
          await this.prisma.plan.update({ where: { id }, data });
          result.updated++;
        } else {
          await this.prisma.plan.create({ data: { id, ...data } });
          result.created++;
        }
      } catch (error) {
        result.errors.push({
          row: rowNum,
          message: error instanceof Error ? error.message : 'Ошибка сохранения',
        });
      }
    }

    return result;
  }

  private async importCounterparties(
    sheet: import('exceljs').Worksheet,
    headers: string[],
  ): Promise<ExcelImportResult> {
    const result: ExcelImportResult = {
      type: ExcelImportType.COUNTERPARTIES,
      created: 0,
      updated: 0,
      errors: [],
    };

    for (let rowNum = 2; rowNum <= sheet.rowCount; rowNum++) {
      const row = sheet.getRow(rowNum);
      const values = this.rowToMap(headers, row);
      if (this.isEmptyRow(values)) {
        continue;
      }

      const id = values.id?.trim();
      const name = values.name?.trim();
      if (!name) {
        result.errors.push({ row: rowNum, message: 'Поле name обязательно' });
        continue;
      }

      try {
        const data = {
          name,
          contactInfo: values.contact_info?.trim() || null,
          notes: values.notes?.trim() || null,
          active: this.parseBoolean(values.active, true),
        };
        if (id) {
          const existing = await this.prisma.counterparty.findUnique({
            where: { id },
          });
          if (existing) {
            await this.prisma.counterparty.update({ where: { id }, data });
            result.updated++;
          } else {
            await this.prisma.counterparty.create({ data: { id, ...data } });
            result.created++;
          }
        } else {
          await this.prisma.counterparty.create({ data });
          result.created++;
        }
      } catch (error) {
        result.errors.push({
          row: rowNum,
          message: error instanceof Error ? error.message : 'Ошибка сохранения',
        });
      }
    }

    return result;
  }

  private async importCredentials(
    sheet: import('exceljs').Worksheet,
    headers: string[],
  ): Promise<ExcelImportResult> {
    const result: ExcelImportResult = {
      type: ExcelImportType.CREDENTIALS,
      created: 0,
      updated: 0,
      errors: [],
    };

    for (let rowNum = 2; rowNum <= sheet.rowCount; rowNum++) {
      const row = sheet.getRow(rowNum);
      const values = this.rowToMap(headers, row);
      if (this.isEmptyRow(values)) {
        continue;
      }

      const planId = values.plan_id?.trim();
      const email = values.email?.trim();
      const password = values.password?.trim();
      const counterpartyId = values.counterparty_id?.trim() || undefined;

      if (!planId || !email || !password) {
        result.errors.push({
          row: rowNum,
          message: 'Поля plan_id, email и password обязательны',
        });
        continue;
      }
      if (password.length < 8) {
        result.errors.push({
          row: rowNum,
          message: 'password должен быть не короче 8 символов',
        });
        continue;
      }

      try {
        const plan = await this.prisma.plan.findUnique({
          where: { id: planId },
        });
        if (!plan) {
          result.errors.push({
            row: rowNum,
            message: `План "${planId}" не найден`,
          });
          continue;
        }

        if (counterpartyId) {
          const counterparty = await this.prisma.counterparty.findUnique({
            where: { id: counterpartyId },
          });
          if (!counterparty) {
            result.errors.push({
              row: rowNum,
              message: `Контрагент "${counterpartyId}" не найден`,
            });
            continue;
          }
        }

        const credential = await this.prisma.credential.create({
          data: {
            planId,
            email,
            password,
            counterpartyId,
            status: 'AVAILABLE',
          },
        });
        const entity = toCredentialEntity(credential);
        this.events.emit(AppEvents.Credential.Created, { credential: entity });
        result.created++;
      } catch (error) {
        result.errors.push({
          row: rowNum,
          message: error instanceof Error ? error.message : 'Ошибка сохранения',
        });
      }
    }

    return result;
  }

  private rowToStrings(row: import('exceljs').Row): string[] {
    const values: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      values[col - 1] = this.cellValueToString(cell.value);
    });
    return values;
  }

  private rowToMap(
    headers: string[],
    row: import('exceljs').Row,
  ): Record<string, string> {
    const map: Record<string, string> = {};
    headers.forEach((header, index) => {
      const cell = row.getCell(index + 1);
      map[header] = this.cellValueToString(cell.value);
    });
    return map;
  }

  private cellValueToString(value: CellValue | null | undefined): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'string') {
      return value.trim();
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'object') {
      if ('richText' in value && Array.isArray(value.richText)) {
        return value.richText
          .map((part) => (typeof part.text === 'string' ? part.text : ''))
          .join('')
          .trim();
      }
      if ('text' in value && typeof value.text === 'string') {
        return value.text.trim();
      }
      if ('result' in value) {
        return this.cellValueToString(value.result);
      }
    }
    return '';
  }

  private isEmptyRow(values: Record<string, string>): boolean {
    return Object.values(values).every((v) => !v);
  }

  private headersMatch(actual: string[], expected: string[]): boolean {
    if (actual.length < expected.length) {
      return false;
    }
    return expected.every(
      (header, index) => actual[index]?.toLowerCase() === header.toLowerCase(),
    );
  }

  private parseBoolean(
    value: string | undefined,
    defaultValue: boolean,
  ): boolean {
    if (!value) {
      return defaultValue;
    }
    const normalized = value.toLowerCase();
    if (['true', '1', 'yes', 'да'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'нет'].includes(normalized)) {
      return false;
    }
    return defaultValue;
  }
}
