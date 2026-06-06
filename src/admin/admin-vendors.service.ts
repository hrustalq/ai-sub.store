import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VendorEntity } from '../entities';
import { PrismaService } from '../prisma/prisma.service';
import { toVendorEntity } from '../prisma/mappers/prisma.mapper';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';

@Injectable()
export class AdminVendorsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(includeInactive = false): Promise<VendorEntity[]> {
    const vendors = await this.prisma.vendor.findMany({
      where: includeInactive ? undefined : { active: true },
      orderBy: { name: 'asc' },
    });
    return vendors.map(toVendorEntity);
  }

  async get(id: string): Promise<VendorEntity> {
    const vendor = await this.prisma.vendor.findUnique({ where: { id } });
    if (!vendor) {
      throw new NotFoundException('Вендор не найден');
    }
    return toVendorEntity(vendor);
  }

  async create(dto: CreateVendorDto): Promise<VendorEntity> {
    const existing = await this.prisma.vendor.findUnique({
      where: { id: dto.id },
    });
    if (existing) {
      throw new ConflictException('Вендор с таким id уже существует');
    }

    const vendor = await this.prisma.vendor.create({
      data: {
        id: dto.id,
        name: dto.name,
        description: dto.description,
        emoji: dto.emoji,
        active: dto.active ?? true,
      },
    });
    return toVendorEntity(vendor);
  }

  async update(id: string, dto: UpdateVendorDto): Promise<VendorEntity> {
    await this.get(id);
    const vendor = await this.prisma.vendor.update({
      where: { id },
      data: dto,
    });
    return toVendorEntity(vendor);
  }

  async deactivate(id: string): Promise<VendorEntity> {
    return this.update(id, { active: false });
  }
}
