import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CredentialStatus } from '../enums';

export class CredentialSchema {
  @ApiProperty({
    description: 'Уникальный идентификатор учётных данных',
    format: 'uuid',
    example: 'cred-cursor-1',
  })
  id: string;

  @ApiProperty({
    description:
      'Идентификатор тарифного плана, к которому относятся учётные данные',
    example: 'cursor-monthly',
  })
  planId: string;

  @ApiPropertyOptional({
    description: 'Идентификатор контрагента — поставщика учётных данных',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  counterpartyId?: string;

  @ApiProperty({
    description: 'Email аккаунта подписки',
    example: 'cursor.sub1@example.com',
    format: 'email',
  })
  email: string;

  @ApiProperty({
    description: 'Пароль аккаунта подписки',
    example: 'CursorPass#1',
    minLength: 8,
  })
  password: string;

  @ApiProperty({
    description: 'Статус учётных данных в инвентаре',
    enum: CredentialStatus,
    enumName: 'CredentialStatus',
    example: CredentialStatus.AVAILABLE,
  })
  status: CredentialStatus;

  @ApiProperty({
    description: 'Дата добавления в инвентарь',
    type: String,
    format: 'date-time',
    example: '2026-06-06T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Дата последнего обновления',
    type: String,
    format: 'date-time',
    example: '2026-06-06T12:00:00.000Z',
  })
  updatedAt: Date;
}
