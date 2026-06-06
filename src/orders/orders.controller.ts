import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
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
import { OrderSchema } from '../entities/schemas';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { OrderIdParamDto } from './dto/order-id-param.dto';
import { OrderWorkflowService } from './order-workflow.service';
import { OrdersService } from './orders.service';

@ApiTags('Заказы')
@ApiSecurity('admin-api-key')
@ApiCommonResponses()
@Controller('api/orders')
@UseGuards(AdminApiKeyGuard)
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly orderWorkflow: OrderWorkflowService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Создать заказ' })
  @ApiCreatedResponse({
    description: 'Заказ успешно создан',
    type: OrderSchema,
  })
  create(@Body() dto: CreateOrderDto) {
    return this.orders.create(
      dto.telegramUserId,
      dto.telegramChatId,
      dto.planId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Получить заказы пользователя' })
  @ApiOkResponse({
    description: 'Список заказов пользователя Telegram',
    type: OrderSchema,
    isArray: true,
  })
  list(@Query() query: ListOrdersQueryDto) {
    return this.orders.getByUser(query.telegramUserId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить заказ по идентификатору' })
  @ApiOkResponse({
    description: 'Данные заказа',
    type: OrderSchema,
  })
  async getOne(@Param() params: OrderIdParamDto) {
    const order = await this.orders.get(params.id);
    if (!order) {
      throw new NotFoundException('Заказ не найден');
    }
    return order;
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Подтвердить оплату и выдать учётные данные',
    description:
      'Отмечает заказ как оплаченный и выполняет его — назначает учётные данные из инвентаря.',
  })
  @ApiOkResponse({
    description: 'Заказ оплачен и выполнен',
    type: OrderSchema,
  })
  async confirm(@Param() params: OrderIdParamDto) {
    return this.orderWorkflow.confirmPayment(params.id, {
      source: 'admin_api',
    });
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Отменить заказ' })
  @ApiOkResponse({
    description: 'Заказ отменён',
    type: OrderSchema,
  })
  cancel(@Param() params: OrderIdParamDto) {
    return this.orders.cancel(params.id);
  }
}
