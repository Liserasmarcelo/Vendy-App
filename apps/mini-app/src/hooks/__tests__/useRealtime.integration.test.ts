import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRealtime } from '../useRealtime';

// Mock EventSource
global.EventSource = vi.fn().mockImplementation(() => ({
  onopen: null,
  onmessage: null,
  onerror: null,
  close: vi.fn(),
})) as any;

describe('useRealtime Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('connects to SSE endpoint', () => {
    renderHook(() => useRealtime(1));

    expect(global.EventSource).toHaveBeenCalledWith('/api/realtime/1');
  });

  it('receives metrics events', () => {
    const mockEventSource = {
      onopen: null as any,
      onmessage: null as any,
      onerror: null as any,
      close: vi.fn(),
    };

    (global.EventSource as any).mockImplementation(() => mockEventSource);

    const { result } = renderHook(() => useRealtime(1));

    // Simulate connection
    act(() => {
      if (mockEventSource.onopen) mockEventSource.onopen();
    });

    // Simulate metrics event
    act(() => {
      if (mockEventSource.onmessage) {
        mockEventSource.onmessage({
          data: JSON.stringify({
            type: 'metrics',
            data: {
              activeUsers: 5,
              todayOrders: 10,
              todayRevenue: 1500,
              conversionRate: 3.5,
            },
          }),
        });
      }
    });

    expect(result.current.metrics).toBeDefined();
    expect(result.current.isConnected).toBe(true);
  });

  it('handles connection errors', () => {
    const mockEventSource = {
      onopen: null as any,
      onmessage: null as any,
      onerror: null as any,
      close: vi.fn(),
    };

    (global.EventSource as any).mockImplementation(() => mockEventSource);

    const { result } = renderHook(() => useRealtime(1));

    // Simulate error
    act(() => {
      if (mockEventSource.onerror) mockEventSource.onerror(new Error('Connection failed'));
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it('disconnects on unmount', () => {
    const mockClose = vi.fn();
    const mockEventSource = {
      onopen: null,
      onmessage: null,
      onerror: null,
      close: mockClose,
    };

    (global.EventSource as any).mockImplementation(() => mockEventSource);

    const { unmount } = renderHook(() => useRealtime(1));

    unmount();

    expect(mockClose).toHaveBeenCalled();
  });
});
