import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

// ==========================================
// HEALTH CHECK TYPES
// ==========================================
interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: ComponentHealth;
    redis: ComponentHealth;
    memory: ComponentHealth;
    disk: ComponentHealth;
  };
}

interface ComponentHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  message?: string;
}

// ==========================================
// METRICS
// ==========================================
class MetricsCollector {
  private requestCount = 0;
  private errorCount = 0;
  private requestDurations: number[] = [];
  private startTime = Date.now();

  recordRequest(duration: number, error = false) {
    this.requestCount++;
    this.requestDurations.push(duration);
    if (error) this.errorCount++;

    // Keep only last 1000 durations
    if (this.requestDurations.length > 1000) {
      this.requestDurations.shift();
    }
  }

  getMetrics() {
    const avgDuration = this.requestDurations.length > 0
      ? this.requestDurations.reduce((a, b) => a + b, 0) / this.requestDurations.length
      : 0;

    return {
      requests: {
        total: this.requestCount,
        errors: this.errorCount,
        errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0,
      },
      latency: {
        avg: Math.round(avgDuration),
        p50: this.getPercentile(50),
        p95: this.getPercentile(95),
        p99: this.getPercentile(99),
      },
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  private getPercentile(p: number): number {
    if (this.requestDurations.length === 0) return 0;
    const sorted = [...this.requestDurations].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return Math.round(sorted[Math.max(0, index)]);
  }
}

export const metrics = new MetricsCollector();

// ==========================================
// HEALTH CHECK FUNCTIONS
// ==========================================
async function checkDatabase(prisma: PrismaClient): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'healthy',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - start,
      message: error instanceof Error ? error.message : 'Database connection failed',
    };
  }
}

async function checkRedis(redis: Redis): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    await redis.ping();
    return {
      status: 'healthy',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - start,
      message: error instanceof Error ? error.message : 'Redis connection failed',
    };
  }
}

function checkMemory(): ComponentHealth {
  const start = Date.now();
  const used = process.memoryUsage();
  const total = used.heapTotal + used.external;
  const limit = 512 * 1024 * 1024; // 512MB threshold
  const percentage = (total / limit) * 100;

  if (percentage > 90) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - start,
      message: `Memory usage critical: ${(percentage).toFixed(1)}%`,
    };
  }

  if (percentage > 75) {
    return {
      status: 'degraded',
      responseTime: Date.now() - start,
      message: `Memory usage high: ${(percentage).toFixed(1)}%`,
    };
  }

  return {
    status: 'healthy',
    responseTime: Date.now() - start,
    message: `Memory usage: ${(percentage).toFixed(1)}%`,
  };
}

function checkDisk(): ComponentHealth {
  const start = Date.now();
  // In a real implementation, you'd use a disk check library
  // For now, we'll assume healthy
  return {
    status: 'healthy',
    responseTime: Date.now() - start,
    message: 'Disk usage: N/A (container environment)',
  };
}

// ==========================================
// REGISTER ROUTES
// ==========================================
export async function registerHealthRoutes(
  fastify: FastifyInstance,
  prisma: PrismaClient,
  redis: Redis
) {
  // Liveness probe - Kubernetes
  fastify.get('/health/live', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.status(200).send({ status: 'alive' });
  });

  // Readiness probe - Kubernetes
  fastify.get('/health/ready', async (request: FastifyRequest, reply: FastifyReply) => {
    const db = await checkDatabase(prisma);
    const cache = await checkRedis(redis);

    const isReady = db.status === 'healthy' && cache.status === 'healthy';

    reply.status(isReady ? 200 : 503).send({
      status: isReady ? 'ready' : 'not ready',
      checks: {
        database: db,
        redis: cache,
      },
    });
  });

  // Detailed health check
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    const [db, cache, memory, disk] = await Promise.all([
      checkDatabase(prisma),
      checkRedis(redis),
      checkMemory(),
      checkDisk(),
    ]);

    const checks = { database: db, redis: cache, memory, disk };
    const allHealthy = Object.values(checks).every(c => c.status === 'healthy');
    const anyUnhealthy = Object.values(checks).some(c => c.status === 'unhealthy');

    const status: HealthStatus['status'] = anyUnhealthy
      ? 'unhealthy'
      : allHealthy
      ? 'healthy'
      : 'degraded';

    const health: HealthStatus = {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      checks,
    };

    reply.status(status === 'unhealthy' ? 503 : 200).send(health);
  });

  // Database health
  fastify.get('/health/db', async (request: FastifyRequest, reply: FastifyReply) => {
    const db = await checkDatabase(prisma);
    reply.status(db.status === 'healthy' ? 200 : 503).send(db);
  });

  // Redis health
  fastify.get('/health/redis', async (request: FastifyRequest, reply: FastifyReply) => {
    const cache = await checkRedis(redis);
    reply.status(cache.status === 'healthy' ? 200 : 503).send(cache);
  });

  // Metrics endpoint (Prometheus format)
  fastify.get('/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
    const m = metrics.getMetrics();
    const prometheusFormat = `
# HELP vendy_requests_total Total number of requests
# TYPE vendy_requests_total counter
vendy_requests_total ${m.requests.total}

# HELP vendy_errors_total Total number of errors
# TYPE vendy_errors_total counter
vendy_errors_total ${m.requests.errors}

# HELP vendy_error_rate Error rate percentage
# TYPE vendy_error_rate gauge
vendy_error_rate ${m.requests.errorRate.toFixed(2)}

# HELP vendy_latency_avg Average latency in ms
# TYPE vendy_latency_avg gauge
vendy_latency_avg ${m.latency.avg}

# HELP vendy_latency_p50 50th percentile latency in ms
# TYPE vendy_latency_p50 gauge
vendy_latency_p50 ${m.latency.p50}

# HELP vendy_latency_p95 95th percentile latency in ms
# TYPE vendy_latency_p95 gauge
vendy_latency_p95 ${m.latency.p95}

# HELP vendy_latency_p99 99th percentile latency in ms
# TYPE vendy_latency_p99 gauge
vendy_latency_p99 ${m.latency.p99}

# HELP vendy_uptime_seconds Uptime in seconds
# TYPE vendy_uptime_seconds gauge
vendy_uptime_seconds ${m.uptime}

# HELP vendy_memory_usage_bytes Memory usage in bytes
# TYPE vendy_memory_usage_bytes gauge
vendy_memory_usage_bytes ${process.memoryUsage().heapUsed}

# HELP vendy_memory_total_bytes Memory total in bytes
# TYPE vendy_memory_total_bytes gauge
vendy_memory_total_bytes ${process.memoryUsage().heapTotal}
`.trim();

    reply.type('text/plain').send(prometheusFormat);
  });
}
