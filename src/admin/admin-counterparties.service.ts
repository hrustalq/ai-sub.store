import { Injectable, NotFoundException } from '@nestjs/common';
import { CounterpartyEntity } from '../entities';
import { PrismaService } from '../prisma/prisma.service';
import { toCounterpartyEntity } from '../prisma/mappers/prisma.mapper';
import { CreateCounterpartyDto } from './dto/create-counterparty.dto';
import { UpdateCounterpartyDto } from './dto/update-counterparty.dto';

@Injectable()
export class AdminCounterpartiesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(includeInactive = false): Promise<CounterpartyEntity[]> {
    const items = await this.prisma.counterparty.findMany({
      where: includeInactive ? undefined : { active: true },
      orderBy: { name: 'asc' },
    });
    return items.map(toCounterpartyEntity);
  }

  async get(id: string): Promise<CounterpartyEntity> {
    const item = await this.prisma.counterparty.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Контрагент не найден');
    }
    return toCounterpartyEntity(item);
  }

  async create(dto: CreateCounterpartyDto): Promise<CounterpartyEntity> {
    const item = await this.prisma.counterparty.create({
      data: {
        name: dto.name,
        contactInfo: dto.contactInfo,
        notes: dto.notes,
        active: dto.active ?? true,
      },
    });
    return toCounterpartyEntity(item);
  }

  async update(
    id: string,
    dto: UpdateCounterpartyDto,
  ): Promise<CounterpartyEntity> {
    await this.get(id);
    const item = await this.prisma.counterparty.update({
      where: { id },
      data: dto,
    });
    return toCounterpartyEntity(item);
  }

  async deactivate(id: string): Promise<CounterpartyEntity> {
    return this.update(id, { active: false });
  }
}
