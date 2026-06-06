import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateCredentialDto {
  @ApiProperty({
    description:
      'Идентификатор тарифного плана, к которому относятся учётные данные',
    example: 'cursor-monthly',
  })
  @IsString()
  @IsNotEmpty()
  planId: string;

  @ApiPropertyOptional({
    description: 'Идентификатор контрагента — поставщика учётных данных',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  counterpartyId?: string;

  @ApiProperty({
    description: 'Email аккаунта подписки',
    example: 'cursor.sub1@example.com',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Пароль аккаунта подписки',
    example: 'CursorPass#1',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;
}
