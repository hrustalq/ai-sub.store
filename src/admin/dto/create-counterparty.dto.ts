import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateCounterpartyDto {
  @ApiProperty({
    description: 'Название контрагента (поставщик учётных данных)',
    example: 'AI Accounts LLC',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name: string;

  @ApiPropertyOptional({
    description: 'Контактная информация',
    example: '@supplier_contact',
  })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  contactInfo?: string;

  @ApiPropertyOptional({
    description: 'Заметки администратора',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  notes?: string;

  @ApiPropertyOptional({
    description: 'Активен ли контрагент',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
