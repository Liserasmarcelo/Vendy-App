import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

// URL de Redis desde env o default local
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = globalForRedis.redis ?? new Redis(redisUrl, {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

// Eventos de conexión
redis.on('connect', () => {
  console.log('🔌 Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
});

export default redis;