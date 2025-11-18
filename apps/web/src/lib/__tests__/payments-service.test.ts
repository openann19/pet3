import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { PaymentsService, type Subscription, type UserEntitlements } from '../payments-service';
import { paymentsApi } from '@/api/payments-api';
import { createLogger } from '../logger';

vi.mock('@/api/payments-api', () => {
  const paymentsApiMock = {
    getUserEntitlements: vi.fn(),
    updateEntitlements: vi.fn(),
    getUserSubscription: vi.fn(),
    createSubscription: vi.fn(),
    getAllSubscriptions: vi.fn(),
    updateSubscription: vi.fn(),
    addConsumable: vi.fn(),
    redeemConsumable: vi.fn(),
    createBillingIssue: vi.fn(),
    getUserBillingIssue: vi.fn(),
    resolveBillingIssue: vi.fn(),
    getAuditLogs: vi.fn(),
    getRevenueMetrics: vi.fn(),
  };

  return {
    paymentsApi: paymentsApiMock,
    PaymentsApiImpl: vi.fn(),
  };
});

vi.mock('../logger', () => {
  const logger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  return {
    createLogger: vi.fn(() => logger),
  };
});

const mockedPaymentsApi = paymentsApi as unknown as {
  getUserEntitlements: ReturnType<typeof vi.fn>;
  updateEntitlements: ReturnType<typeof vi.fn>;
  getUserSubscription: ReturnType<typeof vi.fn>;
  createSubscription: ReturnType<typeof vi.fn>;
  getAllSubscriptions: ReturnType<typeof vi.fn>;
  updateSubscription: ReturnType<typeof vi.fn>;
  addConsumable: ReturnType<typeof vi.fn>;
  redeemConsumable: ReturnType<typeof vi.fn>;
  createBillingIssue: ReturnType<typeof vi.fn>;
  getUserBillingIssue: ReturnType<typeof vi.fn>;
  resolveBillingIssue: ReturnType<typeof vi.fn>;
  getAuditLogs: ReturnType<typeof vi.fn>;
  getRevenueMetrics: ReturnType<typeof vi.fn>;
};

const loggerMock = createLogger('PaymentsService');

const baseEntitlements: UserEntitlements = {
  userId: 'user-1',
  planTier: 'premium',
  entitlements: ['unlimited_swipes'],
  consumables: {
    boosts: 1,
    super_likes: 0,
  },
  updatedAt: new Date().toISOString(),
};

const baseSubscription: Subscription = {
  id: 'sub-1',
  userId: 'user-1',
  planId: 'plan-premium',
  status: 'active',
  store: 'web',
  startDate: new Date().toISOString(),
  currentPeriodStart: new Date().toISOString(),
  currentPeriodEnd: new Date(Date.now() + 86400000).toISOString(),
  cancelAtPeriodEnd: false,
  metadata: {},
};

describe('PaymentsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserEntitlements', () => {
    it('returns entitlements on success', async () => {
      mockedPaymentsApi.getUserEntitlements.mockResolvedValueOnce(baseEntitlements);

      const result = await PaymentsService.getUserEntitlements('user-1');

      expect(mockedPaymentsApi.getUserEntitlements).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(baseEntitlements);
    });

    it('logs and rethrows on error', async () => {
      const error = new Error('network error');
      mockedPaymentsApi.getUserEntitlements.mockRejectedValueOnce(error);

      await expect(PaymentsService.getUserEntitlements('user-1')).rejects.toThrow('network error');

      expect(loggerMock.error).toHaveBeenCalled();
    });
  });

  describe('createSubscription', () => {
    it('creates subscription via API', async () => {
      mockedPaymentsApi.createSubscription.mockResolvedValueOnce(baseSubscription);

      const result = await PaymentsService.createSubscription('user-1', 'plan-premium', 'web', {
        telemetry: true,
      });

      expect(mockedPaymentsApi.createSubscription).toHaveBeenCalledWith(
        'user-1',
        'plan-premium',
        'web',
        { telemetry: true },
      );
      expect(result).toEqual(baseSubscription);
    });

    it('logs and rethrows on error', async () => {
      mockedPaymentsApi.createSubscription.mockRejectedValueOnce(new Error('create failed'));

      await expect(
        PaymentsService.createSubscription('user-1', 'plan-premium', 'web', {}),
      ).rejects.toThrow('create failed');

      expect(loggerMock.error).toHaveBeenCalled();
    });
  });

  describe('cancelSubscription', () => {
    it('cancels at period end when immediate is false', async () => {
      const updatedSub: Subscription = { ...baseSubscription, cancelAtPeriodEnd: true };
      mockedPaymentsApi.getAllSubscriptions.mockResolvedValueOnce([baseSubscription]);
      mockedPaymentsApi.updateSubscription.mockResolvedValueOnce(updatedSub);

      const result = await PaymentsService.cancelSubscription('sub-1', false, 'admin-1', 'user-request');

      expect(mockedPaymentsApi.getAllSubscriptions).toHaveBeenCalled();
      expect(mockedPaymentsApi.updateSubscription).toHaveBeenCalledWith('sub-1', {
        cancelAtPeriodEnd: true,
      });
      expect(mockedPaymentsApi.updateEntitlements).not.toHaveBeenCalled();
      expect(result).toEqual(updatedSub);
    });

    it('cancels immediately and downgrades entitlements when immediate is true', async () => {
      const updatedSub: Subscription = { ...baseSubscription, status: 'canceled' };
      mockedPaymentsApi.getAllSubscriptions.mockResolvedValueOnce([baseSubscription]);
      mockedPaymentsApi.updateSubscription.mockResolvedValueOnce(updatedSub);
      mockedPaymentsApi.updateEntitlements.mockResolvedValueOnce(baseEntitlements);

      const result = await PaymentsService.cancelSubscription('sub-1', true, 'admin-1', 'fraud');

      expect(mockedPaymentsApi.updateSubscription).toHaveBeenCalledWith('sub-1', {
        status: 'canceled',
      });
      expect(mockedPaymentsApi.updateEntitlements).toHaveBeenCalledWith(
        'user-1',
        'free',
        'fraud',
        'admin-1',
      );
      expect(result).toEqual(updatedSub);
    });

    it('throws when subscription is not found', async () => {
      mockedPaymentsApi.getAllSubscriptions.mockResolvedValueOnce([]);

      await expect(PaymentsService.cancelSubscription('missing', false)).rejects.toThrow(
        'Subscription not found',
      );
      expect(loggerMock.error).toHaveBeenCalled();
    });
  });

  describe('refundSubscription', () => {
    it('returns subscription and logs audit when found', async () => {
      mockedPaymentsApi.getAllSubscriptions.mockResolvedValueOnce([baseSubscription]);
      const logAuditSpy = vi.spyOn(PaymentsService, 'logAudit');

      const result = await PaymentsService.refundSubscription(
        'sub-1',
        1000,
        'admin-1',
        'goodwill',
      );

      expect(mockedPaymentsApi.getAllSubscriptions).toHaveBeenCalled();
      expect(logAuditSpy).toHaveBeenCalledWith({
        actorUserId: 'admin-1',
        action: 'refund',
        targetSubscriptionId: 'sub-1',
        details: { amount: 1000, reason: 'goodwill' },
        reason: 'goodwill',
      });
      expect(result).toEqual(baseSubscription);
    });

    it('throws when subscription to refund is not found', async () => {
      mockedPaymentsApi.getAllSubscriptions.mockResolvedValueOnce([]);

      await expect(
        PaymentsService.refundSubscription('missing-sub', 1000, 'admin-1', 'reason'),
      ).rejects.toThrow('Subscription not found');
      expect(loggerMock.error).toHaveBeenCalled();
    });
  });

  describe('createSubscriptionEvent', () => {
    it('creates event and logs warning', () => {
      const event = PaymentsService.createSubscriptionEvent({
        subscriptionId: 'sub-1',
        userId: 'user-1',
        type: 'created',
        metadata: { source: 'test' },
      });

      expect(event.subscriptionId).toBe('sub-1');
      expect(event.userId).toBe('user-1');
      expect(event.type).toBe('created');
      expect(typeof event.timestamp).toBe('string');
      expect(loggerMock.warn).toHaveBeenCalled();
    });
  });

  describe('logAudit', () => {
    it('returns audit entry and logs warning', () => {
      const entry = PaymentsService.logAudit({
        actorUserId: 'admin-1',
        action: 'grant',
        targetUserId: 'user-1',
        targetSubscriptionId: 'sub-1',
        details: { reason: 'promo' },
        reason: 'promo',
      });

      expect(entry.actorUserId).toBe('admin-1');
      expect(entry.action).toBe('grant');
      expect(entry.targetUserId).toBe('user-1');
      expect(entry.targetSubscriptionId).toBe('sub-1');
      expect(typeof entry.timestamp).toBe('string');
      expect(loggerMock.warn).toHaveBeenCalled();
    });
  });
});
