import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';

export class EnvironmentVariablesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT?: number;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  TELEGRAM_BOT_TOKEN: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  TELEGRAM_WEBHOOK_DOMAIN?: string;

  @IsOptional()
  @IsString()
  TELEGRAM_WEBHOOK_PATH?: string;

  @IsOptional()
  @IsString()
  YOOKASSA_SHOP_ID?: string;

  @IsOptional()
  @IsString()
  YOOKASSA_SECRET_KEY?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  PUBLIC_BASE_URL?: string;

  @IsOptional()
  @IsString()
  ADMIN_TELEGRAM_IDS?: string;

  @IsOptional()
  @IsString()
  ADMIN_API_KEY?: string;

  @IsOptional()
  @IsString()
  LOG_LEVEL?: string;
}
