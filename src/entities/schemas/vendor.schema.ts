import { ApiProperty } from '@nestjs/swagger';
import { VendorId } from '../enums';

export class VendorSchema {
  @ApiProperty({
    description: 'Уникальный идентификатор вендора',
    enum: VendorId,
    enumName: 'VendorId',
    example: VendorId.CURSOR,
  })
  id: VendorId;

  @ApiProperty({
    description: 'Название AI-инструмента',
    example: 'Cursor',
  })
  name: string;

  @ApiProperty({
    description: 'Краткое описание вендора',
    example: 'AI-редактор кода с моделями Claude и GPT',
  })
  description: string;

  @ApiProperty({
    description: 'Эмодзи для отображения в Telegram-боте',
    example: '⚡',
  })
  emoji: string;

  @ApiProperty({
    description: 'Доступен ли вендор для покупки',
    example: true,
  })
  active: boolean;

  @ApiProperty({
    description: 'Дата создания записи',
    type: String,
    format: 'date-time',
    example: '2026-06-06T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Дата последнего обновления записи',
    type: String,
    format: 'date-time',
    example: '2026-06-06T12:00:00.000Z',
  })
  updatedAt: Date;
}
