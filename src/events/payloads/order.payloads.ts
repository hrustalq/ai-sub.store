import { CredentialEntity, OrderEntity } from '../../entities';

export type PaymentConfirmationSource =
  | 'yookassa'
  | 'admin_api'
  | 'admin_command';

export interface OrderCreatedPayload {
  order: OrderEntity;
}

export interface OrderPaidPayload {
  order: OrderEntity;
  source?: PaymentConfirmationSource;
}

export interface OrderFulfilledPayload {
  order: OrderEntity;
  credential: CredentialEntity;
  source?: PaymentConfirmationSource;
}

export interface OrderFulfillmentFailedPayload {
  orderId: string;
  planId: string;
  telegramUserId: number;
  telegramChatId: number;
  reason: string;
  source?: PaymentConfirmationSource;
}

export interface OrderCancelledPayload {
  order: OrderEntity;
}
