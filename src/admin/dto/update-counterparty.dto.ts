import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateCounterpartyDto {
  @ApiPropertyOptional({ description: 'Название контрагента' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name?: string;

  @ApiPropertyOptional({ description: 'Контактная информация' })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  contactInfo?: string;

  @ApiPropertyOptional({ description: 'Заметки администратора' })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  notes?: string;

  @ApiPropertyOptional({ description: 'Активен ли контрагент' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
