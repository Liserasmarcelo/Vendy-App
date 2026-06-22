import React, { useState, useEffect, useRef } from 'react';
import { useTickets } from '../hooks/useTickets';

// ==========================================
// TICKET CHAT COMPONENT
// ==========================================
interface TicketChatProps {
  ticketId: string;
  userId: string;
}

export function TicketChat({ ticketId, userId }: TicketChatProps) {
  const { messages, fetchMessages, sendMessage } = useTickets();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const ticketMessages = messages[ticketId] || [];

  useEffect(() => {
    fetchMessages(ticketId);
  }, [ticketId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticketMessages]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(ticketId, newMessage.trim(), userId);
      setNewMessage('');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getMessageStyle = (senderType: string) => {
    switch (senderType) {
      case 'customer':
        return { alignSelf: 'flex-end', background: '#FF7403', color: 'white' };
      case 'agent':
        return { alignSelf: 'flex-start', background: '#2196F3', color: 'white' };
      case 'system':
        return { alignSelf: 'center', background: '#f0f0f0', color: '#666', fontSize: '12px' };
      default:
        return { alignSelf: 'flex-start', background: '#e0e0e0' };
    }
  };

  const getSenderLabel = (senderType: string) => {
    switch (senderType) {
      case 'customer': return 'Vos';
      case 'agent': return 'Agente';
      case 'system': return 'Sistema';
      default: return senderType;
    }
  };

  return (
    <div className="ticket-chat">
      <div className="chat-messages">
        {ticketMessages.length === 0 ? (
          <div className="chat-empty">
            <p>No hay mensajes aún</p>
          </div>
        ) : (
          ticketMessages.map(msg => (
            <div
              key={msg.id}
              className={`chat-message ${msg.senderType}`}
              style={getMessageStyle(msg.senderType)}
            >
              <div className="message-header">
                <span className="sender">{getSenderLabel(msg.senderType)}</span>
                <span className="time">
                  {new Date(msg.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="message-content">{msg.content}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Escribí tu mensaje..."
          rows={3}
          disabled={isSending}
        />
        <button
          onClick={handleSend}
          disabled={!newMessage.trim() || isSending}
          className="send-btn"
        >
          {isSending ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
    </div>
  );
}
