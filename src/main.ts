import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { getBotToken } from 'nestjs-telegraf';
import { Logger } from 'nestjs-pino';
import { Telegraf } from 'telegraf';
import { AppModule } from './app.module';
import { VALIDATION_PIPE_OPTIONS } from './common/pipes/validation-pipe.config';
import {
  setupSwagger,
  SWAGGER_JSON_PATH,
  SWAGGER_PATH,
} from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  app.set('trust proxy', true);
  app.useGlobalPipes(new ValidationPipe(VALIDATION_PIPE_OPTIONS));
  setupSwagger(app);

  const config = app.get(ConfigService);
  const logger = app.get(Logger);

  const webhookDomain = config.get<string>('telegram.webhookDomain');
  const webhookPath =
    config.get<string>('telegram.webhookPath') ?? '/telegram/webhook';

  if (webhookDomain) {
    const bot = app.get<Telegraf>(getBotToken());
    app.use(bot.webhookCallback(webhookPath));
    const webhookUrl = `${webhookDomain.replace(/\/$/, '')}${webhookPath}`;
    await bot.telegram.setWebhook(webhookUrl);
    logger.log(`Telegram webhook set: ${webhookUrl}`);
  }

  const port = config.get<number>('port') ?? 3000;
  await app.listen(port);
  logger.log(`Server listening on port ${port}`);
  logger.log(`Swagger UI: http://localhost:${port}/${SWAGGER_PATH}`);
  logger.log(`OpenAPI JSON: http://localhost:${port}/${SWAGGER_JSON_PATH}`);
}

void bootstrap();
