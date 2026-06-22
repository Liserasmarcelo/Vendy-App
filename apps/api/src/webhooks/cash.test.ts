import { describe, it, expect, vi } from 'vitest';
import { cashOnDeliveryHandler, cashConfirmedHandler, cashDeliveredHandler } from './cash';

describe('cashOnDeliveryHandler', () => {
  const mockReply = () => {
    const status = vi.fn().mockReturnThis();
    const send = vi.fn().mockReturnThis();
    return { status, send } as any;
  };

  it('processes cash on delivery request', async () => {
    const reply = mockReply();
    await cashOnDeliveryHandler(
      {
        body: {
          orderId: 1,
          shopId: 1,
          customerTelegramId: 123456,
          deliveryAddress: 'Av. España 1234',
          preferredDate: '2024-06-20',
          preferredTime: '14:00-18:00',
        },
      } as any,
      reply
    );
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

describe('cashConfirmedHandler', () => {
  const mockReply = () => {
    const status = vi.fn().mockReturnThis();
    const send = vi.fn().mockReturnThis();
    return { status, send } as any;
  };

  it('confirms cash order', async () => {
    const reply = mockReply();
    await cashConfirmedHandler(
      {
        body: {
          orderId: 1,
          shopId: 1,
          confirmed: true,
          adminId: 1,
          deliveryFee: 5,
        },
      } as any,
      reply
    );
    expect(reply.status).toHaveBeenCalledWith(200);
  });

  it('rejects cash order', async () => {
    const reply = mockReply();
    await cashConfirmedHandler(
      {
        body: {
          orderId: 1,
          shopId: 1,
          confirmed: false,
          adminId: 1,
          notes: 'Zona no cubierta',
        },
      } as any,
      reply
    );
    expect(reply.status).toHaveBeenCalledWith(200);
  });
});

describe('cashDeliveredHandler', () => {
  const mockReply = () => {
    const status = vi.fn().mockReturnThis();
    const send = vi.fn().mockReturnThis();
    return { status, send } as any;
  };

  it('marks order as delivered', async () => {
    const reply = mockReply();
    await cashDeliveredHandler(
      {
        body: {
          orderId: 1,
          shopId: 1,
          deliveredBy: 'Juan Delivery',
          deliveredAt: '2024-06-20T15:30:00Z',
        },
      } as any,
      reply
    );
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({ success: true });
  });
});
