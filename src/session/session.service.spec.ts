import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SessionScenario, SessionStep } from '../entities';
import { EventsService } from '../events';
import { PrismaService } from '../prisma/prisma.service';
import { SessionService } from './session.service';

interface UserSessionUpsertPayload {
  scenario: string;
  step: string;
  vendorId: string | null;
  planId: string | null;
  pendingOrderId: string | null;
  supportTicketId: string | null;
}

interface UserSessionUpsertArgs {
  where: { telegramUserId: bigint };
  create: UserSessionUpsertPayload & { telegramUserId: bigint };
  update: UserSessionUpsertPayload;
}

type UserSessionUpsertMock = jest.Mock<
  Promise<unknown>,
  [UserSessionUpsertArgs]
>;

function getUpsertPayload(
  upsert: UserSessionUpsertMock,
  branch: 'create' | 'update',
): UserSessionUpsertPayload {
  const [args] = upsert.mock.calls[0] ?? [];
  if (!args) {
    throw new Error('upsert was not called');
  }

  return args[branch];
}

describe('SessionService', () => {
  let service: SessionService;
  let prisma: {
    telegramUser: { upsert: jest.Mock };
    userSession: { findUnique: jest.Mock; upsert: UserSessionUpsertMock };
  };

  beforeEach(async () => {
    prisma = {
      telegramUser: { upsert: jest.fn().mockResolvedValue({}) },
      userSession: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({}) as UserSessionUpsertMock,
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventsService, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get(SessionService);
  });

  it('enters purchase scenario at vendor selection', async () => {
    await service.enterScenario(
      42,
      SessionScenario.PURCHASE,
      SessionStep.SELECTING_VENDOR,
    );

    expect(prisma.userSession.upsert).toHaveBeenCalledTimes(1);
    expect(getUpsertPayload(prisma.userSession.upsert, 'create')).toEqual({
      telegramUserId: BigInt(42),
      scenario: 'PURCHASE',
      step: 'SELECTING_VENDOR',
      vendorId: null,
      planId: null,
      pendingOrderId: null,
      supportTicketId: null,
    });
  });

  it('advances purchase flow and merges context', async () => {
    prisma.userSession.findUnique.mockResolvedValue({
      telegramUserId: BigInt(42),
      scenario: 'PURCHASE',
      step: 'SELECTING_VENDOR',
      vendorId: 'cursor',
      planId: null,
      pendingOrderId: null,
      supportTicketId: null,
      updatedAt: new Date(),
    });

    await service.advancePurchase(42, SessionStep.SELECTING_PLAN, {
      vendorId: 'cursor',
    });

    expect(prisma.userSession.upsert).toHaveBeenCalledTimes(1);
    expect(getUpsertPayload(prisma.userSession.upsert, 'update')).toEqual({
      scenario: 'PURCHASE',
      step: 'SELECTING_PLAN',
      vendorId: 'cursor',
      planId: null,
      pendingOrderId: null,
      supportTicketId: null,
    });
  });

  it('resets to idle scenario and clears context', async () => {
    await service.reset(42);

    expect(prisma.userSession.upsert).toHaveBeenCalledTimes(1);
    expect(getUpsertPayload(prisma.userSession.upsert, 'update')).toEqual({
      scenario: 'IDLE',
      step: 'IDLE',
      vendorId: null,
      planId: null,
      pendingOrderId: null,
      supportTicketId: null,
    });
  });

  it('rejects invalid step for scenario', async () => {
    await expect(
      service.enterScenario(
        42,
        SessionScenario.IDLE,
        SessionStep.SELECTING_VENDOR,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns purchase state only for active purchase scenario', async () => {
    prisma.userSession.findUnique.mockResolvedValue({
      telegramUserId: BigInt(42),
      scenario: 'PURCHASE',
      step: 'CONFIRMING_ORDER',
      vendorId: 'cursor',
      planId: 'cursor-monthly',
      pendingOrderId: 'order-1',
      supportTicketId: null,
      updatedAt: new Date(),
    });

    await expect(service.getPurchaseState(42)).resolves.toEqual({
      step: SessionStep.CONFIRMING_ORDER,
      context: {
        vendorId: 'cursor',
        planId: 'cursor-monthly',
        pendingOrderId: 'order-1',
      },
    });
  });

  it('returns undefined purchase state when idle', async () => {
    await expect(service.getPurchaseState(42)).resolves.toBeUndefined();
  });
});
