import { PrismaClient } from '@prisma/client';

// ==========================================
// NOTIFICATION TYPES
// ==========================================
export type NotificationChannel = 'push' | 'email' | 'sms' | 'in_app';
export type NotificationType = 
  | 'order_created'
  | 'order_updated'
  | 'payment_received'
  | 'payment_failed'
  | 'low_stock'
  | 'subscription_expiring'
  | 'subscription_expired'
  | 'ticket_updated'
  | 'new_message'
  | 'system';

export interface Notification {
  id: string;
  userId: string;
  shopId?: number;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  channel: NotificationChannel;
  status: 'pending' | 'sent' | 'failed' | 'read';
  sentAt?: Date;
  readAt?: Date;
  createdAt: Date;
}

export interface NotificationPreference {
  userId: string;
  shopId?: number;
  channels: Record<NotificationType, NotificationChannel[]>;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string;
  };
}

export interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: Date;
}

// ==========================================
// NOTIFICATION MANAGER
// ==========================================
export class NotificationManager {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Create notification
  async createNotification(data: {
    userId: string;
    shopId?: number;
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, any>;
    channel: NotificationChannel;
  }): Promise<Notification> {
    // Check quiet hours
    const prefs = await this.getPreferences(data.userId, data.shopId);
    if (prefs?.quietHours?.enabled && this.isQuietHours(prefs.quietHours)) {
      // Delay notification
      const notification = await this.prisma.notification.create({
        data: {
          userId: data.userId,
          shopId: data.shopId,
          type: data.type,
          title: data.title,
          body: data.body,
          data: data.data,
          channel: data.channel,
          status: 'pending',
        },
      });

      return this.mapNotification(notification);
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        shopId: data.shopId,
        type: data.type,
        title: data.title,
        body: data.body,
        data: data.data,
        channel: data.channel,
        status: 'pending',
      },
    });

    // Try to send immediately
    await this.sendNotification(notification.id);

    return this.mapNotification(notification);
  }

  // Send notification
  async sendNotification(notificationId: string): Promise<Notification> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    try {
      switch (notification.channel) {
        case 'push':
          await this.sendPush(notification);
          break;
        case 'email':
          await this.sendEmail(notification);
          break;
        case 'sms':
          await this.sendSMS(notification);
          break;
        case 'in_app':
          // In-app notifications are just stored
          break;
      }

      const updated = await this.prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'sent', sentAt: new Date() },
      });

      return this.mapNotification(updated);
    } catch (error) {
      const updated = await this.prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'failed' },
      });

      return this.mapNotification(updated);
    }
  }

  // Get notifications for user
  async getNotifications(userId: string, options?: {
    shopId?: number;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ notifications: Notification[]; total: number }> {
    const where: any = { userId };
    if (options?.shopId) where.shopId = options.shopId;
    if (options?.status) where.status = options.status;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit,
        skip: options?.offset,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      notifications: notifications.map(this.mapNotification),
      total,
    };
  }

  // Mark as read
  async markAsRead(notificationId: string): Promise<Notification> {
    const notification = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'read', readAt: new Date() },
    });

    return this.mapNotification(notification);
  }

  // Mark all as read
  async markAllAsRead(userId: string, shopId?: number): Promise<number> {
    const where: any = { userId, status: { not: 'read' } };
    if (shopId) where.shopId = shopId;

    const result = await this.prisma.notification.updateMany({
      where,
      data: { status: 'read', readAt: new Date() },
    });

    return result.count;
  }

  // Get unread count
  async getUnreadCount(userId: string, shopId?: number): Promise<number> {
    const where: any = { userId, status: { not: 'read' } };
    if (shopId) where.shopId = shopId;

    return this.prisma.notification.count({ where });
  }

  // Preferences
  async getPreferences(userId: string, shopId?: number): Promise<NotificationPreference | null> {
    const where: any = { userId };
    if (shopId) where.shopId = shopId;

    const prefs = await this.prisma.notificationPreference.findFirst({
      where,
    });

    if (!prefs) return null;

    return {
      userId: prefs.userId,
      shopId: prefs.shopId || undefined,
      channels: prefs.channels as Record<NotificationType, NotificationChannel[]>,
      quietHours: prefs.quietHours as any,
    };
  }

  async updatePreferences(userId: string, data: Partial<NotificationPreference>): Promise<NotificationPreference> {
    const existing = await this.prisma.notificationPreference.findFirst({
      where: { userId },
    });

    if (existing) {
      const updated = await this.prisma.notificationPreference.update({
        where: { id: existing.id },
        data: {
          ...(data.channels && { channels: data.channels }),
          ...(data.quietHours && { quietHours: data.quietHours }),
        },
      });

      return {
        userId: updated.userId,
        shopId: updated.shopId || undefined,
        channels: updated.channels as any,
        quietHours: updated.quietHours as any,
      };
    }

    // Create default preferences
    const created = await this.prisma.notificationPreference.create({
      data: {
        userId,
        shopId: data.shopId,
        channels: data.channels || this.getDefaultChannels(),
        quietHours: data.quietHours || { enabled: false, start: '22:00', end: '08:00' },
      },
    });

    return {
      userId: created.userId,
      shopId: created.shopId || undefined,
      channels: created.channels as any,
      quietHours: created.quietHours as any,
    };
  }

  // Push subscriptions
  async addPushSubscription(userId: string, subscription: {
    endpoint: string;
    p256dh: string;
    auth: string;
  }): Promise<PushSubscription> {
    // Remove existing subscriptions for this user
    await this.prisma.pushSubscription.deleteMany({
      where: { userId },
    });

    const sub = await this.prisma.pushSubscription.create({
      data: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    });

    return this.mapPushSubscription(sub);
  }

  async removePushSubscription(endpoint: string): Promise<void> {
    await this.prisma.pushSubscription.deleteMany({
      where: { endpoint },
    });
  }

  async getPushSubscriptions(userId: string): Promise<PushSubscription[]> {
    const subs = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    return subs.map(this.mapPushSubscription);
  }

  // Private methods
  private async sendPush(notification: any): Promise<void> {
    const subs = await this.prisma.pushSubscription.findMany({
      where: { userId: notification.userId },
    });

    for (const sub of subs) {
      try {
        // In production, use web-push library
        console.log(`Sending push to ${sub.endpoint}: ${notification.title}`);
      } catch (error) {
        console.error('Push failed:', error);
        // Remove invalid subscription
        if ((error as any)?.statusCode === 410) {
          await this.prisma.pushSubscription.delete({
            where: { id: sub.id },
          });
        }
      }
    }
  }

  private async sendEmail(notification: any): Promise<void> {
    // In production, use email service (SendGrid, AWS SES, etc.)
    console.log(`Sending email to ${notification.userId}: ${notification.title}`);
  }

  private async sendSMS(notification: any): Promise<void> {
    // In production, use SMS service (Twilio, etc.)
    console.log(`Sending SMS to ${notification.userId}: ${notification.title}`);
  }

  private isQuietHours(quietHours: { enabled: boolean; start: string; end: string }): boolean {
    if (!quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = quietHours.start.split(':').map(Number);
    const [endHour, endMin] = quietHours.end.split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime < endTime) {
      return currentTime >= startTime && currentTime < endTime;
    } else {
      // Overnight quiet hours (e.g., 22:00 - 08:00)
      return currentTime >= startTime || currentTime < endTime;
    }
  }

  private getDefaultChannels(): Record<NotificationType, NotificationChannel[]> {
    return {
      order_created: ['push', 'email', 'in_app'],
      order_updated: ['push', 'in_app'],
      payment_received: ['push', 'email', 'in_app'],
      payment_failed: ['push', 'email', 'in_app'],
      low_stock: ['email', 'in_app'],
      subscription_expiring: ['email', 'push'],
      subscription_expired: ['email', 'push'],
      ticket_updated: ['push', 'in_app'],
      new_message: ['push', 'in_app'],
      system: ['email', 'in_app'],
    };
  }

  // Private mappers
  private mapNotification(notification: any): Notification {
    return {
      id: notification.id,
      userId: notification.userId,
      shopId: notification.shopId || undefined,
      type: notification.type as NotificationType,
      title: notification.title,
      body: notification.body,
      data: notification.data || undefined,
      channel: notification.channel as NotificationChannel,
      status: notification.status,
      sentAt: notification.sentAt || undefined,
      readAt: notification.readAt || undefined,
      createdAt: notification.createdAt,
    };
  }

  private mapPushSubscription(sub: any): PushSubscription {
    return {
      id: sub.id,
      userId: sub.userId,
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
      createdAt: sub.createdAt,
    };
  }
}

// Singleton
let notificationManager: NotificationManager | null = null;

export function getNotificationManager(prisma: PrismaClient): NotificationManager {
  if (!notificationManager) {
    notificationManager = new NotificationManager(prisma);
  }
  return notificationManager;
}
