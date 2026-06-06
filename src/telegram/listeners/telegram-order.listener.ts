import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Markup, Telegraf } from 'telegraf';
import { CatalogService } from '../../catalog/catalog.service';
import { AppEvents } from '../../events/app-events';
import type {
  OrderFulfillmentFailedPayload,
  OrderFulfilledPayload,
} from '../../events/payloads/order.payloads';
import { credentialsMessage } from '../telegram.messages';

@Injectable()
export class TelegramOrderListener {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly catalog: CatalogService,
  ) {}

  @OnEvent(AppEvents.Order.Fulfilled, { async: true })
  async handleFulfilled({
    order,
    credential,
  }: OrderFulfilledPayload): Promise<void> {
    const vendor = await this.catalog.getVendor(order.vendorId);
    const plan = await this.catalog.getPlan(order.planId);

    if (!vendor || !plan) {
      await this.bot.telegram.sendMessage(
        order.telegramChatId,
        'Ошибка загрузки данных заказа.',
      );
      return;
    }

    await this.bot.telegram.sendMessage(
      order.telegramChatId,
      credentialsMessage(vendor, plan, credential),
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🛒 Купить ещё', 'browse')],
        ]),
      },
    );
  }

  @OnEvent(AppEvents.Order.FulfillmentFailed, { async: true })
  async handleFulfillmentFailed(
    payload: OrderFulfillmentFailedPayload,
  ): Promise<void> {
    await this.bot.telegram.sendMessage(
      payload.telegramChatId,
      'Оплата получена, но выдать учётные данные не удалось. Поддержка уведомлена.',
    );
  }
}
