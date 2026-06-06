export interface SupportMessageEntity {
  id: string;
  ticketId: string;
  fromAdmin: boolean;
  telegramUserId?: number;
  text: string;
  createdAt: Date;
}
