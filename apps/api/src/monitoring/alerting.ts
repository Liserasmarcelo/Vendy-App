import { logger } from './logger';

// ==========================================
// ALERT TYPES
// ==========================================
interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  service: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  acknowledged: boolean;
}

// ==========================================
// ALERT STORE
// ==========================================
const alerts: Alert[] = [];
const MAX_ALERTS = 100;

// ==========================================
// ALERT FUNCTIONS
// ==========================================
export function createAlert(
  type: Alert['type'],
  service: string,
  message: string,
  details?: Record<string, any>
): Alert {
  const alert: Alert = {
    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    service,
    message,
    details,
    timestamp: new Date().toISOString(),
    acknowledged: false,
  };

  alerts.push(alert);

  // Keep only last MAX_ALERTS
  if (alerts.length > MAX_ALERTS) {
    alerts.shift();
  }

  // Log based on type
  if (type === 'error') {
    logger.error({ alert }, `🚨 ALERT: ${message}`);
  } else if (type === 'warning') {
    logger.warn({ alert }, `⚠️  ALERT: ${message}`);
  } else {
    logger.info({ alert }, `ℹ️  ALERT: ${message}`);
  }

  // In production, send to external service (PagerDuty, Slack, etc.)
  if (process.env.NODE_ENV === 'production') {
    sendToExternalService(alert);
  }

  return alert;
}

export function acknowledgeAlert(alertId: string): boolean {
  const alert = alerts.find((a) => a.id === alertId);
  if (alert) {
    alert.acknowledged = true;
    return true;
  }
  return false;
}

export function getAlerts(
  type?: Alert['type'],
  service?: string,
  acknowledged?: boolean
): Alert[] {
  return alerts.filter((alert) => {
    if (type && alert.type !== type) return false;
    if (service && alert.service !== service) return false;
    if (acknowledged !== undefined && alert.acknowledged !== acknowledged) return false;
    return true;
  });
}

export function getRecentAlerts(limit = 10): Alert[] {
  return alerts.slice(-limit).reverse();
}

// ==========================================
// AUTO-ALERTS
// ==========================================
export function checkErrorRate(errorRate: number): void {
  if (errorRate > 10) {
    createAlert('error', 'api', `Error rate critical: ${errorRate.toFixed(1)}%`, {
      errorRate,
      threshold: 10,
    });
  } else if (errorRate > 5) {
    createAlert('warning', 'api', `Error rate high: ${errorRate.toFixed(1)}%`, {
      errorRate,
      threshold: 5,
    });
  }
}

export function checkLatency(avgLatency: number, p95Latency: number): void {
  if (p95Latency > 5000) {
    createAlert('error', 'api', `P95 latency critical: ${p95Latency}ms`, {
      avgLatency,
      p95Latency,
      threshold: 5000,
    });
  } else if (p95Latency > 2000) {
    createAlert('warning', 'api', `P95 latency high: ${p95Latency}ms`, {
      avgLatency,
      p95Latency,
      threshold: 2000,
    });
  }
}

export function checkMemoryUsage(percentage: number): void {
  if (percentage > 90) {
    createAlert('error', 'api', `Memory usage critical: ${percentage.toFixed(1)}%`, {
      percentage,
      threshold: 90,
    });
  } else if (percentage > 75) {
    createAlert('warning', 'api', `Memory usage high: ${percentage.toFixed(1)}%`, {
      percentage,
      threshold: 75,
    });
  }
}

export function checkDatabaseConnection(healthy: boolean): void {
  if (!healthy) {
    createAlert('error', 'database', 'Database connection failed', {
      timestamp: new Date().toISOString(),
    });
  }
}

export function checkRedisConnection(healthy: boolean): void {
  if (!healthy) {
    createAlert('error', 'redis', 'Redis connection failed', {
      timestamp: new Date().toISOString(),
    });
  }
}

// ==========================================
// EXTERNAL SERVICE (Placeholder)
// ==========================================
function sendToExternalService(alert: Alert): void {
  // TODO: Integrate with Slack, PagerDuty, or email
  // Example Slack webhook:
  // await fetch(process.env.SLACK_WEBHOOK_URL, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     text: `🚨 ${alert.type.toUpperCase()}: ${alert.message}`,
  //     attachments: [{
  //       color: alert.type === 'error' ? 'danger' : alert.type === 'warning' ? 'warning' : 'good',
  //       fields: Object.entries(alert.details || {}).map(([title, value]) => ({
  //         title,
  //         value: String(value),
  //         short: true,
  //       })),
  //     }],
  //   }),
  // });

  logger.info({ alert }, 'Would send to external service');
}
