import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { OrderWorkflowService } from '../orders/order-workflow.service';
import { OrdersService } from '../orders/orders.service';
import type { YooKassaWebhookPayload } from './yookassa.types';

@Injectable()
export class YooKassaWebhookService {
  constructor(
    private readonly orders: OrdersService,
    private readonly orderWorkflow: OrderWorkflowService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(YooKassaWebhookService.name);
  }

  async handleNotification(payload: YooKassaWebhookPayload): Promise<void> {
    const { event, object } = payload;

    if (event !== 'payment.succeeded') {
      this.logger.info(
        { event, paymentId: object.id },
        'Ignored YooKassa webhook event',
      );
      return;
    }

    const orderId = object.metadata?.order_id;
    if (!orderId) {
      this.logger.warn(
        { paymentId: object.id },
        'YooKassa payment succeeded without order_id metadata',
      );
      return;
    }

    const order = await this.orders.get(orderId);
    if (!order) {
      this.logger.warn(
        { orderId, paymentId: object.id },
        'YooKassa payment references unknown order',
      );
      return;
    }

    if (order.yookassaPaymentId && order.yookassaPaymentId !== object.id) {
      this.logger.warn(
        {
          orderId,
          expectedPaymentId: order.yookassaPaymentId,
          receivedPaymentId: object.id,
        },
        'YooKassa payment ID mismatch for order',
      );
      return;
    }

    try {
      await this.orderWorkflow.confirmPayment(orderId, { source: 'yookassa' });
      this.logger.info(
        { orderId, paymentId: object.id },
        'YooKassa payment confirmed and order fulfilled',
      );
    } catch (error) {
      this.logger.error(
        {
          orderId,
          paymentId: object.id,
          error: error instanceof Error ? error.message : 'unknown error',
        },
        'Failed to fulfill order after YooKassa payment',
      );
    }
  }
}
