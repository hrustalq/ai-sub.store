import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppEvents } from '../../events/app-events';
import type { OrderFulfilledPayload } from '../../events/payloads/order.payloads';
import { SessionService } from '../session.service';

@Injectable()
export class SessionOrderListener {
  constructor(private readonly session: SessionService) {}

  @OnEvent(AppEvents.Order.Fulfilled, { async: true })
  async handleFulfilled({ order }: OrderFulfilledPayload): Promise<void> {
    await this.session.reset(order.telegramUserId);
  }
}
