import { SessionScenario, SessionStep, VendorIdType } from './enums';

export interface UserSessionEntity {
  telegramUserId: number;
  scenario: SessionScenario;
  step: SessionStep;
  vendorId?: VendorIdType;
  planId?: string;
  pendingOrderId?: string;
  supportTicketId?: string;
  updatedAt: Date;
}
