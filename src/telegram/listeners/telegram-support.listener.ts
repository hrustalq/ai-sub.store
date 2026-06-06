import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectBot } from 'nestjs-telegraf';
import { PinoLogger } from 'nestjs-pino';
import { Context, Telegraf } from 'telegraf';
import { AppEvents } from '../../events';
import type {
  SupportMessageAddedPayload,
  SupportTicketCreatedPayload,
} from '../../events/payloads/support.payloads';
import { adminTicketKeyboard } from '../telegram.keyboards';
import {
  adminNewTicketMessage,
  adminUserFollowUpMessage,
  supportReplyToUserMessage,
  supportTicketCreatedMessage,
} from '../telegram.messages';

@Injectable()
export class TelegramSupportListener {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly config: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TelegramSupportListener.name);
  }

  @OnEvent(AppEvents.Support.TicketCreated, { async: true })
  async onTicketCreated({
    ticket,
    message,
  }: SupportTicketCreatedPayload): Promise<void> {
    await this.bot.telegram.sendMessage(
      ticket.telegramChatId,
      supportTicketCreatedMessage(ticket.id),
      { parse_mode: 'Markdown' },
    );

    await this.notifyAdmins(
      adminNewTicketMessage(ticket, message.text),
      adminTicketKeyboard(ticket.id),
    );
    this.logger.info(
      { ticketId: ticket.id, telegramUserId: ticket.telegramUserId },
      'Support ticket created',
    );
  }

  @OnEvent(AppEvents.Support.MessageAdded, { async: true })
  async onMessageAdded({
    ticket,
    message,
  }: SupportMessageAddedPayload): Promise<void> {
    if (message.fromAdmin) {
      await this.bot.telegram.sendMessage(
        ticket.telegramChatId,
        supportReplyToUserMessage(message.text),
        { parse_mode: 'Markdown' },
      );
      this.logger.info(
        { ticketId: ticket.id, messageId: message.id },
        'Support reply sent to user',
      );
      return;
    }

    await this.notifyAdmins(
      adminUserFollowUpMessage(ticket, message.text),
      adminTicketKeyboard(ticket.id),
    );
    this.logger.info(
      { ticketId: ticket.id, messageId: message.id },
      'Support follow-up from user',
    );
  }

  private async notifyAdmins(
    text: string,
    extra?: ReturnType<typeof adminTicketKeyboard>,
  ): Promise<void> {
    const adminIds = this.getAdminIds();
    if (adminIds.length === 0) {
      this.logger.warn('ADMIN_TELEGRAM_IDS not set — support alerts skipped');
      return;
    }

    await Promise.all(
      adminIds.map(async (adminId) => {
        try {
          await this.bot.telegram.sendMessage(adminId, text, {
            parse_mode: 'Markdown',
            ...extra,
          });
        } catch (error) {
          this.logger.error(
            {
              adminId,
              error: error instanceof Error ? error.message : String(error),
            },
            'Failed to notify admin about support ticket',
          );
        }
      }),
    );
  }

  private getAdminIds(): number[] {
    const raw = this.config.get<string>('ADMIN_TELEGRAM_IDS', '');
    return raw
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
      .map(Number)
      .filter((id) => Number.isFinite(id));
  }
}
