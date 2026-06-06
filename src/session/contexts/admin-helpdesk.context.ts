import { SessionStep, UserSessionEntity } from '../../entities';

export type AdminHelpdeskStep = SessionStep.ADMIN_REPLYING;

export interface AdminHelpdeskContext {
  supportTicketId?: string;
}

export interface AdminHelpdeskSessionState {
  step: AdminHelpdeskStep;
  context: AdminHelpdeskContext;
}

export function toAdminHelpdeskContext(
  session: UserSessionEntity,
): AdminHelpdeskContext {
  return {
    supportTicketId: session.supportTicketId,
  };
}

export function mergeAdminHelpdeskContext(
  current: AdminHelpdeskContext,
  patch?: Partial<AdminHelpdeskContext>,
): AdminHelpdeskContext {
  return {
    supportTicketId: patch?.supportTicketId ?? current.supportTicketId,
  };
}
