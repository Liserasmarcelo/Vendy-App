import { useState, useCallback } from 'react';

// ==========================================
// HELP TYPES
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
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpfulCount: number;
  notHelpfulCount: number;
}

export interface HelpCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  articleCount: number;
}

// ==========================================
// HELP HOOK
// ==========================================
export function useHelp() {
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [searchResults, setSearchResults] = useState<{ articles: HelpArticle[]; faqs: FAQ[]; total: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/help/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchArticles = useCallback(async (category?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);

      const response = await fetch(`/api/help/articles?${params}`);
      const data = await response.json();
      setArticles(data.articles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch articles');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchFAQs = useCallback(async (category?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);

      const response = await fetch(`/api/help/faqs?${params}`);
      const data = await response.json();
      setFaqs(data.faqs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch FAQs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const search = useCallback(async (query: string) => {
    if (query.length < 2) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/help/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addFeedback = useCallback(async (articleId: string, helpful: boolean) => {
    try {
      await fetch(`/api/help/articles/${articleId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helpful }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add feedback');
    }
  }, []);

  const addFAQFeedback = useCallback(async (faqId: string, helpful: boolean) => {
    try {
      await fetch(`/api/help/faqs/${faqId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helpful }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add feedback');
    }
  }, []);

  return {
    categories,
    articles,
    faqs,
    searchResults,
    isLoading,
    error,
    fetchCategories,
    fetchArticles,
    fetchFAQs,
    search,
    addFeedback,
    addFAQFeedback,
  };
}
