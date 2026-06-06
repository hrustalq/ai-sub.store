import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SupportMessageSchema {
  @ApiProperty({ description: 'Идентификатор сообщения' })
  id: string;

  @ApiProperty({ description: 'Идентификатор обращения' })
  ticketId: string;

  @ApiProperty({ description: 'Сообщение от администратора' })
  fromAdmin: boolean;

  @ApiPropertyOptional({ description: 'Telegram user ID отправителя' })
  telegramUserId?: number;

  @ApiProperty({ description: 'Текст сообщения' })
  text: string;

  @ApiProperty({ description: 'Дата отправки' })
  createdAt: Date;
}
