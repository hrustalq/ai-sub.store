export interface CounterpartyEntity {
  id: string;
  name: string;
  contactInfo?: string;
  notes?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
