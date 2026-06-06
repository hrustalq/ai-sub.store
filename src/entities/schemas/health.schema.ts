import { ApiProperty } from '@nestjs/swagger';

export class HealthIndicatorStatusSchema {
  @ApiProperty({
    description: 'Состояние компонента',
    example: 'up',
    enum: ['up', 'down'],
  })
  status: string;
}

export class HealthLiveSchema {
  @ApiProperty({
    description: 'Статус живости процесса',
    example: 'ok',
    enum: ['ok'],
  })
  status: string;
}

export class HealthReadySchema {
  @ApiProperty({
    description: 'Общий статус проверки',
    example: 'ok',
    enum: ['ok', 'error'],
  })
  status: string;

  @ApiProperty({
    description: 'Состояние успешных индикаторов',
    example: { database: { status: 'up' } },
  })
  info: Record<string, HealthIndicatorStatusSchema>;

  @ApiProperty({
    description: 'Состояние неуспешных индикаторов',
    example: {},
  })
  error: Record<string, unknown>;

  @ApiProperty({
    description: 'Детали всех индикаторов',
    example: { database: { status: 'up' } },
  })
  details: Record<string, HealthIndicatorStatusSchema>;
}

/** @deprecated Используйте HealthLiveSchema или HealthReadySchema */
export class HealthSchema extends HealthLiveSchema {}
