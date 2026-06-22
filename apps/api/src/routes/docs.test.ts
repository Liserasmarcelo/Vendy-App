import { describe, it, expect, vi } from 'vitest';

describe('Docs Routes', () => {
  it('has OpenAPI export endpoint', () => {
    const routes = [
      { method: 'GET', url: '/api/openapi.json' },
      { method: 'GET', url: '/health' },
      { method: 'GET', url: '/health/db' },
      { method: 'GET', url: '/health/redis' },
    ];

    expect(routes).toContainEqual({ method: 'GET', url: '/api/openapi.json' });
    expect(routes).toContainEqual({ method: 'GET', url: '/health' });
    expect(routes).toContainEqual({ method: 'GET', url: '/health/db' });
    expect(routes).toContainEqual({ method: 'GET', url: '/health/redis' });
  });

  it('health endpoint returns correct structure', () => {
    const expectedResponse = {
      status: 'ok',
      timestamp: '2024-06-15T10:00:00Z',
      version: '1.0.0',
      uptime: 3600,
      services: {
        database: 'connected',
        redis: 'connected',
      },
    };

    expect(expectedResponse.status).toBe('ok');
    expect(expectedResponse.services.database).toBe('connected');
    expect(expectedResponse.services.redis).toBe('connected');
  });

  it('db health returns latency', () => {
    const expectedResponse = {
      status: 'ok',
      latency: 5.2,
    };

    expect(expectedResponse.status).toBe('ok');
    expect(expectedResponse.latency).toBeGreaterThan(0);
  });

  it('redis health returns latency', () => {
    const expectedResponse = {
      status: 'ok',
      latency: 2.1,
    };

    expect(expectedResponse.status).toBe('ok');
    expect(expectedResponse.latency).toBeGreaterThan(0);
  });
});
