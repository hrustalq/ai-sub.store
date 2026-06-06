import { Injectable } from '@nestjs/common';
import { PlanEntity, VendorEntity, VendorIdType } from '../entities';
import { PrismaService } from '../prisma/prisma.service';
import { toPlanEntity, toVendorEntity } from '../prisma/mappers/prisma.mapper';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async getVendors(): Promise<VendorEntity[]> {
    const vendors = await this.prisma.vendor.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
    return vendors.map(toVendorEntity);
  }

  async getVendor(vendorId: VendorIdType): Promise<VendorEntity | undefined> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, active: true },
    });
    return vendor ? toVendorEntity(vendor) : undefined;
  }

  async getPlansForVendor(vendorId: VendorIdType): Promise<PlanEntity[]> {
    const plans = await this.prisma.plan.findMany({
      where: { vendorId, active: true },
      orderBy: { durationDays: 'asc' },
    });
    return plans.map(toPlanEntity);
  }

  async getPlan(planId: string): Promise<PlanEntity | undefined> {
    const plan = await this.prisma.plan.findFirst({
      where: { id: planId, active: true },
    });
    return plan ? toPlanEntity(plan) : undefined;
  }
}
