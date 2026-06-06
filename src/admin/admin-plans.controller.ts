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
import { PlanSchema } from '../entities/schemas';
import { AdminPlansService } from './admin-plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { ListPlansQueryDto } from './dto/list-plans-query.dto';
import { AdminPlanIdParamDto } from './dto/plan-id-param.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@ApiTags('Администрирование — планы')
@ApiSecurity('admin-api-key')
@ApiCommonResponses()
@Controller('api/admin/plans')
@UseGuards(AdminApiKeyGuard)
export class AdminPlansController {
  constructor(private readonly plans: AdminPlansService) {}

  @Get()
  @ApiOperation({ summary: 'Список тарифных планов' })
  @ApiOkResponse({ type: PlanSchema, isArray: true })
  list(@Query() query: ListPlansQueryDto) {
    return this.plans.list(query.vendorId, query.includeInactive);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить план по id' })
  @ApiOkResponse({ type: PlanSchema })
  get(@Param() params: AdminPlanIdParamDto) {
    return this.plans.get(params.id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать тарифный план' })
  @ApiCreatedResponse({ type: PlanSchema })
  create(@Body() dto: CreatePlanDto) {
    return this.plans.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить тарифный план' })
  @ApiOkResponse({ type: PlanSchema })
  update(@Param() params: AdminPlanIdParamDto, @Body() dto: UpdatePlanDto) {
    return this.plans.update(params.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Деактивировать тарифный план' })
  @ApiOkResponse({ type: PlanSchema })
  deactivate(@Param() params: AdminPlanIdParamDto) {
    return this.plans.deactivate(params.id);
  }
}
