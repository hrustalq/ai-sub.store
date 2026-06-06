import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CredentialStockQueryDto {
  @ApiProperty({
    description: 'Идентификатор тарифного плана для проверки остатка',
    example: 'cursor-monthly',
  })
  @IsString()
  @IsNotEmpty()
  planId: string;
}
