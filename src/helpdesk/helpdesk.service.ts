import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  SupportMessageEntity,
  SupportTicketEntity,
  SupportTicketStatus,
} from '../entities';
import { AppEvents, EventsService } from '../events';
import { PrismaService } from '../prisma/prisma.service';
import {
  toSupportMessageEntity,
  toSupportTicketEntity,
} from '../prisma/mappers/prisma.mapper';

@Injectable()
export class HelpdeskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  async createTicket(
    telegramUserId: number,
    telegramChatId: number,
    text: string,
    relatedOrderId?: string,
  ): Promise<{ ticket: SupportTicketEntity; message: SupportMessageEntity }> {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new BadRequestException('Сообщение не может быть пустым');
    }

    await this.ensureTelegramUser(telegramUserId);

    const ticket = await this.prisma.supportTicket.create({
      data: {
        telegramUserId: BigInt(telegramUserId),
        telegramChatId: BigInt(telegramChatId),
        relatedOrderId: relatedOrderId ?? null,
        messages: {
          create: {
            fromAdmin: false,
            telegramUserId: BigInt(telegramUserId),
            text: trimmed,
          },
        },
      },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 1 } },
    });

    const entity = toSupportTicketEntity(ticket);
    const message = toSupportMessageEntity(ticket.messages[0]);
    this.events.emit(AppEvents.Support.TicketCreated, {
      ticket: entity,
      message,
    });
    return { ticket: entity, message };
  }

  async addUserMessage(
    ticketId: string,
    telegramUserId: number,
    text: string,
  ): Promise<{ ticket: SupportTicketEntity; message: SupportMessageEntity }> {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new BadRequestException('Сообщение не может быть пустым');
    }

    const ticket = await this.getTicketOrThrow(ticketId);
    if (ticket.telegramUserId !== telegramUserId) {
      throw new BadRequestException(
        'Обращение принадлежит другому пользователю',
      );
    }
    if (ticket.status === SupportTicketStatus.CLOSED) {
      throw new BadRequestException('Обращение уже закрыто');
    }

    const record = await this.prisma.supportMessage.create({
      data: {
        ticketId,
        fromAdmin: false,
        telegramUserId: BigInt(telegramUserId),
        text: trimmed,
      },
    });

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: 'OPEN',
        updatedAt: new Date(),
      },
    });

    const entity = toSupportTicketEntity(updated);
    const message = toSupportMessageEntity(record);
    this.events.emit(AppEvents.Support.MessageAdded, {
      ticket: entity,
      message,
    });
    return { ticket: entity, message };
  }

  async addAdminReply(
    ticketId: string,
    adminTelegramUserId: number,
    text: string,
  ): Promise<{ ticket: SupportTicketEntity; message: SupportMessageEntity }> {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new BadRequestException('Сообщение не может быть пустым');
    }

    const ticket = await this.getTicketOrThrow(ticketId);
    if (ticket.status === SupportTicketStatus.CLOSED) {
      throw new BadRequestException('Обращение уже закрыто');
    }

    const record = await this.prisma.supportMessage.create({
      data: {
        ticketId,
        fromAdmin: true,
        telegramUserId: BigInt(adminTelegramUserId),
        text: trimmed,
      },
    });

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    });

    const entity = toSupportTicketEntity(updated);
    const message = toSupportMessageEntity(record);
    this.events.emit(AppEvents.Support.MessageAdded, {
      ticket: entity,
      message,
    });
    return { ticket: entity, message };
  }

  async closeTicket(ticketId: string): Promise<SupportTicketEntity> {
    const ticket = await this.getTicketOrThrow(ticketId);
    if (ticket.status === SupportTicketStatus.CLOSED) {
      return ticket;
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
      },
    });

    const entity = toSupportTicketEntity(updated);
    this.events.emit(AppEvents.Support.TicketClosed, { ticket: entity });
    return entity;
  }

  async get(ticketId: string): Promise<SupportTicketEntity | undefined> {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });
    return ticket ? toSupportTicketEntity(ticket) : undefined;
  }

  async getMessages(ticketId: string): Promise<SupportMessageEntity[]> {
    await this.getTicketOrThrow(ticketId);
    const messages = await this.prisma.supportMessage.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
    });
    return messages.map(toSupportMessageEntity);
  }

  async getOpenTicketForUser(
    telegramUserId: number,
  ): Promise<SupportTicketEntity | undefined> {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: {
        telegramUserId: BigInt(telegramUserId),
        status: 'OPEN',
      },
      orderBy: { updatedAt: 'desc' },
    });
    return ticket ? toSupportTicketEntity(ticket) : undefined;
  }

  async listByUser(telegramUserId: number): Promise<SupportTicketEntity[]> {
    const tickets = await this.prisma.supportTicket.findMany({
      where: { telegramUserId: BigInt(telegramUserId) },
      orderBy: { createdAt: 'desc' },
    });
    return tickets.map(toSupportTicketEntity);
  }

  async listOpen(): Promise<SupportTicketEntity[]> {
    const tickets = await this.prisma.supportTicket.findMany({
      where: { status: 'OPEN' },
      orderBy: { updatedAt: 'desc' },
    });
    return tickets.map(toSupportTicketEntity);
  }

  private async getTicketOrThrow(
    ticketId: string,
  ): Promise<SupportTicketEntity> {
    const ticket = await this.get(ticketId);
    if (!ticket) {
      throw new NotFoundException('Обращение не найдено');
    }
    return ticket;
  }

  private async ensureTelegramUser(telegramUserId: number): Promise<void> {
    await this.prisma.telegramUser.upsert({
      where: { telegramUserId: BigInt(telegramUserId) },
      create: { telegramUserId: BigInt(telegramUserId) },
      update: {},
    });
  }
}
