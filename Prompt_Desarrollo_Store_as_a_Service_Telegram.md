# Prompt de Desarrollo: Store-as-a-Service para Telegram
## Producto tipo "Sellz" — Multi-bot Ecommerce Platform

**Versión:** 1.0  
**Fecha:** 2026-06-17  
**Estado:** Ready for Sprint Execution  
**Agente Destino:** Coding Agent (Hermes CLI) con skills de `telegram-mini-apps`

---

## 1. Contexto y Visión del Producto

Construir una plataforma **Store-as-a-Service** dentro de Telegram que permita a cualquier usuario crear, personalizar y operar una tienda de ecommerce en minutos. El producto es un **clon funcional mejorado** de Sellz (`@sellzdigitalbot`), con arquitectura multi-bot de tres capas, Mini-App embebida para admin y cliente, y modelo de monetización por suscripción + comisión por transacción.

**Filosofía:** "Tu tienda donde ya conversas. Sin código. En 3 minutos."

---

## 2. Arquitectura General del Sistema (Multi-Bot de 3 Capas)

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPA 1: BOT PADRE                        │
│                  @TuPlataformaBot                           │
│  • Onboarding (creación de tienda)                         │
│  • Dashboard Admin (Mini-App embebida)                     │
│  • Gestión de suscripción y planes                         │
│  • Soporte y FAQ                                           │
└──────────────────────────┬──────────────────────────────────┘
                           │ Auth via Telegram initData
                           │ Webhook: /webhook/parent
┌──────────────────────────▼──────────────────────────────────┐
│                    CAPA 2: BACKEND CORE                     │
│              FastAPI / Node.js + PostgreSQL                 │
│  • Multi-tenant (shop_id como namespace)                   │
│  • Gestión de productos, pedidos, pagos                    │
│  • Webhook router (enruta por bot_token)                   │
│  • Colas Redis (bullmq / celery)                           │
│  • Integraciones de pago (Stripe, Smart Glocal, Unlimit)   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    CAPA 3: BOT HIJO                         │
│                   @MiTiendaBot                              │
│  • Atención al cliente (comandos + IA)                     │
│  • Launcher de Mini-App pública (catálogo)                 │
│  • Notificaciones de pedido                                │
│  • Webhook: /webhook/child/{shop_id}                       │
└─────────────────────────────────────────────────────────────┘
```

**Regla de oro:** Cada tienda es un tenant independiente. El Bot Padre gestiona el tenant. El Bot Hijo es la interfaz pública del tenant. Ambos comparten la misma Mini-App URL parametrizada (`?role=admin|customer&shop_id=xxx`).

---

## 3. Stack Técnico y Skills Disponibles

El agente de coding posee las siguientes skills bajo `~/.hermes/skills/telegram-mini-apps/`:

| Skill | Uso en este proyecto |
|-------|---------------------|
| `telegram-mini-apps-botfather` | Gestión de bots, webhooks, validación de tokens, deep links |
| `telegram-mini-apps-visuals` | Diseño de Mini-Apps, theming oscuro, componentes UI, responsive |
| `telegram-mini-apps-payments` | Integración Stripe, Telegram Stars, Smart Glocal, Unlimit, comisiones |
| `telegram-mini-apps-backend` | FastAPI/Node, PostgreSQL, Redis, multi-tenancy, webhooks |
| `telegram-mini-apps-devops` | Docker, CI/CD, deploy en Railway/Render/AWS, SSL, dominios |
| `telegram-mini-apps-architect` | Decisiones de arquitectura, escalabilidad, seguridad, rate limits |

**Stack propuesto:**
- **Backend:** FastAPI (Python) o Express (Node.js) — decisión del agente con justificación
- **Base de datos:** PostgreSQL 15+ (multi-tenant por schema o shop_id prefix)
- **Cache / Colas:** Redis 7+ (sesiones, carritos, cola de webhooks)
- **Mini-App:** React 18 + Telegram Web App SDK + Tailwind CSS
- **Bot Framework:** Python: `aiogram 3.x` | Node.js: `grammY` o `telegraf`
- **Deploy:** Docker Compose (dev) → Railway/Render (staging) → AWS ECS/GCP (prod)
- **Almacenamiento:** Cloudflare R2 (imágenes de productos, avatares)

---

## 4. Decisiones Pendientes (a tomar en Sprint 0)

Las siguientes decisiones deben ser tomadas explícitamente antes de avanzar al Sprint 1. El agente debe presentar opciones y esperar aprobación.

| Decisión | Sprint | Opciones / Notas |
|----------|--------|-----------------|
| **Nombre de la empresa / plataforma** | Sprint 0 | Ej: Vendly, StoreBot, TeleShop, etc. Impacta dominio, branding, bot username padre. |
| **Color primario de marca** | Sprint 0 | Reemplaza el azul #2D7FF9 de Sellz. Debe funcionar en tema oscuro. Sugerir 3 opciones. |
| **Backend: Python vs Node.js** | Sprint 0 | Justificar elección considerando aiogram vs grammY, equipo, ecosistema. |
| **Estrategia de multi-tenancy** | Sprint 0 | Schema-per-tenant vs shop_id column. Justificar con proyección de escala. |
| **Nombre de los planes** | Sprint 0 | Ej: Starter / Growth / Pro; o Lite / Pro / Max. |
| **Porcentaje de comisión por transacción** | Sprint 0 | Por plan. Sugerir: 3% Starter, 2% Growth, 1% Pro, 0% Pro anual. |
| **Precio de white-label (Marca Personalizada)** | Sprint 0 | One-time vs mensual. Sugerir: $49 one-time o $15/mes. |

---

## 5. Sprints de Desarrollo

### SPRINT 0: Fundamentos y Decisiones (Semana 1)
**Objetivo:** Tomar todas las decisiones de arquitectura y branding antes de escribir código de producción.

**Entregables:**
1. Documento `DECISIONS.md` con todas las elecciones de la tabla anterior, aprobadas.
2. Repositorio inicializado con monorepo:
   ```
   /apps
     /bot-parent
     /bot-child
     /mini-app
     /api
   /packages
     /shared-types
     /ui-components
   /infra
     /docker
     /terraform (opcional)
   ```
3. Docker Compose local funcional (PostgreSQL + Redis + API + bots).
4. Configuración de CI/CD básica (lint + test en PR).
5. Diseño de sistema de diseño (Design Tokens) en Figma/código:
   - Tema oscuro obligatorio (no hay light mode).
   - Color primario definido en Sprint 0.
   - Tipografía: Inter o SF Pro equivalente.
   - Radios: 12px cards, 8px botones.
   - Iconografía: estilo filled+outline mixto, colores distintivos por sección.

**Criterios de aceptación:**
- [ ] `docker-compose up` levanta todos los servicios sin errores.
- [ ] Existe un endpoint `/health` que responde OK.
- [ ] Design Tokens documentados en `/docs/design-system.md`.

---

### SPRINT 1: Backend Core + Base de Datos (Semana 2)
**Objetivo:** Fundamento sólido multi-tenant, autenticación y gestión de usuarios.

**Entregables:**
1. **Modelo de datos PostgreSQL** (migraciones iniciales):
   - `users` (telegram_id, username, first_name, last_name, language_code, created_at)
   - `shops` (id, owner_id, name, description, category, country, currency, bot_token, bot_username, status, plan_id, trial_ends_at, created_at)
   - `shop_settings` (shop_id, primary_color, cover_image, logo, custom_domain, welcome_message, min_order_amount, etc.)
   - `categories` (id, shop_id, name, sort_order)
   - `products` (id, shop_id, category_id, name, description, price, stock, images[], status, variants)
   - `orders` (id, shop_id, customer_id, items[], total, status, payment_method, delivery_method, metadata, created_at)
   - `customers` (id, shop_id, telegram_id, username, contact_info, orders_count, total_spent)
   - `coupons` (id, shop_id, code, type [fixed|percentage], value, usage_limit, used_count, expires_at)
   - `subscriptions` (id, shop_id, plan, status, starts_at, ends_at, payment_provider, payment_id)
   - `managers` (id, shop_id, telegram_id, role [owner|admin|support], permissions)
   - `analytics_events` (id, shop_id, event_type, payload, created_at)

2. **API REST**:
   - Autenticación: validación de `initData` de Telegram (HMAC SHA-256).
   - Middleware de multi-tenancy: extrae `shop_id` del token o de la URL.
   - CRUD de tienda (protegido por ownership).
   - Rate limiting por telegram_id y por shop_id.

3. **Redis**:
   - Sesiones de Mini-App (TTL 24h).
   - Cola de webhooks pendientes.
   - Caché de catálogos públicos (TTL 5 min).

**Criterios de aceptación:**
- [ ] Migraciones ejecutan limpio en base vacía.
- [ ] Tests unitarios para validación de `initData`.
- [ ] Postman/Bruno collection con endpoints de shop CRUD.
- [ ] Rate limiting funcional (probar con 100 req/s).

---

### SPRINT 2: Bot Padre + Onboarding + Token Helper (Semana 3)
**Objetivo:** Flujo de onboarding completo desde `/start` hasta tienda creada, resolviendo la fricción del token de BotFather.

**Entregables:**
1. **Bot Padre** (`@TuPlataformaBot`):
   - Comando `/start` → mensaje de bienvenida + botón "Crear mi tienda".
   - Botón abre Mini-App con URL `https://tu-dominio.app/onboarding`.

2. **Mini-App Onboarding (3 pasos):**
   - **Paso 1 — Bienvenida:**
     - Título: "Bienvenido a [NombreEmpresa]"
     - Value props: Rápido y eficiente (90 segundos), Sistemas de pago, Para todos.
     - Selector de idioma: Español, English, Português, Русский, Français, Hindi.
     - CTA: "Continuar".
   - **Paso 2 — Información de la tienda:**
     - Inputs: Nombre de la tienda (obligatorio), Descripción (opcional).
     - Selector "Tipo de tienda" (13 opciones): Electrónica, Moda, Belleza, Hogar, Auto, Niños, Pasatiempos, Deportes, Alimentos, Mascotas, Libros, Construcción, Otro.
     - Canal de contacto: input `t.me/...` + toggle "Suscribirte para acceder".
   - **Paso 3 — Lanzamiento (Token Helper):**
     - **NO pedir token en crudo sin ayuda.**
     - Implementar **Token Helper de 3 fases:**
       1. **Botón "Abrir BotFather"**: Deep link `https://t.me/BotFather?start=start` que abre BotFather directamente en Telegram.
       2. **Tutorial inline paso a paso**:
          - "1. Escribe `/newbot` en BotFather"
          - "2. Elige un nombre para tu tienda"
          - "3. Elige un username que termine en `_bot`"
          - "4. Copia el token que te envía BotFather (se ve como `123456789:ABCdef...`)"
          - "5. Vuelve aquí y pégalo abajo 👇"
       3. **Input con validación inteligente**:
          - Placeholder: "Pega tu token aquí..."
          - Validación de formato regex: `^\d+:[A-Za-z0-9_-]{35,}$`
          - Al pegar, backend ejecuta `getMe` vía Bot API para verificar que el token es válido y que el bot no está ya vinculado a otra tienda.
          - Si válido: muestra ✅ + nombre del bot detectado.
          - Si inválido: muestra ❌ con mensaje específico ("Token no válido" / "Este bot ya está en uso").
     - **Upsell Banner** (debajo del input):
       - "[NombreEmpresa] Pro — Prueba gratuita de 20 días"
       - Subtexto: "Después del trial, elige el plan perfecto para tu negocio."
     - CTA: "Lanzar tienda" (deshabilitado hasta token válido).

3. **Post-launch:**
   - Animación de éxito (confeti o checkmark animado).
   - Mensaje: "¡Está todo listo! Agrega productos desde tu dashboard."
   - Redirección automática al Dashboard Admin.

**Criterios de aceptación:**
- [ ] Usuario puede completar onboarding en < 3 minutos.
- [ ] Token inválido es rechazado con mensaje claro.
- [ ] Token ya usado por otra tienda es rechazado.
- [ ] BotFather deep link funciona en iOS, Android y Desktop.
- [ ] Mini-App valida `initData` en cada paso.

---

### SPRINT 3: Dashboard Admin — Core UI y Gestión de Tienda (Semana 4)
**Objetivo:** Replicar y mejorar el dashboard principal de Sellz.

**Entregables:**
1. **Header Persistente:**
   - Hero card: foto de portada con patrón de iconos de compra (SVG) + nombre de tienda + "Ver tienda ›" (abre Mini-App pública) + "Editar".
   - **Suscripción Card:**
     - Estado: "Prueba gratuita" (badge cyan) o nombre del plan.
     - Tiempo restante: "X días restantes".
     - Expira el: DD-MM-YYYY.
     - Botones: "Extender por $X" / "Suscribir" (precio en USD, NO en Stars).

2. **Menú Principal (lista vertical con iconos):**
   - Premium (estado Activa)
   - Verificación
   - Marca Personalizada
   - Categorías
   - Métodos de entrega
   - Productos (con alerta 🔴 si hay productos incompletos)
   - Pedidos
   - Cupones
   - Analítica
   - Correo (Broadcast)
   - Sistemas de pago
   - Configuración de pedidos
   - Configuración del bot
   - Gerentes (roles de equipo)
   - Idioma
   - Soporte / Noticias / FAQ

3. **Editar Tienda:**
   - Cambiar foto de portada (upload a R2/S3).
   - Nombre, descripción.
   - País, Moneda (dropdown con símbolos: $, €, ₲, R$, etc.).
   - Tipo de tienda.
   - Número, username, canal, ubicación.
   - Eliminar tienda (confirmación con texto "ELIMINAR").

**Criterios de aceptación:**
- [ ] Dashboard carga en < 2 segundos.
- [ ] "Ver tienda" abre la Mini-App pública correctamente.
- [ ] Editar tienda persiste cambios inmediatamente.
- [ ] Alerta roja en Productos aparece cuando un producto falta imagen o precio.

---

### SPRINT 4: Dashboard Admin — Productos, Categorías, Pedidos, Cupones (Semana 5)
**Objetivo:** Gestión completa del catálogo y operación.

**Entregables:**
1. **Categorías:**
   - Lista con "Default" pre-creada.
   - CRUD: nombre, orden.

2. **Productos:**
   - Tabs: "Todos los productos" / "Por categorías".
   - Card de producto: thumbnail, nombre, categoría, precio, stock.
   - Formulario de producto:
     - Nombre, descripción, precio, stock.
     - Categoría (selector).
     - Imágenes: upload múltiple (máx 5), preview, reordenar.
     - Variantes: talla, color, etc. (plan Pro+).
     - Estado: Activo / Borrador / Sin stock.
   - Alerta roja en menú si producto tiene campos obligatorios vacíos.

3. **Pedidos:**
   - Tabs: "En curso" / "Completado".
   - Lista: ID, cliente, total, estado, fecha.
   - Detalle: productos, dirección, método de pago, historial de estados.
   - Acciones: marcar como enviado, agregar tracking, marcar completado, cancelar.

4. **Cupones:**
   - Cupón fijo: monto de descuento constante.
   - Cupón de porcentaje: % sobre el total.
   - Campos: código, tipo, valor, límite de uso, usados, expiración.

**Criterios de aceptación:**
- [ ] CRUD completo de productos con imágenes.
- [ ] Pedido cambia de estado y notifica al cliente vía bot hijo.
- [ ] Cupón aplicable en checkout de Mini-App cliente.

---

### SPRINT 5: Dashboard Admin — Pagos, Configuración, Analytics, Broadcast (Semana 6)
**Objetivo:** Configuración operativa y comunicación con clientes.

**Entregables:**
1. **Sistemas de Pago:**
   | Método | Estado Default | Tipo | Notas |
   |--------|---------------|------|-------|
   | Efectivo | Activa | Manual | El vendedor confirma pago manualmente. |
   | Telegram Stars | Inactiva | Virtual | Para compras dentro de la tienda (plan Pro+). |
   | Stripe | Inactiva | Tarjeta | Requiere cuenta Stripe Connect. |
   | Smart Glocal | Inactiva | Local/LATAM | Docs: https://smart-glocal.com/#menuopen |
   | Unlimit | Inactiva | Global/LATAM | Docs: https://www.unlimit.com/es-lat/ |
   - Cada método: toggle on/off + campos de configuración (API keys, webhooks).

2. **Configuración de Pedidos:**
   - Campos requeridos del cliente (toggles): Nombre, Teléfono, Email, Ubicación, Comentario.
   - Precio mínimo de pedido (input numérico).
   - Mensaje de salida automático (post-compra), editable.
   - Reenvío de pedidos: input de Chat ID para notificar a grupo de equipo.

3. **Configuración del Bot:**
   - Mensaje de saludo editable (con preview).
   - Adjuntar imagen al saludo.
   - Integración de canales: WebApp URL generada con botón COPIAR.

4. **Analítica (MVP — contadores básicos):**
   - Total de clientes.
   - Pedidos totales.
   - Vistas por producto.
   - **Backlog futuro:** GMV, tasa de conversión, AOV, cohortes, canales de origen.

5. **Correo (Broadcast):**
   - Input de mensaje + adjuntar imagen.
   - **MEJORA CRÍTICA vs Sellz:** Segmentación básica:
     - Todos los clientes.
     - Clientes con al menos 1 compra.
     - Clientes sin compras.
     - Por rango de fecha de última compra.
   - Preview del mensaje antes de enviar.
   - Confirmación: "¿Enviar a 47 clientes?"

**Criterios de aceptación:**
- [ ] Toggle de método de pago persiste y afecta checkout del cliente.
- [ ] Broadcast segmentado envía solo al segmento seleccionado.
- [ ] Mensaje de saludo se refleja inmediatamente en el bot hijo.

---

### SPRINT 6: Bot Hijo + Mini-App Cliente (Vista Pública) (Semana 7)
**Objetivo:** Experiencia de compra completa para el cliente final.

**Entregables:**
1. **Bot Hijo:**
   - Comando `/start` → mensaje de bienvenida personalizado + botón inline "Catálogo" (con icono de Mini-App).
   - Comando `/catalogo` → mismo botón.
   - Mensajes automáticos: confirmación de pedido, envío, entrega.

2. **Mini-App Pública (Tienda del Cliente):**
   - Header: nombre del bot + avatar.
   - Hero: banner con patrón de iconos de compra + nombre de tienda.
   - Botones flotantes: 🌐 cambiar idioma (5 idiomas), ↗️ compartir tienda (share sheet nativo).
   - About Store: card con Seller `@username` (link clickable).
   - Catálogo:
     - Tabs: "All" / por categorías.
     - Grid de productos: thumbnail, nombre, precio.
     - Estado vacío: caja 3D gris + "No hay productos aún".
   - Ficha de producto:
     - Carrusel de imágenes.
     - Nombre, descripción, precio.
     - Selector de variantes (si aplica).
     - Botón "Agregar al carrito".
   - Carrito:
     - Lista de items, cantidades, subtotal.
     - Input de cupón.
     - Selector de método de pago (solo los activados por el vendedor).
     - Formulario de checkout (campos requeridos configurados por vendedor).
   - Footer: "Seller @username" + "Powered By [NombreEmpresa]" (o texto/link personalizado si pagó white-label).

3. **Checkout:**
   - Stripe: redirect a Stripe Checkout o Payment Intent.
   - Telegram Stars: nativo via Telegram Payments API.
   - Efectivo: pedido queda "Pendiente de pago", vendedor confirma manualmente.
   - Smart Glocal / Unlimit: integración vía sus SDKs/webhooks.

**Criterios de aceptación:**
- [ ] Cliente puede comprar un producto de principio a fin en < 5 taps.
- [ ] Checkout refleja métodos de pago activos del vendedor.
- [ ] Pedido aparece en dashboard del vendedor en < 3 segundos.
- [ ] Share sheet funciona en iOS/Android/Desktop.

---

### SPRINT 7: Suscripciones, Planes y Monetización (Semana 8)
**Objetivo:** Sistema completo de cobro por suscripción y comisiones.

**Entregables:**
1. **Modelo de Planes (precios en USD):**

   | Plan | Precio Mensual | Precio Anual (-20%) | Productos | Categorías | Features |
   |------|---------------|---------------------|-----------|------------|----------|
   | **Starter** | $10 | $96 | 50 | 10 | Tienda básica, analytics simple, broadcast segmentado básico, soporte email. |
   | **Growth** | $25 | $240 | Ilimitado | Ilimitado | Todo Starter + colores personalizados, plantillas por vertical, variantes de producto, métodos de entrega avanzados, 3 gerentes. |
   | **Pro** | $49 | $470 | Ilimitado | Ilimitado | Todo Growth + marketing automation, entregas optimizadas (zonas, costos), 10 gerentes, prioridad soporte, API access. |

   **Nota:** Planes nombrados en Sprint 0. Los precios son referenciales y ajustables.

2. **Flujo de Suscripción:**
   - Trial de 20 días al crear tienda (plan Growth por defecto durante trial).
   - Al finalizar trial: elegir plan o downgrade a Starter free limitado (5 productos, 1 categoría, marca obligatoria).
   - Cobro vía Stripe (tarjeta) o Unlimit/Smart Glocal para LATAM.
   - Renovación automática mensual/anual.
   - Recordatorio 3 días antes de expiración.

3. **Comisión por Transacción:**
   - Starter: 3%
   - Growth: 2%
   - Pro: 1%
   - Pro anual: 0%
   - La comisión se retiene automáticamente del pago (Stripe Connect split) o se factura semanalmente si el pago fue en efectivo/Stars.

4. **Verificación (Insignia):**
   - Requisitos: 1,000 clientes + 500 pedidos completados.
   - O compra directa: 2,000 Telegram Stars (único uso de Stars en la plataforma).
   - Badge visible en tienda pública.

5. **Marca Personalizada (White-label):**
   - Retirar "Powered By [NombreEmpresa]" de la tienda pública.
   - Reemplazar por texto/link propio del vendedor.
   - Precio: $49 one-time o $15/mes (decisión Sprint 0).

**Criterios de aceptación:**
- [ ] Usuario puede suscribirse a un plan y pagar exitosamente.
- [ ] Comisión se calcula correctamente por plan.
- [ ] Downgrade automático al free si no renueva.
- [ ] Badge de verificación aparece solo si cumple requisitos o paga Stars.

---

### SPRINT 8: Marketing Automation + Entregas Optimizadas (Semana 9)
**Objetivo:** Funcionalidades diferenciadoras para planes superiores.

**Entregables:**
1. **Marketing Automation (Growth y Pro):**
   - Carrito abandonado: si el cliente agrega producto pero no compra en 1h → recordatorio automático vía bot hijo.
   - Post-compra: solicitud de review a los 7 días.
   - Re-engagement: "¿Te gustó? 10% off en tu próxima compra" a los 30 días sin compra.
   - Bienvenida: serie de 3 mensajes para nuevos clientes (día 0, 1, 3).
   - Editor visual simple de flows (condición → acción → delay).

2. **Entregas Optimizadas (Growth y Pro):**
   - Configuración de zonas de entrega con costos diferenciados.
   - Métodos: delivery propio, pickup, correo, on-request.
   - Calculadora de envío por ubicación del cliente.
   - Integración con servicios de tracking (backlog: API de correos locales).

3. **Broadcast Segmentado Avanzado (Pro):**
   - Segmentos custom: por categoría comprada, por monto total, por ubicación, por última compra.

**Criterios de aceptación:**
- [ ] Carrito abandonado envía mensaje en 1h con 90% confiabilidad.
- [ ] Entregas calculan costo correctamente por zona.
- [ ] Automation no envía spam (límite 1 mensaje cada 24h por cliente).

---

### SPRINT 9: DevOps, Testing y Deploy a Producción (Semana 10)
**Objetivo:** Producto listo para usuarios reales.

**Entregables:**
1. **Testing:**
   - Tests unitarios > 80% cobertura en backend.
   - Tests E2E de flujo crítico: onboarding → crear producto → comprar → recibir pedido.
   - Load testing: 500 usuarios concurrentes.

2. **Seguridad:**
   - Auditoría de dependencias (`npm audit`, `pip-audit`).
   - Sanitización de inputs, prevención de SQL injection.
   - Validación estricta de webhooks (secret tokens).
   - Rate limits agresivos en endpoints públicos.

3. **Deploy:**
   - Infraestructura en producción (Railway/Render/AWS).
   - SSL forzado.
   - Dominio propio para Mini-App.
   - Backups automáticos diarios de PostgreSQL.
   - Monitoreo: uptime, errores (Sentry), métricas (Prometheus/Grafana opcional).

4. **Documentación:**
   - `README.md` de deploy.
   - `API.md` con todos los endpoints.
   - Guía para el equipo de soporte.

**Criterios de aceptación:**
- [ ] Producción accesible y estable.
- [ ] Flujo E2E completo pasa sin errores.
- [ ] Backup restaurable verificado.

---

## 6. Especificaciones Funcionales por Módulo

### 6.1 Onboarding y Token Helper

**Flujo detallado:**
```
Usuario toca "Crear mi tienda"
  → Mini-App se abre con initData validado
  → Paso 1: Bienvenida + selector idioma
  → Paso 2: Form tienda (nombre, desc, categoría, canal)
  → Paso 3: Token Helper
       ├─ Botón "Abrir BotFather" (deep link t.me/BotFather?start=start)
       ├─ Tutorial inline paso a paso (ilustrado)
       ├─ Input token con validación regex + verificación getMe
       └─ Upsell: "20 días de prueba gratuita"
  → Validación OK
  → Backend crea tenant, configura webhook del bot hijo
  → Animación éxito → redirect a Dashboard
```

**Validación de token:**
- Regex: `^\d{6,}:[A-Za-z0-9_-]{35,}$`
- Backend hace POST a `https://api.telegram.org/bot{token}/getMe`
- Si 200 y `ok: true`: token válido. Extraer `username` del bot.
- Si 401/404: token inválido.
- Si username ya existe en tabla `shops`: token ya en uso.

### 6.2 Dashboard Admin — Estructura de UI

Replicar la estructura de lista vertical de Sellz pero mejorada:
- Cards con fondo `#1C1C1E`, radio 12px, padding 16px.
- Separación entre cards: 8px.
- Iconos a la izquierda (40x40, fondo circular con color de sección).
- Chevron derecho para navegar a sub-pantalla.
- Alertas: dot rojo 🔴 en icono cuando requiere acción.
- Header hero: imagen de portada (aspect 16:9) con overlay gradiente + nombre de tienda.

### 6.3 Mini-App Cliente — Estructura de UI

- Tema oscuro obligatorio. Fondo `#000000` o `#0A0A0A`.
- Hero banner: SVG pattern de iconos de compra + gradiente del color primario de marca.
- Tipografía blanca `#FFFFFF`, secundarios `#8E8E93`.
- Product cards: thumbnail cuadrado, nombre, precio en color primario.
- Footer siempre visible: "Powered By [NombreEmpresa]" (salvo white-label).

### 6.4 Pagos y Comisiones

**Comisión:**
- Se calcula sobre el total del pedido (sin envío).
- Si pago es Stripe: se usa Stripe Connect `application_fee_amount` para retener comisión automáticamente.
- Si pago es efectivo/Stars: se acumula en tabla `pending_commissions` y se factura semanalmente al vendedor (dashboard de deuda).

**Smart Glocal / Unlimit:**
- Implementar como providers opcionales en el módulo de pagos.
- Documentar sus APIs de checkout y webhooks.
- Fallback a Stripe si no están configurados.

---

## 7. Modelo de Datos (Resumen de Tablas Clave)

```sql
-- Usuarios (propietarios de tiendas)
users (id PK, telegram_id BIGINT UNIQUE, username, first_name, last_name, language_code, created_at)

-- Tiendas (tenants)
shops (id PK, owner_id FK, name, description, category, country, currency, 
       bot_token_hash VARCHAR, bot_username VARCHAR UNIQUE, status [active|suspended|trial],
       plan [starter|growth|pro], trial_ends_at, subscription_ends_at, 
       primary_color VARCHAR DEFAULT '#2D7FF9', cover_image_url, logo_url,
       welcome_message TEXT, min_order_amount DECIMAL,
       custom_brand_text, custom_brand_url, has_white_label BOOLEAN DEFAULT FALSE,
       is_verified BOOLEAN DEFAULT FALSE, created_at)

-- Configuración de métodos de pago por tienda
shop_payment_methods (id PK, shop_id FK, method [cash|stars|stripe|smartglocal|unlimit], 
                      is_active BOOLEAN, config JSONB)

-- Productos
products (id PK, shop_id FK, category_id FK, name, description, price DECIMAL, 
          stock INT, images TEXT[], status [active|draft|out_of_stock], 
          variants JSONB, views_count INT DEFAULT 0, created_at)

-- Pedidos
orders (id PK, shop_id FK, customer_id FK, items JSONB, subtotal DECIMAL, 
        delivery_cost DECIMAL, total DECIMAL, coupon_code, discount_amount DECIMAL,
        status [pending|paid|shipped|delivered|cancelled], 
        payment_method, payment_status, metadata JSONB, created_at)

-- Clientes (por tienda)
customers (id PK, shop_id FK, telegram_id BIGINT, username, contact_info JSONB,
           orders_count INT DEFAULT 0, total_spent DECIMAL DEFAULT 0, 
           last_order_at, created_at)

-- Suscripciones
subscriptions (id PK, shop_id FK, plan, billing_cycle [monthly|annual], 
               amount DECIMAL, currency, status [active|cancelled|past_due],
               provider [stripe|unlimit|smartglocal], provider_subscription_id,
               starts_at, ends_at, created_at)

-- Comisiones pendientes
commissions (id PK, shop_id FK, order_id FK, amount DECIMAL, 
             status [pending|paid|waived], created_at)

-- Eventos de analytics (MVP)
analytics_events (id PK, shop_id FK, event_type [shop_view|product_view|add_to_cart|purchase],
                  payload JSONB, created_at)
```

---

## 8. Modelo de Monetización Completo

| Ingreso | Mecánica | Plan Afectado |
|---------|----------|---------------|
| **Suscripción mensual** | Cobro recurrente vía Stripe/Unlimit/Smart Glocal | Todos |
| **Suscripción anual** | -20% vs mensual | Todos |
| **Comisión por venta** | 3% Starter, 2% Growth, 1% Pro, 0% Pro anual | Por transacción |
| **Marca personalizada** | $49 one-time o $15/mes | Opcional |
| **Verificación** | 2,000 Telegram Stars (único uso de Stars) | Opcional |
| **Overages** (backlog) | Cobro por productos extra si excede límite del plan | Starter |

**Cálculo de comisión:**
```
commission = order_subtotal * plan_commission_rate
net_to_seller = order_total - commission - payment_processor_fees
```

---

## 9. Backlog Post-MVP (Futuros Sprints)

| Prioridad | Feature | Descripción |
|-----------|---------|-------------|
| P1 | Analytics avanzados | GMV, AOV, tasa de conversión, funnel, cohortes, canales de origen |
| P1 | API pública | REST API para integraciones externas (plan Pro) |
| P2 | App móvil nativa | Wrapper de Mini-App o React Native |
| P2 | Marketplace de apps | Plugins de terceros (envíos, contabilidad) |
| P2 | IA para productos | Generación automática de descripciones y SEO |
| P3 | Multi-canal | WhatsApp Business API como canal adicional |
| P3 | POS físico | QR code para pagos en tienda física |
| P3 | Dropshipping | Integración con proveedores |

---

## 10. Notas de Implementación para el Agente de Coding

1. **Telegram Mini-App SDK:** Usar `window.Telegram.WebApp` para:
   - `initData` y `initDataUnsafe` (auth sin password).
   - `expand()` para pantalla completa.
   - `MainButton` y `BackButton` para navegación nativa.
   - `openInvoice()` para pagos con Stars.
   - `showPopup()` para confirmaciones.

2. **Multi-tenancy:** Cada request debe incluir `X-Shop-ID` o derivarlo del `initData` → `telegram_id` → `shops.owner_id`. Nunca confiar en `shop_id` del cliente sin validar ownership.

3. **BotFather Token Helper:** La validación de token debe ser server-side (nunca en frontend) para no exponer la lógica de verificación.

4. **Imágenes:** Usar presigned URLs de R2/S3. Limitar tamaño a 2MB por imagen. Generar thumbnails automáticamente.

5. **Webhooks:** Configurar un solo endpoint por bot. El backend enruta según el `bot_token` recibido en el payload de Telegram.

6. **Rate Limits:**
   - Bot API: máx 30 mensajes/segundo por bot.
   - Mini-App API: 100 req/min por usuario.
   - Webhook: aceptar y encolar, nunca procesar sincrónicamente si implica DB pesada.

7. **Idiomas:** Usar i18n (react-i18next). Archivos JSON por idioma. Idioma default del usuario viene en `initDataUnsafe.user.language_code`.

8. **Tema oscuro:** Forzar `color_scheme: 'dark'` en Telegram WebApp. No implementar light mode.

---

## 11. Checklist Final de Aceptación del Producto

- [ ] Usuario crea tienda en < 3 minutos sin salir de Telegram.
- [ ] Token Helper guía al usuario paso a paso con validación automática.
- [ ] Dashboard admin replica y mejora la funcionalidad de Sellz.
- [ ] Mini-App cliente permite compra completa en < 5 taps.
- [ ] Sistema de suscripción con trial 20 días y planes en USD funcional.
- [ ] Comisión por transacción calculada y retenida correctamente.
- [ ] Métodos de pago: Efectivo, Stars, Stripe, Smart Glocal, Unlimit configurables.
- [ ] Broadcast segmentado funcional.
- [ ] Marketing automation (carrito abandonado, re-engagement) funcional para planes superiores.
- [ ] Tema oscuro, color primario de marca, tipografía Inter, iconografía consistente.
- [ ] Producción estable, SSL, backups, monitoreo.

---

**Fin del Prompt.**
