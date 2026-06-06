import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PlanEntity } from '../entities';
import { PrismaService } from '../prisma/prisma.service';
import { toPlanEntity } from '../prisma/mappers/prisma.mapper';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class AdminPlansService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    vendorId?: string,
    includeInactive = false,
  ): Promise<PlanEntity[]> {
    const plans = await this.prisma.plan.findMany({
      where: {
        ...(vendorId ? { vendorId } : {}),
        ...(includeInactive ? {} : { active: true }),
      },
      orderBy: [{ vendorId: 'asc' }, { durationDays: 'asc' }],
    });
    return plans.map(toPlanEntity);
  }

  async get(id: string): Promise<PlanEntity> {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundException('Тарифный план не найден');
    }
    return toPlanEntity(plan);
  }

  async create(dto: CreatePlanDto): Promise<PlanEntity> {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: dto.vendorId },
    });
    if (!vendor) {
      throw new NotFoundException('Вендор не найден');
    }

    const existing = await this.prisma.plan.findUnique({
      where: { id: dto.id },
    });
    if (existing) {
      throw new ConflictException('План с таким id уже существует');
    }

    const plan = await this.prisma.plan.create({
      data: {
        id: dto.id,
        vendorId: dto.vendorId,
        name: dto.name,
        description: dto.description,
        durationDays: dto.durationDays,
        priceRub: dto.priceRub,
        currency: dto.currency ?? 'RUB',
        active: dto.active ?? true,
      },
    });
    return toPlanEntity(plan);
  }

  async update(id: string, dto: UpdatePlanDto): Promise<PlanEntity> {
    await this.get(id);
    const plan = await this.prisma.plan.update({
      where: { id },
      data: dto,
    });
    return toPlanEntity(plan);
  }

  async deactivate(id: string): Promise<PlanEntity> {
    return this.update(id, { active: false });
  }
}
