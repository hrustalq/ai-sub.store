import { Injectable } from '@nestjs/common';
import { OrderEntity, OrderStatus } from '../entities';
import { CatalogService } from '../catalog/catalog.service';
import { CredentialsService } from '../credentials/credentials.service';
import { AppEvents, EventsService, PaymentConfirmationSource } from '../events';
import { PrismaService } from '../prisma/prisma.service';
import { toOrderEntity } from '../prisma/mappers/prisma.mapper';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogService,
    private readonly credentials: CredentialsService,
    private readonly events: EventsService,
  ) {}

  async create(
    telegramUserId: number,
    telegramChatId: number,
    planId: string,
  ): Promise<OrderEntity> {
    const plan = await this.catalog.getPlan(planId);
    if (!plan) {
      throw new Error(`Unknown plan: ${planId}`);
    }

    const available = await this.credentials.availableCount(plan.id);
    if (available === 0) {
      this.events.emit(AppEvents.Credential.StockDepleted, { planId: plan.id });
      throw new Error('No credentials available for this plan');
    }

    await this.ensureTelegramUser(telegramUserId);

    const order = await this.prisma.order.create({
      data: {
        telegramUserId: BigInt(telegramUserId),
        telegramChatId: BigInt(telegramChatId),
        vendorId: plan.vendorId,
        planId: plan.id,
        status: 'PENDING_PAYMENT',
        amountRub: plan.priceRub,
        currency: plan.currency,
      },
    });

    const entity = toOrderEntity(order);
    this.events.emit(AppEvents.Order.Created, { order: entity });
    return entity;
  }

  async get(orderId: string): Promise<OrderEntity | undefined> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    return order ? toOrderEntity(order) : undefined;
  }

  async getByUser(telegramUserId: number): Promise<OrderEntity[]> {
    const orders = await this.prisma.order.findMany({
      where: { telegramUserId: BigInt(telegramUserId) },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(toOrderEntity);
  }

  async markPaid(
    orderId: string,
    source?: PaymentConfirmationSource,
  ): Promise<OrderEntity> {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });
    const entity = toOrderEntity(order);
    this.events.emit(AppEvents.Order.Paid, { order: entity, source });
    return entity;
  }

  async fulfill(
    orderId: string,
    source?: PaymentConfirmationSource,
  ): Promise<OrderEntity> {
    const existing = await this.requireOrder(orderId);
    if (existing.status === OrderStatus.FULFILLED) {
      return existing;
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const credential = await this.credentials.reserveForOrder(
          existing.planId,
          tx,
        );

        if (!credential) {
          await tx.order.update({
            where: { id: orderId },
            data: { status: 'FAILED' },
          });
          return undefined;
        }

        const order = await tx.order.update({
          where: { id: orderId },
          data: {
            status: 'FULFILLED',
            fulfilledAt: new Date(),
            credentialId: credential.id,
          },
        });

        return { order: toOrderEntity(order), credential };
      });

      if (!result) {
        this.events.emit(AppEvents.Credential.StockDepleted, {
          planId: existing.planId,
          orderId,
        });
        this.events.emit(AppEvents.Order.FulfillmentFailed, {
          orderId,
          planId: existing.planId,
          telegramUserId: existing.telegramUserId,
          telegramChatId: existing.telegramChatId,
          reason: 'inventory exhausted',
          source,
        });
        throw new Error('Failed to assign credentials — inventory exhausted');
      }

      this.events.emit(AppEvents.Order.Fulfilled, {
        order: result.order,
        credential: result.credential,
        source,
      });
      return result.order;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('inventory exhausted')
      ) {
        throw error;
      }

      this.events.emit(AppEvents.Order.FulfillmentFailed, {
        orderId,
        planId: existing.planId,
        telegramUserId: existing.telegramUserId,
        telegramChatId: existing.telegramChatId,
        reason: error instanceof Error ? error.message : 'unknown error',
        source,
      });
      throw error;
    }
  }

  async setYooKassaPaymentId(
    orderId: string,
    yookassaPaymentId: string,
  ): Promise<OrderEntity> {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: { yookassaPaymentId },
    });
    return toOrderEntity(order);
  }

  async cancel(orderId: string): Promise<OrderEntity> {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });
    const entity = toOrderEntity(order);
    this.events.emit(AppEvents.Order.Cancelled, { order: entity });
    return entity;
  }

  private async requireOrder(orderId: string): Promise<OrderEntity> {
    const order = await this.get(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }
    return order;
  }

  private async ensureTelegramUser(telegramUserId: number): Promise<void> {
    await this.prisma.telegramUser.upsert({
      where: { telegramUserId: BigInt(telegramUserId) },
      create: { telegramUserId: BigInt(telegramUserId) },
      update: {},
    });
  }
}
