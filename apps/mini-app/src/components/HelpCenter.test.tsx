import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HelpCenter } from './HelpCenter';

vi.mock('../hooks/useHelp', () => ({
  useHelp: vi.fn().mockReturnValue({
    categories: [
      { id: 'cat1', name: 'Getting Started', icon: '🚀', articleCount: 5 },
      { id: 'cat2', name: 'Billing', icon: '💳', articleCount: 3 },
    ],
    articles: [
      { id: 'a1', title: 'How to start', content: 'Start here', category: 'cat1', tags: ['start'], viewCount: 100, helpfulCount: 10 },
      { id: 'a2', title: 'Payment guide', content: 'Pay here', category: 'cat2', tags: ['payment'], viewCount: 50, helpfulCount: 5 },
    ],
    faqs: [
      { id: 'f1', question: 'How do I start?', answer: 'Click start', category: 'cat1', helpfulCount: 20 },
      { id: 'f2', question: 'How to pay?', answer: 'Use card', category: 'cat2', helpfulCount: 15 },
    ],
    searchResults: null,
    isLoading: false,
    fetchCategories: vi.fn(),
    fetchArticles: vi.fn(),
    fetchFAQs: vi.fn(),
    search: vi.fn(),
    addFeedback: vi.fn(),
    addFAQFeedback: vi.fn(),
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: vi.fn((key: string) => key),
  }),
}));

describe('HelpCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders help center', () => {
    render(<HelpCenter />);
    
    expect(screen.getByText('📚 title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Buscar ayuda...')).toBeInTheDocument();
  });

  it('shows categories', () => {
    render(<HelpCenter />);
    
    expect(screen.getByText('🚀 Getting Started')).toBeInTheDocument();
    expect(screen.getByText('💳 Billing')).toBeInTheDocument();
  });

  it('shows articles by default', () => {
    render(<HelpCenter />);
    
    expect(screen.getByText('How to start')).toBeInTheDocument();
    expect(screen.getByText('Payment guide')).toBeInTheDocument();
  });

  it('switches to FAQ tab', () => {
    render(<HelpCenter />);
    
    const faqTab = screen.getByText('❓ FAQs');
    fireEvent.click(faqTab);
    
    expect(screen.getByText('How do I start?')).toBeInTheDocument();
    expect(screen.getByText('How to pay?')).toBeInTheDocument();
  });

  it('expands FAQ on click', () => {
    render(<HelpCenter />);
    
    const faqTab = screen.getByText('❓ FAQs');
    fireEvent.click(faqTab);
    
    const question = screen.getByText('How do I start?');
    fireEvent.click(question);
    
    expect(screen.getByText('Click start')).toBeInTheDocument();
  });

  it('filters by category', () => {
    render(<HelpCenter />);
    
    const categoryBtn = screen.getByText('🚀 Getting Started');
    fireEvent.click(categoryBtn);
    
    // Should show articles from that category
    expect(screen.getByText('How to start')).toBeInTheDocument();
  });

  it('searches on input', async () => {
    const mockSearch = vi.fn();
    vi.mocked(require('../hooks/useHelp').useHelp).mockReturnValueOnce({
      categories: [],
      articles: [],
      faqs: [],
      searchResults: null,
      isLoading: false,
      fetchCategories: vi.fn(),
      fetchArticles: vi.fn(),
      fetchFAQs: vi.fn(),
      search: mockSearch,
    });

    render(<HelpCenter />);
    
    const input = screen.getByPlaceholderText('Buscar ayuda...');
    fireEvent.change(input, { target: { value: 'payment' } });
    
    await waitFor(() => {
      expect(mockSearch).toHaveBeenCalledWith('payment');
    }, { timeout: 500 });
  });

  it('shows article view on click', () => {
    render(<HelpCenter />);
    
    const article = screen.getByText('How to start');
    fireEvent.click(article);
    
    expect(screen.getByText('← Volver')).toBeInTheDocument();
    expect(screen.getByText('How to start')).toBeInTheDocument();
  });

  it('shows article feedback buttons', () => {
    render(<HelpCenter />);
    
    const article = screen.getByText('How to start');
    fireEvent.click(article);
    
    expect(screen.getByText('¿Te fue útil este artículo?')).toBeInTheDocument();
    expect(screen.getByText('👍 Sí')).toBeInTheDocument();
    expect(screen.getByText('👎 No')).toBeInTheDocument();
  });

  it('shows FAQ feedback buttons', () => {
    render(<HelpCenter />);
    
    const faqTab = screen.getByText('❓ FAQs');
    fireEvent.click(faqTab);
    
    const question = screen.getByText('How do I start?');
    fireEvent.click(question);
    
    expect(screen.getByText('¿Te fue útil?')).toBeInTheDocument();
  });
});
