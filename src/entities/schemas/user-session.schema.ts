import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SessionScenario, SessionStep, VendorId } from '../enums';

export class UserSessionSchema {
  @ApiProperty({
    description: 'Идентификатор пользователя Telegram',
    example: 123456789,
  })
  telegramUserId: number;

  @ApiProperty({
    description: 'Активный сценарий диалога в боте',
    enum: SessionScenario,
    enumName: 'SessionScenario',
    example: SessionScenario.PURCHASE,
  })
  scenario: SessionScenario;

  @ApiProperty({
    description: 'Текущий шаг внутри активного сценария',
    enum: SessionStep,
    enumName: 'SessionStep',
    example: SessionStep.SELECTING_VENDOR,
  })
  step: SessionStep;

  @ApiPropertyOptional({
    description: 'Выбранный вендор (на шаге выбора плана или подтверждения)',
    enum: VendorId,
    enumName: 'VendorId',
    example: VendorId.CURSOR,
  })
  vendorId?: VendorId;

  @ApiPropertyOptional({
    description: 'Выбранный тарифный план',
    example: 'cursor-monthly',
  })
  planId?: string;

  @ApiPropertyOptional({
    description: 'Идентификатор заказа, ожидающего оплаты',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  pendingOrderId?: string;

  @ApiPropertyOptional({
    description: 'Идентификатор активного обращения в поддержку',
    format: 'uuid',
  })
  supportTicketId?: string;

  @ApiProperty({
    description: 'Дата последнего обновления сессии',
    type: String,
    format: 'date-time',
    example: '2026-06-06T12:00:00.000Z',
  })
  updatedAt: Date;
}
