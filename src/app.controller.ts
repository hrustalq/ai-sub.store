import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Система')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Статус сервиса' })
  @ApiOkResponse({
    description: 'Текстовое сообщение о работе сервиса',
    schema: {
      type: 'string',
      example: 'AI Sub Store — Telegram bot is running',
    },
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
