import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';

export class ListOrdersQueryDto {
  @ApiProperty({
    description: 'Идентификатор пользователя Telegram для фильтрации заказов',
    example: 123456789,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  telegramUserId: number;
}
