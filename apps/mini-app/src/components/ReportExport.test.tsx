import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportExport } from './ReportExport';

// Mock fetch
global.fetch = vi.fn();

describe('ReportExport', () => {
  it('renders export buttons', () => {
    render(
      <ReportExport
        shopId={1}
        reportType="orders"
        startDate="2024-06-01"
        endDate="2024-06-30"
      />
    );

    expect(screen.getByText('📄 CSV')).toBeInTheDocument();
    expect(screen.getByText('📊 Excel')).toBeInTheDocument();
    expect(screen.getByText('📑 PDF')).toBeInTheDocument();
  });

  it('exports CSV on click', async () => {
    const mockBlob = new Blob(['test'], { type: 'text/csv' });
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    } as Response);

    render(
      <ReportExport
        shopId={1}
        reportType="orders"
        startDate="2024-06-01"
        endDate="2024-06-30"
      />
    );

    fireEvent.click(screen.getByText('📄 CSV'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/reports/orders')
      );
    });
  });

  it('shows error on failed export', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    render(
      <ReportExport
        shopId={1}
        reportType="orders"
        startDate="2024-06-01"
        endDate="2024-06-30"
      />
    );

    fireEvent.click(screen.getByText('📄 CSV'));

    await waitFor(() => {
      expect(screen.getByText(/Error/i)).toBeInTheDocument();
    });
  });

  it('disables buttons while loading', () => {
    render(
      <ReportExport
        shopId={1}
        reportType="orders"
        startDate="2024-06-01"
        endDate="2024-06-30"
      />
    );

    fireEvent.click(screen.getByText('📄 CSV'));

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });
});
