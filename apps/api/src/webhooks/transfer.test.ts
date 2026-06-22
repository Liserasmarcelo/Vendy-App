import { describe, it, expect, vi } from 'vitest';
import { transferSubmittedHandler, transferConfirmedHandler } from './transfer';

describe('transferSubmittedHandler', () => {
  const mockReply = () => {
    const status = vi.fn().mockReturnThis();
    const send = vi.fn().mockReturnThis();
    return { status, send } as any;
  };

  it('processes transfer submission', async () => {
    const reply = mockReply();
    await transferSubmittedHandler(
      {
        body: {
          orderId: 1,
          shopId: 1,
          transferReference: 'TRF-123',
          bankName: 'Itaú',
          amount: 100,
          currency: 'USD',
          customerTelegramId: 123456,
        },
      } as any,
      reply
    );
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('handles missing customer telegram id', async () => {
    const reply = mockReply();
    await transferSubmittedHandler(
      {
        body: {
          orderId: 1,
          shopId: 1,
          transferReference: 'TRF-123',
          bankName: 'Itaú',
          amount: 100,
          currency: 'USD',
        },
      } as any,
      reply
    );
    expect(reply.status).toHaveBeenCalledWith(200);
  });
});

describe('transferConfirmedHandler', () => {
  const mockReply = () => {
    const status = vi.fn().mockReturnThis();
    const send = vi.fn().mockReturnThis();
    return { status, send } as any;
  };

  it('confirms transfer', async () => {
    const reply = mockReply();
    await transferConfirmedHandler(
      {
        body: {
          orderId: 1,
          shopId: 1,
          confirmed: true,
          adminId: 1,
        },
      } as any,
      reply
    );
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({ success: true });
  });

  it('rejects transfer', async () => {
    const reply = mockReply();
    await transferConfirmedHandler(
      {
        body: {
          orderId: 1,
          shopId: 1,
          confirmed: false,
          adminId: 1,
          notes: 'Transferencia no recibida',
        },
      } as any,
      reply
    );
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({ success: true });
  });
});
