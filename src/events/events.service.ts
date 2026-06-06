import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppEventName, AppEventPayloads } from './app-events';

@Injectable()
export class EventsService {
  constructor(private readonly emitter: EventEmitter2) {}

  /** Fire-and-forget domain event (sync listeners run inline). */
  emit<K extends AppEventName>(event: K, payload: AppEventPayloads[K]): void {
    this.emitter.emit(event, payload);
  }

  /** Await all async listeners — use when callers need side effects to finish. */
  emitAsync<K extends AppEventName>(
    event: K,
    payload: AppEventPayloads[K],
  ): Promise<unknown[]> {
    return this.emitter.emitAsync(event, payload);
  }
}
