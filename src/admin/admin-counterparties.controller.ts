import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { ApiCommonResponses } from '../common/decorators/api-responses.decorator';
import { AdminApiKeyGuard } from '../common/guards/admin-api-key.guard';
import { CounterpartySchema } from '../entities/schemas';
import { AdminCounterpartiesService } from './admin-counterparties.service';
import { CounterpartyIdParamDto } from './dto/counterparty-id-param.dto';
import { CreateCounterpartyDto } from './dto/create-counterparty.dto';
import { ListCounterpartiesQueryDto } from './dto/list-counterparties-query.dto';
import { UpdateCounterpartyDto } from './dto/update-counterparty.dto';

@ApiTags('Администрирование — контрагенты')
@ApiSecurity('admin-api-key')
@ApiCommonResponses()
@Controller('api/admin/counterparties')
@UseGuards(AdminApiKeyGuard)
export class AdminCounterpartiesController {
  constructor(private readonly counterparties: AdminCounterpartiesService) {}

  @Get()
  @ApiOperation({ summary: 'Список контрагентов (поставщиков учётных данных)' })
  @ApiOkResponse({ type: CounterpartySchema, isArray: true })
  list(@Query() query: ListCounterpartiesQueryDto) {
    return this.counterparties.list(query.includeInactive);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить контрагента по id' })
  @ApiOkResponse({ type: CounterpartySchema })
  get(@Param() params: CounterpartyIdParamDto) {
    return this.counterparties.get(params.id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать контрагента' })
  @ApiCreatedResponse({ type: CounterpartySchema })
  create(@Body() dto: CreateCounterpartyDto) {
    return this.counterparties.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить контрагента' })
  @ApiOkResponse({ type: CounterpartySchema })
  update(
    @Param() params: CounterpartyIdParamDto,
    @Body() dto: UpdateCounterpartyDto,
  ) {
    return this.counterparties.update(params.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Деактивировать контрагента' })
  @ApiOkResponse({ type: CounterpartySchema })
  deactivate(@Param() params: CounterpartyIdParamDto) {
    return this.counterparties.deactivate(params.id);
  }
}
