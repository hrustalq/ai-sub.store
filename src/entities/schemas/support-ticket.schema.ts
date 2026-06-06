import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SupportTicketStatus } from '../enums';

export class SupportTicketSchema {
  @ApiProperty({ description: 'Идентификатор обращения' })
  id: string;

  @ApiProperty({ description: 'Telegram user ID автора' })
  telegramUserId: number;

  @ApiProperty({ description: 'Telegram chat ID для ответа' })
  telegramChatId: number;

  @ApiProperty({
    enum: SupportTicketStatus,
    enumName: 'SupportTicketStatus',
    description: 'Статус обращения',
  })
  status: SupportTicketStatus;

  @ApiPropertyOptional({
    description: 'Связанный заказ (если указан пользователем)',
  })
  relatedOrderId?: string;

  @ApiProperty({ description: 'Дата создания' })
  createdAt: Date;

  @ApiProperty({ description: 'Дата последнего обновления' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Дата закрытия' })
  closedAt?: Date;
}
