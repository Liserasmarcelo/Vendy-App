import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FunnelAnalyzer, getFunnelAnalyzer } from './funnelAnalyzer';

// Mock Prisma
const mockPrisma = {
  $queryRaw: vi.fn().mockImplementation((query: any) => {
    // Return decreasing counts for funnel steps
    const mockCounts = [1000, 500, 200, 100, 50];
    return Promise.resolve([{ count: mockCounts[mockPrisma.$queryRaw.mock.calls.length - 1] || 0 }]);
  }),
} as any;

describe('FunnelAnalyzer', () => {
  let analyzer: FunnelAnalyzer;

  beforeEach(() => {
    analyzer = new FunnelAnalyzer(mockPrisma);
    vi.clearAllMocks();
  });

  it('analyzes purchase funnel', async () => {
    const funnel = await analyzer.analyze(
      'purchase',
      1,
      new Date('2024-06-01'),
      new Date('2024-06-30')
    );

    expect(funnel.name).toBe('Funnel de Compra');
    expect(funnel.steps).toHaveLength(5);
    expect(funnel.steps[0].label).toBe('Visitas');
    expect(funnel.steps[4].label).toBe('Compra Completada');
    expect(funnel.totalConversionRate).toBeDefined();
    expect(funnel.totalDropOffRate).toBeDefined();
  });

  it('calculates conversion rates', async () => {
    // Mock specific counts for predictable results
    mockPrisma.$queryRaw.mockImplementation(() => {
      const counts = [1000, 600, 300, 150, 75];
      const callIndex = mockPrisma.$queryRaw.mock.calls.length - 1;
      return Promise.resolve([{ count: counts[callIndex] || 0 }]);
    });

    const funnel = await analyzer.analyze(
      'purchase',
      1,
      new Date('2024-06-01'),
      new Date('2024-06-30')
    );

    // First step should be 100%
    expect(funnel.steps[0].conversionRate).toBe(100);

    // Second step should be 60% (600/1000)
    expect(funnel.steps[1].conversionRate).toBe(60);

    // Drop-off should be 40%
    expect(funnel.steps[1].dropOffRate).toBe(40);
  });

  it('analyzes onboarding funnel', async () => {
    const funnel = await analyzer.analyze(
      'onboarding',
      1,
      new Date('2024-06-01'),
      new Date('2024-06-30')
    );

    expect(funnel.name).toBe('Funnel de Onboarding');
    expect(funnel.steps).toHaveLength(5);
  });

  it('compares funnels', async () => {
    const comparison = await analyzer.compareFunnels(
      'purchase',
      1,
      { start: new Date('2024-06-01'), end: new Date('2024-06-30') },
      { start: new Date('2024-05-01'), end: new Date('2024-05-31') }
    );

    expect(comparison.current).toBeDefined();
    expect(comparison.previous).toBeDefined();
    expect(comparison.changes).toBeDefined();
    expect(comparison.changes.length).toBe(5);
  });

  it('analyzes drop-off', async () => {
    mockPrisma.$queryRaw.mockImplementation(() => {
      const counts = [1000, 500, 200, 100, 50];
      const callIndex = mockPrisma.$queryRaw.mock.calls.length - 1;
      return Promise.resolve([{ count: counts[callIndex] || 0 }]);
    });

    const analysis = await analyzer.getDropOffAnalysis(
      'purchase',
      1,
      new Date('2024-06-01'),
      new Date('2024-06-30')
    );

    expect(analysis.biggestDropOff).toBeDefined();
    expect(analysis.allDropOffs).toBeDefined();
    expect(analysis.recommendations).toBeDefined();
    expect(analysis.recommendations.length).toBeGreaterThan(0);
  });

  it('throws on unknown funnel type', async () => {
    await expect(
      analyzer.analyze('unknown' as any, 1, new Date(), new Date())
    ).rejects.toThrow('Unknown funnel type');
  });

  it('handles zero counts gracefully', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ count: 0 }]);

    const funnel = await analyzer.analyze(
      'purchase',
      1,
      new Date('2024-06-01'),
      new Date('2024-06-30')
    );

    expect(funnel.steps[0].count).toBe(0);
    expect(funnel.totalConversionRate).toBe(0);
  });
});

describe('getFunnelAnalyzer', () => {
  it('returns singleton instance', () => {
    const analyzer1 = getFunnelAnalyzer(mockPrisma);
    const analyzer2 = getFunnelAnalyzer(mockPrisma);
    expect(analyzer1).toBe(analyzer2);
  });
});
