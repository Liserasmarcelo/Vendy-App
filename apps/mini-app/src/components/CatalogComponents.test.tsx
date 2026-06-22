import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductSkeleton from './ProductSkeleton';
import FilterDrawer from './FilterDrawer';
import InfiniteScroll from './InfiniteScroll';

// Mock Telegram context
vi.mock('../context/TelegramContext', () => ({
  useTelegram: () => ({
    haptic: { impact: vi.fn() },
  }),
}));

describe('ProductSkeleton', () => {
  it('renders skeleton elements', () => {
    render(<ProductSkeleton />);
    expect(document.querySelector('.animate-pulse')).toBeTruthy();
  });
});

describe('FilterDrawer', () => {
  it('does not render when closed', () => {
    render(
      <FilterDrawer
        isOpen={false}
        onClose={vi.fn()}
        filters={{}}
        onApply={vi.fn()}
        currency="USD"
      />
    );
    expect(screen.queryByText('Filtros')).toBeNull();
  });

  it('renders when open', () => {
    render(
      <FilterDrawer
        isOpen={true}
        onClose={vi.fn()}
        filters={{}}
        onApply={vi.fn()}
        currency="USD"
      />
    );
    expect(screen.getByText('Filtros')).toBeTruthy();
  });

  it('shows sort options', () => {
    render(
      <FilterDrawer
        isOpen={true}
        onClose={vi.fn()}
        filters={{}}
        onApply={vi.fn()}
        currency="USD"
      />
    );
    expect(screen.getByText('💰 Menor USD')).toBeTruthy();
    expect(screen.getByText('💰 Mayor USD')).toBeTruthy();
    expect(screen.getByText('📝 Nombre')).toBeTruthy();
    expect(screen.getByText('🆕 Nuevos')).toBeTruthy();
  });

  it('shows price range inputs', () => {
    render(
      <FilterDrawer
        isOpen={true}
        onClose={vi.fn()}
        filters={{}}
        onApply={vi.fn()}
        currency="USD"
      />
    );
    expect(screen.getByPlaceholderText('Min')).toBeTruthy();
    expect(screen.getByPlaceholderText('Max')).toBeTruthy();
  });

  it('shows stock filter', () => {
    render(
      <FilterDrawer
        isOpen={true}
        onClose={vi.fn()}
        filters={{}}
        onApply={vi.fn()}
        currency="USD"
      />
    );
    expect(screen.getByText('Solo productos en stock')).toBeTruthy();
  });

  it('calls onApply when apply button clicked', () => {
    const onApply = vi.fn();
    render(
      <FilterDrawer
        isOpen={true}
        onClose={vi.fn()}
        filters={{}}
        onApply={onApply}
        currency="USD"
      />
    );
    
    fireEvent.click(screen.getByText('Aplicar'));
    expect(onApply).toHaveBeenCalled();
  });
});

describe('InfiniteScroll', () => {
  it('renders children', () => {
    render(
      <InfiniteScroll onLoadMore={vi.fn()} hasMore={false} isLoading={false}>
        <div data-testid="child">Content</div>
      </InfiniteScroll>
    );
    expect(screen.getByTestId('child')).toBeTruthy();
  });

  it('shows loading spinner when loading', () => {
    render(
      <InfiniteScroll onLoadMore={vi.fn()} hasMore={true} isLoading={true}>
        <div>Content</div>
      </InfiniteScroll>
    );
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('shows end message when no more items', () => {
    render(
      <InfiniteScroll onLoadMore={vi.fn()} hasMore={false} isLoading={false}>
        <div>Content</div>
      </InfiniteScroll>
    );
    expect(screen.getByText('No hay más productos')).toBeTruthy();
  });
});
