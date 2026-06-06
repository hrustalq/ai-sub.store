import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { CredentialsModule } from '../credentials/credentials.module';
import { OrdersController } from './orders.controller';
import { OrderWorkflowService } from './order-workflow.service';
import { OrdersService } from './orders.service';

@Module({
  imports: [CatalogModule, CredentialsModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderWorkflowService],
  exports: [OrdersService, OrderWorkflowService],
})
export class OrdersModule {}
