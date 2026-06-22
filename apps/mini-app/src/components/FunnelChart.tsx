import React from 'react';

// ==========================================
// FUNNEL CHART COMPONENT
// ==========================================
interface FunnelStep {
  id: string;
  label: string;
  count: number;
  conversionRate: number;
  dropOffRate: number;
}

interface FunnelChartProps {
  steps: FunnelStep[];
  title?: string;
  color?: string;
}

export function FunnelChart({ steps, title, color = '#FF7403' }: FunnelChartProps) {
  const maxCount = Math.max(...steps.map(s => s.count));

  return (
    <div className="funnel-chart">
      {title && <h3 className="funnel-title">{title}</h3>}
      
      <div className="funnel-steps">
        {steps.map((step, index) => {
          const width = maxCount > 0 ? (step.count / maxCount) * 100 : 0;
          const isLast = index === steps.length - 1;
          
          return (
            <div key={step.id} className="funnel-step">
              {/* Step bar */}
              <div className="funnel-bar-container">
                <div
                  className="funnel-bar"
                  style={{
                    width: `${width}%`,
                    backgroundColor: color,
                    opacity: 1 - (index * 0.15),
                  }}
                >
                  <span className="funnel-bar-label">{step.label}</span>
                  <span className="funnel-bar-count">{step.count.toLocaleString()}</span>
                </div>
              </div>

              {/* Conversion info */}
              <div className="funnel-step-info">
                <div className="funnel-conversion">
                  {index > 0 && (
                    <>
                      <span className="conversion-rate">
                        {step.conversionRate.toFixed(1)}%
                      </span>
                      <span className="conversion-arrow">→</span>
                    </>
                  )}
                </div>
                
                {index > 0 && step.dropOffRate > 0 && (
                  <div className="funnel-dropoff">
                    <span className="dropoff-label">Abandono:</span>
                    <span className="dropoff-rate" style={{
                      color: step.dropOffRate > 50 ? '#f44336' : step.dropOffRate > 30 ? '#ff9800' : '#4caf50'
                    }}>
                      {step.dropOffRate.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="funnel-summary">
        <div className="summary-item">
          <span className="summary-label">Conversión Total:</span>
          <span className="summary-value" style={{ color }}>
            {steps.length > 0 && steps[0].count > 0
              ? ((steps[steps.length - 1].count / steps[0].count) * 100).toFixed(1)
              : 0}%
          </span>
        </div>
      </div>
    </div>
  );
}
