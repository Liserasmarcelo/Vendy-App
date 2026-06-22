import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import Redis from 'ioredis';

// ==========================================
// SSE CONNECTION MANAGER
// ==========================================
interface SSEConnection {
  id: string;
  shopId: number;
  reply: FastifyReply;
  heartbeat: NodeJS.Timeout;
}

export class SSEManager {
  private connections: Map<string, SSEConnection> = new Map();
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  // Register new SSE connection
  async register(shopId: number, request: FastifyRequest, reply: FastifyReply): Promise<string> {
    const connectionId = `sse_${shopId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Set SSE headers
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    // Send initial connection message
    reply.raw.write(`data: ${JSON.stringify({ type: 'connected', connectionId })}

`);

    // Setup heartbeat
    const heartbeat = setInterval(() => {
      try {
        reply.raw.write(`:heartbeat

`);
      } catch {
        this.disconnect(connectionId);
      }
    }, 30000); // 30 seconds

    const connection: SSEConnection = {
      id: connectionId,
      shopId,
      reply,
      heartbeat,
    };

    this.connections.set(connectionId, connection);

    // Listen for Redis pub/sub events for this shop
    await this.subscribeToShop(shopId);

    // Cleanup on disconnect
    request.raw.on('close', () => {
      this.disconnect(connectionId);
    });

    return connectionId;
  }

  // Disconnect
  disconnect(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      clearInterval(connection.heartbeat);
      try {
        connection.reply.raw.end();
      } catch {
        // Already closed
      }
      this.connections.delete(connectionId);
    }
  }

  // Broadcast to all connections for a shop
  async broadcastToShop(shopId: number, data: any): Promise<void> {
    const message = `data: ${JSON.stringify(data)}

`;
    
    for (const [id, connection] of this.connections) {
      if (connection.shopId === shopId) {
        try {
          connection.reply.raw.write(message);
        } catch {
          this.disconnect(id);
        }
      }
    }
  }

  // Broadcast to all connections
  async broadcastAll(data: any): Promise<void> {
    const message = `data: ${JSON.stringify(data)}

`;
    
    for (const [id, connection] of this.connections) {
      try {
        connection.reply.raw.write(message);
      } catch {
        this.disconnect(id);
      }
    }
  }

  // Get active connections count
  getConnectionCount(shopId?: number): number {
    if (shopId) {
      return Array.from(this.connections.values()).filter(c => c.shopId === shopId).length;
    }
    return this.connections.size;
  }

  // Subscribe to Redis pub/sub for shop events
  private async subscribeToShop(shopId: number): Promise<void> {
    // In a real implementation, you'd subscribe to a Redis channel
    // and forward messages to SSE connections
    const channel = `shop:${shopId}:events`;
    
    this.redis.subscribe(channel, (err) => {
      if (err) {
        console.error(`Failed to subscribe to ${channel}:`, err);
      }
    });

    this.redis.on('message', (channel, message) => {
      const shopIdFromChannel = parseInt(channel.split(':')[1]);
      try {
        const data = JSON.parse(message);
        this.broadcastToShop(shopIdFromChannel, data);
      } catch {
        // Invalid message
      }
    });
  }

  // Publish event to Redis (called from other parts of the app)
  async publishEvent(shopId: number, event: any): Promise<void> {
    const channel = `shop:${shopId}:events`;
    await this.redis.publish(channel, JSON.stringify(event));
  }
}

// Singleton
let sseManager: SSEManager | null = null;

export function getSSEManager(redis: Redis): SSEManager {
  if (!sseManager) {
    sseManager = new SSEManager(redis);
  }
  return sseManager;
}
