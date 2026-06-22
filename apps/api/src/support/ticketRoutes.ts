import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { getTicketManager } from './ticketManager';

// ==========================================
// TICKET ROUTES
// ==========================================
export async function registerTicketRoutes(fastify: FastifyInstance, prisma: PrismaClient) {
  const manager = getTicketManager(prisma);

  // Create ticket
  fastify.post('/tickets', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shopId, customerId, subject, description, priority, category } = request.body as any;

    try {
      const ticket = await manager.createTicket({
        shopId: parseInt(shopId),
        customerId,
        subject,
        description,
        priority,
        category,
      });

      reply.status(201).send(ticket);
    } catch (error) {
      reply.status(400).send({
        error: 'Failed to create ticket',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get tickets
  fastify.get('/tickets', async (request: FastifyRequest, reply: FastifyReply) => {
    const { status, priority, category, assignedTo, shopId, customerId, search, limit, offset } = request.query as any;

    const result = await manager.getTickets(
      {
        status,
        priority,
        category,
        assignedTo,
        shopId: shopId ? parseInt(shopId) : undefined,
        customerId,
        search,
      },
      {
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      }
    );

    reply.send(result);
  });

  // Get ticket by ID
  fastify.get('/tickets/:ticketId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { ticketId } = request.params as { ticketId: string };

    const ticket = await manager.getTicket(ticketId);
    if (!ticket) {
      return reply.status(404).send({ error: 'Ticket not found' });
    }

    reply.send(ticket);
  });

  // Update ticket status
  fastify.patch('/tickets/:ticketId/status', async (request: FastifyRequest, reply: FastifyReply) => {
    const { ticketId } = request.params as { ticketId: string };
    const { status, agentId } = request.body as any;

    try {
      const ticket = await manager.updateStatus(ticketId, status, agentId);
      reply.send(ticket);
    } catch (error) {
      reply.status(400).send({
        error: 'Failed to update status',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Assign ticket
  fastify.post('/tickets/:ticketId/assign', async (request: FastifyRequest, reply: FastifyReply) => {
    const { ticketId } = request.params as { ticketId: string };
    const { agentId } = request.body as { agentId: string };

    try {
      const ticket = await manager.assignTicket(ticketId, agentId);
      reply.send(ticket);
    } catch (error) {
      reply.status(400).send({
        error: 'Failed to assign ticket',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Add message
  fastify.post('/tickets/:ticketId/messages', async (request: FastifyRequest, reply: FastifyReply) => {
    const { ticketId } = request.params as { ticketId: string };
    const { senderId, senderType, content, attachments } = request.body as any;

    try {
      const message = await manager.addMessage({
        ticketId,
        senderId,
        senderType,
        content,
        attachments,
      });

      reply.status(201).send(message);
    } catch (error) {
      reply.status(400).send({
        error: 'Failed to add message',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get messages
  fastify.get('/tickets/:ticketId/messages', async (request: FastifyRequest, reply: FastifyReply) => {
    const { ticketId } = request.params as { ticketId: string };

    const messages = await manager.getMessages(ticketId);
    reply.send({ messages });
  });

  // Get stats
  fastify.get('/tickets/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    const { shopId } = request.query as any;

    const stats = await manager.getStats(shopId ? parseInt(shopId) : undefined);
    reply.send(stats);
  });
}
