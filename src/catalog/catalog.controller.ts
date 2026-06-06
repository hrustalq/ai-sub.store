import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { PlanSchema, VendorSchema } from '../entities/schemas';
import { CatalogService } from './catalog.service';
import { PlanIdParamDto } from './dto/plan-id-param.dto';
import { VendorIdParamDto } from './dto/vendor-id-param.dto';

@ApiTags('Каталог')
@Controller('api/catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('vendors')
  @ApiOperation({ summary: 'Получить список вендоров' })
  @ApiOkResponse({
    description: 'Список активных вендоров AI-инструментов',
    type: VendorSchema,
    isArray: true,
  })
  getVendors() {
    return this.catalog.getVendors();
  }

  @Get('vendors/:vendorId')
  @ApiOperation({ summary: 'Получить вендора по идентификатору' })
  @ApiParam({
    name: 'vendorId',
    description: 'Идентификатор вендора',
    enum: ['cursor', 'claude', 'chatgpt', 'gemini'],
    example: 'cursor',
  })
  @ApiOkResponse({
    description: 'Данные вендора',
    type: VendorSchema,
  })
  @ApiNotFoundResponse({ description: 'Вендор не найден' })
  async getVendor(@Param() params: VendorIdParamDto) {
    const vendor = await this.catalog.getVendor(params.vendorId);
    if (!vendor) {
      throw new NotFoundException('Вендор не найден');
    }
    return vendor;
  }

  @Get('vendors/:vendorId/plans')
  @ApiOperation({ summary: 'Получить тарифные планы вендора' })
  @ApiParam({
    name: 'vendorId',
    description: 'Идентификатор вендора',
    enum: ['cursor', 'claude', 'chatgpt', 'gemini'],
    example: 'cursor',
  })
  @ApiOkResponse({
    description: 'Список тарифных планов вендора',
    type: PlanSchema,
    isArray: true,
  })
  getPlansForVendor(@Param() params: VendorIdParamDto) {
    return this.catalog.getPlansForVendor(params.vendorId);
  }

  @Get('plans/:planId')
  @ApiOperation({ summary: 'Получить тарифный план по идентификатору' })
  @ApiParam({
    name: 'planId',
    description: 'Идентификатор тарифного плана',
    example: 'cursor-monthly',
  })
  @ApiOkResponse({
    description: 'Данные тарифного плана',
    type: PlanSchema,
  })
  @ApiNotFoundResponse({ description: 'Тарифный план не найден' })
  async getPlan(@Param() params: PlanIdParamDto) {
    const plan = await this.catalog.getPlan(params.planId);
    if (!plan) {
      throw new NotFoundException('Тарифный план не найден');
    }
    return plan;
  }
}
