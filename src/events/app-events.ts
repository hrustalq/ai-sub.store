import {
  CredentialCreatedPayload,
  CredentialStockDepletedPayload,
} from './payloads/credential.payloads';
import {
  OrderCancelledPayload,
  OrderCreatedPayload,
  OrderFulfillmentFailedPayload,
  OrderFulfilledPayload,
  OrderPaidPayload,
} from './payloads/order.payloads';
import {
  PaymentInstructionsSentPayload,
  PaymentInvoiceSentPayload,
  PaymentYooKassaLinkSentPayload,
} from './payloads/payment.payloads';
import {
  SessionResetPayload,
  SessionScenarioEnteredPayload,
} from './payloads/session.payloads';
import {
  SupportMessageAddedPayload,
  SupportTicketClosedPayload,
  SupportTicketCreatedPayload,
} from './payloads/support.payloads';

/** Dot-notation event names — use as single source of truth for emit and @OnEvent. */
export const AppEvents = {
  Order: {
    Created: 'order.created',
    Paid: 'order.paid',
    Fulfilled: 'order.fulfilled',
    FulfillmentFailed: 'order.fulfillment_failed',
    Cancelled: 'order.cancelled',
  },
  Credential: {
    Created: 'credential.created',
    StockDepleted: 'credential.stock_depleted',
  },
  Payment: {
    InvoiceSent: 'payment.invoice_sent',
    InstructionsSent: 'payment.instructions_sent',
    YooKassaLinkSent: 'payment.yookassa_link_sent',
  },
  Session: {
    Reset: 'session.reset',
    ScenarioEntered: 'session.scenario_entered',
  },
  Support: {
    TicketCreated: 'support.ticket_created',
    MessageAdded: 'support.message_added',
    TicketClosed: 'support.ticket_closed',
  },
} as const;

export type AppEventName =
  | (typeof AppEvents.Order)[keyof typeof AppEvents.Order]
  | (typeof AppEvents.Credential)[keyof typeof AppEvents.Credential]
  | (typeof AppEvents.Payment)[keyof typeof AppEvents.Payment]
  | (typeof AppEvents.Session)[keyof typeof AppEvents.Session]
  | (typeof AppEvents.Support)[keyof typeof AppEvents.Support];

export interface AppEventPayloads {
  [AppEvents.Order.Created]: OrderCreatedPayload;
  [AppEvents.Order.Paid]: OrderPaidPayload;
  [AppEvents.Order.Fulfilled]: OrderFulfilledPayload;
  [AppEvents.Order.FulfillmentFailed]: OrderFulfillmentFailedPayload;
  [AppEvents.Order.Cancelled]: OrderCancelledPayload;
  [AppEvents.Credential.Created]: CredentialCreatedPayload;
  [AppEvents.Credential.StockDepleted]: CredentialStockDepletedPayload;
  [AppEvents.Payment.InvoiceSent]: PaymentInvoiceSentPayload;
  [AppEvents.Payment.InstructionsSent]: PaymentInstructionsSentPayload;
  [AppEvents.Payment.YooKassaLinkSent]: PaymentYooKassaLinkSentPayload;
  [AppEvents.Session.Reset]: SessionResetPayload;
  [AppEvents.Session.ScenarioEntered]: SessionScenarioEnteredPayload;
  [AppEvents.Support.TicketCreated]: SupportTicketCreatedPayload;
  [AppEvents.Support.MessageAdded]: SupportMessageAddedPayload;
  [AppEvents.Support.TicketClosed]: SupportTicketClosedPayload;
}
