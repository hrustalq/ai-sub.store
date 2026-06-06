import {
  ExcelImportTypeValue,
  SessionStep,
  UserSessionEntity,
} from '../../entities';

export type AdminManageStep = SessionStep.ADMIN_AWAITING_EXCEL;

export interface AdminManageContext {
  importType?: ExcelImportTypeValue;
}

export interface AdminManageSessionState {
  step: AdminManageStep;
  context: AdminManageContext;
}

export function toAdminManageContext(
  session: UserSessionEntity,
): AdminManageContext {
  return {
    importType: session.vendorId as ExcelImportTypeValue | undefined,
  };
}

export function mergeAdminManageContext(
  current: AdminManageContext,
  patch?: Partial<AdminManageContext>,
): AdminManageContext {
  return {
    importType: patch?.importType ?? current.importType,
  };
}
