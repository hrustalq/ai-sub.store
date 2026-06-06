import { ApiProperty } from '@nestjs/swagger';
import { VendorId } from '../enums';

export class PlanSchema {
  @ApiProperty({
    description: 'Уникальный идентификатор тарифного плана',
    example: 'cursor-monthly',
  })
  id: string;

  @ApiProperty({
    description: 'Идентификатор вендора, к которому относится план',
    enum: VendorId,
    enumName: 'VendorId',
    example: VendorId.CURSOR,
  })
  vendorId: VendorId;

  @ApiProperty({
    description: 'Название тарифного плана',
    example: 'Cursor Pro — 1 месяц',
  })
  name: string;

  @ApiProperty({
    description: 'Описание тарифного плана',
    example: 'Полный доступ к Cursor Pro на 30 дней',
  })
  description: string;

  @ApiProperty({
    description: 'Срок действия подписки в днях',
    example: 30,
    minimum: 1,
  })
  durationDays: number;

  @ApiProperty({
    description: 'Стоимость подписки в рублях',
    example: 1990,
    minimum: 0,
  })
  priceRub: number;

  @ApiProperty({
    description: 'Валюта оплаты',
    example: 'RUB',
  })
  currency: string;

  @ApiProperty({
    description: 'Доступен ли план для покупки',
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
