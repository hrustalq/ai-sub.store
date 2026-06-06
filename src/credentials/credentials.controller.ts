import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { ApiCommonResponses } from '../common/decorators/api-responses.decorator';
import { AdminApiKeyGuard } from '../common/guards/admin-api-key.guard';
import { CredentialSchema, CredentialStockSchema } from '../entities/schemas';
import { CreateCredentialDto } from './dto/create-credential.dto';
import { CredentialStockQueryDto } from './dto/credential-stock-query.dto';
import { CredentialsService } from './credentials.service';

@ApiTags('Учётные данные')
@ApiSecurity('admin-api-key')
@ApiCommonResponses()
@Controller('api/credentials')
@UseGuards(AdminApiKeyGuard)
export class CredentialsController {
  constructor(private readonly credentials: CredentialsService) {}

  @Post()
  @ApiOperation({ summary: 'Добавить учётные данные в инвентарь' })
  @ApiCreatedResponse({
    description: 'Учётные данные добавлены в инвентарь',
    type: CredentialSchema,
  })
  create(@Body() dto: CreateCredentialDto) {
    return this.credentials.create(dto);
  }

  @Get('stock')
  @ApiOperation({ summary: 'Проверить остаток учётных данных по плану' })
  @ApiOkResponse({
    description: 'Количество доступных учётных данных',
    type: CredentialStockSchema,
  })
  stock(@Query() query: CredentialStockQueryDto) {
    return this.credentials
      .availableCount(query.planId)
      .then((available) => ({ available }));
  }
}
