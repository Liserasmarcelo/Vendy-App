import React, { useEffect, useState } from 'react';
import { useBilling } from '../hooks/useBilling';
import { useSubscription } from '../hooks/useSubscription';

// ==========================================
// BILLING DASHBOARD COMPONENT
// ==========================================
interface BillingDashboardProps {
  shopId: number;
}

export function BillingDashboard({ shopId }: BillingDashboardProps) {
  const {
    invoices,
    paymentMethods,
    fetchInvoices,
    fetchPaymentMethods,
  } = useBilling(shopId);

  const { subscription, fetchSubscription } = useSubscription(shopId);
  const [activeTab, setActiveTab] = useState<'invoices' | 'payment-methods'>('invoices');

  useEffect(() => {
    fetchInvoices();
    fetchPaymentMethods();
    fetchSubscription();
  }, [fetchInvoices, fetchPaymentMethods, fetchSubscription]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'failed': return '#f44336';
      case 'refunded': return '#2196F3';
      default: return '#999';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Pagado';
      case 'pending': return 'Pendiente';
      case 'failed': return 'Fallido';
      case 'refunded': return 'Reembolsado';
      default: return status;
    }
  };

  return (
    <div className="billing-dashboard">
      <h2>💳 Facturación</h2>

      {/* Subscription summary */}
      {subscription && (
        <div className="subscription-summary">
          <div className="summary-card">
            <span className="summary-label">Plan Actual</span>
            <span className="summary-value">{subscription.planId}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Estado</span>
            <span className="summary-value" style={{ color: getStatusColor(subscription.status) }}>
              {subscription.status}
            </span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Próximo cobro</span>
            <span className="summary-value">
              {new Date(subscription.currentPeriodEnd).toLocaleDateString('es-ES')}
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="billing-tabs">
        <button
          className={activeTab === 'invoices' ? 'active' : ''}
          onClick={() => setActiveTab('invoices')}
        >
          📄 Facturas
        </button>
        <button
          className={activeTab === 'payment-methods' ? 'active' : ''}
          onClick={() => setActiveTab('payment-methods')}
        >
          💳 Métodos de Pago
        </button>
      </div>

      {/* Invoices tab */}
      {activeTab === 'invoices' && (
        <div className="invoices-list">
          {invoices.length === 0 ? (
            <p className="empty-state">No hay facturas aún</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Factura</th>
                  <th>Descripción</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(invoice => (
                  <tr key={invoice.id}>
                    <td>{invoice.id}</td>
                    <td>{invoice.description}</td>
                    <td>${invoice.amount.toFixed(2)} {invoice.currency}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(invoice.status) }}
                      >
                        {getStatusLabel(invoice.status)}
                      </span>
                    </td>
                    <td>{new Date(invoice.createdAt).toLocaleDateString('es-ES')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Payment methods tab */}
      {activeTab === 'payment-methods' && (
        <div className="payment-methods-list">
          {paymentMethods.length === 0 ? (
            <p className="empty-state">No hay métodos de pago guardados</p>
          ) : (
            <div className="payment-methods-grid">
              {paymentMethods.map(method => (
                <div key={method.id} className={`payment-method-card ${method.isDefault ? 'default' : ''}`}>
                  <div className="method-icon">
                    {method.type === 'card' ? '💳' : method.type === 'bank_transfer' ? '🏦' : '₿'}
                  </div>
                  <div className="method-details">
                    <span className="method-brand">{method.brand || method.type}</span>
                    {method.last4 && (
                      <span className="method-last4">•••• {method.last4}</span>
                    )}
                    {method.expiryMonth && (
                      <span className="method-expiry">
                        Vence: {method.expiryMonth}/{method.expiryYear}
                      </span>
                    )}
                  </div>
                  {method.isDefault && (
                    <span className="default-badge">Predeterminado</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
