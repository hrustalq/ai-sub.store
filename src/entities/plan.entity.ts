import { VendorIdType } from './enums';

export interface PlanEntity {
  id: string;
  vendorId: VendorIdType;
  name: string;
  description: string;
  durationDays: number;
  priceRub: number;
  currency: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
