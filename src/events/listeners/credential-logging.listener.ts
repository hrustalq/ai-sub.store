import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PinoLogger } from 'nestjs-pino';
import { AppEvents } from '../app-events';
import type {
  CredentialCreatedPayload,
  CredentialStockDepletedPayload,
} from '../payloads/credential.payloads';

@Injectable()
export class CredentialLoggingListener {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(CredentialLoggingListener.name);
  }

  @OnEvent(AppEvents.Credential.Created)
  handleCreated({ credential }: CredentialCreatedPayload): void {
    this.logger.info(
      { credentialId: credential.id, planId: credential.planId },
      'Credential added to inventory',
    );
  }

  @OnEvent(AppEvents.Credential.StockDepleted)
  handleStockDepleted(payload: CredentialStockDepletedPayload): void {
    this.logger.warn(
      { planId: payload.planId, orderId: payload.orderId },
      'Credential stock depleted',
    );
  }
}
