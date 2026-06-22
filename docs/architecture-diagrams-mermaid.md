# Arquitectura Vendy - Diagrama Mermaid

## Diagrama de Flujo Completo (Mermaid)

```mermaid
graph TB
    subgraph Internet["🌐 Internet"]
        Cloudflare["Cloudflare<br/>DNS + SSL + CDN + DDoS"]
    end

    subgraph Router["🏠 Router (Casa/Oficina)"]
        PortForwarding["Port Forwarding<br/>443 → Dell"]
    end

    subgraph Dell["🖥️ Dell Optiplex 3060<br/>Ubuntu Server 22.04"]
        subgraph Docker["🐳 Docker Compose"]
            Traefik["Traefik<br/>Reverse Proxy + SSL<br/>Let's Encrypt"]
            
            subgraph API["⚡ API (Fastify + Node.js)"]
                Fastify["Fastify Server<br/>Port 3001"]
                WebhookRoute["/webhook<br/>Telegram Updates"]
                APIRoutes["/api/*<br/>Endpoints"]
                MetricsRoute["/metrics<br/>Prometheus"]
                HealthRoute["/health<br/>Health Check"]
                
                subgraph Middleware["Middleware"]
                    Auth["authenticateTelegram<br/>Valida initData"]
                    RateLimit["Rate Limiting<br/>Redis Sliding Window"]
                    CORS["CORS<br/>Telegram Domains"]
                end
                
                subgraph Services["Services"]
                    BotService["Bot Service<br/>Telegraf (grammy)"]
                    PaymentService["Payment Service<br/>Stripe + Webhooks"]
                    NotificationService["Notification Service<br/>Telegram Bot API"]
                end
                
                subgraph Libs["Libraries"]
                    InitData["initData.ts<br/>HMAC-SHA256 Validation"]
                    Metrics["metrics.ts<br/>Prometheus Client"]
                end
            end
            
            subgraph MiniApp["📱 Mini-App (React + Vite)"]
                Nginx["Nginx<br/>Port 80"]
                React["React App<br/>@twa-dev/sdk"]
                ApiClient["ApiClient.ts<br/>X-Telegram-Init-Data"]
                TelegramHelpers["telegram.ts<br/>WebApp Helpers"]
            end
            
            subgraph Database["🗄️ Base de Datos"]
                Postgres[(PostgreSQL<br/>Port 5432)]
                Redis[(Redis<br/>Port 6379)]
            end
            
            subgraph Monitoring["📊 Monitoreo"]
                Prometheus[(Prometheus<br/>Port 9090)]
                Grafana[(Grafana<br/>Port 3000)]
                NodeExporter["Node Exporter"]
                PostgresExporter["PostgreSQL Exporter"]
                RedisExporter["Redis Exporter"]
            end
            
            subgraph Bots["🤖 Bots Telegram"]
                BotParent["Bot Padre<br/>@vendy_bot<br/>Onboarding + Admin"]
                BotChild["Bot Hijo<br/>@vendy_shop_bot<br/>Catálogo + Checkout"]
            end
        end
    end

    subgraph Telegram["💬 Telegram"]
        BotFather["@BotFather<br/>Configuración"]
        User["Usuario<br/>Telegram App"]
        MiniAppView["Mini-App View<br/>Dentro de Telegram"]
    end

    subgraph External["🔗 Servicios Externos"]
        Stripe["Stripe<br/>Pagos"]
        DuckDNS["DuckDNS<br/>IP Dinámica"]
        UptimeRobot["UptimeRobot<br/>Monitoreo Externo"]
    end

    %% Flujos de Internet
    Cloudflare --> PortForwarding
    PortForwarding --> Traefik
    
    %% Traefik Routing
    Traefik --> Fastify
    Traefik --> Nginx
    Traefik --> Prometheus
    Traefik --> Grafana
    
    %% API Internals
    Fastify --> WebhookRoute
    Fastify --> APIRoutes
    Fastify --> MetricsRoute
    Fastify --> HealthRoute
    
    APIRoutes --> Auth
    Auth --> InitData
    Auth --> RateLimit
    Auth --> CORS
    
    WebhookRoute --> BotService
    BotService --> BotParent
    BotService --> BotChild
    
    APIRoutes --> PaymentService
    PaymentService --> Stripe
    
    APIRoutes --> NotificationService
    NotificationService --> BotParent
    
    %% Mini-App
    Nginx --> React
    React --> ApiClient
    React --> TelegramHelpers
    ApiClient --> Auth
    
    %% Database
    Fastify --> Postgres
    Fastify --> Redis
    BotService --> Postgres
    BotService --> Redis
    
    %% Monitoring
    Prometheus --> NodeExporter
    Prometheus --> PostgresExporter
    Prometheus --> RedisExporter
    Prometheus --> MetricsRoute
    Grafana --> Prometheus
    
    %% Telegram Flow
    User --> BotFather
    BotFather --> BotParent
    User --> BotParent
    BotParent --> MiniAppView
    MiniAppView --> ApiClient
    
    %% External
    Dell --> DuckDNS
    DuckDNS --> Cloudflare
    UptimeRobot --> Cloudflare
    
    %% Webhooks
    Stripe --> WebhookRoute
    Telegram --> WebhookRoute

    %% Estilos
    style Cloudflare fill:#f9f,stroke:#333,stroke-width:2px
    style Traefik fill:#ff7403,stroke:#333,stroke-width:2px
    style Fastify fill:#ff7403,stroke:#333,stroke-width:2px
    style React fill:#61dafb,stroke:#333,stroke-width:2px
    style Postgres fill:#336791,stroke:#333,stroke-width:2px,color:#fff
    style Redis fill:#dc382d,stroke:#333,stroke-width:2px,color:#fff
    style Prometheus fill:#e6522c,stroke:#333,stroke-width:2px,color:#fff
    style Grafana fill:#f46800,stroke:#333,stroke-width:2px,color:#fff
    style BotParent fill:#0088cc,stroke:#333,stroke-width:2px,color:#fff
    style BotChild fill:#0088cc,stroke:#333,stroke-width:2px,color:#fff
    style User fill:#0088cc,stroke:#333,stroke-width:2px,color:#fff
    style Stripe fill:#635bff,stroke:#333,stroke-width:2px,color:#fff
```

---

## Diagrama de Secuencia - Flujo de Autenticación

```mermaid
sequenceDiagram
    participant U as Usuario
    participant T as Telegram App
    participant BF as @BotFather
    participant BP as Bot Padre<br/>@vendy_bot
    participant MA as Mini-App<br/>(React)
    participant API as API<br/>(Fastify)
    participant ID as initData.ts<br/>HMAC-SHA256
    participant DB as PostgreSQL

    U->>BF: 1. Crear bot /mybots
    BF-->>U: 2. Token: 123456...XYZ
    
    U->>BF: 3. /setcommands
    U->>BF: 4. /setmenubutton<br/>URL: https://app.vendy.app
    U->>BF: 5. Configure Mini App<br/>URL: https://app.vendy.app
    
    U->>BP: 6. /start
    BP->>T: 7. Botón "Abrir Vendy"
    
    U->>T: 8. Toca "Abrir Vendy"
    T->>MA: 9. Abre Mini-App<br/>initData firmado
    
    MA->>MA: 10. Lee initData<br/>window.Telegram.WebApp.initData
    
    MA->>API: 11. GET /api/products<br/>Header: X-Telegram-Init-Data
    
    API->>ID: 12. validateInitData(data, token)
    ID->>ID: 13. Extrae hash
    ID->>ID: 14. Ordena params<br/>alfabéticamente
    ID->>ID: 15. Calcula HMAC-SHA256<br/>(WebAppData + token)
    ID->>ID: 16. Compara hash
    
    alt initData VÁLIDO
        ID-->>API: 17a. { valid: true, user: {...} }
        API->>DB: 18a. Query productos
        DB-->>API: 19a. Resultados
        API-->>MA: 20a. JSON + 200 OK
        MA->>U: 21a. Muestra productos
    else initData INVÁLIDO
        ID-->>API: 17b. { valid: false, error: "Invalid hash" }
        API-->>MA: 18b. 401 Unauthorized
        MA->>U: 19b. "Error de autenticación"
    end
```

---

## Diagrama de Secuencia - Flujo de Compra

```mermaid
sequenceDiagram
    participant U as Usuario<br/>(Comprador)
    participant T as Telegram
    participant MA as Mini-App
    participant API as API
    participant Stripe as Stripe
    participant Bot as Bot Hijo<br/>(Vendedor)
    
    U->>T: 1. Abre link de tienda<br/>t.me/vendy_bot?start=shop_123
    T->>MA: 2. Abre Mini-App<br/>con shop_id=123
    
    MA->>API: 3. GET /shops/123/products<br/>+ initData
    API-->>MA: 4. Lista de productos
    MA->>U: 5. Muestra catálogo
    
    U->>MA: 6. Agrega al carrito
    MA->>API: 7. POST /cart<br/>+ initData + items
    API-->>MA: 8. Carrito actualizado
    
    U->>MA: 9. Checkout
    MA->>API: 10. POST /orders<br/>+ initData + shipping
    API->>API: 11. Crea orden<br/>estado: PENDING
    API->>Stripe: 12. Crear PaymentIntent
    Stripe-->>API: 13. client_secret
    API-->>MA: 14. Orden + client_secret
    
    U->>MA: 15. Ingresa tarjeta
    MA->>Stripe: 16. Confirmar pago<br/>(Stripe.js)
    Stripe-->>MA: 17. Pago exitoso
    
    MA->>API: 18. POST /webhook/stripe<br/>confirmar orden
    API->>API: 19. Actualiza orden<br/>estado: PAID
    API->>Bot: 20. Notificar vendedor<br/>Nueva orden #1234
    
    Bot->>U: 21. Notificación<br/>"Tu orden está confirmada"
    
    U->>MA: 22. Ver seguimiento
    MA->>API: 23. GET /orders/1234<br/>+ initData
    API-->>MA: 24. Estado: PAID → SHIPPED
    MA->>U: 25. Muestra tracking
```

---

## Diagrama de Infraestructura - Self-Hosted

```mermaid
graph LR
    subgraph "Internet"
        CF[Cloudflare]
        DD[DuckDNS]
        UR[UptimeRobot]
    end
    
    subgraph "Router"
        PF[Port Forwarding<br/>443 → 192.168.1.100]
    end
    
    subgraph "Dell Optiplex 3060"
        subgraph "Docker Network"
            T[Traefik<br/>:80, :443]
            
            subgraph "API Services"
                F[Fastify<br/>:3001]
                W[Webhook Handler]
                A[Auth Middleware]
            end
            
            subgraph "Frontend"
                N[Nginx<br/>:80]
                R[React Mini-App]
            end
            
            subgraph "Data"
                P[(PostgreSQL<br/>:5432)]
                Re[(Redis<br/>:6379)]
            end
            
            subgraph "Monitoring"
                Pr[(Prometheus<br/>:9090)]
                G[(Grafana<br/>:3000)]
            end
        end
    end
    
    CF --> PF
    PF --> T
    T --> F
    T --> N
    T --> Pr
    T --> G
    
    F --> P
    F --> Re
    F --> W
    W --> A
    
    N --> R
    R --> F
    
    Pr --> F
    G --> Pr
    
    DD --> CF
    UR --> CF
    
    style CF fill:#f9f,stroke:#333
    style T fill:#ff7403,stroke:#333
    style F fill:#ff7403,stroke:#333
    style P fill:#336791,stroke:#333,color:#fff
    style Re fill:#dc382d,stroke:#333,color:#fff
    style Pr fill:#e6522c,stroke:#333,color:#fff
    style G fill:#f46800,stroke:#333,color:#fff
```

---

## Diagrama de Componentes - Mini-App

```mermaid
graph TB
    subgraph "Telegram WebApp"
        InitData[window.Telegram.WebApp.initData]
        Theme[window.Telegram.WebApp.themeParams]
        Haptic[window.Telegram.WebApp.HapticFeedback]
        MainButton[window.Telegram.WebApp.MainButton]
        BackButton[window.Telegram.WebApp.BackButton]
    end
    
    subgraph "Mini-App React"
        subgraph "Core"
            App[App.tsx]
            Router[React Router]
            Context[AuthContext]
        end
        
        subgraph "Pages"
            Home[Home Page]
            Catalog[Catalog Page]
            Product[Product Page]
            Cart[Cart Page]
            Checkout[Checkout Page]
            Orders[Orders Page]
        end
        
        subgraph "Components"
            Header[Header<br/>+ theme colors]
            ProductCard[ProductCard]
            CartItem[CartItem]
            PaymentForm[PaymentForm<br/>Stripe Elements]
        end
        
        subgraph "Services"
            ApiClient[ApiClient.ts<br/>+ X-Telegram-Init-Data]
            TelegramHelpers[telegram.ts<br/>WebApp helpers]
            StripeClient[stripe.ts<br/>Payment processing]
        end
    end
    
    InitData --> ApiClient
    Theme --> App
    Haptic --> ProductCard
    MainButton --> Checkout
    BackButton --> Router
    
    App --> Router
    Router --> Home
    Router --> Catalog
    Router --> Product
    Router --> Cart
    Router --> Checkout
    Router --> Orders
    
    Catalog --> ProductCard
    Product --> ProductCard
    Cart --> CartItem
    Checkout --> PaymentForm
    
    ApiClient --> Catalog
    ApiClient --> Product
    ApiClient --> Cart
    ApiClient --> Checkout
    ApiClient --> Orders
    
    TelegramHelpers --> App
    StripeClient --> PaymentForm
    
    style InitData fill:#0088cc,stroke:#333,color:#fff
    style ApiClient fill:#ff7403,stroke:#333
    style App fill:#61dafb,stroke:#333
    style PaymentForm fill:#635bff,stroke:#333,color:#fff
```

---

## Diagrama de Despliegue - CI/CD

```mermaid
graph LR
    subgraph "Developer"
        Dev[Developer<br/>MacBook]
        Git[Git<br/>Local commits]
    end
    
    subgraph "GitHub"
        Repo[GitHub Repo<br/>origin/develop]
        Actions[GitHub Actions]
        
        subgraph "CI Pipeline"
            Lint[ESLint<br/>+ Prettier]
            Test[Vitest<br/>Unit Tests]
            Build[Docker Build<br/>Multi-stage]
        end
    end
    
    subgraph "Dell Optiplex 3060"
        SSH[SSH<br/>~/deploy.sh]
        Docker[Docker Compose<br/>Pull & Up]
        
        subgraph "Running Services"
            API[API Container]
            APP[Mini-App Container]
            DB[Postgres Container]
            Cache[Redis Container]
        end
    end
    
    Dev --> Git
    Git --> Repo
    Repo --> Actions
    Actions --> Lint
    Lint --> Test
    Test --> Build
    Build --> SSH
    SSH --> Docker
    Docker --> API
    Docker --> APP
    Docker --> DB
    Docker --> Cache
    
    style Dev fill:#ff7403,stroke:#333
    style Actions fill:#2088ff,stroke:#333,color:#fff
    style Docker fill:#2496ed,stroke:#333,color:#fff
    style API fill:#ff7403,stroke:#333
    style APP fill:#61dafb,stroke:#333
```

---

## Cómo usar estos diagramas

### En GitHub/GitLab
Estos diagramas usan **Mermaid**, que se renderiza nativamente en:
- GitHub Markdown (README.md, PRs, Issues)
- GitLab Markdown
- Notion (bloque Mermaid)
- VS Code (extensión Markdown Preview Mermaid Support)

### En documentación
Copiá el bloque ` ```mermaid ` completo y pegalo en cualquier archivo `.md`.

### Para exportar como imagen
1. Usá [Mermaid Live Editor](https://mermaid.live)
2. Pegá el código
3. Descargá como SVG, PNG o PDF

---

## Archivo fuente

Este archivo está en:
`/Users/marcelo/Desktop/Proyectos/Vendy/docs/architecture-diagrams-mermaid.md`
