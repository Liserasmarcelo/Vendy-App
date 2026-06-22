import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationBell } from './NotificationBell';

vi.mock('../hooks/useNotifications', () => ({
  useNotifications: vi.fn().mockReturnValue({
    notifications: [
      { id: 'n1', type: 'order_created', title: 'New Order', body: 'Order #123', status: 'sent', createdAt: '2024-06-01T10:00:00Z' },
      { id: 'n2', type: 'payment_received', title: 'Payment', body: '$50 received', status: 'read', createdAt: '2024-06-01T09:00:00Z' },
    ],
    unreadCount: 1,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    fetchNotifications: vi.fn(),
  }),
}));

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders bell with unread count', () => {
    render(<NotificationBell shopId={1} />);
    
    expect(screen.getByLabelText('Notificaciones')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Badge
  });

  it('opens dropdown on click', () => {
    render(<NotificationBell shopId={1} />);
    
    const bell = screen.getByLabelText('Notificaciones');
    fireEvent.click(bell);
    
    expect(screen.getByText('Notificaciones')).toBeInTheDocument();
    expect(screen.getByText('New Order')).toBeInTheDocument();
  });

  it('shows notification icons', () => {
    render(<NotificationBell shopId={1} />);
    
    const bell = screen.getByLabelText('Notificaciones');
    fireEvent.click(bell);
    
    expect(screen.getByText('🛒')).toBeInTheDocument();
    expect(screen.getByText('💰')).toBeInTheDocument();
  });

  it('marks notification as read on click', async () => {
    const mockMarkAsRead = vi.fn();
    vi.mocked(require('../hooks/useNotifications').useNotifications).mockReturnValueOnce({
      notifications: [
        { id: 'n1', type: 'order_created', title: 'New Order', body: 'Body', status: 'sent', createdAt: '2024-06-01T10:00:00Z' },
      ],
      unreadCount: 1,
      markAsRead: mockMarkAsRead,
      markAllAsRead: vi.fn(),
      fetchNotifications: vi.fn(),
    });

    render(<NotificationBell shopId={1} />);
    
    const bell = screen.getByLabelText('Notificaciones');
    fireEvent.click(bell);
    
    const notification = screen.getByText('New Order');
    fireEvent.click(notification);
    
    await waitFor(() => {
      expect(mockMarkAsRead).toHaveBeenCalledWith('n1');
    });
  });

  it('marks all as read', async () => {
    const mockMarkAll = vi.fn();
    vi.mocked(require('../hooks/useNotifications').useNotifications).mockReturnValueOnce({
      notifications: [
        { id: 'n1', type: 'order', title: 'Order', body: 'Body', status: 'sent', createdAt: '2024-06-01' },
      ],
      unreadCount: 1,
      markAsRead: vi.fn(),
      markAllAsRead: mockMarkAll,
      fetchNotifications: vi.fn(),
    });

    render(<NotificationBell shopId={1} />);
    
    const bell = screen.getByLabelText('Notificaciones');
    fireEvent.click(bell);
    
    const markAllBtn = screen.getByText('Marcar todo como leído');
    fireEvent.click(markAllBtn);
    
    await waitFor(() => {
      expect(mockMarkAll).toHaveBeenCalled();
    });
  });

  it('shows empty state', () => {
    vi.mocked(require('../hooks/useNotifications').useNotifications).mockReturnValueOnce({
      notifications: [],
      unreadCount: 0,
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      fetchNotifications: vi.fn(),
    });

    render(<NotificationBell shopId={1} />);
    
    const bell = screen.getByLabelText('Notificaciones');
    fireEvent.click(bell);
    
    expect(screen.getByText('No hay notificaciones')).toBeInTheDocument();
  });

  it('closes dropdown on outside click', () => {
    render(<NotificationBell shopId={1} />);
    
    const bell = screen.getByLabelText('Notificaciones');
    fireEvent.click(bell);
    
    expect(screen.getByText('Notificaciones')).toBeInTheDocument();
    
    // Click outside
    fireEvent.mouseDown(document.body);
    
    // Dropdown should be closed
    expect(screen.queryByText('Marcar todo como leído')).not.toBeInTheDocument();
  });
});
