import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CounterpartySchema {
  @ApiProperty({
    description: 'Уникальный идентификатор контрагента',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Название контрагента (поставщик учётных данных)',
    example: 'AI Accounts LLC',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Контактная информация (Telegram, email и т.д.)',
    example: '@supplier_contact',
  })
  contactInfo?: string;

  @ApiPropertyOptional({
    description: 'Заметки администратора',
    example: 'Поставляет аккаунты Cursor, оплата по факту',
  })
  notes?: string;

  @ApiProperty({
    description: 'Активен ли контрагент',
    example: true,
  })
  active: boolean;

  @ApiProperty({
    description: 'Дата создания записи',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Дата последнего обновления записи',
    type: String,
    format: 'date-time',
  })
  updatedAt: Date;
}
