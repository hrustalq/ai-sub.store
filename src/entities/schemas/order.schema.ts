import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, VendorId } from '../enums';

export class OrderSchema {
  @ApiProperty({
    description: 'Уникальный идентификатор заказа',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Идентификатор пользователя Telegram, оформившего заказ',
    example: 123456789,
  })
  telegramUserId: number;

  @ApiProperty({
    description: 'Идентификатор чата Telegram для доставки учётных данных',
    example: 123456789,
  })
  telegramChatId: number;

  @ApiProperty({
    description: 'Идентификатор вендора',
    enum: VendorId,
    enumName: 'VendorId',
    example: VendorId.CURSOR,
  })
  vendorId: VendorId;

  @ApiProperty({
    description: 'Идентификатор купленного тарифного плана',
    example: 'cursor-monthly',
  })
  planId: string;

  @ApiProperty({
    description: 'Текущий статус заказа',
    enum: OrderStatus,
    enumName: 'OrderStatus',
    example: OrderStatus.PENDING_PAYMENT,
  })
  status: OrderStatus;

  @ApiProperty({
    description: 'Сумма заказа в рублях',
    example: 1990,
    minimum: 0,
  })
  amountRub: number;

  @ApiProperty({
    description: 'Валюта заказа',
    example: 'RUB',
  })
  currency: string;

  @ApiPropertyOptional({
    description:
      'Идентификатор выданных учётных данных (после выполнения заказа)',
    format: 'uuid',
    example: 'cred-cursor-1',
  })
  credentialId?: string;

  @ApiPropertyOptional({
    description: 'Идентификатор платежа YooKassa (при оплате через ЮKassa)',
    example: '32f3dce3-e775-424f-a265-4e1e86e3db08',
  })
  yookassaPaymentId?: string;

  @ApiProperty({
    description: 'Дата создания заказа',
    type: String,
    format: 'date-time',
    example: '2026-06-06T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'Дата подтверждения оплаты',
    type: String,
    format: 'date-time',
    example: '2026-06-06T12:05:00.000Z',
  })
  paidAt?: Date;

  @ApiPropertyOptional({
    description: 'Дата выдачи учётных данных',
    type: String,
    format: 'date-time',
    example: '2026-06-06T12:05:01.000Z',
  })
  fulfilledAt?: Date;

  @ApiPropertyOptional({
    description: 'Дата отмены заказа',
    type: String,
    format: 'date-time',
    example: '2026-06-06T12:10:00.000Z',
  })
  cancelledAt?: Date;
}
