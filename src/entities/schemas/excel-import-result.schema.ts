import { ApiProperty } from '@nestjs/swagger';

export class ExcelImportErrorSchema {
  @ApiProperty({
    description: 'Номер строки в Excel (начиная с 2 — первая строка данных)',
    example: 3,
  })
  row: number;

  @ApiProperty({
    description: 'Описание ошибки',
    example: 'План с id "unknown-plan" не найден',
  })
  message: string;
}

export class ExcelImportResultSchema {
  @ApiProperty({
    description: 'Тип импортируемых данных',
    example: 'credentials',
  })
  type: string;

  @ApiProperty({
    description: 'Количество созданных записей',
    example: 5,
  })
  created: number;

  @ApiProperty({
    description: 'Количество обновлённых записей',
    example: 2,
  })
  updated: number;

  @ApiProperty({
    description: 'Ошибки по строкам (импорт частичный при наличии ошибок)',
    type: ExcelImportErrorSchema,
    isArray: true,
  })
  errors: ExcelImportErrorSchema[];
}
