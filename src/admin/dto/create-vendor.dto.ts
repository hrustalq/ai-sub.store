import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateVendorDto {
  @ApiProperty({
    description: 'Уникальный идентификатор вендора (латиница, цифры, дефис)',
    example: 'cursor',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message:
      'id должен содержать только строчные латинские буквы, цифры и дефис',
  })
  @MaxLength(64)
  id: string;

  @ApiProperty({
    description: 'Название AI-инструмента',
    example: 'Cursor',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name: string;

  @ApiProperty({
    description: 'Краткое описание вендора',
    example: 'AI-редактор кода с моделями Claude и GPT',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  description: string;

  @ApiProperty({
    description: 'Эмодзи для отображения в Telegram-боте',
    example: '⚡',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(8)
  emoji: string;

  @ApiPropertyOptional({
    description: 'Доступен ли вендор для покупки',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
