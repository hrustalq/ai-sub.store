import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdatePlanDto {
  @ApiPropertyOptional({ description: 'Название тарифного плана' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name?: string;

  @ApiPropertyOptional({ description: 'Описание тарифного плана' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  description?: string;

  @ApiPropertyOptional({
    description: 'Срок действия подписки в днях',
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationDays?: number;

  @ApiPropertyOptional({
    description: 'Стоимость подписки в рублях',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceRub?: number;

  @ApiPropertyOptional({ description: 'Валюта оплаты', example: 'RUB' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @ApiPropertyOptional({ description: 'Доступен ли план для покупки' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
