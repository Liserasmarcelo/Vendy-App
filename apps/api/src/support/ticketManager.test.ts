import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TicketManager, getTicketManager } from './ticketManager';

// Mock Prisma
const mockPrisma = {
  ticket: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  ticketMessage: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
} as any;

describe('TicketManager', () => {
  let manager: TicketManager;

  beforeEach(() => {
    manager = new TicketManager(mockPrisma);
    vi.clearAllMocks();
  });

  it('creates ticket', async () => {
    mockPrisma.ticket.create.mockResolvedValue({
      id: 'ticket_1',
      shopId: 1,
      subject: 'Test ticket',
      description: 'Description',
      status: 'open',
      priority: 'medium',
      category: 'general',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const ticket = await manager.createTicket({
      shopId: 1,
      subject: 'Test ticket',
      description: 'Description',
    });

    expect(ticket.id).toBe('ticket_1');
    expect(ticket.status).toBe('open');
    expect(mockPrisma.ticketMessage.create).toHaveBeenCalled();
  });

  it('creates ticket with custom priority', async () => {
    mockPrisma.ticket.create.mockResolvedValue({
      id: 'ticket_2',
      shopId: 1,
      subject: 'Urgent issue',
      description: 'Help!',
      status: 'open',
      priority: 'urgent',
      category: 'technical',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const ticket = await manager.createTicket({
      shopId: 1,
      subject: 'Urgent issue',
      description: 'Help!',
      priority: 'urgent',
      category: 'technical',
    });

    expect(ticket.priority).toBe('urgent');
    expect(ticket.category).toBe('technical');
  });

  it('gets ticket by ID', async () => {
    mockPrisma.ticket.findUnique.mockResolvedValue({
      id: 'ticket_1',
      shopId: 1,
      subject: 'Test',
      status: 'open',
      priority: 'medium',
      category: 'general',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const ticket = await manager.getTicket('ticket_1');

    expect(ticket).toBeDefined();
    expect(ticket?.id).toBe('ticket_1');
  });

  it('returns null for unknown ticket', async () => {
    mockPrisma.ticket.findUnique.mockResolvedValue(null);

    const ticket = await manager.getTicket('unknown');

    expect(ticket).toBeNull();
  });

  it('gets tickets with filters', async () => {
    mockPrisma.ticket.findMany.mockResolvedValue([
      {
        id: 'ticket_1',
        shopId: 1,
        status: 'open',
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    mockPrisma.ticket.count.mockResolvedValue(1);

    const result = await manager.getTickets({ status: 'open', priority: 'high' });

    expect(result.tickets).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('updates ticket status', async () => {
    mockPrisma.ticket.update.mockResolvedValue({
      id: 'ticket_1',
      status: 'in_progress',
      assignedTo: 'agent_1',
      updatedAt: new Date(),
    });

    const ticket = await manager.updateStatus('ticket_1', 'in_progress', 'agent_1');

    expect(ticket.status).toBe('in_progress');
    expect(mockPrisma.ticketMessage.create).toHaveBeenCalled();
  });

  it('resolves ticket and sets resolvedAt', async () => {
    mockPrisma.ticket.update.mockResolvedValue({
      id: 'ticket_1',
      status: 'resolved',
      resolvedAt: new Date(),
      updatedAt: new Date(),
    });

    const ticket = await manager.updateStatus('ticket_1', 'resolved');

    expect(ticket.status).toBe('resolved');
    expect(ticket.resolvedAt).toBeDefined();
  });

  it('assigns ticket', async () => {
    mockPrisma.ticket.update.mockResolvedValue({
      id: 'ticket_1',
      assignedTo: 'agent_1',
      status: 'in_progress',
      updatedAt: new Date(),
    });

    const ticket = await manager.assignTicket('ticket_1', 'agent_1');

    expect(ticket.assignedTo).toBe('agent_1');
    expect(ticket.status).toBe('in_progress');
  });

  it('adds message', async () => {
    mockPrisma.ticketMessage.create.mockResolvedValue({
      id: 'msg_1',
      ticketId: 'ticket_1',
      senderId: 'user_1',
      senderType: 'customer',
      content: 'Hello',
      createdAt: new Date(),
    });

    const message = await manager.addMessage({
      ticketId: 'ticket_1',
      senderId: 'user_1',
      senderType: 'customer',
      content: 'Hello',
    });

    expect(message.content).toBe('Hello');
    expect(message.senderType).toBe('customer');
  });

  it('gets messages for ticket', async () => {
    mockPrisma.ticketMessage.findMany.mockResolvedValue([
      {
        id: 'msg_1',
        ticketId: 'ticket_1',
        senderId: 'system',
        senderType: 'system',
        content: 'Ticket created',
        createdAt: new Date(),
      },
      {
        id: 'msg_2',
        ticketId: 'ticket_1',
        senderId: 'user_1',
        senderType: 'customer',
        content: 'Hello',
        createdAt: new Date(),
      },
    ]);

    const messages = await manager.getMessages('ticket_1');

    expect(messages).toHaveLength(2);
    expect(messages[0].senderType).toBe('system');
  });

  it('gets stats', async () => {
    mockPrisma.ticket.count.mockResolvedValueOnce(10); // total
    mockPrisma.ticket.count.mockResolvedValueOnce(3);  // open
    mockPrisma.ticket.count.mockResolvedValueOnce(4);  // in_progress
    mockPrisma.ticket.count.mockResolvedValueOnce(2);  // resolved
    mockPrisma.ticket.count.mockResolvedValueOnce(1);  // closed

    const stats = await manager.getStats();

    expect(stats.total).toBe(10);
    expect(stats.open).toBe(3);
    expect(stats.inProgress).toBe(4);
    expect(stats.resolved).toBe(2);
    expect(stats.closed).toBe(1);
  });

  it('searches tickets', async () => {
    mockPrisma.ticket.findMany.mockResolvedValue([
      {
        id: 'ticket_1',
        subject: 'Payment issue',
        description: 'Cannot pay',
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    mockPrisma.ticket.count.mockResolvedValue(1);

    const result = await manager.getTickets({ search: 'payment' });

    expect(result.tickets).toHaveLength(1);
  });
});

describe('getTicketManager', () => {
  it('returns singleton', () => {
    const m1 = getTicketManager(mockPrisma);
    const m2 = getTicketManager(mockPrisma);
    expect(m1).toBe(m2);
  });
});
