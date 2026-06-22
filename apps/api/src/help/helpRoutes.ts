import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { getHelpManager } from './helpManager';

// ==========================================
// HELP ROUTES
// ==========================================
export async function registerHelpRoutes(fastify: FastifyInstance, prisma: PrismaClient) {
  const manager = getHelpManager(prisma);

  // Get categories
  fastify.get('/help/categories', async (request: FastifyRequest, reply: FastifyReply) => {
    const categories = await manager.getCategories();
    reply.send({ categories });
  });

  // Get articles
  fastify.get('/help/articles', async (request: FastifyRequest, reply: FastifyReply) => {
    const { category, limit, offset } = request.query as any;

    const result = await manager.getArticles({
      category,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    reply.send(result);
  });

  // Get article by ID
  fastify.get('/help/articles/:articleId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { articleId } = request.params as { articleId: string };

    const article = await manager.getArticle(articleId);
    if (!article) {
      return reply.status(404).send({ error: 'Article not found' });
    }

    reply.send(article);
  });

  // Create article (admin only)
  fastify.post('/help/articles', async (request: FastifyRequest, reply: FastifyReply) => {
    const { title, content, category, tags } = request.body as any;

    try {
      const article = await manager.createArticle({ title, content, category, tags });
      reply.status(201).send(article);
    } catch (error) {
      reply.status(400).send({
        error: 'Failed to create article',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Update article (admin only)
  fastify.patch('/help/articles/:articleId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { articleId } = request.params as { articleId: string };
    const data = request.body as any;

    try {
      const article = await manager.updateArticle(articleId, data);
      reply.send(article);
    } catch (error) {
      reply.status(400).send({
        error: 'Failed to update article',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Delete article (admin only)
  fastify.delete('/help/articles/:articleId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { articleId } = request.params as { articleId: string };

    try {
      await manager.deleteArticle(articleId);
      reply.send({ success: true });
    } catch (error) {
      reply.status(400).send({
        error: 'Failed to delete article',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Article feedback
  fastify.post('/help/articles/:articleId/feedback', async (request: FastifyRequest, reply: FastifyReply) => {
    const { articleId } = request.params as { articleId: string };
    const { helpful } = request.body as { helpful: boolean };

    try {
      const article = await manager.addFeedback(articleId, helpful);
      reply.send(article);
    } catch (error) {
      reply.status(400).send({
        error: 'Failed to add feedback',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get FAQs
  fastify.get('/help/faqs', async (request: FastifyRequest, reply: FastifyReply) => {
    const { category, limit } = request.query as any;

    const result = await manager.getFAQs({
      category,
      limit: limit ? parseInt(limit) : undefined,
    });

    reply.send(result);
  });

  // Create FAQ (admin only)
  fastify.post('/help/faqs', async (request: FastifyRequest, reply: FastifyReply) => {
    const { question, answer, category } = request.body as any;

    try {
      const faq = await manager.createFAQ({ question, answer, category });
      reply.status(201).send(faq);
    } catch (error) {
      reply.status(400).send({
        error: 'Failed to create FAQ',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // FAQ feedback
  fastify.post('/help/faqs/:faqId/feedback', async (request: FastifyRequest, reply: FastifyReply) => {
    const { faqId } = request.params as { faqId: string };
    const { helpful } = request.body as { helpful: boolean };

    try {
      const faq = await manager.addFAQFeedback(faqId, helpful);
      reply.send(faq);
    } catch (error) {
      reply.status(400).send({
        error: 'Failed to add feedback',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Search
  fastify.get('/help/search', async (request: FastifyRequest, reply: FastifyReply) => {
    const { q } = request.query as { q: string };

    if (!q || q.length < 2) {
      return reply.status(400).send({ error: 'Search query must be at least 2 characters' });
    }

    const results = await manager.search(q);
    reply.send(results);
  });

  // Popular articles
  fastify.get('/help/popular', async (request: FastifyRequest, reply: FastifyReply) => {
    const { limit } = request.query as any;

    const articles = await manager.getPopularArticles(limit ? parseInt(limit) : undefined);
    reply.send({ articles });
  });
}
