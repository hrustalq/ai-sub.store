export enum ExcelImportType {
  VENDORS = 'vendors',
  PLANS = 'plans',
  COUNTERPARTIES = 'counterparties',
  CREDENTIALS = 'credentials',
}

export type ExcelImportTypeValue = `${ExcelImportType}`;
