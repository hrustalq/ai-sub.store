import { CredentialStatus } from './enums';

export interface CredentialEntity {
  id: string;
  planId: string;
  counterpartyId?: string;
  email: string;
  password: string;
  status: CredentialStatus;
  createdAt: Date;
  updatedAt: Date;
}
