import { CredentialEntity } from '../../entities';

export interface CredentialCreatedPayload {
  credential: CredentialEntity;
}

export interface CredentialStockDepletedPayload {
  planId: string;
  orderId?: string;
}
