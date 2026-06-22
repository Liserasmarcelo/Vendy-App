import { PrismaClient } from '@prisma/client';

// ==========================================
// HELP ARTICLE TYPES
// ==========================================
export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  helpfulCount: number;
  notHelpfulCount: number;
  viewCount: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface HelpCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  order: number;
  articleCount: number;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpfulCount: number;
  notHelpfulCount: number;
  isPublished: boolean;
  createdAt: Date;
}

export interface SearchResult {
  articles: HelpArticle[];
  faqs: FAQ[];
  total: number;
}

// ==========================================
// HELP MANAGER
// ==========================================
export class HelpManager {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Categories
  async getCategories(): Promise<HelpCategory[]> {
    const categories = await this.prisma.helpCategory.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    return categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      icon: cat.icon,
      order: cat.order,
      articleCount: cat._count.articles,
    }));
  }

  // Articles
  async getArticles(options?: {
    category?: string;
    limit?: number;
    offset?: number;
    publishedOnly?: boolean;
  }): Promise<{ articles: HelpArticle[]; total: number }> {
    const where: any = {};
    if (options?.category) where.category = options.category;
    if (options?.publishedOnly !== false) where.isPublished = true;

    const [articles, total] = await Promise.all([
      this.prisma.helpArticle.findMany({
        where,
        orderBy: { viewCount: 'desc' },
        take: options?.limit,
        skip: options?.offset,
      }),
      this.prisma.helpArticle.count({ where }),
    ]);

    return {
      articles: articles.map(this.mapArticle),
      total,
    };
  }

  async getArticle(articleId: string): Promise<HelpArticle | null> {
    const article = await this.prisma.helpArticle.findUnique({
      where: { id: articleId },
    });

    if (!article) return null;

    // Increment view count
    await this.prisma.helpArticle.update({
      where: { id: articleId },
      data: { viewCount: { increment: 1 } },
    });

    return this.mapArticle({ ...article, viewCount: article.viewCount + 1 });
  }

  async createArticle(data: {
    title: string;
    content: string;
    category: string;
    tags?: string[];
  }): Promise<HelpArticle> {
    const article = await this.prisma.helpArticle.create({
      data: {
        title: data.title,
        content: data.content,
        category: data.category,
        tags: data.tags || [],
        helpfulCount: 0,
        notHelpfulCount: 0,
        viewCount: 0,
        isPublished: true,
      },
    });

    return this.mapArticle(article);
  }

  async updateArticle(articleId: string, data: Partial<HelpArticle>): Promise<HelpArticle> {
    const article = await this.prisma.helpArticle.update({
      where: { id: articleId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.content && { content: data.content }),
        ...(data.category && { category: data.category }),
        ...(data.tags && { tags: data.tags }),
        ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
      },
    });

    return this.mapArticle(article);
  }

  async deleteArticle(articleId: string): Promise<void> {
    await this.prisma.helpArticle.delete({
      where: { id: articleId },
    });
  }

  // Feedback
  async addFeedback(articleId: string, helpful: boolean): Promise<HelpArticle> {
    const article = await this.prisma.helpArticle.update({
      where: { id: articleId },
      data: {
        helpfulCount: helpful ? { increment: 1 } : undefined,
        notHelpfulCount: !helpful ? { increment: 1 } : undefined,
      },
    });

    return this.mapArticle(article);
  }

  // FAQs
  async getFAQs(options?: {
    category?: string;
    limit?: number;
    publishedOnly?: boolean;
  }): Promise<{ faqs: FAQ[]; total: number }> {
    const where: any = {};
    if (options?.category) where.category = options.category;
    if (options?.publishedOnly !== false) where.isPublished = true;

    const [faqs, total] = await Promise.all([
      this.prisma.fAQ.findMany({
        where,
        orderBy: { helpfulCount: 'desc' },
        take: options?.limit,
      }),
      this.prisma.fAQ.count({ where }),
    ]);

    return {
      faqs: faqs.map(this.mapFAQ),
      total,
    };
  }

  async createFAQ(data: {
    question: string;
    answer: string;
    category: string;
  }): Promise<FAQ> {
    const faq = await this.prisma.fAQ.create({
      data: {
        question: data.question,
        answer: data.answer,
        category: data.category,
        helpfulCount: 0,
        notHelpfulCount: 0,
        isPublished: true,
      },
    });

    return this.mapFAQ(faq);
  }

  async addFAQFeedback(faqId: string, helpful: boolean): Promise<FAQ> {
    const faq = await this.prisma.fAQ.update({
      where: { id: faqId },
      data: {
        helpfulCount: helpful ? { increment: 1 } : undefined,
        notHelpfulCount: !helpful ? { increment: 1 } : undefined,
      },
    });

    return this.mapFAQ(faq);
  }

  // Search
  async search(query: string): Promise<SearchResult> {
    const searchTerm = query.toLowerCase();

    const [articles, faqs] = await Promise.all([
      this.prisma.helpArticle.findMany({
        where: {
          isPublished: true,
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { content: { contains: searchTerm, mode: 'insensitive' } },
            { tags: { has: searchTerm } },
          ],
        },
        orderBy: { viewCount: 'desc' },
        take: 10,
      }),
      this.prisma.fAQ.findMany({
        where: {
          isPublished: true,
          OR: [
            { question: { contains: searchTerm, mode: 'insensitive' } },
            { answer: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        orderBy: { helpfulCount: 'desc' },
        take: 10,
      }),
    ]);

    return {
      articles: articles.map(this.mapArticle),
      faqs: faqs.map(this.mapFAQ),
      total: articles.length + faqs.length,
    };
  }

  // Popular articles
  async getPopularArticles(limit: number = 5): Promise<HelpArticle[]> {
    const articles = await this.prisma.helpArticle.findMany({
      where: { isPublished: true },
      orderBy: { viewCount: 'desc' },
      take: limit,
    });

    return articles.map(this.mapArticle);
  }

  // Private mappers
  private mapArticle(article: any): HelpArticle {
    return {
      id: article.id,
      title: article.title,
      content: article.content,
      category: article.category,
      tags: article.tags || [],
      helpfulCount: article.helpfulCount || 0,
      notHelpfulCount: article.notHelpfulCount || 0,
      viewCount: article.viewCount || 0,
      isPublished: article.isPublished,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    };
  }

  private mapFAQ(faq: any): FAQ {
    return {
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      helpfulCount: faq.helpfulCount || 0,
      notHelpfulCount: faq.notHelpfulCount || 0,
      isPublished: faq.isPublished,
      createdAt: faq.createdAt,
    };
  }
}

// Singleton
let helpManager: HelpManager | null = null;

export function getHelpManager(prisma: PrismaClient): HelpManager {
  if (!helpManager) {
    helpManager = new HelpManager(prisma);
  }
  return helpManager;
}
