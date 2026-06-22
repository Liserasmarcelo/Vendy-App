/**
 * OrderTimeline.tsx
 * Timeline de estados de orden con iconos animados.
 * Estados: Ordenado → Pagado → Enviado → Entregado.
 */

import React from 'react';
import { LottiePlayer } from './LottiePlayer';
import { useHaptic } from '../../hooks/useHaptic';

// TODO: Crear assets
// import orderPlaced from '../../assets/animations/order-placed.json';
// import paymentDone from '../../assets/animations/payment-done.json';
// import truckMoving from '../../assets/animations/truck-moving.json';
// import packageDelivered from '../../assets/animations/package-delivered.json';
const orderPlaced = {} as object;
const paymentDone = {} as object;
const truckMoving = {} as object;
const packageDelivered = {} as object;

type OrderStatus = 'placed' | 'paid' | 'shipped' | 'delivered';

interface Step {
  status: OrderStatus;
  label: string;
  date?: string;
  completed: boolean;
  active: boolean;
}

interface Props {
  steps: Step[];
}

const statusIcons: Record<OrderStatus, object> = {
  placed: orderPlaced,
  paid: paymentDone,
  shipped: truckMoving,
  delivered: packageDelivered
};

export function OrderTimeline({ steps }: Props) {
  const { selection, impact } = useHaptic();

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {/* Línea de conexión */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-2 -translate-y-1/2 z-0" />
        <div
          className="absolute top-1/2 left-0 h-0.5 bg-vendy-primary -translate-y-1/2 z-0 transition-all duration-500"
          style={{
            width: `${(steps.filter(s => s.completed).length / (steps.length - 1)) * 100}%`
          }}
        />

        {steps.map((step, index) => (
          <div
            key={step.status}
            className="relative z-10 flex flex-col items-center"
            onClick={() => {
              if (step.active) {
                impact('light');
                selection();
              }
            }}
          >
            <div
              className={`
                w-12 h-12 rounded-full flex items-center justify-center
                transition-all duration-300
                ${step.completed
                  ? 'bg-vendy-primary shadow-vendy'
                  : step.active
                    ? 'bg-vendy-primary/20 border-2 border-vendy-primary'
                    : 'bg-gray-2'
                }
              `}
            >
              {step.completed || step.active ? (
                <div className="w-8 h-8">
                  <LottiePlayer
                    src={statusIcons[step.status]}
                    loop={step.active && step.status === 'shipped'}
                    autoplay={step.active || step.completed}
                    style={{ width: 32, height: 32 }}
                    fallback={
                      <span className="text-lg">
                        {step.status === 'placed' && '📋'}
                        {step.status === 'paid' && '💳'}
                        {step.status === 'shipped' && '🚚'}
                        {step.status === 'delivered' && '📦'}
                      </span>
                    }
                  />
                </div>
              ) : (
                <span className="text-gray-3 text-lg">
                  {step.status === 'placed' && '📋'}
                  {step.status === 'paid' && '💳'}
                  {step.status === 'shipped' && '🚚'}
                  {step.status === 'delivered' && '📦'}
                </span>
              )}
            </div>

            <span className={`
              text-xs mt-2 font-medium
              ${step.completed || step.active ? 'text-vendy-text' : 'text-gray-3'}
            `}>
              {step.label}
            </span>

            {step.date && (
              <span className="text-gray-3 text-xs">
                {step.date}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
