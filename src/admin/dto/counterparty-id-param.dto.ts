import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CounterpartyIdParamDto {
  @ApiProperty({
    description: 'Идентификатор контрагента',
    format: 'uuid',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  id: string;
}
