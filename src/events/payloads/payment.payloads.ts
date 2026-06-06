import { OrderEntity, PlanEntity } from '../../entities';

export interface PaymentInvoiceSentPayload {
  order: OrderEntity;
  plan: PlanEntity;
  telegramChatId: number;
}

export interface PaymentInstructionsSentPayload {
  order: OrderEntity;
  plan: PlanEntity;
  telegramChatId: number;
}

export interface PaymentYooKassaLinkSentPayload {
  order: OrderEntity;
  plan: PlanEntity;
  telegramChatId: number;
  paymentId: string;
  confirmationUrl: string;
}
