# Política de Seguridad

## Versiones Soportadas

| Versión | Soportada | Estado |
|---------|-----------|--------|
| 1.0.x | ✅ | Activa |
| 0.x.x | ❌ | No soportada |

## Reportar Vulnerabilidades

### ⚠️ IMPORTANTE

**No reportes vulnerabilidades de seguridad en issues públicos de GitHub.**

Usá uno de estos canales:

| Canal | Uso | Tiempo de respuesta |
|-------|-----|---------------------|
| Email | [security@vendy.app](mailto:security@vendy.app) | 24 horas |
| Telegram | [@vendysecurity](https://t.me/vendysecurity) | 24 horas |
| Formulario | [security.vendy.app](https://security.vendy.app) | 24 horas |
| GitHub Private | Security Advisories | 48 horas |

### Información Requerida

Incluí la mayor cantidad posible de:

- **Descripción:** Qué es la vulnerabilidad
- **Impacto:** Qué puede causar
- **Pasos de reproducción:** Cómo explotarla
- **Versión afectada:** Qué versión(es)
- **Mitigación:** Cómo reducir el riesgo (si conocés)
- **Proof of Concept:** Código o demo (opcional)
- **Tu contacto:** Cómo contactarte (opcional, anónimo permitido)

### Proceso

```
1. Recibimos el reporte (24h)
2. Confirmamos recepción (24h)
3. Investigamos y validamos (1-7 días)
4. Desarrollamos fix (1-14 días)
5. Testing del fix (1-3 días)
6. Deploy del fix (24h)
7. Notificamos al reportero
8. Publicamos advisory (7 días después)
```

### Recompensas

Aunque no tenemos un bug bounty formal, reconocemos a los reporteros:

- **Hall of Fame** en nuestro sitio
- **Swag** (stickers, camisetas)
- **Acceso early** a nuevas features
- **Mención** en release notes

### Política de Divulgación

Seguimos **Responsible Disclosure**:

1. Reportero notifica en privado
2. Nosotros investigamos y fixeamos
3. Notificamos a reportero antes de publicar
4. Publicamos advisory después de 7 días del fix
5. Damos crédito al reportero (si desea)

### Seguridad de Dependencias

Monitoreamos vulnerabilidades en dependencias:

- **Dependabot:** Alertas automáticas de GitHub
- **Snyk:** Escaneo continuo
- **npm audit:** En cada build

### Seguridad de la Infraestructura

- **HTTPS obligatorio** en todos los endpoints
- **HSTS** habilitado
- **CSP** configurado
- **Rate limiting** por IP y usuario
- **WAF** (Cloudflare) para protección DDoS
- **Secrets** en variables de entorno, nunca en código
- **Database** accesible solo desde la red interna

### Contacto de Emergencia

Para incidentes de seguridad activos:

- **Email:** [security@vendy.app](mailto:security@vendy.app)
- **Telegram:** [@vendysecurity](https://t.me/vendysecurity)
- **Teléfono:** +595-XXX-XXXXXX (solo emergencias)

---

## Historial de Vulnerabilidades

| Fecha | CVE | Descripción | Severidad | Reportero |
|-------|-----|-------------|-----------|-----------|
| - | - | Sin vulnerabilidades reportadas todavía | - | - |

---

## Referencias

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Telegram Bot Security](https://core.telegram.org/bots/webapps#security)
