import React, { useState } from 'react';
import { useTickets } from '../hooks/useTickets';

// ==========================================
// TICKET LIST COMPONENT
// ==========================================
interface TicketListProps {
  shopId?: number;
  onSelectTicket?: (ticketId: string) => void;
}

export function TicketList({ shopId, onSelectTicket }: TicketListProps) {
  const { tickets, isLoading, fetchTickets } = useTickets(shopId);
  const [filter, setFilter] = useState('all');

  const filteredTickets = filter === 'all'
    ? tickets
    : tickets.filter(t => t.status === filter);

  const statusColors: Record<string, string> = {
    open: '#FF9800',
    in_progress: '#2196F3',
    resolved: '#4CAF50',
    closed: '#9E9E9E',
  };

  const statusLabels: Record<string, string> = {
    open: 'Abierto',
    in_progress: 'En progreso',
    resolved: 'Resuelto',
    closed: 'Cerrado',
  };

  const priorityColors: Record<string, string> = {
    low: '#4CAF50',
    medium: '#FF9800',
    high: '#f44336',
    urgent: '#9C27B0',
  };

  return (
    <div className="ticket-list">
      <div className="ticket-header">
        <h2>🎫 Tickets de Soporte</h2>
        <div className="ticket-filters">
          {['all', 'open', 'in_progress', 'resolved'].map(f => (
            <button
              key={f}
              className={filter === f ? 'active' : ''}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Todos' : statusLabels[f]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Cargando tickets...</div>
      ) : filteredTickets.length === 0 ? (
        <div className="empty-state">
          <p>No hay tickets {filter !== 'all' && `en estado "${statusLabels[filter]}"`}</p>
        </div>
      ) : (
        <div className="tickets-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Asunto</th>
                <th>Estado</th>
                <th>Prioridad</th>
                <th>Categoría</th>
                <th>Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map(ticket => (
                <tr
                  key={ticket.id}
                  onClick={() => onSelectTicket?.(ticket.id)}
                  className="clickable"
                >
                  <td><code>{ticket.id.slice(0, 8)}</code></td>
                  <td>{ticket.subject}</td>
                  <td>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: statusColors[ticket.status] }}
                    >
                      {statusLabels[ticket.status]}
                    </span>
                  </td>
                  <td>
                    <span
                      className="priority-badge"
                      style={{ backgroundColor: priorityColors[ticket.priority] }}
                    >
                      {ticket.priority}
                    </span>
                  </td>
                  <td>{ticket.category}</td>
                  <td>{new Date(ticket.updatedAt).toLocaleDateString('es-ES')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
