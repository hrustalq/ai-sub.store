import { BadRequestException, Injectable } from '@nestjs/common';
import { SessionScenario, SessionStep, UserSessionEntity } from '../entities';
import { AppEvents, EventsService } from '../events';
import { PrismaService } from '../prisma/prisma.service';
import {
  toPrismaSessionScenario,
  toPrismaSessionStep,
  toUserSessionEntity,
} from '../prisma/mappers/prisma.mapper';
import {
  AdminHelpdeskContext,
  AdminHelpdeskSessionState,
  AdminHelpdeskStep,
  mergeAdminHelpdeskContext,
  toAdminHelpdeskContext,
} from './contexts/admin-helpdesk.context';
import {
  AdminManageContext,
  AdminManageSessionState,
  toAdminManageContext,
} from './contexts/admin-manage.context';
import {
  HelpdeskContext,
  HelpdeskSessionState,
  HelpdeskStep,
  mergeHelpdeskContext,
  toHelpdeskContext,
} from './contexts/helpdesk.context';
import {
  mergePurchaseContext,
  PurchaseContext,
  PurchaseSessionState,
  PurchaseStep,
  toPurchaseContext,
} from './contexts/purchase.context';
import {
  getInitialStep,
  isAdminHelpdeskStep,
  isAdminManageStep,
  isHelpdeskStep,
  isPurchaseStep,
  isStepAllowedForScenario,
} from './scenarios/scenario-registry';

const DEFAULT_SESSION: Pick<
  UserSessionEntity,
  | 'scenario'
  | 'step'
  | 'vendorId'
  | 'planId'
  | 'pendingOrderId'
  | 'supportTicketId'
> = {
  scenario: SessionScenario.IDLE,
  step: SessionStep.IDLE,
  vendorId: undefined,
  planId: undefined,
  pendingOrderId: undefined,
  supportTicketId: undefined,
};

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  async get(telegramUserId: number): Promise<UserSessionEntity> {
    await this.ensureTelegramUser(telegramUserId);

    const session = await this.prisma.userSession.findUnique({
      where: { telegramUserId: BigInt(telegramUserId) },
    });

    if (!session) {
      return {
        telegramUserId,
        ...DEFAULT_SESSION,
        updatedAt: new Date(),
      };
    }

    return toUserSessionEntity(session);
  }

  async enterScenario(
    telegramUserId: number,
    scenario: SessionScenario,
    step: SessionStep = getInitialStep(scenario),
    context?:
      | Partial<PurchaseContext>
      | Partial<HelpdeskContext>
      | Partial<AdminManageContext>,
  ): Promise<void> {
    this.assertStepForScenario(scenario, step);

    const purchasePatch =
      scenario === SessionScenario.PURCHASE
        ? (context as Partial<PurchaseContext> | undefined)
        : undefined;
    const helpdeskPatch =
      scenario === SessionScenario.HELPDESK ||
      scenario === SessionScenario.ADMIN_HELPDESK
        ? (context as
            | Partial<HelpdeskContext>
            | Partial<AdminHelpdeskContext>
            | undefined)
        : undefined;
    const adminManagePatch =
      scenario === SessionScenario.ADMIN_MANAGE
        ? (context as Partial<AdminManageContext> | undefined)
        : undefined;
    await this.persist(telegramUserId, {
      scenario,
      step,
      vendorId: adminManagePatch?.importType ?? purchasePatch?.vendorId,
      planId: purchasePatch?.planId,
      pendingOrderId: purchasePatch?.pendingOrderId,
      supportTicketId: helpdeskPatch?.supportTicketId,
      clearContext: scenario === SessionScenario.IDLE,
      clearPurchaseContext:
        scenario === SessionScenario.HELPDESK ||
        scenario === SessionScenario.ADMIN_HELPDESK ||
        scenario === SessionScenario.ADMIN_MANAGE,
    });

    if (scenario !== SessionScenario.IDLE) {
      this.events.emit(AppEvents.Session.ScenarioEntered, {
        telegramUserId,
        scenario,
        step,
      });
    }
  }

  async advancePurchase(
    telegramUserId: number,
    step: PurchaseStep,
    context?: Partial<PurchaseContext>,
  ): Promise<void> {
    this.assertStepForScenario(SessionScenario.PURCHASE, step);

    const current = await this.get(telegramUserId);
    const merged = mergePurchaseContext(toPurchaseContext(current), context);

    await this.persist(telegramUserId, {
      scenario: SessionScenario.PURCHASE,
      step,
      vendorId: merged.vendorId,
      planId: merged.planId,
      pendingOrderId: merged.pendingOrderId,
      supportTicketId: undefined,
      clearPurchaseContext: false,
    });
  }

  async enterAdminImport(
    adminTelegramUserId: number,
    importType: AdminManageContext['importType'],
  ): Promise<void> {
    await this.enterScenario(
      adminTelegramUserId,
      SessionScenario.ADMIN_MANAGE,
      SessionStep.ADMIN_AWAITING_EXCEL,
      { importType },
    );
  }

  async enterAdminChat(
    adminTelegramUserId: number,
    ticketId: string,
  ): Promise<void> {
    await this.enterScenario(
      adminTelegramUserId,
      SessionScenario.ADMIN_HELPDESK,
      SessionStep.ADMIN_REPLYING,
      { supportTicketId: ticketId },
    );
  }

  async advanceAdminHelpdesk(
    adminTelegramUserId: number,
    step: AdminHelpdeskStep,
    context?: Partial<AdminHelpdeskContext>,
  ): Promise<void> {
    this.assertStepForScenario(SessionScenario.ADMIN_HELPDESK, step);

    const current = await this.get(adminTelegramUserId);
    const merged = mergeAdminHelpdeskContext(
      toAdminHelpdeskContext(current),
      context,
    );

    await this.persist(adminTelegramUserId, {
      scenario: SessionScenario.ADMIN_HELPDESK,
      step,
      supportTicketId: merged.supportTicketId,
      clearPurchaseContext: true,
    });
  }

  async advanceHelpdesk(
    telegramUserId: number,
    step: HelpdeskStep,
    context?: Partial<HelpdeskContext>,
  ): Promise<void> {
    this.assertStepForScenario(SessionScenario.HELPDESK, step);

    const current = await this.get(telegramUserId);
    const merged = mergeHelpdeskContext(toHelpdeskContext(current), context);

    await this.persist(telegramUserId, {
      scenario: SessionScenario.HELPDESK,
      step,
      supportTicketId: merged.supportTicketId,
      clearPurchaseContext: true,
    });
  }

  async getAdminManageState(
    adminTelegramUserId: number,
  ): Promise<AdminManageSessionState | undefined> {
    const session = await this.get(adminTelegramUserId);

    if (
      session.scenario !== SessionScenario.ADMIN_MANAGE ||
      !isAdminManageStep(session.step)
    ) {
      return undefined;
    }

    return {
      step: session.step,
      context: toAdminManageContext(session),
    };
  }

  async getAdminHelpdeskState(
    adminTelegramUserId: number,
  ): Promise<AdminHelpdeskSessionState | undefined> {
    const session = await this.get(adminTelegramUserId);

    if (
      session.scenario !== SessionScenario.ADMIN_HELPDESK ||
      !isAdminHelpdeskStep(session.step)
    ) {
      return undefined;
    }

    return {
      step: session.step,
      context: toAdminHelpdeskContext(session),
    };
  }

  async getHelpdeskState(
    telegramUserId: number,
  ): Promise<HelpdeskSessionState | undefined> {
    const session = await this.get(telegramUserId);

    if (
      session.scenario !== SessionScenario.HELPDESK ||
      !isHelpdeskStep(session.step)
    ) {
      return undefined;
    }

    return {
      step: session.step,
      context: toHelpdeskContext(session),
    };
  }

  async getPurchaseState(
    telegramUserId: number,
  ): Promise<PurchaseSessionState | undefined> {
    const session = await this.get(telegramUserId);

    if (
      session.scenario !== SessionScenario.PURCHASE ||
      !isPurchaseStep(session.step)
    ) {
      return undefined;
    }

    return {
      step: session.step,
      context: toPurchaseContext(session),
    };
  }

  async reset(telegramUserId: number): Promise<void> {
    await this.enterScenario(telegramUserId, SessionScenario.IDLE);
    this.events.emit(AppEvents.Session.Reset, { telegramUserId });
  }

  /** @deprecated Use enterScenario / advancePurchase instead */
  async set(
    telegramUserId: number,
    session: Pick<
      UserSessionEntity,
      'step' | 'vendorId' | 'planId' | 'pendingOrderId'
    > & { scenario?: SessionScenario },
  ): Promise<void> {
    const scenario =
      session.scenario ??
      (session.step === SessionStep.IDLE
        ? SessionScenario.IDLE
        : SessionScenario.PURCHASE);

    await this.persist(telegramUserId, {
      scenario,
      step: session.step,
      vendorId: session.vendorId,
      planId: session.planId,
      pendingOrderId: session.pendingOrderId,
      clearContext: scenario === SessionScenario.IDLE,
    });
  }

  private async persist(
    telegramUserId: number,
    data: {
      scenario: SessionScenario;
      step: SessionStep;
      vendorId?: string;
      planId?: string;
      pendingOrderId?: string;
      supportTicketId?: string;
      clearContext?: boolean;
      clearPurchaseContext?: boolean;
    },
  ): Promise<void> {
    await this.ensureTelegramUser(telegramUserId);

    const clearAll = data.clearContext === true;
    const clearPurchase = clearAll || data.clearPurchaseContext === true;
    const vendorId = clearPurchase ? null : (data.vendorId ?? null);
    const planId = clearPurchase ? null : (data.planId ?? null);
    const pendingOrderId = clearPurchase ? null : (data.pendingOrderId ?? null);
    const supportTicketId = clearAll ? null : (data.supportTicketId ?? null);

    await this.prisma.userSession.upsert({
      where: { telegramUserId: BigInt(telegramUserId) },
      create: {
        telegramUserId: BigInt(telegramUserId),
        scenario: toPrismaSessionScenario(data.scenario),
        step: toPrismaSessionStep(data.step),
        vendorId,
        planId,
        pendingOrderId,
        supportTicketId,
      },
      update: {
        scenario: toPrismaSessionScenario(data.scenario),
        step: toPrismaSessionStep(data.step),
        vendorId,
        planId,
        pendingOrderId,
        supportTicketId,
      },
    });
  }

  private assertStepForScenario(
    scenario: SessionScenario,
    step: SessionStep,
  ): void {
    if (!isStepAllowedForScenario(scenario, step)) {
      throw new BadRequestException(
        `Шаг ${step} недопустим для сценария ${scenario}`,
      );
    }
  }

  private async ensureTelegramUser(telegramUserId: number): Promise<void> {
    await this.prisma.telegramUser.upsert({
      where: { telegramUserId: BigInt(telegramUserId) },
      create: { telegramUserId: BigInt(telegramUserId) },
      update: {},
    });
  }
}
