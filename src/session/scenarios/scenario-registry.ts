import { SessionScenario, SessionStep } from '../../entities';
import { AdminHelpdeskStep } from '../contexts/admin-helpdesk.context';
import { AdminManageStep } from '../contexts/admin-manage.context';
import { HelpdeskStep } from '../contexts/helpdesk.context';
import { PurchaseStep } from '../contexts/purchase.context';

export const PURCHASE_STEPS: readonly PurchaseStep[] = [
  SessionStep.SELECTING_VENDOR,
  SessionStep.SELECTING_PLAN,
  SessionStep.CONFIRMING_ORDER,
  SessionStep.AWAITING_PAYMENT,
] as const;

export const HELPDESK_STEPS: readonly HelpdeskStep[] = [
  SessionStep.DESCRIBING_ISSUE,
] as const;

export const ADMIN_HELPDESK_STEPS: readonly AdminHelpdeskStep[] = [
  SessionStep.ADMIN_REPLYING,
] as const;

export const ADMIN_MANAGE_STEPS: readonly AdminManageStep[] = [
  SessionStep.ADMIN_AWAITING_EXCEL,
] as const;

const PURCHASE_STEP_SET = new Set<SessionStep>(PURCHASE_STEPS);
const HELPDESK_STEP_SET = new Set<SessionStep>(HELPDESK_STEPS);
const ADMIN_HELPDESK_STEP_SET = new Set<SessionStep>(ADMIN_HELPDESK_STEPS);
const ADMIN_MANAGE_STEP_SET = new Set<SessionStep>(ADMIN_MANAGE_STEPS);

const SCENARIO_STEPS: Record<SessionScenario, readonly SessionStep[]> = {
  [SessionScenario.IDLE]: [SessionStep.IDLE],
  [SessionScenario.PURCHASE]: PURCHASE_STEPS,
  [SessionScenario.HELPDESK]: HELPDESK_STEPS,
  [SessionScenario.ADMIN_HELPDESK]: ADMIN_HELPDESK_STEPS,
  [SessionScenario.ADMIN_MANAGE]: ADMIN_MANAGE_STEPS,
};

const STEP_HINTS: Partial<Record<SessionStep, string>> = {
  [SessionStep.SELECTING_VENDOR]:
    'Выберите провайдера из списка или нажмите /cancel.',
  [SessionStep.SELECTING_PLAN]:
    'Выберите тарифный план из списка или вернитесь к провайдерам.',
  [SessionStep.CONFIRMING_ORDER]:
    'Подтвердите заказ кнопкой ниже или отмените его.',
  [SessionStep.AWAITING_PAYMENT]:
    'Завершите оплату по инструкции выше. После подтверждения вы получите учётные данные.',
  [SessionStep.DESCRIBING_ISSUE]:
    'Опишите проблему одним сообщением. Мы ответим в этом чате.',
  [SessionStep.ADMIN_REPLYING]:
    'Режим чата с пользователем. Отправьте сообщение — оно уйдёт в обращение.',
  [SessionStep.ADMIN_AWAITING_EXCEL]:
    'Отправьте Excel-файл (.xlsx) для импорта или /cancel для отмены.',
};

export function isStepAllowedForScenario(
  scenario: SessionScenario,
  step: SessionStep,
): boolean {
  return SCENARIO_STEPS[scenario].includes(step);
}

export function isPurchaseStep(step: SessionStep): step is PurchaseStep {
  return PURCHASE_STEP_SET.has(step);
}

export function isHelpdeskStep(step: SessionStep): step is HelpdeskStep {
  return HELPDESK_STEP_SET.has(step);
}

export function isAdminHelpdeskStep(
  step: SessionStep,
): step is AdminHelpdeskStep {
  return ADMIN_HELPDESK_STEP_SET.has(step);
}

export function isAdminManageStep(step: SessionStep): step is AdminManageStep {
  return ADMIN_MANAGE_STEP_SET.has(step);
}

export function getStepHint(step: SessionStep): string | undefined {
  return STEP_HINTS[step];
}

export function getInitialStep(scenario: SessionScenario): SessionStep {
  return SCENARIO_STEPS[scenario][0];
}
