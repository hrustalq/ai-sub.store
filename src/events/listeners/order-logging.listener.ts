import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PinoLogger } from 'nestjs-pino';
import { AppEvents } from '../app-events';
import type {
  OrderCancelledPayload,
  OrderCreatedPayload,
  OrderFulfillmentFailedPayload,
  OrderFulfilledPayload,
  OrderPaidPayload,
} from '../payloads/order.payloads';

@Injectable()
export class OrderLoggingListener {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(OrderLoggingListener.name);
  }

  @OnEvent(AppEvents.Order.Created)
  handleCreated({ order }: OrderCreatedPayload): void {
    this.logger.info(
      {
        orderId: order.id,
        planId: order.planId,
        telegramUserId: order.telegramUserId,
        status: order.status,
      },
      'Order created',
    );
  }

  @OnEvent(AppEvents.Order.Paid)
  handlePaid({ order, source }: OrderPaidPayload): void {
    this.logger.info(
      {
        orderId: order.id,
        planId: order.planId,
        status: order.status,
        source,
      },
      'Order paid',
    );
  }

  @OnEvent(AppEvents.Order.Fulfilled)
  handleFulfilled({ order, credential }: OrderFulfilledPayload): void {
    this.logger.info(
      {
        orderId: order.id,
        planId: order.planId,
        credentialId: credential.id,
        status: order.status,
      },
      'Order fulfilled',
    );
  }

  @OnEvent(AppEvents.Order.FulfillmentFailed)
  handleFulfillmentFailed(payload: OrderFulfillmentFailedPayload): void {
    this.logger.error(
      {
        orderId: payload.orderId,
        planId: payload.planId,
        telegramUserId: payload.telegramUserId,
        reason: payload.reason,
        source: payload.source,
      },
      'Order fulfillment failed',
    );
  }

  @OnEvent(AppEvents.Order.Cancelled)
  handleCancelled({ order }: OrderCancelledPayload): void {
    this.logger.info(
      {
        orderId: order.id,
        planId: order.planId,
        status: order.status,
      },
      'Order cancelled',
    );
  }
}
