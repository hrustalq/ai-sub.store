import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateVendorDto {
  @ApiPropertyOptional({
    description: 'Название AI-инструмента',
    example: 'Cursor',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name?: string;

  @ApiPropertyOptional({
    description: 'Краткое описание вендора',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  description?: string;

  @ApiPropertyOptional({
    description: 'Эмодзи для отображения в Telegram-боте',
    example: '⚡',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(8)
  emoji?: string;

  @ApiPropertyOptional({
    description: 'Доступен ли вендор для покупки',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
