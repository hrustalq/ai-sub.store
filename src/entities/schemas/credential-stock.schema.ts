import { ApiProperty } from '@nestjs/swagger';

export class CredentialStockSchema {
  @ApiProperty({
    description: 'Количество доступных учётных данных для указанного плана',
    example: 5,
    minimum: 0,
  })
  available: number;
}
