import { Module } from '@nestjs/common';
import { SessionOrderListener } from './listeners/session-order.listener';
import { SessionService } from './session.service';

@Module({
  providers: [SessionService, SessionOrderListener],
  exports: [SessionService],
})
export class SessionModule {}
