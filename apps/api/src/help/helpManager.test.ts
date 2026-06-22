import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HelpManager, getHelpManager } from './helpManager';

// Mock Prisma
const mockPrisma = {
  helpCategory: {
    findMany: vi.fn(),
  },
  helpArticle: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  fAQ: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
} as any;

describe('HelpManager', () => {
  let manager: HelpManager;

  beforeEach(() => {
    manager = new HelpManager(mockPrisma);
    vi.clearAllMocks();
  });

  it('gets categories', async () => {
    mockPrisma.helpCategory.findMany.mockResolvedValue([
      { id: 'cat1', name: 'Getting Started', description: 'Start here', icon: '🚀', order: 1, _count: { articles: 5 } },
      { id: 'cat2', name: 'Billing', description: 'Payments', icon: '💳', order: 2, _count: { articles: 3 } },
    ]);

    const categories = await manager.getCategories();

    expect(categories).toHaveLength(2);
    expect(categories[0].name).toBe('Getting Started');
    expect(categories[0].articleCount).toBe(5);
  });

  it('gets articles', async () => {
    mockPrisma.helpArticle.findMany.mockResolvedValue([
      { id: 'a1', title: 'How to start', content: 'Content...', category: 'getting-started', tags: ['start'], viewCount: 100, helpfulCount: 10, isPublished: true, createdAt: new Date(), updatedAt: new Date() },
    ]);
    mockPrisma.helpArticle.count.mockResolvedValue(1);

    const result = await manager.getArticles();

    expect(result.articles).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('gets article by ID and increments views', async () => {
    mockPrisma.helpArticle.findUnique.mockResolvedValue({
      id: 'a1', title: 'Article', content: 'Content', category: 'general', viewCount: 5, helpfulCount: 2, isPublished: true, createdAt: new Date(), updatedAt: new Date(),
    });

    const article = await manager.getArticle('a1');

    expect(article).toBeDefined();
    expect(article?.viewCount).toBe(6);
    expect(mockPrisma.helpArticle.update).toHaveBeenCalled();
  });

  it('returns null for unknown article', async () => {
    mockPrisma.helpArticle.findUnique.mockResolvedValue(null);

    const article = await manager.getArticle('unknown');

    expect(article).toBeNull();
  });

  it('creates article', async () => {
    mockPrisma.helpArticle.create.mockResolvedValue({
      id: 'a2', title: 'New Article', content: 'New content', category: 'general', tags: ['new'], helpfulCount: 0, notHelpfulCount: 0, viewCount: 0, isPublished: true, createdAt: new Date(), updatedAt: new Date(),
    });

    const article = await manager.createArticle({
      title: 'New Article',
      content: 'New content',
      category: 'general',
      tags: ['new'],
    });

    expect(article.title).toBe('New Article');
    expect(article.tags).toContain('new');
  });

  it('updates article', async () => {
    mockPrisma.helpArticle.update.mockResolvedValue({
      id: 'a1', title: 'Updated', content: 'Updated content', category: 'general', tags: [], helpfulCount: 0, notHelpfulCount: 0, viewCount: 0, isPublished: true, createdAt: new Date(), updatedAt: new Date(),
    });

    const article = await manager.updateArticle('a1', { title: 'Updated' });

    expect(article.title).toBe('Updated');
  });

  it('deletes article', async () => {
    mockPrisma.helpArticle.delete.mockResolvedValue({});

    await manager.deleteArticle('a1');

    expect(mockPrisma.helpArticle.delete).toHaveBeenCalledWith({ where: { id: 'a1' } });
  });

  it('adds helpful feedback', async () => {
    mockPrisma.helpArticle.update.mockResolvedValue({
      id: 'a1', title: 'Article', helpfulCount: 11, notHelpfulCount: 2, viewCount: 0, isPublished: true, createdAt: new Date(), updatedAt: new Date(),
    });

    const article = await manager.addFeedback('a1', true);

    expect(article.helpfulCount).toBe(11);
  });

  it('adds not helpful feedback', async () => {
    mockPrisma.helpArticle.update.mockResolvedValue({
      id: 'a1', title: 'Article', helpfulCount: 10, notHelpfulCount: 3, viewCount: 0, isPublished: true, createdAt: new Date(), updatedAt: new Date(),
    });

    const article = await manager.addFeedback('a1', false);

    expect(article.notHelpfulCount).toBe(3);
  });

  it('gets FAQs', async () => {
    mockPrisma.fAQ.findMany.mockResolvedValue([
      { id: 'f1', question: 'How do I start?', answer: 'Just click start', category: 'getting-started', helpfulCount: 50, notHelpfulCount: 2, isPublished: true, createdAt: new Date() },
    ]);
    mockPrisma.fAQ.count.mockResolvedValue(1);

    const result = await manager.getFAQs();

    expect(result.faqs).toHaveLength(1);
    expect(result.faqs[0].question).toBe('How do I start?');
  });

  it('creates FAQ', async () => {
    mockPrisma.fAQ.create.mockResolvedValue({
      id: 'f2', question: 'What is Vendy?', answer: 'A platform', category: 'general', helpfulCount: 0, notHelpfulCount: 0, isPublished: true, createdAt: new Date(),
    });

    const faq = await manager.createFAQ({
      question: 'What is Vendy?',
      answer: 'A platform',
      category: 'general',
    });

    expect(faq.question).toBe('What is Vendy?');
  });

  it('searches articles and FAQs', async () => {
    mockPrisma.helpArticle.findMany.mockResolvedValue([
      { id: 'a1', title: 'Payment guide', content: 'How to pay', category: 'billing', tags: ['payment'], viewCount: 50, helpfulCount: 10, isPublished: true, createdAt: new Date(), updatedAt: new Date() },
    ]);
    mockPrisma.fAQ.findMany.mockResolvedValue([
      { id: 'f1', question: 'How to pay?', answer: 'Use card', category: 'billing', helpfulCount: 30, notHelpfulCount: 1, isPublished: true, createdAt: new Date() },
    ]);

    const results = await manager.search('payment');

    expect(results.total).toBe(2);
    expect(results.articles).toHaveLength(1);
    expect(results.faqs).toHaveLength(1);
  });

  it('gets popular articles', async () => {
    mockPrisma.helpArticle.findMany.mockResolvedValue([
      { id: 'a1', title: 'Most viewed', content: '...', category: 'general', viewCount: 1000, helpfulCount: 100, isPublished: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'a2', title: 'Second', content: '...', category: 'general', viewCount: 500, helpfulCount: 50, isPublished: true, createdAt: new Date(), updatedAt: new Date() },
    ]);

    const articles = await manager.getPopularArticles(5);

    expect(articles).toHaveLength(2);
    expect(articles[0].viewCount).toBe(1000);
  });
});

describe('getHelpManager', () => {
  it('returns singleton', () => {
    const m1 = getHelpManager(mockPrisma);
    const m2 = getHelpManager(mockPrisma);
    expect(m1).toBe(m2);
  });
});
