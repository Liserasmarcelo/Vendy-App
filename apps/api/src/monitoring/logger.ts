import pino from 'pino';

// ==========================================
// LOGGER CONFIGURATION
// ==========================================
const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        },
      }),
});

// ==========================================
// REQUEST LOGGER
// ==========================================
export function createRequestLogger() {
  return async (request: any, reply: any) => {
    const start = Date.now();

    reply.addHook('onSend', async (request: any, reply: any, payload: any) => {
      const duration = Date.now() - start;
      const logData = {
        req: {
          method: request.method,
          url: request.url,
          ip: request.ip,
          userAgent: request.headers['user-agent'],
        },
        res: {
          statusCode: reply.statusCode,
          duration,
        },
        userId: request.user?.id,
        shopId: request.shop?.id,
      };

      if (reply.statusCode >= 500) {
        logger.error(logData, 'Request failed');
      } else if (reply.statusCode >= 400) {
        logger.warn(logData, 'Request error');
      } else {
        logger.info(logData, 'Request completed');
      }
    });
  };
}

// ==========================================
// ERROR LOGGER
// ==========================================
export function logError(error: Error, context?: Record<string, any>) {
  logger.error(
    {
      err: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      ...context,
    },
    error.message
  );
}

export function logWarn(message: string, context?: Record<string, any>) {
  logger.warn({ ...context }, message);
}

export function logInfo(message: string, context?: Record<string, any>) {
  logger.info({ ...context }, message);
}

export function logDebug(message: string, context?: Record<string, any>) {
  logger.debug({ ...context }, message);
}
