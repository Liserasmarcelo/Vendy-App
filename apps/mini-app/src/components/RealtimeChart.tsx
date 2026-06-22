import React, { useEffect, useRef, useState } from 'react';

// ==========================================
// REALTIME CHART COMPONENT
// ==========================================
interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

interface RealtimeChartProps {
  title: string;
  data: ChartDataPoint[];
  color?: string;
  maxPoints?: number;
  height?: number;
}

export function RealtimeChart({
  title,
  data,
  color = '#FF7403',
  maxPoints = 20,
  height = 200,
}: RealtimeChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<ChartDataPoint | null>(null);

  // Keep only last N points
  const displayData = data.slice(-maxPoints);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || displayData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Setup canvas
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const chartHeight = rect.height - 40; // Leave space for labels

    // Clear
    ctx.clearRect(0, 0, width, rect.height);

    // Calculate scales
    const maxValue = Math.max(...displayData.map(d => d.value)) * 1.1;
    const minValue = 0;
    const xStep = width / (displayData.length - 1 || 1);

    // Draw grid lines
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = chartHeight - (i / 5) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      // Y-axis labels
      ctx.fillStyle = '#999';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      const value = Math.round((maxValue / 5) * i);
      ctx.fillText(String(value), 30, y + 3);
    }

    // Draw line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    displayData.forEach((point, index) => {
      const x = index * xStep;
      const y = chartHeight - (point.value / maxValue) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw area under line
    ctx.fillStyle = color + '20'; // 20 = 12% opacity
    ctx.beginPath();
    ctx.moveTo(0, chartHeight);
    displayData.forEach((point, index) => {
      const x = index * xStep;
      const y = chartHeight - (point.value / maxValue) * chartHeight;
      ctx.lineTo(x, y);
    });
    ctx.lineTo(width, chartHeight);
    ctx.closePath();
    ctx.fill();

    // Draw points
    displayData.forEach((point, index) => {
      const x = index * xStep;
      const y = chartHeight - (point.value / maxValue) * chartHeight;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      // X-axis labels (every few points)
      if (index % Math.ceil(displayData.length / 5) === 0) {
        ctx.fillStyle = '#999';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        const time = new Date(point.timestamp).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        });
        ctx.fillText(time, x, rect.height - 5);
      }
    });
  }, [displayData, color]);

  return (
    <div className="realtime-chart">
      <h3 className="chart-title">{title}</h3>
      <div className="chart-container" style={{ height }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%' }}
          onMouseMove={(e) => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const index = Math.round((x / rect.width) * (displayData.length - 1));

            if (index >= 0 && index < displayData.length) {
              setHoveredPoint(displayData[index]);
            }
          }}
          onMouseLeave={() => setHoveredPoint(null)}
        />
        {hoveredPoint && (
          <div className="chart-tooltip">
            <div className="tooltip-value">{hoveredPoint.value}</div>
            <div className="tooltip-time">
              {new Date(hoveredPoint.timestamp).toLocaleTimeString('es-ES')}
            </div>
            {hoveredPoint.label && (
              <div className="tooltip-label">{hoveredPoint.label}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
