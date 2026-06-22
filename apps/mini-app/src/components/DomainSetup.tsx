import React, { useState } from 'react';
import { useBrand } from '../hooks/useBrand';

// ==========================================
// DOMAIN SETUP COMPONENT
// ==========================================
interface DomainSetupProps {
  shopId: number;
}

export function DomainSetup({ shopId }: DomainSetupProps) {
  const { brand, validateDomain, configureDomain } = useBrand(shopId);
  const [domain, setDomain] = useState(brand?.customDomain || '');
  const [validation, setValidation] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [dnsRecords, setDnsRecords] = useState<Array<{ type: string; name: string; value: string }> | null>(null);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [message, setMessage] = useState('');

  const handleValidate = async () => {
    if (!domain) return;
    const result = await validateDomain(domain);
    setValidation(result);
    setDnsRecords(null);
    setMessage('');
  };

  const handleConfigure = async () => {
    setIsConfiguring(true);
    setMessage('');

    try {
      const config = await configureDomain(domain);
      setDnsRecords(config.dnsRecords);
      setMessage('✅ Dominio configurado. Agregá estos registros DNS:');
    } catch (err) {
      setMessage(`❌ Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setIsConfiguring(false);
    }
  };

  return (
    <div className="domain-setup">
      <h2>🌐 Configuración de Dominio</h2>

      <div className="domain-input-section">
        <label>Tu dominio personalizado</label>
        <div className="domain-input-group">
          <input
            type="text"
            value={domain}
            onChange={(e) => {
              setDomain(e.target.value);
              setValidation(null);
            }}
            placeholder="mitienda.com"
          />
          <button onClick={handleValidate} className="btn-validate">
            Verificar
          </button>
        </div>

        {validation && (
          <div className={`validation-result ${validation.valid ? 'valid' : 'invalid'}`}>
            {validation.valid ? (
              <>
                <p>✅ Dominio disponible</p>
                <button
                  onClick={handleConfigure}
                  disabled={isConfiguring}
                  className="btn-configure"
                >
                  {isConfiguring ? 'Configurando...' : 'Configurar Dominio'}
                </button>
              </>
            ) : (
              <ul>
                {validation.errors.map((err, i) => (
                  <li key={i}>❌ {err}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {message && <div className="setup-message">{message}</div>}

      {dnsRecords && (
        <div className="dns-records">
          <h3>Registros DNS requeridos:</h3>
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Nombre</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {dnsRecords.map((record, i) => (
                <tr key={i}>
                  <td><code>{record.type}</code></td>
                  <td><code>{record.name}</code></td>
                  <td><code>{record.value}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="dns-note">
            Agregá estos registros en tu proveedor de dominio y luego verificá la configuración.
          </p>
        </div>
      )}

      {brand?.customDomain && (
        <div className="current-domain">
          <h3>Dominio Actual</h3>
          <p>
            <strong>{brand.customDomain}</strong>
            {brand.subdomain && (
              <span> (subdominio: {brand.subdomain})</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
