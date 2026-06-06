import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { PaymentService } from './payment.service';
import { YooKassaController } from './yookassa.controller';
import { YooKassaWebhookService } from './yookassa-webhook.service';
import { YooKassaService } from './yookassa.service';

@Module({
  imports: [OrdersModule],
  controllers: [YooKassaController],
  providers: [PaymentService, YooKassaService, YooKassaWebhookService],
  exports: [PaymentService, YooKassaService],
})
export class PaymentModule {}
