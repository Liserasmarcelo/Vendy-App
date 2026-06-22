import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationSettings } from './NotificationSettings';

vi.mock('../hooks/useNotifications', () => ({
  useNotifications: vi.fn().mockReturnValue({
    preferences: {
      channels: {
        order_created: ['push', 'email'],
        payment_received: ['push', 'in_app'],
      },
      quietHours: { enabled: false, start: '22:00', end: '08:00' },
    },
    fetchPreferences: vi.fn(),
    updatePreferences: vi.fn().mockResolvedValue({}),
  }),
}));

describe('NotificationSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders notification settings', () => {
    render(<NotificationSettings shopId={1} />);
    
    expect(screen.getByText('🔔 Configuración de Notificaciones')).toBeInTheDocument();
    expect(screen.getByText('Canales por tipo')).toBeInTheDocument();
  });

  it('shows notification types', () => {
    render(<NotificationSettings shopId={1} />);
    
    expect(screen.getByText('🛒 Nuevas órdenes')).toBeInTheDocument();
    expect(screen.getByText('💰 Pagos recibidos')).toBeInTheDocument();
    expect(screen.getByText('⚠️ Stock bajo')).toBeInTheDocument();
  });

  it('shows channel checkboxes', () => {
    render(<NotificationSettings shopId={1} />);
    
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it('toggles channel on click', () => {
    render(<NotificationSettings shopId={1} />);
    
    const checkboxes = screen.getAllByRole('checkbox');
    // First checkbox should be for order_created + push
    fireEvent.click(checkboxes[1]); // Toggle off
    
    expect(checkboxes[1]).not.toBeChecked();
  });

  it('shows quiet hours section', () => {
    render(<NotificationSettings shopId={1} />);
    
    expect(screen.getByText('Horas de silencio')).toBeInTheDocument();
    expect(screen.getByText('Activar horas de silencio')).toBeInTheDocument();
  });

  it('enables quiet hours', () => {
    render(<NotificationSettings shopId={1} />);
    
    const toggle = screen.getByLabelText('Activar horas de silencio');
    fireEvent.click(toggle);
    
    expect(screen.getByLabelText('Desde')).toBeInTheDocument();
    expect(screen.getByLabelText('Hasta')).toBeInTheDocument();
  });

  it('saves changes', async () => {
    const mockUpdate = vi.fn().mockResolvedValue({});
    vi.mocked(require('../hooks/useNotifications').useNotifications).mockReturnValueOnce({
      preferences: {
        channels: { order_created: ['push'] },
        quietHours: { enabled: false, start: '22:00', end: '08:00' },
      },
      fetchPreferences: vi.fn(),
      updatePreferences: mockUpdate,
    });

    render(<NotificationSettings shopId={1} />);
    
    // Toggle a channel to make changes
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[2]); // Toggle email for order_created
    
    const saveBtn = screen.getByText('💾 Guardar cambios');
    fireEvent.click(saveBtn);
    
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  it('shows time inputs when quiet hours enabled', () => {
    render(<NotificationSettings shopId={1} />);
    
    const toggle = screen.getByLabelText('Activar horas de silencio');
    fireEvent.click(toggle);
    
    expect(screen.getByLabelText('Desde')).toBeInTheDocument();
    expect(screen.getByLabelText('Hasta')).toBeInTheDocument();
  });
});
