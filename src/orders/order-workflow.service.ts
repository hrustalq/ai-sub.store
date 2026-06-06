import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderEntity, OrderStatus } from '../entities';
import { OrdersService } from './orders.service';
import { PaymentConfirmationSource } from '../events';

export interface ConfirmPaymentOptions {
  source?: PaymentConfirmationSource;
}

@Injectable()
export class OrderWorkflowService {
  constructor(private readonly orders: OrdersService) {}

  async confirmPayment(
    orderId: string,
    options: ConfirmPaymentOptions = {},
  ): Promise<OrderEntity> {
    const existing = await this.orders.get(orderId);
    if (!existing) {
      throw new BadRequestException(`Order not found: ${orderId}`);
    }

    if (existing.status === OrderStatus.FULFILLED) {
      return existing;
    }

    if (existing.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order was cancelled');
    }

    await this.orders.markPaid(orderId, options.source);
    return this.orders.fulfill(orderId, options.source);
  }
}
