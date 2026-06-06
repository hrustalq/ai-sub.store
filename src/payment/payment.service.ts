import { Injectable } from '@nestjs/common';
import { YooKassaService } from './yookassa.service';

@Injectable()
export class PaymentService {
  constructor(private readonly yookassa: YooKassaService) {}

  isEnabled(): boolean {
    return this.yookassa.isEnabled();
  }
}
