export interface YooKassaAmount {
  value: string;
  currency: string;
}

export interface YooKassaPaymentConfirmation {
  type: string;
  confirmation_url?: string;
  return_url?: string;
}

export interface YooKassaPayment {
  id: string;
  status: string;
  amount: YooKassaAmount;
  confirmation?: YooKassaPaymentConfirmation;
  metadata?: Record<string, string>;
}

export interface YooKassaWebhookPayload {
  type: string;
  event: string;
  object: YooKassaPayment;
}

export interface YooKassaCreatePaymentResult {
  paymentId: string;
  confirmationUrl: string;
}
