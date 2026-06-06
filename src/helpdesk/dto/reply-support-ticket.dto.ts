import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ReplySupportTicketDto {
  @ApiProperty({ description: 'Текст ответа пользователю' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({
    description: 'Telegram user ID администратора (для аудита)',
    example: 123456789,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  adminTelegramUserId?: number;
}
