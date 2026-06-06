import { SupportTicketStatus } from './enums';

export interface SupportTicketEntity {
  id: string;
  telegramUserId: number;
  telegramChatId: number;
  status: SupportTicketStatus;
  relatedOrderId?: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}
