import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TelegramUserSchema {
  @ApiProperty({
    description: 'Уникальный идентификатор пользователя в Telegram',
    example: 123456789,
  })
  telegramUserId: number;

  @ApiPropertyOptional({
    description: 'Имя пользователя в Telegram (@username)',
    example: 'ivan_petrov',
  })
  username?: string;

  @ApiPropertyOptional({
    description: 'Имя пользователя',
    example: 'Иван',
  })
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Фамилия пользователя',
    example: 'Петров',
  })
  lastName?: string;

  @ApiProperty({
    description: 'Дата первого взаимодействия с ботом',
    type: String,
    format: 'date-time',
    example: '2026-06-06T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Дата последнего обновления профиля',
    type: String,
    format: 'date-time',
    example: '2026-06-06T12:00:00.000Z',
  })
  updatedAt: Date;
}
