import { VendorIdType } from './enums';

export interface VendorEntity {
  id: VendorIdType;
  name: string;
  description: string;
  emoji: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
