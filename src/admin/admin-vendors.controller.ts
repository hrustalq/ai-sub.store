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
import { VendorSchema } from '../entities/schemas';
import { AdminVendorsService } from './admin-vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { ListVendorsQueryDto } from './dto/list-vendors-query.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { AdminVendorIdParamDto } from './dto/vendor-id-param.dto';

@ApiTags('Администрирование — вендоры')
@ApiSecurity('admin-api-key')
@ApiCommonResponses()
@Controller('api/admin/vendors')
@UseGuards(AdminApiKeyGuard)
export class AdminVendorsController {
  constructor(private readonly vendors: AdminVendorsService) {}

  @Get()
  @ApiOperation({ summary: 'Список вендоров (включая неактивных по запросу)' })
  @ApiOkResponse({ type: VendorSchema, isArray: true })
  list(@Query() query: ListVendorsQueryDto) {
    return this.vendors.list(query.includeInactive);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить вендора по id' })
  @ApiOkResponse({ type: VendorSchema })
  get(@Param() params: AdminVendorIdParamDto) {
    return this.vendors.get(params.id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать вендора' })
  @ApiCreatedResponse({ type: VendorSchema })
  create(@Body() dto: CreateVendorDto) {
    return this.vendors.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить вендора' })
  @ApiOkResponse({ type: VendorSchema })
  update(@Param() params: AdminVendorIdParamDto, @Body() dto: UpdateVendorDto) {
    return this.vendors.update(params.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Деактивировать вендора' })
  @ApiOkResponse({ type: VendorSchema })
  deactivate(@Param() params: AdminVendorIdParamDto) {
    return this.vendors.deactivate(params.id);
  }
}
