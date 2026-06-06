import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class SupportTicketIdParamDto {
  @ApiProperty({
    description: 'Идентификатор обращения',
    format: 'uuid',
  })
  @IsUUID()
  id: string;
}
