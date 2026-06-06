import {
  Counterparty as PrismaCounterparty,
  Credential as PrismaCredential,
  CredentialStatus as PrismaCredentialStatus,
  Order as PrismaOrder,
  OrderStatus as PrismaOrderStatus,
  Plan as PrismaPlan,
  SessionScenario as PrismaSessionScenario,
  SessionStep as PrismaSessionStep,
  TelegramUser as PrismaTelegramUser,
  SupportMessage as PrismaSupportMessage,
  SupportTicket as PrismaSupportTicket,
  SupportTicketStatus as PrismaSupportTicketStatus,
  UserSession as PrismaUserSession,
  Vendor as PrismaVendor,
} from '@prisma/client';
import {
  CounterpartyEntity,
  CredentialEntity,
  CredentialStatus,
  OrderEntity,
  OrderStatus,
  PlanEntity,
  SessionScenario,
  SessionStep,
  SupportMessageEntity,
  SupportTicketEntity,
  SupportTicketStatus,
  TelegramUserEntity,
  UserSessionEntity,
  VendorEntity,
  VendorIdType,
} from '../../entities';

const ORDER_STATUS_FROM_PRISMA: Record<PrismaOrderStatus, OrderStatus> = {
  PENDING_PAYMENT: OrderStatus.PENDING_PAYMENT,
  PAID: OrderStatus.PAID,
  FULFILLED: OrderStatus.FULFILLED,
  CANCELLED: OrderStatus.CANCELLED,
  FAILED: OrderStatus.FAILED,
};

const ORDER_STATUS_TO_PRISMA: Record<OrderStatus, PrismaOrderStatus> = {
  [OrderStatus.PENDING_PAYMENT]: 'PENDING_PAYMENT',
  [OrderStatus.PAID]: 'PAID',
  [OrderStatus.FULFILLED]: 'FULFILLED',
  [OrderStatus.CANCELLED]: 'CANCELLED',
  [OrderStatus.FAILED]: 'FAILED',
};

const SESSION_SCENARIO_FROM_PRISMA: Record<
  PrismaSessionScenario,
  SessionScenario
> = {
  IDLE: SessionScenario.IDLE,
  PURCHASE: SessionScenario.PURCHASE,
  HELPDESK: SessionScenario.HELPDESK,
  ADMIN_HELPDESK: SessionScenario.ADMIN_HELPDESK,
  ADMIN_MANAGE: SessionScenario.ADMIN_MANAGE,
};

const SESSION_SCENARIO_TO_PRISMA: Record<
  SessionScenario,
  PrismaSessionScenario
> = {
  [SessionScenario.IDLE]: 'IDLE',
  [SessionScenario.PURCHASE]: 'PURCHASE',
  [SessionScenario.HELPDESK]: 'HELPDESK',
  [SessionScenario.ADMIN_HELPDESK]: 'ADMIN_HELPDESK',
  [SessionScenario.ADMIN_MANAGE]: 'ADMIN_MANAGE',
};

const SESSION_STEP_FROM_PRISMA: Record<PrismaSessionStep, SessionStep> = {
  IDLE: SessionStep.IDLE,
  SELECTING_VENDOR: SessionStep.SELECTING_VENDOR,
  SELECTING_PLAN: SessionStep.SELECTING_PLAN,
  CONFIRMING_ORDER: SessionStep.CONFIRMING_ORDER,
  AWAITING_PAYMENT: SessionStep.AWAITING_PAYMENT,
  DESCRIBING_ISSUE: SessionStep.DESCRIBING_ISSUE,
  ADMIN_REPLYING: SessionStep.ADMIN_REPLYING,
  ADMIN_AWAITING_EXCEL: SessionStep.ADMIN_AWAITING_EXCEL,
};

const SESSION_STEP_TO_PRISMA: Record<SessionStep, PrismaSessionStep> = {
  [SessionStep.IDLE]: 'IDLE',
  [SessionStep.SELECTING_VENDOR]: 'SELECTING_VENDOR',
  [SessionStep.SELECTING_PLAN]: 'SELECTING_PLAN',
  [SessionStep.CONFIRMING_ORDER]: 'CONFIRMING_ORDER',
  [SessionStep.AWAITING_PAYMENT]: 'AWAITING_PAYMENT',
  [SessionStep.DESCRIBING_ISSUE]: 'DESCRIBING_ISSUE',
  [SessionStep.ADMIN_REPLYING]: 'ADMIN_REPLYING',
  [SessionStep.ADMIN_AWAITING_EXCEL]: 'ADMIN_AWAITING_EXCEL',
};

const SUPPORT_TICKET_STATUS_FROM_PRISMA: Record<
  PrismaSupportTicketStatus,
  SupportTicketStatus
> = {
  OPEN: SupportTicketStatus.OPEN,
  RESOLVED: SupportTicketStatus.RESOLVED,
  CLOSED: SupportTicketStatus.CLOSED,
};

const SUPPORT_TICKET_STATUS_TO_PRISMA: Record<
  SupportTicketStatus,
  PrismaSupportTicketStatus
> = {
  [SupportTicketStatus.OPEN]: 'OPEN',
  [SupportTicketStatus.RESOLVED]: 'RESOLVED',
  [SupportTicketStatus.CLOSED]: 'CLOSED',
};

const CREDENTIAL_STATUS_FROM_PRISMA: Record<
  PrismaCredentialStatus,
  CredentialStatus
> = {
  AVAILABLE: CredentialStatus.AVAILABLE,
  ASSIGNED: CredentialStatus.ASSIGNED,
  REVOKED: CredentialStatus.REVOKED,
};

export function toVendorEntity(vendor: PrismaVendor): VendorEntity {
  return {
    id: vendor.id as VendorIdType,
    name: vendor.name,
    description: vendor.description,
    emoji: vendor.emoji,
    active: vendor.active,
    createdAt: vendor.createdAt,
    updatedAt: vendor.updatedAt,
  };
}

export function toPlanEntity(plan: PrismaPlan): PlanEntity {
  return {
    id: plan.id,
    vendorId: plan.vendorId as VendorIdType,
    name: plan.name,
    description: plan.description,
    durationDays: plan.durationDays,
    priceRub: plan.priceRub,
    currency: plan.currency,
    active: plan.active,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
}

export function toTelegramUserEntity(
  user: PrismaTelegramUser,
): TelegramUserEntity {
  return {
    telegramUserId: Number(user.telegramUserId),
    username: user.username ?? undefined,
    firstName: user.firstName ?? undefined,
    lastName: user.lastName ?? undefined,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function toUserSessionEntity(
  session: PrismaUserSession,
): UserSessionEntity {
  return {
    telegramUserId: Number(session.telegramUserId),
    scenario: SESSION_SCENARIO_FROM_PRISMA[session.scenario],
    step: SESSION_STEP_FROM_PRISMA[session.step],
    vendorId: session.vendorId as VendorIdType | undefined,
    planId: session.planId ?? undefined,
    pendingOrderId: session.pendingOrderId ?? undefined,
    supportTicketId: session.supportTicketId ?? undefined,
    updatedAt: session.updatedAt,
  };
}

export function toCounterpartyEntity(
  counterparty: PrismaCounterparty,
): CounterpartyEntity {
  return {
    id: counterparty.id,
    name: counterparty.name,
    contactInfo: counterparty.contactInfo ?? undefined,
    notes: counterparty.notes ?? undefined,
    active: counterparty.active,
    createdAt: counterparty.createdAt,
    updatedAt: counterparty.updatedAt,
  };
}

export function toCredentialEntity(
  credential: PrismaCredential,
): CredentialEntity {
  return {
    id: credential.id,
    planId: credential.planId,
    counterpartyId: credential.counterpartyId ?? undefined,
    email: credential.email,
    password: credential.password,
    status: CREDENTIAL_STATUS_FROM_PRISMA[credential.status],
    createdAt: credential.createdAt,
    updatedAt: credential.updatedAt,
  };
}

export function toOrderEntity(order: PrismaOrder): OrderEntity {
  return {
    id: order.id,
    telegramUserId: Number(order.telegramUserId),
    telegramChatId: Number(order.telegramChatId),
    vendorId: order.vendorId as VendorIdType,
    planId: order.planId,
    status: ORDER_STATUS_FROM_PRISMA[order.status],
    amountRub: order.amountRub,
    currency: order.currency,
    credentialId: order.credentialId ?? undefined,
    yookassaPaymentId: order.yookassaPaymentId ?? undefined,
    createdAt: order.createdAt,
    paidAt: order.paidAt ?? undefined,
    fulfilledAt: order.fulfilledAt ?? undefined,
    cancelledAt: order.cancelledAt ?? undefined,
  };
}

export function toPrismaOrderStatus(status: OrderStatus): PrismaOrderStatus {
  return ORDER_STATUS_TO_PRISMA[status];
}

export function toPrismaSessionScenario(
  scenario: SessionScenario,
): PrismaSessionScenario {
  return SESSION_SCENARIO_TO_PRISMA[scenario];
}

export function toPrismaSessionStep(step: SessionStep): PrismaSessionStep {
  return SESSION_STEP_TO_PRISMA[step];
}

export function toSupportTicketEntity(
  ticket: PrismaSupportTicket,
): SupportTicketEntity {
  return {
    id: ticket.id,
    telegramUserId: Number(ticket.telegramUserId),
    telegramChatId: Number(ticket.telegramChatId),
    status: SUPPORT_TICKET_STATUS_FROM_PRISMA[ticket.status],
    relatedOrderId: ticket.relatedOrderId ?? undefined,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    closedAt: ticket.closedAt ?? undefined,
  };
}

export function toSupportMessageEntity(
  message: PrismaSupportMessage,
): SupportMessageEntity {
  return {
    id: message.id,
    ticketId: message.ticketId,
    fromAdmin: message.fromAdmin,
    telegramUserId: message.telegramUserId
      ? Number(message.telegramUserId)
      : undefined,
    text: message.text,
    createdAt: message.createdAt,
  };
}

export function toPrismaSupportTicketStatus(
  status: SupportTicketStatus,
): PrismaSupportTicketStatus {
  return SUPPORT_TICKET_STATUS_TO_PRISMA[status];
}
