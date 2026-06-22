import React, { useState } from 'react';

// ==========================================
// REPORT EXPORT COMPONENT
// ==========================================
interface ReportExportProps {
  shopId: number;
  reportType: 'orders' | 'products' | 'customers' | 'sales' | 'inventory';
  startDate: string;
  endDate: string;
  filters?: Record<string, any>;
}

export function ReportExport({ shopId, reportType, startDate, endDate, filters }: ReportExportProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        shopId: String(shopId),
        startDate,
        endDate,
        format,
        ...filters,
      });

      const response = await fetch(`/api/reports/${reportType}?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xls' : format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar reporte');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="report-export">
      <div className="export-buttons">
        <button 
          onClick={() => handleExport('csv')}
          disabled={isLoading}
          className="export-btn csv"
        >
          {isLoading ? '⏳' : '📄'} CSV
        </button>
        <button 
          onClick={() => handleExport('excel')}
          disabled={isLoading}
          className="export-btn excel"
        >
          {isLoading ? '⏳' : '📊'} Excel
        </button>
        <button 
          onClick={() => handleExport('pdf')}
          disabled={isLoading}
          className="export-btn pdf"
        >
          {isLoading ? '⏳' : '📑'} PDF
        </button>
      </div>
      
      {error && (
        <div className="export-error">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
