import { SupportMessageEntity, SupportTicketEntity } from '../../entities';

export interface SupportTicketCreatedPayload {
  ticket: SupportTicketEntity;
  message: SupportMessageEntity;
}

export interface SupportMessageAddedPayload {
  ticket: SupportTicketEntity;
  message: SupportMessageEntity;
}

export interface SupportTicketClosedPayload {
  ticket: SupportTicketEntity;
}
