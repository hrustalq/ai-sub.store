import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Payment,
  YooCheckout,
  type ICreatePayment,
} from '@a2seven/yoo-checkout';
import { PinoLogger } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { PAYMENT_CURRENCY, formatPriceRub } from '../common/format-price';
import { PlanEntity } from '../entities';
import { isYooKassaWebhookIp } from './yookassa-ip.util';
import type {
  YooKassaCreatePaymentResult,
  YooKassaWebhookPayload,
} from './yookassa.types';

@Injectable()
export class YooKassaService {
  private checkout: YooCheckout | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(YooKassaService.name);
  }

  isEnabled(): boolean {
    return Boolean(
      this.config.get<string>('YOOKASSA_SHOP_ID') &&
      this.config.get<string>('YOOKASSA_SECRET_KEY'),
    );
  }

  getReturnUrl(orderId: string): string {
    const baseUrl = this.requirePublicBaseUrl();
    return `${baseUrl.replace(/\/$/, '')}/payment/yookassa/return?order_id=${encodeURIComponent(orderId)}`;
  }

  toPaymentAmount(plan: PlanEntity): { value: string; currency: string } {
    return {
      value: plan.priceRub.toFixed(2),
      currency: PAYMENT_CURRENCY,
    };
  }

  formatAmountLabel(amount: { value: string; currency: string }): string {
    return formatPriceRub(Number(amount.value));
  }

  async createPayment(
    orderId: string,
    plan: PlanEntity,
  ): Promise<YooKassaCreatePaymentResult> {
    const amount = this.toPaymentAmount(plan);
    const idempotenceKey = randomUUID();

    const createPayload: ICreatePayment = {
      amount,
      capture: true,
      confirmation: {
        type: 'redirect',
        return_url: this.getReturnUrl(orderId),
      },
      description: `${plan.name} · заказ ${orderId.slice(0, 8)}`,
      metadata: {
        order_id: orderId,
      },
    };

    let payment: Payment;
    try {
      payment = await this.getCheckoutClient().createPayment(
        createPayload,
        idempotenceKey,
      );
    } catch (error) {
      this.handleApiError(error, { orderId });
    }

    const confirmationUrl = payment.confirmation?.confirmation_url;
    if (!confirmationUrl) {
      this.logger.error(
        { orderId, paymentId: payment.id },
        'YooKassa payment created without confirmation URL',
      );
      throw new BadRequestException('Failed to create YooKassa payment link');
    }

    this.logger.info(
      {
        orderId,
        paymentId: payment.id,
        amount: amount.value,
        currency: amount.currency,
      },
      'YooKassa payment created',
    );

    return {
      paymentId: payment.id,
      confirmationUrl,
    };
  }

  assertWebhookSourceIp(ip: string | undefined): void {
    if (!ip || !isYooKassaWebhookIp(ip)) {
      this.logger.warn({ ip }, 'Rejected YooKassa webhook from untrusted IP');
      throw new UnauthorizedException('Untrusted webhook source');
    }
  }

  extractOrderId(payload: YooKassaWebhookPayload): string | undefined {
    return payload.object.metadata?.order_id;
  }

  private getCheckoutClient(): YooCheckout {
    if (!this.checkout) {
      this.checkout = new YooCheckout({
        shopId: this.config.getOrThrow<string>('YOOKASSA_SHOP_ID'),
        secretKey: this.config.getOrThrow<string>('YOOKASSA_SECRET_KEY'),
      });
    }

    return this.checkout;
  }

  private requirePublicBaseUrl(): string {
    const baseUrl =
      this.config.get<string>('publicBaseUrl') ??
      this.config.get<string>('PUBLIC_BASE_URL') ??
      this.config.get<string>('TELEGRAM_WEBHOOK_DOMAIN');

    if (!baseUrl) {
      throw new BadRequestException(
        'PUBLIC_BASE_URL or TELEGRAM_WEBHOOK_DOMAIN is required for YooKassa payments',
      );
    }

    return baseUrl;
  }

  private handleApiError(
    error: unknown,
    context: Record<string, unknown>,
  ): never {
    const err = error as {
      description?: string;
      code?: string;
      errorCode?: number;
      type?: string;
      response?: {
        status?: number;
        data?: { description?: string; type?: string };
      };
    };

    const description =
      err.description ??
      err.response?.data?.description ??
      'YooKassa API request failed';

    this.logger.error(
      {
        ...context,
        errorCode: err.errorCode ?? err.response?.status,
        errorType: err.response?.data?.type ?? err.type,
        code: err.code,
        description,
      },
      'YooKassa API request failed',
    );

    throw new BadRequestException(description);
  }
}
