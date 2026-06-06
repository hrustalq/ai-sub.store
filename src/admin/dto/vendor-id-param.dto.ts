import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AdminVendorIdParamDto {
  @ApiProperty({
    description: 'Идентификатор вендора',
    example: 'cursor',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  id: string;
}
