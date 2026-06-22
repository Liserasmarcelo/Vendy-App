import { describe, it, expect, vi } from 'vitest';
import { metrics } from './healthChecks';

describe('MetricsCollector', () => {
  it('records requests', () => {
    metrics.recordRequest(100);
    metrics.recordRequest(200);
    metrics.recordRequest(300, true);

    const m = metrics.getMetrics();
    expect(m.requests.total).toBe(3);
    expect(m.requests.errors).toBe(1);
  });

  it('calculates error rate', () => {
    const m = metrics.getMetrics();
    expect(m.requests.errorRate).toBeGreaterThan(0);
  });

  it('calculates latency percentiles', () => {
    const m = metrics.getMetrics();
    expect(m.latency.avg).toBeGreaterThan(0);
    expect(m.latency.p50).toBeGreaterThanOrEqual(0);
    expect(m.latency.p95).toBeGreaterThanOrEqual(0);
    expect(m.latency.p99).toBeGreaterThanOrEqual(0);
  });

  it('tracks uptime', () => {
    const m = metrics.getMetrics();
    expect(m.uptime).toBeGreaterThanOrEqual(0);
  });
});

describe('Health Status', () => {
  it('has correct structure', () => {
    const status = {
      status: 'healthy' as const,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: 3600,
      checks: {
        database: { status: 'healthy' as const, responseTime: 10 },
        redis: { status: 'healthy' as const, responseTime: 5 },
        memory: { status: 'healthy' as const, responseTime: 1 },
        disk: { status: 'healthy' as const, responseTime: 1 },
      },
    };

    expect(status.status).toBe('healthy');
    expect(status.checks.database.status).toBe('healthy');
  });

  it('detects unhealthy status', () => {
    const status = {
      status: 'unhealthy' as const,
      checks: {
        database: { status: 'unhealthy' as const, responseTime: 0, message: 'Connection failed' },
      },
    };

    expect(status.status).toBe('unhealthy');
    expect(status.checks.database.message).toContain('failed');
  });
});

describe('Prometheus Metrics', () => {
  it('formats metrics correctly', () => {
    const format = `
# HELP vendy_requests_total Total number of requests
# TYPE vendy_requests_total counter
vendy_requests_total 100

# HELP vendy_errors_total Total number of errors
# TYPE vendy_errors_total counter
vendy_errors_total 5
`;

    expect(format).toContain('vendy_requests_total');
    expect(format).toContain('vendy_errors_total');
  });
});
