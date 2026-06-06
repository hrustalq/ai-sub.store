import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AdminPlanIdParamDto {
  @ApiProperty({
    description: 'Идентификатор тарифного плана',
    example: 'cursor-monthly',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  id: string;
}
