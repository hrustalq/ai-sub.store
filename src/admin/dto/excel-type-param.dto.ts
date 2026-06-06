import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ExcelImportType } from '../../entities';

export class ExcelTypeParamDto {
  @ApiProperty({
    description: 'Тип Excel-шаблона или импорта',
    enum: ExcelImportType,
    enumName: 'ExcelImportType',
    example: ExcelImportType.CREDENTIALS,
  })
  @IsEnum(ExcelImportType)
  type: ExcelImportType;
}
