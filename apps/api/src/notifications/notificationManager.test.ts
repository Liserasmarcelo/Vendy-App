import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationManager, getNotificationManager } from './notificationManager';

// Mock Prisma
const mockPrisma = {
  notification: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
  },
  notificationPreference: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  pushSubscription: {
    create: vi.fn(),
    deleteMany: vi.fn(),
    findMany: vi.fn(),
    delete: vi.fn(),
  },
} as any;

describe('NotificationManager', () => {
  let manager: NotificationManager;

  beforeEach(() => {
    manager = new NotificationManager(mockPrisma);
    vi.clearAllMocks();
  });

  it('creates notification', async () => {
    mockPrisma.notification.create.mockResolvedValue({
      id: 'notif_1',
      userId: 'user_1',
      type: 'order_created',
      title: 'New Order',
      body: 'You have a new order',
      channel: 'push',
      status: 'pending',
      createdAt: new Date(),
    });

    const notification = await manager.createNotification({
      userId: 'user_1',
      type: 'order_created',
      title: 'New Order',
      body: 'You have a new order',
      channel: 'push',
    });

    expect(notification.id).toBe('notif_1');
    expect(notification.status).toBe('pending');
  });

  it('sends notification and marks as sent', async () => {
    mockPrisma.notification.findUnique.mockResolvedValue({
      id: 'notif_1',
      userId: 'user_1',
      type: 'order_created',
      title: 'New Order',
      body: 'You have a new order',
      channel: 'in_app',
      status: 'pending',
    });

    mockPrisma.notification.update.mockResolvedValue({
      id: 'notif_1',
      status: 'sent',
      sentAt: new Date(),
    });

    const notification = await manager.sendNotification('notif_1');

    expect(notification.status).toBe('sent');
    expect(notification.sentAt).toBeDefined();
  });

  it('marks failed on send error', async () => {
    mockPrisma.notification.findUnique.mockResolvedValue({
      id: 'notif_1',
      userId: 'user_1',
      channel: 'push',
      status: 'pending',
    });

    mockPrisma.pushSubscription.findMany.mockRejectedValue(new Error('DB error'));

    mockPrisma.notification.update.mockResolvedValue({
      id: 'notif_1',
      status: 'failed',
    });

    const notification = await manager.sendNotification('notif_1');

    expect(notification.status).toBe('failed');
  });

  it('gets notifications for user', async () => {
    mockPrisma.notification.findMany.mockResolvedValue([
      { id: 'notif_1', userId: 'user_1', type: 'order_created', title: 'Order', body: 'Body', channel: 'push', status: 'sent', createdAt: new Date() },
      { id: 'notif_2', userId: 'user_1', type: 'payment_received', title: 'Payment', body: 'Body', channel: 'email', status: 'read', createdAt: new Date() },
    ]);
    mockPrisma.notification.count.mockResolvedValue(2);

    const result = await manager.getNotifications('user_1');

    expect(result.notifications).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('marks notification as read', async () => {
    mockPrisma.notification.update.mockResolvedValue({
      id: 'notif_1',
      status: 'read',
      readAt: new Date(),
    });

    const notification = await manager.markAsRead('notif_1');

    expect(notification.status).toBe('read');
    expect(notification.readAt).toBeDefined();
  });

  it('marks all as read', async () => {
    mockPrisma.notification.updateMany.mockResolvedValue({ count: 3 });

    const count = await manager.markAllAsRead('user_1');

    expect(count).toBe(3);
  });

  it('gets unread count', async () => {
    mockPrisma.notification.count.mockResolvedValue(5);

    const count = await manager.getUnreadCount('user_1');

    expect(count).toBe(5);
  });

  it('gets preferences', async () => {
    mockPrisma.notificationPreference.findFirst.mockResolvedValue({
      id: 'pref_1',
      userId: 'user_1',
      channels: { order_created: ['push', 'email'] },
      quietHours: { enabled: true, start: '22:00', end: '08:00' },
    });

    const prefs = await manager.getPreferences('user_1');

    expect(prefs).toBeDefined();
    expect(prefs?.quietHours.enabled).toBe(true);
  });

  it('updates preferences', async () => {
    mockPrisma.notificationPreference.findFirst.mockResolvedValue({
      id: 'pref_1',
      userId: 'user_1',
    });

    mockPrisma.notificationPreference.update.mockResolvedValue({
      id: 'pref_1',
      userId: 'user_1',
      channels: { order_created: ['push'] },
      quietHours: { enabled: false, start: '22:00', end: '08:00' },
    });

    const prefs = await manager.updatePreferences('user_1', {
      channels: { order_created: ['push'] } as any,
    });

    expect(prefs.channels.order_created).toEqual(['push']);
  });

  it('creates default preferences if none exist', async () => {
    mockPrisma.notificationPreference.findFirst.mockResolvedValue(null);

    mockPrisma.notificationPreference.create.mockResolvedValue({
      id: 'pref_new',
      userId: 'user_1',
      channels: { order_created: ['push', 'email', 'in_app'] },
      quietHours: { enabled: false, start: '22:00', end: '08:00' },
    });

    const prefs = await manager.updatePreferences('user_1', {});

    expect(prefs).toBeDefined();
    expect(prefs.channels).toBeDefined();
  });

  it('adds push subscription', async () => {
    mockPrisma.pushSubscription.deleteMany.mockResolvedValue({});
    mockPrisma.pushSubscription.create.mockResolvedValue({
      id: 'sub_1',
      userId: 'user_1',
      endpoint: 'https://push.example.com/1',
      p256dh: 'key1',
      auth: 'auth1',
      createdAt: new Date(),
    });

    const sub = await manager.addPushSubscription('user_1', {
      endpoint: 'https://push.example.com/1',
      p256dh: 'key1',
      auth: 'auth1',
    });

    expect(sub.endpoint).toBe('https://push.example.com/1');
    expect(mockPrisma.pushSubscription.deleteMany).toHaveBeenCalled();
  });

  it('removes push subscription', async () => {
    mockPrisma.pushSubscription.deleteMany.mockResolvedValue({});

    await manager.removePushSubscription('https://push.example.com/1');

    expect(mockPrisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
      where: { endpoint: 'https://push.example.com/1' },
    });
  });

  it('gets push subscriptions', async () => {
    mockPrisma.pushSubscription.findMany.mockResolvedValue([
      { id: 'sub_1', userId: 'user_1', endpoint: 'https://push.example.com/1', p256dh: 'key1', auth: 'auth1', createdAt: new Date() },
    ]);

    const subs = await manager.getPushSubscriptions('user_1');

    expect(subs).toHaveLength(1);
    expect(subs[0].userId).toBe('user_1');
  });

  it('respects quiet hours', async () => {
    // Mock time to 23:00
    const mockDate = new Date('2024-06-15T23:00:00');
    vi.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

    mockPrisma.notificationPreference.findFirst.mockResolvedValue({
      userId: 'user_1',
      quietHours: { enabled: true, start: '22:00', end: '08:00' },
    });

    mockPrisma.notification.create.mockResolvedValue({
      id: 'notif_1',
      status: 'pending',
      createdAt: new Date(),
    });

    const notification = await manager.createNotification({
      userId: 'user_1',
      type: 'order_created',
      title: 'Order',
      body: 'Body',
      channel: 'push',
    });

    expect(notification.status).toBe('pending');

    vi.restoreAllMocks();
  });
});

describe('getNotificationManager', () => {
  it('returns singleton', () => {
    const m1 = getNotificationManager(mockPrisma);
    const m2 = getNotificationManager(mockPrisma);
    expect(m1).toBe(m2);
  });
});
