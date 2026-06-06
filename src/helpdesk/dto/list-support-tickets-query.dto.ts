import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { SupportTicketStatus } from '../../entities';

export class ListSupportTicketsQueryDto {
  @ApiPropertyOptional({
    description: 'Фильтр по статусу обращения',
    enum: SupportTicketStatus,
    enumName: 'SupportTicketStatus',
  })
  @IsOptional()
  @IsEnum(SupportTicketStatus)
  status?: SupportTicketStatus;

  @ApiPropertyOptional({
    description: 'Telegram user ID автора обращения',
    example: 123456789,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  telegramUserId?: number;
}
