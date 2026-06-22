import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createAlert,
  acknowledgeAlert,
  getAlerts,
  getRecentAlerts,
  checkErrorRate,
  checkLatency,
  checkMemoryUsage,
  checkDatabaseConnection,
  checkRedisConnection,
} from './alerting';

describe('Alerting', () => {
  beforeEach(() => {
    // Clear alerts between tests
    vi.stubEnv('NODE_ENV', 'development');
  });

  it('creates alert', () => {
    const alert = createAlert('error', 'api', 'Test error');
    expect(alert).toBeDefined();
    expect(alert.type).toBe('error');
    expect(alert.service).toBe('api');
    expect(alert.message).toBe('Test error');
    expect(alert.acknowledged).toBe(false);
  });

  it('acknowledges alert', () => {
    const alert = createAlert('warning', 'api', 'Test warning');
    const result = acknowledgeAlert(alert.id);
    expect(result).toBe(true);

    const alerts = getAlerts('warning', 'api', true);
    expect(alerts.length).toBeGreaterThan(0);
  });

  it('filters alerts by type', () => {
    createAlert('error', 'api', 'Error 1');
    createAlert('warning', 'api', 'Warning 1');
    createAlert('info', 'api', 'Info 1');

    const errors = getAlerts('error');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.every((a) => a.type === 'error')).toBe(true);
  });

  it('returns recent alerts', () => {
    createAlert('error', 'api', 'Error 1');
    createAlert('error', 'api', 'Error 2');

    const recent = getRecentAlerts(2);
    expect(recent.length).toBe(2);
  });

  it('checks error rate', () => {
    checkErrorRate(15);
    const alerts = getAlerts('error');
    expect(alerts.length).toBeGreaterThan(0);
  });

  it('checks latency', () => {
    checkLatency(100, 6000);
    const alerts = getAlerts('error');
    expect(alerts.length).toBeGreaterThan(0);
  });

  it('checks memory usage', () => {
    checkMemoryUsage(95);
    const alerts = getAlerts('error');
    expect(alerts.length).toBeGreaterThan(0);
  });

  it('checks database connection', () => {
    checkDatabaseConnection(false);
    const alerts = getAlerts('error');
    expect(alerts.length).toBeGreaterThan(0);
  });

  it('checks redis connection', () => {
    checkRedisConnection(false);
    const alerts = getAlerts('error');
    expect(alerts.length).toBeGreaterThan(0);
  });
});
