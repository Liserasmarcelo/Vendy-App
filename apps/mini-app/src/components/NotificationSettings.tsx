import React, { useState, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';

// ==========================================
// NOTIFICATION SETTINGS COMPONENT
// ==========================================
interface NotificationSettingsProps {
  shopId?: number;
}

const NOTIFICATION_TYPES = [
  { key: 'order_created', label: 'Nuevas órdenes', icon: '🛒' },
  { key: 'order_updated', label: 'Actualizaciones de órdenes', icon: '📦' },
  { key: 'payment_received', label: 'Pagos recibidos', icon: '💰' },
  { key: 'payment_failed', label: 'Pagos fallidos', icon: '❌' },
  { key: 'low_stock', label: 'Stock bajo', icon: '⚠️' },
  { key: 'subscription_expiring', label: 'Suscripción por vencer', icon: '⏰' },
  { key: 'ticket_updated', label: 'Actualizaciones de tickets', icon: '🎫' },
  { key: 'new_message', label: 'Nuevos mensajes', icon: '💬' },
];

const CHANNELS = [
  { key: 'push', label: 'Push', icon: '🔔' },
  { key: 'email', label: 'Email', icon: '📧' },
  { key: 'in_app', label: 'In-App', icon: '📱' },
];

export function NotificationSettings({ shopId }: NotificationSettingsProps) {
  const { preferences, fetchPreferences, updatePreferences } = useNotifications(shopId);
  const [localPrefs, setLocalPrefs] = useState<Record<string, string[]>>({});
  const [quietHours, setQuietHours] = useState({ enabled: false, start: '22:00', end: '08:00' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  useEffect(() => {
    if (preferences) {
      setLocalPrefs(preferences.channels || {});
      setQuietHours(preferences.quietHours || { enabled: false, start: '22:00', end: '08:00' });
    }
  }, [preferences]);

  const toggleChannel = (type: string, channel: string) => {
    setLocalPrefs(prev => {
      const current = prev[type] || [];
      const updated = current.includes(channel)
        ? current.filter(c => c !== channel)
        : [...current, channel];
      return { ...prev, [type]: updated };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updatePreferences({
        channels: localPrefs,
        quietHours,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = JSON.stringify(localPrefs) !== JSON.stringify(preferences?.channels) ||
    JSON.stringify(quietHours) !== JSON.stringify(preferences?.quietHours);

  return (
    <div className="notification-settings">
      <h2>🔔 Configuración de Notificaciones</h2>

      <div className="settings-section">
        <h3>Canales por tipo</h3>
        <table className="channels-table">
          <thead>
            <tr>
              <th>Tipo</th>
              {CHANNELS.map(ch => (
                <th key={ch.key}>{ch.icon} {ch.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {NOTIFICATION_TYPES.map(type => (
              <tr key={type.key}>
                <td>{type.icon} {type.label}</td>
                {CHANNELS.map(ch => (
                  <td key={ch.key}>
                    <label className="checkbox-wrapper">
                      <input
                        type="checkbox"
                        checked={(localPrefs[type.key] || []).includes(ch.key)}
                        onChange={() => toggleChannel(type.key, ch.key)}
                      />
                    </label>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="settings-section">
        <h3>Horas de silencio</h3>
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={quietHours.enabled}
            onChange={(e) => setQuietHours(prev => ({ ...prev, enabled: e.target.checked }))}
          />
          Activar horas de silencio
        </label>

        {quietHours.enabled && (
          <div className="quiet-hours-inputs">
            <div className="form-group">
              <label>Desde</label>
              <input
                type="time"
                value={quietHours.start}
                onChange={(e) => setQuietHours(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Hasta</label>
              <input
                type="time"
                value={quietHours.end}
                onChange={(e) => setQuietHours(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>
        )}
      </div>

      {hasChanges && (
        <button onClick={handleSave} disabled={isSaving} className="btn-primary">
          {isSaving ? 'Guardando...' : '💾 Guardar cambios'}
        </button>
      )}
    </div>
  );
}
