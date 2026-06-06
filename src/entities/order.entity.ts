import { OrderStatus, VendorIdType } from './enums';

export interface OrderEntity {
  id: string;
  telegramUserId: number;
  telegramChatId: number;
  vendorId: VendorIdType;
  planId: string;
  status: OrderStatus;
  amountRub: number;
  currency: string;
  credentialId?: string;
  yookassaPaymentId?: string;
  createdAt: Date;
  paidAt?: Date;
  fulfilledAt?: Date;
  cancelledAt?: Date;
}
