# SPRINT 13: Go-Live, Documentación de Usuario y Onboarding

> **Guía paso a paso para preparar el lanzamiento de Vendy**
> **Optimizado para migración a la nube sin fricciones**
>
> **Regla:** Seguí cada paso exactamente como está escrito. No saltear ninguno.

---

## ANTES DE EMPEZAR

### Requisitos Previos

| Requisito | Verificación | Si no lo tenés...
|-----------|-------------|-------------------|
| Sprint 12 completado | Grafana funciona, alertas llegan | Completá el Sprint 12 primero |
| Bot de Vendy funcionando | `@vendy_bot` responde en Telegram | Revisá el Sprint 5 |
| Mini-App accesible | `https://app.vendy.app` carga | Revisá el Sprint 11 |
| API funcionando | `https://api.vendy.app/health` responde 200 | Revisá el Sprint 11 |

---

## TICKET 1: Guía de Usuario para Comerciantes

**Tiempo estimado:** 60-90 minutos
**Dificultad:** Baja
**Resultado:** Documentación completa para que un comerciante pueda usar Vendy sin ayuda

---

### PARTE A: Crear guía de inicio rápido

**PASO 1: Crear `docs/user-guides/quickstart.md`**

1. En tu Mac, creá el archivo:

```markdown
# Guía de Inicio Rápido - Vendy

## ¿Qué es Vendy?

Vendy es una plataforma que te permite crear tu propia tienda online dentro de Telegram. Tus clientes pueden comprar tus productos sin salir de la app.

## Requisitos

- Tener una cuenta de Telegram
- Tener productos para vender

## Paso 1: Crear tu tienda

1. Abrí el bot `@vendy_bot` en Telegram
2. Escribí `/start`
3. Tocá el botón "Abrir Vendy" o "Abrir App" (el botón que aparece al lado del teclado)
4. Se abre la Mini-App de Vendy dentro de Telegram
5. Elige "Crear nueva tienda"
6. Escribe el nombre de tu tienda
7. Escribe una descripción breve
8. Elige tu moneda (USD, PYG, etc.)

> **¿Qué es la Mini-App?** Es una aplicación web que funciona dentro de Telegram. No necesitás descargar nada extra. Tocás el botón y se abre como si fuera parte de Telegram.

> **¿Por qué no veo el botón?** Si no ves el botón "Abrir App", asegurate de que el bot tenga configurado el menú button en @BotFather. Verificá la configuración en el Paso 4 del Ticket 6 del Sprint 11.

## Paso 2: Agregar productos

1. En el menú principal, elige "Productos"
2. Toca "Agregar producto"
3. Completa:
   - Nombre del producto
   - Descripción
   - Precio
   - Stock disponible
   - Foto (opcional)
4. Toca "Guardar"

## Paso 3: Configurar pagos

1. Ve a "Configuración" → "Pagos"
2. Elige tu método de pago:
   - Stripe (tarjetas internacionales)
   - Transferencia bancaria
   - Efectivo (contra entrega)
3. Completa los datos requeridos

## Paso 3: Compartir tu tienda

1. Ve a "Configuración" → "Compartir"
2. Copiá el link de tu tienda
3. Compártelo en tus redes sociales, grupos de WhatsApp, etc.

> **Formato del link:** `https://t.me/vendy_bot?start=shop_123`
> 
> Este link abre el bot de Vendy y automáticamente te muestra la tienda del comerciante. Tus clientes no necesitan buscar nada.

## Paso 4: Gestionar órdenes

1. Cuando alguien compra, recibirás una notificación
2. Ve a "Órdenes" en el bot
3. Revisa los detalles
4. Marca como "Enviado" cuando despaches

## Precios

| Plan | Precio | Comisión | Productos | Tiendas |
|------|--------|----------|-----------|---------|
| Inicial | Gratis | 3% | 50 | 1 |
| Crecimiento | $15/mes | 2% | Ilimitados | 3 |
| Pro | $45/mes | 1% | Ilimitados | Ilimitadas |

## Soporte

¿Necesitás ayuda? Escribinos a soporte@vendy.app o usa el bot `@vendy_soporte_bot`.

> **¿Por qué todo dentro de Telegram?** Vendy funciona completamente dentro de Telegram. No necesitás descargar apps extra. Tus clientes ya usan Telegram, así que comprar es tan fácil como enviar un mensaje.
```

2. Guardá el archivo

**PASO 2: Crear guía de productos**

1. Creá `docs/user-guides/products.md`:

```markdown
# Guía de Productos

## Crear un producto

1. Desde el bot, ve a "Productos" → "Nuevo"
2. Completá los campos:
   - **Nombre**: Nombre corto y descriptivo
   - **Descripción**: Detalles, materiales, tamaños, etc.
   - **Precio**: En tu moneda configurada
   - **Stock**: Cantidad disponible
   - **SKU**: Código interno (opcional)
   - **Categoría**: Para organizar tu catálogo
   - **Imágenes**: Hasta 5 fotos por producto

## Variantes

Si tu producto tiene opciones (tallas, colores):

1. Creá el producto base
2. Ve a "Variantes" → "Agregar variante"
3. Elegí el tipo (talla, color, etc.)
4. Agregá las opciones con precio y stock

Ejemplo:
- Camiseta Vendy
  - Talla S: $29.99 (stock: 10)
  - Talla M: $29.99 (stock: 15)
  - Talla L: $29.99 (stock: 8)

## Gestión de stock

- El stock se descuenta automáticamente con cada venta
- Cuando un producto llega a 0, se marca como "Agotado"
- Podés recibir alertas cuando el stock sea bajo

## Categorías

Organizá tus productos en categorías:
- Ropa
- Electrónica
- Hogar
- Alimentos
- etc.

Las categorías ayudan a tus clientes a encontrar productos más fácilmente.
```

2. Guardá el archivo

**PASO 3: Crear guía de órdenes**

1. Creá `docs/user-guides/orders.md`:

```markdown
# Guía de Órdenes

## Estados de una orden

| Estado | Significado | Acción del vendedor |
|--------|-------------|---------------------|
| Pendiente | Cliente hizo el pedido | Confirmar stock |
| Procesando | Pago confirmado | Preparar envío |
| Enviado | Producto despachado | Compartir tracking |
| Entregado | Cliente recibió | Solicitar review |
| Cancelado | Orden anulada | Reponer stock |

## Flujo de trabajo

### 1. Recibir notificación

Cuando alguien compra:
- Notificación push en Telegram
- Email (si configuraste)
- Aparece en "Órdenes" → "Nuevas"

### 2. Ver detalles

Tocá la orden para ver:
- Productos comprados
- Datos del cliente
- Dirección de envío
- Método de pago
- Notas del cliente

### 3. Procesar envío

1. Prepará el producto
2. Empacalo bien
3. Enviá por el método elegido
4. Agregá el número de tracking
5. Marcá como "Enviado"

### 4. Seguimiento

- El cliente puede ver el estado en tiempo real
- Recibe notificaciones de cambios de estado
- Puede contactarte si hay problemas

### 5. Completar

Cuando el cliente confirma recepción:
- La orden se marca como "Entregada"
- El pago se libera (si usaste Stripe)
- Podés solicitar una review

## Reembolsos

Si necesitás reembolsar:
1. Ve a la orden
2. Tocá "Reembolsar"
3. Elegí: total o parcial
4. Indicá el motivo
5. Confirmá

El cliente recibe el reembolso en 5-10 días hábiles (Stripe).
```

2. Guardá el archivo

---

### PARTE B: Crear guía de pagos

**PASO 4: Crear `docs/user-guides/payments.md`**

```markdown
# Guía de Pagos

## Métodos de pago soportados

### Stripe (Tarjetas internacionales)

**Ventajas:**
- Acepta Visa, Mastercard, Amex
- Pagos instantáneos
- Seguro y confiable

**Configuración:**
1. Creá cuenta en https://stripe.com
2. Conectá tu cuenta bancaria
3. Copiá tu "Secret Key" desde el dashboard
4. Pegala en Vendy: Configuración → Pagos → Stripe

**Comisión:**
- Stripe: 2.9% + $0.30 por transacción
- Vendy: según tu plan (1-3%)

### Transferencia bancaria

**Ventajas:**
- Sin comisión de procesador
- Ideal para clientes locales

**Configuración:**
1. Ve a Configuración → Pagos → Transferencia
2. Agregá tus datos bancarios:
   - Banco
   - Número de cuenta
   - Tipo de cuenta
   - Titular
3. Guardá

**Proceso:**
1. Cliente hace el pedido
2. Recibe los datos para transferir
3. Te envía el comprobante por Telegram
4. Confirmás el pago manualmente
5. Marcás la orden como "Pagada"

### Efectivo (contra entrega)

**Ventajas:**
- Sin comisión
- Ideal para delivery local

**Configuración:**
1. Ve a Configuración → Pagos → Efectivo
2. Definí zonas de entrega
3. Definí costo de envío (si aplica)

**Proceso:**
1. Cliente hace el pedido
2. Vos preparás y entregás
3. Cobrás en efectivo
4. Marcás la orden como "Pagada"

## Retiros de fondos

### Stripe
- Automático cada 7 días a tu cuenta bancaria
- O manual desde el dashboard de Stripe

### Transferencia/Efectivo
- El dinero va directo a vos
- No hay intermediarios

## Reportes de ventas

Ve a "Reportes" en el bot para ver:
- Ventas por día/semana/mes
- Productos más vendidos
- Métodos de pago más usados
- Comisiones pagadas a Vendy
```

2. Guardá el archivo

---

### PARTE C: Commitear documentación de usuario

**PASO 5: Subir a GitHub**

```bash
cd /Users/marcelo/Desktop/Proyectos/Vendy
git add docs/user-guides/
git commit -m "docs: add user guides for merchants"
git push origin develop
```

---

## TICKET 1: CHECKLIST DE VERIFICACIÓN

- [ ] `docs/user-guides/quickstart.md` creado
- [ ] `docs/user-guides/products.md` creado
- [ ] `docs/user-guides/orders.md` creado
- [ ] `docs/user-guides/payments.md` creado
- [ ] Documentación commiteada y subida

---

---

## TICKET 2: Guía de Usuario para Clientes (Compradores)

**Tiempo estimado:** 45-60 minutos
**Dificultad:** Baja
**Resultado:** Los clientes saben cómo comprar sin confusión

---

### PARTE A: Crear guía del comprador

**PASO 1: Crear `docs/user-guides/buyer-guide.md`**

```markdown
# Guía del Comprador - Cómo comprar en Vendy

## ¿Qué es Vendy?

Vendy te permite comprar productos de tus tiendas favoritas directamente dentro de Telegram. No necesitás descargar otra app.

## Paso 1: Encontrar una tienda

### Opción A: Link directo (más fácil)
1. El vendedor te comparte un link (ej: `https://t.me/vendy_bot?start=shop_123`)
2. Tocá el link
3. Se abre el bot de Vendy con la tienda del vendedor
4. Tocá "Abrir App" para ver los productos

> **¿Qué es el link?** Es un link especial de Telegram que abre el bot de Vendy y automáticamente te muestra la tienda del vendedor. No necesitás buscar nada.

### Opción B: Buscar en el bot
1. Abrí `@vendy_bot` en Telegram
2. Escribí `/start`
3. Tocá "Abrir App" (el botón al lado del teclado)
4. Elegí "Explorar tiendas"
5. Buscá por nombre o categoría

> **¿No ves el botón?** Asegurate de que el bot esté configurado. Si no ves "Abrir App", escribí `/start` de nuevo.

## Paso 2: Ver productos

1. En la tienda, tocá "Ver productos"
2. Navegá por categorías o usá la búsqueda
3. Tocá un producto para ver detalles:
   - Fotos
   - Descripción
   - Precio
   - Stock disponible
   - Variantes (talla, color, etc.)

## Paso 3: Agregar al carrito

1. Elegí la variante (si aplica)
2. Elegí la cantidad
3. Tocá "Agregar al carrito"
4. Repetí para más productos

## Paso 4: Revisar carrito

1. Tocá el ícono del carrito 🛒
2. Revisá los productos
3. Ajustá cantidades o eliminá productos
4. Tocá "Continuar"

## Paso 5: Datos de envío

1. Verificá tu nombre y teléfono
2. Escribí tu dirección completa:
   - Calle y número
   - Ciudad
   - Barrio
   - Referencias (color de casa, etc.)
3. Elegí método de envío:
   - Delivery (si aplica)
   - Retiro en tienda
   - Correo

## Paso 6: Pago

### Con tarjeta (Stripe)
1. Elegí "Pagar con tarjeta"
2. Ingresá los datos de tu tarjeta
3. Confirmá el pago
4. Recibí confirmación instantánea

### Transferencia bancaria
1. Elegí "Transferencia"
2. Anotá los datos bancarios del vendedor
3. Hacé la transferencia desde tu banco
4. Enviá el comprobante por Telegram
5. Esperá confirmación del vendedor

### Efectivo
1. Elegí "Efectivo"
2. Coordiná con el vendedor
3. Pagá al recibir el producto

## Paso 7: Seguimiento

Después de comprar:
1. Recibí confirmación con número de orden
2. Seguí el estado en tiempo real:
   - 📦 Pendiente
   - 🔄 Procesando
   - 🚚 Enviado
   - ✅ Entregado
3. Si hay tracking, tocá "Ver ruta"

## Paso 8: Recibir producto

Cuando llegue:
1. Revisá que todo esté correcto
2. Confirmá recepción en el bot
3. Dejá una review (opcional pero ayuda mucho!)

## Dudas o problemas

¿Algo salió mal?
1. Abrí el bot
2. Ve a "Mis órdenes"
3. Tocá la orden con problema
4. Elegí "Necesito ayuda"
5. Describí el problema

El vendedor te responderá por Telegram.

## ¿Por qué comprar dentro de Telegram?

- **No descargás nada extra**: Todo funciona dentro de Telegram
- **Sin registro**: Usás tu cuenta de Telegram directamente
- **Rápido**: Un par de toques y listo
- **Seguro**: Telegram encripta tus mensajes
- **Notificaciones instantáneas**: Sabés en tiempo real el estado de tu orden
```

2. Guardá el archivo

**PASO 2: Crear FAQ para compradores**

1. Creá `docs/user-guides/buyer-faq.md`:

```markdown
# Preguntas Frecuentes - Compradores

## ¿Es seguro pagar con tarjeta?

Sí. Usamos Stripe, uno de los procesadores más seguros del mundo. Tus datos de tarjeta nunca los vemos nosotros ni el vendedor. Stripe los procesa directamente.

## ¿Qué pasa si no me llega el producto?

Contactá al vendedor por Telegram. Si no responde en 48 horas, podés abrir un ticket de soporte con nosotros.

## ¿Puedo cancelar una orden?

Sí, pero depende del estado:
- **Pendiente**: Cancelá sin problema
- **Procesando**: Consultá con el vendedor
- **Enviado**: No se puede cancelar, pero podés rechazar la entrega

## ¿Cómo sé que mi pago se procesó?

Recibís confirmación instantánea en Telegram. También podés ver el estado en "Mis órdenes".

## ¿Los precios incluyen envío?

Depende del vendedor. Algunos incluyen envío, otros lo cobran aparte. Siempre se muestra el costo total antes de pagar.

## ¿Puedo devolver un producto?

Las políticas de devolución las define cada vendedor. Consultá antes de comprar.

## ¿Necesito crear una cuenta?

No. Con tu cuenta de Telegram ya podés comprar. No necesitás contraseñas ni emails.

## ¿Mis datos están seguros?

Sí. Solo compartimos con el vendedor:
- Tu nombre de Telegram
- Tu dirección de envío
- Tu teléfono (si lo proporcionás)

No compartimos tu email ni datos de pago.
```

2. Guardá el archivo

**PASO 3: Subir a GitHub**

```bash
cd /Users/marcelo/Desktop/Proyectos/Vendy
git add docs/user-guides/
git commit -m "docs: add buyer guide and FAQ"
git push origin develop
```

---

## TICKET 2: CHECKLIST DE VERIFICACIÓN

- [ ] `docs/user-guides/buyer-guide.md` creado
- [ ] `docs/user-guides/buyer-faq.md` creado
- [ ] Documentación commiteada y subida

---

---

## TICKET 3: Checklist de Go-Live (Pre-lanzamiento)

**Tiempo estimado:** 60-90 minutos
**Dificultad:** Media
**Resultado:** Lista de verificación para asegurar que todo está listo antes de lanzar

---

### PARTE A: Crear checklist de go-live

**PASO 1: Crear `docs/go-live-checklist.md`**

```markdown
# Checklist de Go-Live

## Fecha de lanzamiento: ___________

---

## 1. Infraestructura

- [ ] Dell Optiplex 3060 encendida y funcionando
- [ ] Docker Compose levantado (`docker compose ps` muestra todo "Up")
- [ ] API responde en `https://api.vendy.app/health`
- [ ] Mini-App carga en `https://app.vendy.app`
- [ ] Bots responden en Telegram
- [ ] PostgreSQL accesible
- [ ] Redis accesible
- [ ] Traefik funcionando (dashboard en :8080)
- [ ] SSL válido en todos los dominios
- [ ] DuckDNS actualizando IP correctamente
- [ ] Port forwarding funcionando en el router
- [ ] UFW activado con reglas correctas
- [ ] Backups automáticos configurados (cron)

## 2. Monitoreo

- [ ] Prometheus funcionando (`https://prometheus.vendy.app`)
- [ ] Grafana funcionando (`https://grafana.vendy.app`)
- [ ] Dashboards configurados
- [ ] UptimeRobot monitoreando 3 URLs
- [ ] Alertas de Telegram funcionando (probar: apagar API 5 min)
- [ ] Script de alertas locales en cron
- [ ] Health checks pasando

## 3. Funcionalidad

- [ ] Registro de comerciantes funciona
- [ ] Creación de tiendas funciona
- [ ] Agregar productos funciona
- [ ] Carrito de compras funciona
- [ ] Checkout funciona
- [ ] Pagos con Stripe funcionan (probar con tarjeta de test)
- [ ] Pagos por transferencia funcionan
- [ ] Notificaciones de Telegram llegan
- [ ] Panel de órdenes funciona
- [ ] Cambio de estados de órdenes funciona
- [ ] Reviews funcionan
- [ ] Búsqueda de productos funciona
- [ ] Filtros por categoría funcionan
- [ ] **Bot padre responde a `/start`** (NUEVO)
- [ ] **Mini-App se abre desde el bot** (NUEVO)
- [ ] **initData se valida correctamente** (NUEVO)
- [ ] **Links de referidos funcionan** (NUEVO)
- [ ] **Webhooks de Telegram reciben updates** (NUEVO)

## 4. Seguridad

- [ ] JWT secrets son fuertes (generados con openssl)
- [ ] Webhook secrets configurados
- [ ] .env no está en el repo (verificar .gitignore)
- [ ] PostgreSQL no expuesto a internet
- [ ] Redis no expuesto a internet
- [ ] Traefik maneja SSL correctamente
- [ ] Cloudflare protege contra DDoS
- [ ] Fail2ban activado en la Dell
- [ ] UFW bloquea puertos no usados
- [ ] Backups encriptados (opcional)

## 5. Rendimiento

- [ ] API responde en < 200ms (probar con `curl -w "%{time_total}\n"`)
- [ ] Mini-App carga en < 3 segundos
- [ ] PostgreSQL queries < 100ms
- [ ] Redis < 10ms
- [ ] RAM usada < 70% (verificar con `htop`)
- [ ] Disco usado < 80% (verificar con `df -h`)
- [ ] Load average < 4 (para 4 cores)

## 6. Contenido

- [ ] Términos de servicio escritos
- [ ] Política de privacidad escrita
- [ ] Guía de usuario para comerciantes completa
- [ ] Guía de usuario para compradores completa
- [ ] FAQ actualizado
- [ ] Precios claros y visibles
- [ ] Métodos de pago documentados
- [ ] Política de reembolsos definida
- [ ] Contacto de soporte visible

## 7. Marketing

- [ ] Landing page creada (opcional)
- [ ] Redes sociales creadas (Instagram, Facebook, Twitter/X)
- [ ] Primeros comerciantes contactados
- [ ] Material promocional preparado
- [ ] Video tutorial grabado (opcional)
- [ ] **Bot de Telegram configurado con descripción atractiva** (NUEVO)
- [ ] **Link de referido funciona: `https://t.me/vendy_bot?start=shop_XXX`** (NUEVO)

## 8. Legal

- [ ] Términos de servicio revisados por abogado (opcional)
- [ ] Política de privacidad cumple GDPR/LGPD (si aplica)
- [ ] Registro de marca (opcional)
- [ ] Contrato con comerciantes definido
- [ ] Política de comisiones clara

## 9. Soporte

- [ ] Bot de soporte configurado
- [ ] Tickets de soporte funcionan
- [ ] Horario de atención definido
- [ ] Canal de comunicación con comerciantes (grupo de Telegram)
- [ ] Documentación de troubleshooting interna

## 10. Post-lanzamiento

- [ ] Plan de monitoreo las primeras 48 horas
- [ ] Escalamiento de problemas definido
- [ ] Comunicación con usuarios preparada
- [ ] Rollback plan si algo falla grave
- [ ] Métricas de éxito definidas (usuarios, ventas, etc.)

---

## Firmas

| Rol | Nombre | Firma | Fecha |
|-----|--------|-------|-------|
| Técnico | | | |
| Producto | | | |
| Legal | | | |
| Marketing | | | |

---

## Notas

_Agregar cualquier nota o preocupación aquí:_

```

2. Guardá el archivo

---

### PARTE B: Crear documentos legales

**PASO 2: Crear `docs/legal/terms-of-service.md`**

```markdown
# Términos de Servicio - Vendy

## 1. Aceptación de términos

Al usar Vendy, aceptás estos términos. Si no estás de acuerdo, no uses el servicio.

## 2. Descripción del servicio

Vendy es una plataforma que permite a comerciantes crear tiendas online dentro de Telegram.

## 3. Elegibilidad

- Debes tener al menos 18 años
- Debes tener una cuenta de Telegram válida
- Debes proporcionar información veraz

## 4. Cuentas de comerciantes

- Sos responsable de mantener la seguridad de tu cuenta
- No podés compartir tu cuenta con terceros
- Vendy puede suspender cuentas que violen estos términos

## 5. Productos y contenido

- No podés vender productos ilegales
- No podés vender productos que infrinjan derechos de autor
- Sos responsable de la calidad de tus productos
- Vendy no es responsable de disputas entre comerciantes y compradores

## 6. Pagos y comisiones

- Vendy cobra una comisión por cada venta según tu plan
- Los pagos se procesan a través de terceros (Stripe, etc.)
- Vendy no almacena datos de tarjetas de crédito

## 7. Cancelación

- Podés cancelar tu cuenta en cualquier momento
- Las órdenes pendientes deben completarse antes de cancelar
- No hay reembolso de planes pagados

## 8. Limitación de responsabilidad

Vendy no es responsable por:
- Pérdidas indirectas o consecuenciales
- Problemas técnicos fuera de nuestro control
- Conducta de comerciantes o compradores

## 9. Cambios a los términos

Podemos modificar estos términos en cualquier momento. Los cambios entran en vigor al publicarse.

## 10. Contacto

Para preguntas sobre estos términos: legal@vendy.app

---

Última actualización: [FECHA]
```

2. Guardá el archivo

**PASO 3: Crear `docs/legal/privacy-policy.md`**

```markdown
# Política de Privacidad - Vendy

## 1. Información que recopilamos

### De comerciantes:
- Nombre y email
- Información de la tienda
- Datos de pago (procesados por Stripe, no almacenados por nosotros)
- Historial de ventas

### De compradores:
- Nombre de Telegram
- Dirección de envío
- Teléfono (opcional)
- Historial de compras

## 2. Cómo usamos la información

- Para proporcionar el servicio
- Para procesar pagos
- Para enviar notificaciones
- Para mejorar el servicio
- Para cumplir con obligaciones legales

## 3. Compartir información

No vendemos tu información personal. Compartimos solo con:
- Procesadores de pago (Stripe)
- Proveedores de servicios (hosting, etc.)
- Cuando la ley lo requiere

## 4. Seguridad

- Usamos encriptación SSL/TLS
- Datos almacenados en servidores seguros
- Acceso restringido a empleados autorizados

## 5. Tus derechos

- Acceder a tu información
- Corregir información incorrecta
- Eliminar tu cuenta y datos
- Oponerte al procesamiento de datos

## 6. Retención

- Mantenemos datos mientras tu cuenta esté activa
- Eliminamos datos 30 días después de cancelar tu cuenta
- Datos de transacciones se retienen por obligaciones legales

## 7. Cookies

No usamos cookies tradicionales. Usamos almacenamiento local del navegador para la Mini-App.

## 8. Cambios a esta política

Podemos actualizar esta política. Te notificaremos de cambios significativos.

## 9. Contacto

Para preguntas sobre privacidad: privacy@vendy.app

---

Última actualización: [FECHA]
```

2. Guardá el archivo

**PASO 4: Subir a GitHub**

```bash
cd /Users/marcelo/Desktop/Proyectos/Vendy
git add docs/
git commit -m "docs: add go-live checklist and legal documents"
git push origin develop
```

---

## TICKET 3: CHECKLIST DE VERIFICACIÓN

- [ ] `docs/go-live-checklist.md` creado
- [ ] `docs/legal/terms-of-service.md` creado
- [ ] `docs/legal/privacy-policy.md` creado
- [ ] Documentación commiteada y subida

---

---

## TICKET 4: Landing Page + Redes Sociales (Opcional)

**Tiempo estimado:** 45-60 minutos
**Dificultad:** Baja
**Resultado:** Presencia web básica para atraer comerciantes

---

### PARTE A: Crear landing page simple

**PASO 1: Crear `landing-page/index.html`**

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vendy - Tu tienda en Telegram</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            color: #fff;
            line-height: 1.6;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        header {
            padding: 20px 0;
            border-bottom: 1px solid #333;
        }
        .logo { font-size: 24px; font-weight: bold; color: #FF7403; }
        .hero {
            padding: 100px 0;
            text-align: center;
        }
        .hero h1 {
            font-size: 48px;
            margin-bottom: 20px;
        }
        .hero .highlight { color: #FF7403; }
        .hero p {
            font-size: 20px;
            color: #aaa;
            margin-bottom: 40px;
        }
        .btn {
            display: inline-block;
            padding: 15px 40px;
            background: #FF7403;
            color: #fff;
            text-decoration: none;
            border-radius: 8px;
            font-size: 18px;
            font-weight: bold;
        }
        .btn:hover { background: #e66800; }
        .features {
            padding: 80px 0;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 40px;
        }
        .feature {
            padding: 30px;
            background: #1a1a1a;
            border-radius: 12px;
        }
        .feature h3 { color: #FF7403; margin-bottom: 10px; }
        .feature p { color: #aaa; }
        .pricing {
            padding: 80px 0;
            text-align: center;
        }
        .pricing h2 { font-size: 36px; margin-bottom: 40px; }
        .plans {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 30px;
        }
        .plan {
            padding: 40px;
            background: #1a1a1a;
            border-radius: 12px;
            border: 2px solid #333;
        }
        .plan.popular { border-color: #FF7403; }
        .plan h3 { font-size: 24px; margin-bottom: 10px; }
        .plan .price { font-size: 36px; color: #FF7403; margin-bottom: 20px; }
        .plan ul { list-style: none; text-align: left; }
        .plan ul li { padding: 10px 0; border-bottom: 1px solid #333; }
        footer {
            padding: 40px 0;
            text-align: center;
            border-top: 1px solid #333;
            color: #666;
        }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <div class="logo">Vendy</div>
        </div>
    </header>

    <section class="hero">
        <div class="container">
            <h1>Tu tienda en <span class="highlight">Telegram</span></h1>
            <p>Vendé tus productos sin que tus clientes salgan de la app.<br>
            Sin complicaciones. Sin apps extra. Sin costos ocultos.<br>
            <strong>Funciona completamente dentro de Telegram.</strong></p>
            <a href="https://t.me/vendy_bot?start=landing" class="btn">Empezar gratis</a>
            <p style="margin-top: 20px; font-size: 14px; color: #888;">
                👆 Tocá el botón para abrir el bot de Vendy en Telegram
            </p>
        </div>
    </section>

    <section class="features">
        <div class="container">
            <div class="feature">
                <h3>🚀 Rápido</h3>
                <p>Creá tu tienda en minutos. Tus clientes compran en segundos.</p>
            </div>
            <div class="feature">
                <h3>💰 Económico</h3>
                <p>Empezá gratis. Pagá solo cuando creces. Comisiones desde 1%.</p>
            </div>
            <div class="feature">
                <h3>🔒 Seguro</h3>
                <p>Pagos con Stripe. SSL encriptado. Tus datos protegidos.</p>
            </div>
            <div class="feature">
                <h3>📱 Simple</h3>
                <p>Tus clientes no necesitan descargar nada. Todo dentro de Telegram. Solo tocan un botón y compran.</p>
            </div>
        </div>
    </section>

    <section class="pricing">
        <div class="container">
            <h2>Planes</h2>
            <div class="plans">
                <div class="plan">
                    <h3>Inicial</h3>
                    <div class="price">Gratis</div>
                    <ul>
                        <li>1 tienda</li>
                        <li>50 productos</li>
                        <li>3% comisión</li>
                        <li>Soporte por email</li>
                    </ul>
                </div>
                <div class="plan popular">
                    <h3>Crecimiento</h3>
                    <div class="price">$15/mes</div>
                    <ul>
                        <li>3 tiendas</li>
                        <li>Productos ilimitados</li>
                        <li>2% comisión</li>
                        <li>Soporte prioritario</li>
                    </ul>
                </div>
                <div class="plan">
                    <h3>Pro</h3>
                    <div class="price">$45/mes</div>
                    <ul>
                        <li>Tiendas ilimitadas</li>
                        <li>Productos ilimitados</li>
                        <li>1% comisión</li>
                        <li>Soporte 24/7</li>
                    </ul>
                </div>
            </div>
        </div>
    </section>

    <footer>
        <div class="container">
            <p>© 2024 Vendy. Todos los derechos reservados.</p>
            <p><a href="/terms" style="color: #666;">Términos</a> · <a href="/privacy" style="color: #666;">Privacidad</a></p>
        </div>
    </footer>
</body>
</html>
```

2. Guardá el archivo

**PASO 2: Servir landing page desde la Dell**

1. Agregá al `docker-compose.yml`:

```yaml
  # ==========================================
  # LANDING PAGE
  # ==========================================
  landing:
    image: nginx:alpine
    container_name: vendy-landing
    restart: unless-stopped
    volumes:
      - ./landing-page:/usr/share/nginx/html:ro
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.landing.rule=Host(`vendy.app`) || Host(`www.vendy.app`)"
      - "traefik.http.routers.landing.entrypoints=websecure"
      - "traefik.http.routers.landing.tls.certresolver=letsencrypt"
      - "traefik.http.services.landing.loadbalancer.server.port=80"
    networks:
      - vendy-public
```

2. Guardá y commiteá:

```bash
cd /Users/marcelo/Desktop/Proyectos/Vendy
git add landing-page/ docker-compose.yml
git commit -m "feat: add landing page"
git push origin develop
```

---

## TICKET 4: CHECKLIST DE VERIFICACIÓN

- [ ] Landing page creada
- [ ] Landing page servida desde la Dell
- [ ] `vendy.app` muestra la landing page

---

---

## SPRINT 13: CHECKLIST FINAL

- [ ] Guía de inicio rápido para comerciantes
- [ ] Guía de productos
- [ ] Guía de órdenes
- [ ] Guía de pagos
- [ ] Guía del comprador
- [ ] FAQ para compradores
- [ ] Checklist de go-live completo
- [ ] Términos de servicio
- [ ] Política de privacidad
- [ ] Landing page (opcional)
- [ ] Todo commiteado y subido a GitHub

---

## COSTOS DEL SPRINT 13

| Servicio | Costo | Notas |
|----------|-------|-------|
| Landing page | $0 | HTML estático, sirve Nginx |
| Redes sociales | $0 | Crear cuentas gratis |
| **Total** | **$0** | |

---

## RESUMEN DE TODOS LOS SPRINTS (0-13)

| Sprint | Estado | Descripción |
|--------|--------|-------------|
| 0 | ✅ | Setup inicial (monorepo, Docker, Prisma) |
| 1 | ✅ | Autenticación (JWT, registro, login) |
| 2 | ✅ | Tiendas (CRUD, slug, settings) |
| 3 | ✅ | Productos (CRUD, imágenes, variantes) |
| 4 | ✅ | Órdenes (carrito, checkout, estados) |
| 5 | ✅ | Bots de Telegram (padre, hijo, webhooks) |
| 6 | ✅ | Mini-App (React, catálogo, checkout UI) |
| 7 | ✅ | Pagos (Stripe, transferencia, efectivo) |
| 8 | ✅ | Panel de admin (dashboard, métricas) |
| 9 | ✅ | Soporte (tickets, chat, FAQ) |
| 10 | ✅ | Documentación técnica (API, DB, arquitectura) |
| 11 | ✅ | Infraestructura (self-hosted, Docker, Traefik) |
| 12 | ✅ | Monitoreo (Grafana, Prometheus, alertas) |
| 13 | ✅ | Go-live (documentación de usuario, legal) |

---

## COSTO TOTAL MENSUAL (SELF-HOSTED)

| Concepto | Costo |
|----------|-------|
| Electricidad (Dell 24/7) | ~$15/mes |
| Dominio | ~$1/mes |
| Cloudflare | $0 |
| DuckDNS | $0 |
| UptimeRobot | $0 |
| **TOTAL** | **~$16/mes** |

## COSTO TOTAL MENSUAL (SI MIGRÁS A NUBE)

| Concepto | Costo |
|----------|-------|
| Railway Pro | $20/mes |
| Railway PostgreSQL | $10/mes |
| Railway Redis | $5/mes |
| Vercel Pro | $20/mes |
| Cloudflare | $0 |
| Dominio | $1/mes |
| **Total** | **~$16/mes** | |

---

## RESUMEN DE TODOS LOS SPRINTS (0-13) - ACTUALIZADO

| Sprint | Estado | Descripción | Tickets |
|--------|--------|-------------|---------|
| 0 | ✅ | Setup inicial (monorepo, Docker, Prisma) | 4 |
| 1 | ✅ | Autenticación (JWT, registro, login) | 4 |
| 2 | ✅ | Tiendas (CRUD, slug, settings) | 4 |
| 3 | ✅ | Productos (CRUD, imágenes, variantes) | 4 |
| 4 | ✅ | Órdenes (carrito, checkout, estados) | 4 |
| 5 | ✅ | Bots de Telegram (padre, hijo, webhooks) | 4 |
| 6 | ✅ | Mini-App (React, catálogo, checkout UI) | 4 |
| 7 | ✅ | Pagos (Stripe, transferencia, efectivo) | 4 |
| 8 | ✅ | Panel de admin (dashboard, métricas) | 4 |
| 9 | ✅ | Soporte (tickets, chat, FAQ) | 4 |
| 10 | ✅ | Documentación técnica (API, DB, arquitectura) | 4 |
| 11 | ✅ | Infraestructura (self-hosted, Docker, Traefik) | **6** (incluye Telegram Production) |
| 12 | ✅ | Monitoreo (Grafana, Prometheus, alertas) | **4** (incluye métricas de bots) |
| 13 | ✅ | Go-live (documentación de usuario, legal) | 4 |

**Total: 58 tickets completados**

---

## ¿Y AHORA QUÉ?

Una vez completado el Sprint 13, tu plataforma está lista para:

1. **Atraer comerciantes** - Compartí el bot `@vendy_bot` con tu link de referido
2. **Procesar ventas reales** - Configurá Stripe en modo producción
3. **Monitorear todo** - Grafana + Prometheus + métricas de bots
4. **Escalar** - Cuando llegues a 300+ clientes, considerá migrar a la nube
5. **Monetizar** - Cobrá comisiones por cada venta

**¡Felicidades! Tenés una plataforma de ecommerce completa, self-hosted, monitoreada, integrada con Telegram y lista para producción.**

---

**¿Listo para lanzar? 🚀**
