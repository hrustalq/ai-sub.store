import { SessionScenario, SessionStep } from '../../entities';

export interface SessionResetPayload {
  telegramUserId: number;
}

export interface SessionScenarioEnteredPayload {
  telegramUserId: number;
  scenario: SessionScenario;
  step: SessionStep;
}
