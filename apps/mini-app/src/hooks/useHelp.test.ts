import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useHelp } from './useHelp';

// Mock fetch
global.fetch = vi.fn();

describe('useHelp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches categories', async () => {
    const mockData = {
      categories: [
        { id: 'cat1', name: 'Getting Started', icon: '🚀', articleCount: 5 },
        { id: 'cat2', name: 'Billing', icon: '💳', articleCount: 3 },
      ],
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response);

    const { result } = renderHook(() => useHelp());

    await act(async () => {
      await result.current.fetchCategories();
    });

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(2);
      expect(result.current.categories[0].name).toBe('Getting Started');
    });
  });

  it('fetches articles', async () => {
    const mockData = {
      articles: [
        { id: 'a1', title: 'How to start', content: 'Content', category: 'getting-started', viewCount: 100 },
      ],
      total: 1,
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response);

    const { result } = renderHook(() => useHelp());

    await act(async () => {
      await result.current.fetchArticles('getting-started');
    });

    await waitFor(() => {
      expect(result.current.articles).toHaveLength(1);
    });
  });

  it('fetches FAQs', async () => {
    const mockData = {
      faqs: [
        { id: 'f1', question: 'How do I start?', answer: 'Click start', category: 'getting-started' },
      ],
      total: 1,
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response);

    const { result } = renderHook(() => useHelp());

    await act(async () => {
      await result.current.fetchFAQs();
    });

    await waitFor(() => {
      expect(result.current.faqs).toHaveLength(1);
    });
  });

  it('searches help content', async () => {
    const mockData = {
      articles: [{ id: 'a1', title: 'Payment guide', content: 'How to pay' }],
      faqs: [{ id: 'f1', question: 'How to pay?', answer: 'Use card' }],
      total: 2,
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response);

    const { result } = renderHook(() => useHelp());

    await act(async () => {
      await result.current.search('payment');
    });

    await waitFor(() => {
      expect(result.current.searchResults?.total).toBe(2);
    });
  });

  it('adds article feedback', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response);

    const { result } = renderHook(() => useHelp());

    await act(async () => {
      await result.current.addFeedback('a1', true);
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/help/articles/a1/feedback',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('adds FAQ feedback', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response);

    const { result } = renderHook(() => useHelp());

    await act(async () => {
      await result.current.addFAQFeedback('f1', false);
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/help/faqs/f1/feedback',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('handles errors', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useHelp());

    await act(async () => {
      await result.current.fetchCategories();
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });
});
