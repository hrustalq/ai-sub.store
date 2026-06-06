import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { ApiCommonResponses } from '../common/decorators/api-responses.decorator';
import { AdminApiKeyGuard } from '../common/guards/admin-api-key.guard';
import { SupportMessageSchema, SupportTicketSchema } from '../entities/schemas';
import { HelpdeskService } from './helpdesk.service';
import { ListSupportTicketsQueryDto } from './dto/list-support-tickets-query.dto';
import { ReplySupportTicketDto } from './dto/reply-support-ticket.dto';
import { SupportTicketIdParamDto } from './dto/support-ticket-id-param.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  toPrismaSupportTicketStatus,
  toSupportTicketEntity,
} from '../prisma/mappers/prisma.mapper';

@ApiTags('Поддержка')
@ApiSecurity('admin-api-key')
@ApiCommonResponses()
@Controller('api/support/tickets')
@UseGuards(AdminApiKeyGuard)
export class HelpdeskController {
  constructor(
    private readonly helpdesk: HelpdeskService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Список обращений в поддержку' })
  @ApiOkResponse({
    description: 'Список обращений',
    type: SupportTicketSchema,
    isArray: true,
  })
  async list(@Query() query: ListSupportTicketsQueryDto) {
    if (query.telegramUserId !== undefined) {
      return this.helpdesk.listByUser(query.telegramUserId);
    }

    if (query.status === undefined) {
      return this.helpdesk.listOpen();
    }

    const tickets = await this.prisma.supportTicket.findMany({
      where: {
        status: toPrismaSupportTicketStatus(query.status),
      },
      orderBy: { updatedAt: 'desc' },
    });
    return tickets.map(toSupportTicketEntity);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить обращение по идентификатору' })
  @ApiOkResponse({
    description: 'Данные обращения',
    type: SupportTicketSchema,
  })
  async getOne(@Param() params: SupportTicketIdParamDto) {
    const ticket = await this.helpdesk.get(params.id);
    if (!ticket) {
      throw new NotFoundException('Обращение не найдено');
    }
    return ticket;
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'История сообщений обращения' })
  @ApiOkResponse({
    description: 'Сообщения обращения',
    type: SupportMessageSchema,
    isArray: true,
  })
  listMessages(@Param() params: SupportTicketIdParamDto) {
    return this.helpdesk.getMessages(params.id);
  }

  @Post(':id/reply')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ответить пользователю в обращении' })
  @ApiOkResponse({
    description: 'Ответ отправлен',
    type: SupportMessageSchema,
  })
  reply(
    @Param() params: SupportTicketIdParamDto,
    @Body() dto: ReplySupportTicketDto,
  ) {
    return this.helpdesk
      .addAdminReply(params.id, dto.adminTelegramUserId ?? 0, dto.text)
      .then((result) => result.message);
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Закрыть обращение' })
  @ApiOkResponse({
    description: 'Обращение закрыто',
    type: SupportTicketSchema,
  })
  close(@Param() params: SupportTicketIdParamDto) {
    return this.helpdesk.closeTicket(params.id);
  }
}
