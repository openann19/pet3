import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MatchingAPI } from '@/api/matching-api';

vi.mock('@/lib/api-client', () => ({
  APIClient: {
    post: vi.fn(() => Promise.resolve({
      data: {
        candidates: [],
        totalCount: 0,
      },
    })),
  },
}));

vi.mock('@/lib/endpoints', () => ({
  ENDPOINTS: {
    MATCHING: {
      DISCOVER: '/matching/discover',
      SCORE: '/matching/score',
      SWIPE: '/matching/swipe',
      REPORT: '/matching/report',
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn(() => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  })),
}));

describe('MatchingAPI', () => {
  let matchingAPI: MatchingAPI;

  beforeEach(() => {
    matchingAPI = new MatchingAPI();
    vi.clearAllMocks();
  });

  it('discovers candidates', async () => {
    const response = await matchingAPI.discover({
      petId: 'pet1',
      filters: {
        species: ['dog'],
        maxDistance: 50,
      },
    });

    expect(response).toBeDefined();
    expect(response.candidates).toBeInstanceOf(Array);
    expect(response.totalCount).toBe(0);
  });

  it('calculates match score', async () => {
    const response = await matchingAPI.score({
      petId1: 'pet1',
      petId2: 'pet2',
    });

    expect(response).toBeDefined();
    expect(response.score).toBeDefined();
    expect(response.canMatch).toBeDefined();
  });

  it('records swipe action', async () => {
    const response = await matchingAPI.swipe({
      petId: 'pet1',
      targetPetId: 'pet2',
      action: 'like',
    });

    expect(response).toBeDefined();
    expect(response.recorded).toBe(true);
  });

  it('reports a pet', async () => {
    await expect(
      matchingAPI.report({
        reporterPetId: 'pet1',
        reportedPetId: 'pet2',
        reason: 'inappropriate',
      })
    ).resolves.not.toThrow();
  });
});
