import React, { useState, useEffect } from 'react';
import { useBrand } from '../hooks/useBrand';

// ==========================================
// BRAND CUSTOMIZER COMPONENT
// ==========================================
interface BrandCustomizerProps {
  shopId: number;
}

export function BrandCustomizer({ shopId }: BrandCustomizerProps) {
  const { brand, isLoading, error, fetchBrand, updateBrand, validateDomain, configureDomain } = useBrand(shopId);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    primaryColor: '#FF7403',
    secondaryColor: '#333333',
    accentColor: '#2196F3',
    fontFamily: 'Inter',
    customDomain: '',
  });
  const [domainValidation, setDomainValidation] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    fetchBrand();
  }, [fetchBrand]);

  useEffect(() => {
    if (brand) {
      setFormData({
        name: brand.name || '',
        description: brand.description || '',
        primaryColor: brand.primaryColor || '#FF7403',
        secondaryColor: brand.secondaryColor || '#333333',
        accentColor: brand.accentColor || '#2196F3',
        fontFamily: brand.fontFamily || 'Inter',
        customDomain: brand.customDomain || '',
      });
    }
  }, [brand]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaveMessage('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      await updateBrand(formData);
      setSaveMessage('✅ Cambios guardados exitosamente');
    } catch {
      setSaveMessage('❌ Error al guardar cambios');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDomainCheck = async () => {
    if (!formData.customDomain) return;

    const result = await validateDomain(formData.customDomain);
    setDomainValidation(result);
  };

  const handleDomainConfigure = async () => {
    if (!formData.customDomain) return;

    try {
      await configureDomain(formData.customDomain);
      setSaveMessage('✅ Dominio configurado. Verificá los registros DNS.');
    } catch (err) {
      setSaveMessage(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (isLoading && !brand) {
    return <div className="brand-customizer-loading">Cargando configuración...</div>;
  }

  return (
    <div className="brand-customizer">
      <h2>🎨 Personalización de Marca</h2>

      {error && <div className="error-message">⚠️ {error}</div>}

      <div className="brand-form">
        {/* Basic Info */}
        <section className="form-section">
          <h3>Información Básica</h3>
          
          <div className="form-group">
            <label>Nombre de la tienda</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Mi Tienda"
            />
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Descripción de tu tienda"
              rows={3}
            />
          </div>
        </section>

        {/* Colors */}
        <section className="form-section">
          <h3>Colores</h3>
          
          <div className="color-group">
            <div className="form-group">
              <label>Color primario</label>
              <div className="color-input">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => handleChange('primaryColor', e.target.value)}
                />
                <span>{formData.primaryColor}</span>
              </div>
            </div>

            <div className="form-group">
              <label>Color secundario</label>
              <div className="color-input">
                <input
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => handleChange('secondaryColor', e.target.value)}
                />
                <span>{formData.secondaryColor}</span>
              </div>
            </div>

            <div className="form-group">
              <label>Color de acento</label>
              <div className="color-input">
                <input
                  type="color"
                  value={formData.accentColor}
                  onChange={(e) => handleChange('accentColor', e.target.value)}
                />
                <span>{formData.accentColor}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="form-section">
          <h3>Tipografía</h3>
          
          <div className="form-group">
            <label>Fuente</label>
            <select
              value={formData.fontFamily}
              onChange={(e) => handleChange('fontFamily', e.target.value)}
            >
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Poppins">Poppins</option>
              <option value="Montserrat">Montserrat</option>
            </select>
          </div>
        </section>

        {/* Custom Domain */}
        <section className="form-section">
          <h3>Dominio Personalizado</h3>
          
          <div className="form-group">
            <label>Dominio</label>
            <div className="domain-input">
              <input
                type="text"
                value={formData.customDomain}
                onChange={(e) => handleChange('customDomain', e.target.value)}
                placeholder="mitienda.com"
              />
              <button onClick={handleDomainCheck} className="btn-check">
                Verificar
              </button>
            </div>
            
            {domainValidation && (
              <div className={`domain-validation ${domainValidation.valid ? 'valid' : 'invalid'}`}>
                {domainValidation.valid ? (
                  <span>✅ Dominio disponible</span>
                ) : (
                  <div>
                    <span>❌ Dominio no disponible:</span>
                    <ul>
                      {domainValidation.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {domainValidation?.valid && (
              <button onClick={handleDomainConfigure} className="btn-configure">
                Configurar Dominio
              </button>
            )}
          </div>
        </section>

        {/* Preview */}
        <section className="form-section">
          <h3>Vista Previa</h3>
          <div
            className="brand-preview"
            style={{
              '--brand-primary': formData.primaryColor,
              '--brand-secondary': formData.secondaryColor,
              '--brand-accent': formData.accentColor,
              '--brand-font': formData.fontFamily,
            } as React.CSSProperties}
          >
            <div className="preview-header">
              <h4 style={{ color: 'var(--brand-primary)' }}>{formData.name || 'Mi Tienda'}</h4>
            </div>
            <div className="preview-button" style={{ backgroundColor: 'var(--brand-primary)' }}>
              Botón Primario
            </div>
            <div className="preview-accent" style={{ color: 'var(--brand-accent)' }}>
              Texto de acento
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="form-actions">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-save"
            style={{ backgroundColor: formData.primaryColor }}
          >
            {isSaving ? '💾 Guardando...' : '💾 Guardar Cambios'}
          </button>
          
          {saveMessage && <span className="save-message">{saveMessage}</span>}
        </div>
      </div>
    </div>
  );
}
