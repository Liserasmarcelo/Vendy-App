import React, { useState } from 'react';
import { useSubscription } from '../hooks/useSubscription';

// ==========================================
// PLAN SELECTOR COMPONENT
// ==========================================
interface PlanSelectorProps {
  shopId: number;
  currentPlanId?: string;
  onSelect?: (planId: string) => void;
}

export function PlanSelector({ shopId, currentPlanId, onSelect }: PlanSelectorProps) {
  const { plans, isLoading, subscribe, changePlan } = useSubscription(shopId);
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredPlans = plans.filter(p => p.billingCycle === selectedCycle);

  const handleSelectPlan = async (planId: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      if (currentPlanId) {
        await changePlan(planId);
      } else {
        await subscribe(planId, 14); // 14-day trial
      }
      onSelect?.(planId);
    } catch (error) {
      console.error('Failed to select plan:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <div className="plan-selector-loading">Cargando planes...</div>;
  }

  return (
    <div className="plan-selector">
      <h2>Elige tu plan</h2>
      <p className="plan-subtitle">Comenzá gratis, escalá cuando crezcas</p>

      {/* Billing cycle toggle */}
      <div className="billing-cycle-toggle">
        <button
          className={selectedCycle === 'monthly' ? 'active' : ''}
          onClick={() => setSelectedCycle('monthly')}
        >
          Mensual
        </button>
        <button
          className={selectedCycle === 'yearly' ? 'active' : ''}
          onClick={() => setSelectedCycle('yearly')}
        >
          Anual <span className="discount">-17%</span>
        </button>
      </div>

      {/* Plans */}
      <div className="plans-grid">
        {filteredPlans.map(plan => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrent={plan.id === currentPlanId}
            isSelected={plan.id === currentPlanId}
            onSelect={() => handleSelectPlan(plan.id)}
            isProcessing={isProcessing}
          />
        ))}
      </div>

      <p className="plan-note">
        * Todos los planes incluyen comisión por transacción. 
        <a href="#/commissions">Ver detalles</a>
      </p>
    </div>
  );
}

// ==========================================
// PLAN CARD
// ==========================================
interface PlanCardProps {
  plan: any;
  isCurrent: boolean;
  isSelected: boolean;
  onSelect: () => void;
  isProcessing: boolean;
}

function PlanCard({ plan, isCurrent, onSelect, isProcessing }: PlanCardProps) {
  const isFree = plan.price === 0;

  return (
    <div className={`plan-card ${isCurrent ? 'current' : ''} ${plan.id === 'pro' ? 'featured' : ''}`}>
      {plan.id === 'pro' && <div className="plan-badge">Más Popular</div>}
      
      <div className="plan-header">
        <h3>{plan.name}</h3>
        <p className="plan-description">{plan.description}</p>
      </div>

      <div className="plan-price">
        {isFree ? (
          <span className="price-free">Gratis</span>
        ) : (
          <>
            <span className="price-currency">$</span>
            <span className="price-amount">{plan.price}</span>
            <span className="price-period">/mes</span>
          </>
        )}
      </div>

      <div className="plan-commission">
        Comisión: {(plan.commissionRate * 100).toFixed(0)}%
      </div>

      <ul className="plan-features">
        <li>
          <span className="feature-icon">📦</span>
          {plan.features.maxProducts === -1 ? 'Productos ilimitados' : `${plan.features.maxProducts} productos`}
        </li>
        <li>
          <span className="feature-icon">🛒</span>
          {plan.features.maxOrdersPerMonth === -1 ? 'Órdenes ilimitadas' : `${plan.features.maxOrdersPerMonth} órdenes/mes`}
        </li>
        <li>
          <span className="feature-icon">👥</span>
          {plan.features.maxAdmins} {plan.features.maxAdmins === 1 ? 'admin' : 'admins'}
        </li>
        <li>
          <span className="feature-icon">📊</span>
          Analytics {plan.features.analyticsLevel}
        </li>
        {plan.features.customDomain && (
          <li><span className="feature-icon">🌐</span> Dominio personalizado</li>
        )}
        {plan.features.whiteLabel && (
          <li><span className="feature-icon">🏷️</span> White-label</li>
        )}
        {plan.features.prioritySupport && (
          <li><span className="feature-icon">🚀</span> Soporte prioritario</li>
        )}
        {plan.features.apiAccess && (
          <li><span className="feature-icon">🔌</span> API access</li>
        )}
      </ul>

      <button
        className={`plan-button ${isCurrent ? 'current' : ''}`}
        onClick={onSelect}
        disabled={isCurrent || isProcessing}
      >
        {isCurrent ? 'Plan Actual' : isProcessing ? 'Procesando...' : isFree ? 'Comenzar Gratis' : 'Seleccionar'}
      </button>
    </div>
  );
}
