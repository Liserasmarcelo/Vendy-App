import React, { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../hooks/useNotifications';

// ==========================================
// NOTIFICATION BELL COMPONENT
// ==========================================
interface NotificationBellProps {
  shopId?: number;
}

export function NotificationBell({ shopId }: NotificationBellProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } = useNotifications(shopId);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications({ limit: 10 });
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'order_created': return '🛒';
      case 'payment_received': return '💰';
      case 'payment_failed': return '❌';
      case 'low_stock': return '⚠️';
      case 'subscription_expiring': return '⏰';
      case 'ticket_updated': return '🎫';
      case 'new_message': return '💬';
      default: return '📢';
    }
  };

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button
        className="bell-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notificaciones"
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <h3>Notificaciones</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="mark-all-read">
                Marcar todo como leído
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="empty-notifications">
                <p>No hay notificaciones</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.status}`}
                  onClick={() => {
                    if (notification.status !== 'read') {
                      markAsRead(notification.id);
                    }
                  }}
                >
                  <span className="notification-icon">{getIcon(notification.type)}</span>
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-body">{notification.body}</div>
                    <div className="notification-time">
                      {new Date(notification.createdAt).toLocaleDateString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  {notification.status !== 'read' && (
                    <span className="unread-dot" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
