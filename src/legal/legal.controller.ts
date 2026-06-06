import { Controller, Get, Header } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LegalService } from './legal.service';

@ApiTags('Правовая информация')
@Controller('legal')
export class LegalController {
  constructor(private readonly legal: LegalService) {}

  @Get('privacy')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @ApiOperation({ summary: 'Политика конфиденциальности (HTML)' })
  @ApiOkResponse({ description: 'HTML-страница политики конфиденциальности' })
  privacy(): string {
    return this.legal.renderHtml(this.legal.getDocument('privacy'));
  }

  @Get('terms')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @ApiOperation({ summary: 'Пользовательское соглашение (HTML)' })
  @ApiOkResponse({ description: 'HTML-страница пользовательского соглашения' })
  terms(): string {
    return this.legal.renderHtml(this.legal.getDocument('terms'));
  }
}
