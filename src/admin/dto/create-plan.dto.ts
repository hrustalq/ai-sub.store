import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePlanDto {
  @ApiProperty({
    description: 'Уникальный идентификатор тарифного плана',
    example: 'cursor-monthly',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/)
  @MaxLength(64)
  id: string;

  @ApiProperty({
    description: 'Идентификатор вендора',
    example: 'cursor',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  vendorId: string;

  @ApiProperty({
    description: 'Название тарифного плана',
    example: 'Cursor Pro — 1 мес.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name: string;

  @ApiProperty({
    description: 'Описание тарифного плана',
    example: 'Полный доступ к Cursor Pro на 30 дней',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  description: string;

  @ApiProperty({
    description: 'Срок действия подписки в днях',
    example: 30,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  durationDays: number;

  @ApiProperty({
    description: 'Стоимость подписки в рублях',
    example: 1990,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  priceRub: number;

  @ApiPropertyOptional({
    description: 'Валюта оплаты',
    example: 'RUB',
    default: 'RUB',
  })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @ApiPropertyOptional({
    description: 'Доступен ли план для покупки',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
