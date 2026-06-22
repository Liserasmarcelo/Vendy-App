import { PrismaClient } from '@prisma/client';

// ==========================================
// TICKET TYPES
// ==========================================
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'general' | 'billing' | 'technical' | 'feature_request' | 'bug';

export interface Ticket {
  id: string;
  shopId: number;
  customerId?: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: 'customer' | 'agent' | 'system';
  content: string;
  attachments?: string[];
  createdAt: Date;
}

export interface TicketFilter {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assignedTo?: string;
  shopId?: number;
  customerId?: string;
  search?: string;
}

// ==========================================
// TICKET MANAGER
// ==========================================
export class TicketManager {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Create ticket
  async createTicket(data: {
    shopId: number;
    customerId?: string;
    subject: string;
    description: string;
    priority?: TicketPriority;
    category?: TicketCategory;
  }): Promise<Ticket> {
    const ticket = await this.prisma.ticket.create({
      data: {
        shopId: data.shopId,
        customerId: data.customerId,
        subject: data.subject,
        description: data.description,
        status: 'open',
        priority: data.priority || 'medium',
        category: data.category || 'general',
      },
    });

    // Create initial system message
    await this.prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: 'system',
        senderType: 'system',
        content: `Ticket creado: ${data.subject}`,
      },
    });

    return this.mapTicket(ticket);
  }

  // Get ticket by ID
  async getTicket(ticketId: string): Promise<Ticket | null> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    return ticket ? this.mapTicket(ticket) : null;
  }

  // Get tickets with filters
  async getTickets(filters?: TicketFilter, options?: { limit?: number; offset?: number }): Promise<{ tickets: Ticket[]; total: number }> {
    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.category) where.category = filters.category;
    if (filters?.assignedTo) where.assignedTo = filters.assignedTo;
    if (filters?.shopId) where.shopId = filters.shopId;
    if (filters?.customerId) where.customerId = filters.customerId;
    if (filters?.search) {
      where.OR = [
        { subject: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        take: options?.limit,
        skip: options?.offset,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      tickets: tickets.map(this.mapTicket),
      total,
    };
  }

  // Update ticket status
  async updateStatus(ticketId: string, status: TicketStatus, agentId?: string): Promise<Ticket> {
    const updateData: any = { status };
    
    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
    }
    if (agentId) {
      updateData.assignedTo = agentId;
    }

    const ticket = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
    });

    // Add status change message
    await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId: agentId || 'system',
        senderType: agentId ? 'agent' : 'system',
        content: `Estado cambiado a: ${status}`,
      },
    });

    return this.mapTicket(ticket);
  }

  // Assign ticket
  async assignTicket(ticketId: string, agentId: string): Promise<Ticket> {
    const ticket = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { assignedTo: agentId, status: 'in_progress' },
    });

    await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId: 'system',
        senderType: 'system',
        content: `Ticket asignado a agente: ${agentId}`,
      },
    });

    return this.mapTicket(ticket);
  }

  // Add message
  async addMessage(data: {
    ticketId: string;
    senderId: string;
    senderType: 'customer' | 'agent' | 'system';
    content: string;
    attachments?: string[];
  }): Promise<TicketMessage> {
    const message = await this.prisma.ticketMessage.create({
      data: {
        ticketId: data.ticketId,
        senderId: data.senderId,
        senderType: data.senderType,
        content: data.content,
        attachments: data.attachments,
      },
    });

    // Update ticket timestamp
    await this.prisma.ticket.update({
      where: { id: data.ticketId },
      data: { updatedAt: new Date() },
    });

    return this.mapMessage(message);
  }

  // Get messages for ticket
  async getMessages(ticketId: string): Promise<TicketMessage[]> {
    const messages = await this.prisma.ticketMessage.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
    });

    return messages.map(this.mapMessage);
  }

  // Get ticket stats
  async getStats(shopId?: number): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    avgResolutionTime?: number;
  }> {
    const where = shopId ? { shopId } : {};

    const [total, open, inProgress, resolved, closed] = await Promise.all([
      this.prisma.ticket.count({ where }),
      this.prisma.ticket.count({ where: { ...where, status: 'open' } }),
      this.prisma.ticket.count({ where: { ...where, status: 'in_progress' } }),
      this.prisma.ticket.count({ where: { ...where, status: 'resolved' } }),
      this.prisma.ticket.count({ where: { ...where, status: 'closed' } }),
    ]);

    return { total, open, inProgress, resolved, closed };
  }

  // Private mappers
  private mapTicket(ticket: any): Ticket {
    return {
      id: ticket.id,
      shopId: ticket.shopId,
      customerId: ticket.customerId || undefined,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status as TicketStatus,
      priority: ticket.priority as TicketPriority,
      category: ticket.category as TicketCategory,
      assignedTo: ticket.assignedTo || undefined,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      resolvedAt: ticket.resolvedAt || undefined,
    };
  }

  private mapMessage(message: any): TicketMessage {
    return {
      id: message.id,
      ticketId: message.ticketId,
      senderId: message.senderId,
      senderType: message.senderType as TicketMessage['senderType'],
      content: message.content,
      attachments: message.attachments || undefined,
      createdAt: message.createdAt,
    };
  }
}

// Singleton
let ticketManager: TicketManager | null = null;

export function getTicketManager(prisma: PrismaClient): TicketManager {
  if (!ticketManager) {
    ticketManager = new TicketManager(prisma);
  }
  return ticketManager;
}
