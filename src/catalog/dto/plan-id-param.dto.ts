import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class PlanIdParamDto {
  @ApiProperty({
    description: 'Идентификатор тарифного плана',
    example: 'cursor-monthly',
  })
  @IsString()
  @IsNotEmpty()
  planId: string;
}
