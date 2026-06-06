import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { AdminModule } from '../admin/admin.module';
import { CatalogModule } from '../catalog/catalog.module';
import { CredentialsModule } from '../credentials/credentials.module';
import { HelpdeskModule } from '../helpdesk/helpdesk.module';
import { LegalModule } from '../legal/legal.module';
import { OrdersModule } from '../orders/orders.module';
import { PaymentModule } from '../payment/payment.module';
import { SessionModule } from '../session/session.module';
import { TelegramOrderListener } from './listeners/telegram-order.listener';
import { TelegramSupportListener } from './listeners/telegram-support.listener';
import { TelegramBotSetupService } from './telegram-bot-setup.service';
import { TelegramUpdate } from './telegram.update';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        token: config.getOrThrow<string>('TELEGRAM_BOT_TOKEN'),
        launchOptions: config.get<string>('telegram.webhookDomain')
          ? false
          : { dropPendingUpdates: true },
      }),
    }),
    AdminModule,
    CatalogModule,
    OrdersModule,
    CredentialsModule,
    PaymentModule,
    SessionModule,
    HelpdeskModule,
    LegalModule,
  ],
  providers: [
    TelegramUpdate,
    TelegramOrderListener,
    TelegramSupportListener,
    TelegramBotSetupService,
  ],
})
export class TelegramModule {}
