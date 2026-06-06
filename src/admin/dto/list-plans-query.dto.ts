import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class ListPlansQueryDto {
  @ApiPropertyOptional({
    description: 'Фильтр по вендору',
    example: 'cursor',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  vendorId?: string;

  @ApiPropertyOptional({
    description: 'Включить неактивные планы',
    example: false,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeInactive?: boolean;
}
