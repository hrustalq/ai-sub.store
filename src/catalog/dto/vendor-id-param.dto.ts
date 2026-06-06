import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { VendorId } from '../../entities';

export class VendorIdParamDto {
  @ApiProperty({
    description: 'Идентификатор вендора',
    enum: VendorId,
    enumName: 'VendorId',
    example: VendorId.CURSOR,
  })
  @IsEnum(VendorId)
  vendorId: VendorId;
}
