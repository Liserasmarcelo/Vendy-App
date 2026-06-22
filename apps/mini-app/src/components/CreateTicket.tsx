import React, { useState } from 'react';
import { useTickets } from '../hooks/useTickets';

// ==========================================
// CREATE TICKET COMPONENT
// ==========================================
interface CreateTicketProps {
  shopId?: number;
  onCreated?: () => void;
}

export function CreateTicket({ shopId, onCreated }: CreateTicketProps) {
  const { createTicket, isLoading } = useTickets(shopId);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('general');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!subject.trim() || !description.trim()) {
      setError('Completá todos los campos');
      return;
    }

    try {
      await createTicket({
        subject: subject.trim(),
        description: description.trim(),
        priority,
        category,
      });

      setSuccess(true);
      setSubject('');
      setDescription('');
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear ticket');
    }
  };

  return (
    <div className="create-ticket">
      <h2>📝 Nuevo Ticket</h2>

      {success && (
        <div className="success-message">
          ✅ Ticket creado exitosamente
        </div>
      )}

      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Asunto *</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Resumí tu problema"
            required
          />
        </div>

        <div className="form-group">
          <label>Descripción *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describí tu problema en detalle..."
            rows={5}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Prioridad</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>

          <div className="form-group">
            <label>Categoría</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="general">General</option>
              <option value="billing">Facturación</option>
              <option value="technical">Técnico</option>
              <option value="feature_request">Feature Request</option>
              <option value="bug">Bug</option>
            </select>
          </div>
        </div>

        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? 'Creando...' : 'Crear Ticket'}
        </button>
      </form>
    </div>
  );
}
