import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventsService } from './events.service';
import { CredentialLoggingListener } from './listeners/credential-logging.listener';
import { OrderLoggingListener } from './listeners/order-logging.listener';

@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),
  ],
  providers: [EventsService, OrderLoggingListener, CredentialLoggingListener],
  exports: [EventsService],
})
export class EventsModule {}
