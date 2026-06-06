import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CredentialEntity } from '../entities';
import { AppEvents, EventsService } from '../events';
import { PrismaService } from '../prisma/prisma.service';
import { toCredentialEntity } from '../prisma/mappers/prisma.mapper';
import { CreateCredentialDto } from './dto/create-credential.dto';

@Injectable()
export class CredentialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  async reserveForOrder(
    planId: string,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<CredentialEntity | undefined> {
    const credential = await tx.credential.findFirst({
      where: { planId, status: 'AVAILABLE' },
      orderBy: { createdAt: 'asc' },
    });

    if (!credential) {
      return undefined;
    }

    const updated = await tx.credential.update({
      where: { id: credential.id },
      data: { status: 'ASSIGNED' },
    });

    return toCredentialEntity(updated);
  }

  async getByOrderId(orderId: string): Promise<CredentialEntity | undefined> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { credential: true },
    });

    if (!order?.credential) {
      return undefined;
    }

    return toCredentialEntity(order.credential);
  }

  async availableCount(planId: string): Promise<number> {
    return this.prisma.credential.count({
      where: { planId, status: 'AVAILABLE' },
    });
  }

  async create(dto: CreateCredentialDto): Promise<CredentialEntity> {
    const credential = await this.prisma.credential.create({
      data: {
        planId: dto.planId,
        counterpartyId: dto.counterpartyId,
        email: dto.email,
        password: dto.password,
        status: 'AVAILABLE',
      },
    });

    const entity = toCredentialEntity(credential);
    this.events.emit(AppEvents.Credential.Created, { credential: entity });
    return entity;
  }
}
