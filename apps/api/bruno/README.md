# Vendy API — Bruno Collection

Colección de requests para testing de la API de Vendy usando [Bruno](https://www.usebruno.com/).

## 📁 Estructura

```
bruno/
├── bruno.json                    # Metadata de la colección
├── environments/
│   ├── local.bruenv              # http://localhost:3001
│   └── staging.bruenv            # https://api-staging.vendy.app
├── health-check.bru              # GET /health
├── auth/
│   ├── me.bru                    # GET /auth/me
│   ├── validate-bot-token.bru    # POST /auth/validate-bot-token
│   └── link-bot.bru              # POST /auth/link-bot
└── shops/
    ├── list.bru                  # GET /shops
    ├── create.bru                # POST /shops
    ├── get.bru                   # GET /shops/:id
    ├── update.bru                # PATCH /shops/:id
    └── delete.bru                # DELETE /shops/:id
```

## 🚀 Instalación

1. Instalar Bruno CLI (opcional, para CI/CD):
   ```bash
   npm install -g @usebruno/cli
   ```

2. Instalar Bruno Desktop (GUI):
   [Descargar desde usebruno.com](https://www.usebruno.com/downloads)

## 🔧 Configuración

### Variables de entorno

Las colecciones usan variables que se definen en los archivos `.bruenv`:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `baseUrl` | URL base de la API | `http://localhost:3001` |
| `initData` | initData de Telegram (firma válida) | `user=...&auth_date=...&hash=...` |
| `shopId` | ID de tienda para requests | `1` |

### Generar initData válido

Para probar los endpoints autenticados, necesitás un `initData` firmado correctamente. Usá el script:

```bash
cd apps/api
node scripts/generate-init-data.js
```

O generalo manualmente con el bot de prueba.

## 🧪 Uso

### Bruno Desktop (GUI)

1. Abrir Bruno
2. "Open Collection" → seleccionar `apps/api/bruno/`
3. Seleccionar environment (local o staging)
4. Ejecutar requests

### Bruno CLI (terminal/CI)

```bash
# Ejecutar toda la colección
cd apps/api/bruno
bru run --env local

# Ejecutar solo carpeta shops
bru run shops --env local

# Ejecutar con variables inline
bru run --env local --var initData="USER_INIT_DATA_HERE"
```

### Ejecutar en CI/CD (GitHub Actions)

```yaml
- name: API Tests
  run: |
    cd apps/api/bruno
    bru run --env local
```

## 📋 Requests disponibles

### Health
- `GET /health` — Verificar que el servidor está corriendo

### Auth
- `GET /auth/me` — Obtener usuario actual (crea/retorna user en DB)
- `POST /auth/validate-bot-token` — Validar token de BotFather
- `POST /auth/link-bot` — Vincular bot a tienda

### Shops (CRUD)
- `GET /shops` — Listar tiendas del usuario autenticado
- `POST /shops` — Crear nueva tienda (trial 20 días, plan GROWTH)
- `GET /shops/:id` — Obtener tienda específica (con settings, categories, counts)
- `PATCH /shops/:id` — Actualizar tienda (solo owner)
- `DELETE /shops/:id` — Eliminar tienda (soft delete, solo owner)

## 🔒 Autenticación

Todos los endpoints protegidos requieren el header:

```
X-Telegram-Init-Data: user={...}&auth_date=...&hash=...
```

El `initData` debe ser firmado con el token del bot padre (`TELEGRAM_BOT_TOKEN_PARENT`).

## 📝 Notas

- Los scripts `post-response` guardan variables automáticamente (shopId, shopName, etc.)
- El `shopId` se actualiza dinámicamente después de crear una tienda
- Las aserciones verifican status codes y estructura de respuesta
- Los tests incluyen validación de tipos (isNumber, isString, isArray, etc.)

## 🐛 Troubleshooting

### "Invalid initData signature"
El `initData` en el environment no está firmado correctamente. Generá uno nuevo con el script de prueba.

### "You do not have access to this shop"
El usuario del `initData` no es owner ni manager de la tienda. Creá una tienda primero con `POST /shops`.

### "Shop not found"
El `shopId` no existe o fue eliminado. Verificá que el valor sea correcto.
