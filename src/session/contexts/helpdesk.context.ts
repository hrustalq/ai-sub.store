import { SessionStep, UserSessionEntity } from '../../entities';

export type HelpdeskStep = SessionStep.DESCRIBING_ISSUE;

export interface HelpdeskContext {
  supportTicketId?: string;
}

export interface HelpdeskSessionState {
  step: HelpdeskStep;
  context: HelpdeskContext;
}

export function toHelpdeskContext(session: UserSessionEntity): HelpdeskContext {
  return {
    supportTicketId: session.supportTicketId,
  };
}

export function mergeHelpdeskContext(
  current: HelpdeskContext,
  patch?: Partial<HelpdeskContext>,
): HelpdeskContext {
  return {
    supportTicketId: patch?.supportTicketId ?? current.supportTicketId,
  };
}
