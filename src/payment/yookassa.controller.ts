import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { YooKassaWebhookService } from './yookassa-webhook.service';
import { YooKassaService } from './yookassa.service';
import type { YooKassaWebhookPayload } from './yookassa.types';

@ApiTags('Платежи')
@Controller()
export class YooKassaController {
  constructor(
    private readonly yookassa: YooKassaService,
    private readonly webhook: YooKassaWebhookService,
  ) {}

  @Post('webhooks/yookassa')
  @HttpCode(200)
  @ApiExcludeEndpoint()
  async handleWebhook(
    @Req() req: Request,
    @Body() payload: YooKassaWebhookPayload,
  ): Promise<{ received: true }> {
    const forwarded = req.headers['x-forwarded-for'];
    const ip =
      typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : req.ip;

    this.yookassa.assertWebhookSourceIp(ip);
    await this.webhook.handleNotification(payload);
    return { received: true };
  }

  @Get('payment/yookassa/return')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @ApiOperation({ summary: 'Страница возврата после оплаты YooKassa' })
  returnPage(@Query('order_id') orderId?: string): string {
    const orderLine = orderId
      ? `<p>Заказ <code>${orderId}</code> принят в обработку.</p>`
      : '';

    return [
      '<!DOCTYPE html>',
      '<html lang="ru">',
      '<head>',
      '<meta charset="utf-8" />',
      '<meta name="viewport" content="width=device-width, initial-scale=1" />',
      '<title>Оплата принята</title>',
      '<style>',
      'body{font-family:system-ui,sans-serif;max-width:36rem;margin:3rem auto;padding:0 1rem;line-height:1.5}',
      'code{background:#f4f4f5;padding:.1rem .35rem;border-radius:.25rem}',
      '</style>',
      '</head>',
      '<body>',
      '<h1>Спасибо за оплату</h1>',
      orderLine,
      '<p>Учётные данные будут отправлены в Telegram-бот автоматически после подтверждения платежа.</p>',
      '<p>Можно вернуться в бот и проверить статус заказа в разделе «Мои заказы».</p>',
      '</body>',
      '</html>',
    ].join('');
  }
}
