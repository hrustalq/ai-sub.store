import { Module } from '@nestjs/common';
import { AdminCounterpartiesController } from './admin-counterparties.controller';
import { AdminCounterpartiesService } from './admin-counterparties.service';
import { AdminExcelController } from './admin-excel.controller';
import { AdminPlansController } from './admin-plans.controller';
import { AdminPlansService } from './admin-plans.service';
import { AdminVendorsController } from './admin-vendors.controller';
import { AdminVendorsService } from './admin-vendors.service';
import { ExcelService } from './excel.service';

@Module({
  controllers: [
    AdminVendorsController,
    AdminPlansController,
    AdminCounterpartiesController,
    AdminExcelController,
  ],
  providers: [
    AdminVendorsService,
    AdminPlansService,
    AdminCounterpartiesService,
    ExcelService,
  ],
  exports: [
    AdminVendorsService,
    AdminPlansService,
    AdminCounterpartiesService,
    ExcelService,
  ],
})
export class AdminModule {}
