import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    description: 'Идентификатор пользователя Telegram',
    example: 123456789,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  telegramUserId: number;

  @ApiProperty({
    description: 'Идентификатор чата Telegram для доставки учётных данных',
    example: 123456789,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  telegramChatId: number;

  @ApiProperty({
    description: 'Идентификатор тарифного плана',
    example: 'cursor-monthly',
  })
  @IsString()
  @IsNotEmpty()
  planId: string;
}
