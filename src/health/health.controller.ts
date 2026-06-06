import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import {
  HealthLiveSchema,
  HealthReadySchema,
} from '../entities/schemas/health.schema';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Система')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  @Get('live')
  @ApiOperation({
    summary: 'Проверка живости процесса',
    description:
      'Liveness probe: процесс запущен и отвечает на HTTP. Не проверяет БД.',
  })
  @ApiOkResponse({
    description: 'Процесс работает',
    type: HealthLiveSchema,
  })
  live(): HealthLiveSchema {
    return { status: 'ok' };
  }

  @Get('ready')
  @HealthCheck()
  @ApiOperation({
    summary: 'Проверка готовности к работе',
    description: 'Readiness probe: проверяет доступность базы данных.',
  })
  @ApiOkResponse({
    description: 'Сервис готов принимать запросы',
    type: HealthReadySchema,
  })
  @ApiServiceUnavailableResponse({
    description: 'Сервис не готов (например, БД недоступна)',
  })
  ready() {
    return this.readinessCheck();
  }

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Проверка работоспособности',
    description:
      'Алиас для /health/ready. Используется Docker HEALTHCHECK и оркестраторами.',
  })
  @ApiOkResponse({
    description: 'Сервис работает нормально',
    type: HealthReadySchema,
  })
  @ApiServiceUnavailableResponse({
    description: 'Сервис недоступен',
  })
  check() {
    return this.readinessCheck();
  }

  private readinessCheck() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
    ]);
  }
}
