import { SessionStep, VendorIdType } from '../../entities';

export interface PurchaseContext {
  vendorId?: VendorIdType;
  planId?: string;
  pendingOrderId?: string;
}

export type PurchaseStep = Exclude<SessionStep, SessionStep.IDLE>;

export interface PurchaseSessionState {
  step: PurchaseStep;
  context: PurchaseContext;
}

export function toPurchaseContext(session: {
  vendorId?: VendorIdType;
  planId?: string;
  pendingOrderId?: string;
}): PurchaseContext {
  return {
    vendorId: session.vendorId,
    planId: session.planId,
    pendingOrderId: session.pendingOrderId,
  };
}

export function mergePurchaseContext(
  current: PurchaseContext,
  patch?: Partial<PurchaseContext>,
): PurchaseContext {
  if (!patch) {
    return current;
  }

  return {
    vendorId: patch.vendorId !== undefined ? patch.vendorId : current.vendorId,
    planId: patch.planId !== undefined ? patch.planId : current.planId,
    pendingOrderId:
      patch.pendingOrderId !== undefined
        ? patch.pendingOrderId
        : current.pendingOrderId,
  };
}
