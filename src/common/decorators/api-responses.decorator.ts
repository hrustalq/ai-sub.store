import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

export function ApiCommonResponses() {
  return applyDecorators(
    ApiBadRequestResponse({
      description: 'Некорректные данные запроса (ошибка валидации)',
    }),
    ApiUnauthorizedResponse({
      description: 'Отсутствует или неверный ключ администратора',
    }),
    ApiNotFoundResponse({
      description: 'Запрашиваемый ресурс не найден',
    }),
  );
}
