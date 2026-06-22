#!/bin/bash
# ==========================================
# SETUP LOCAL DE VENDY
# ==========================================
# Script de instalación automatizada para desarrollo local
# Uso: ./scripts/setup-local.sh

set -e  # Exit on error

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
REQUIRED_NODE_VERSION="18.0.0"
REQUIRED_PNPM_VERSION="8.0.0"
REQUIRED_DOCKER_VERSION="24.0.0"

# Funciones
print_header() {
    echo ""
    echo "=========================================="
    echo "  $1"
    echo "=========================================="
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

check_command() {
    if command -v "$1" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

compare_versions() {
    # Returns 0 if $1 >= $2
    printf '%s\n%s\n' "$2" "$1" | sort -V -C
}

# ==========================================
# INICIO DEL SCRIPT
# ==========================================

clear
print_header "Setup Local de Vendy"
echo ""

# Verificar sistema operativo
OS="$(uname -s)"
case "${OS}" in
    Linux*)     PLATFORM=Linux;;
    Darwin*)    PLATFORM=Mac;;
    CYGWIN*|MINGW*|MSYS*) PLATFORM=Windows;;
    *)          PLATFORM="UNKNOWN:${OS}"
esac

print_info "Sistema operativo detectado: $PLATFORM"

# ==========================================
# 1. VERIFICAR NODE.JS
# ==========================================
print_header "1. Verificando Node.js"

if check_command node; then
    NODE_VERSION=$(node --version | sed 's/v//')
    if compare_versions "$NODE_VERSION" "$REQUIRED_NODE_VERSION"; then
        print_success "Node.js $NODE_VERSION instalado"
    else
        print_error "Node.js $NODE_VERSION es muy viejo. Se requiere >= $REQUIRED_NODE_VERSION"
        print_info "Instalá Node.js desde https://nodejs.org/"
        exit 1
    fi
else
    print_error "Node.js no está instalado"
    print_info "Instalá Node.js desde https://nodejs.org/"
    exit 1
fi

# ==========================================
# 2. VERIFICAR PNPM
# ==========================================
print_header "2. Verificando pnpm"

if check_command pnpm; then
    PNPM_VERSION=$(pnpm --version)
    if compare_versions "$PNPM_VERSION" "$REQUIRED_PNPM_VERSION"; then
        print_success "pnpm $PNPM_VERSION instalado"
    else
        print_warning "pnpm $PNPM_VERSION es viejo. Actualizando..."
        npm install -g pnpm
        print_success "pnpm actualizado"
    fi
else
    print_warning "pnpm no está instalado. Instalando..."
    npm install -g pnpm
    print_success "pnpm instalado"
fi

# ==========================================
# 3. VERIFICAR DOCKER
# ==========================================
print_header "3. Verificando Docker"

if check_command docker; then
    DOCKER_VERSION=$(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    if compare_versions "$DOCKER_VERSION" "$REQUIRED_DOCKER_VERSION"; then
        print_success "Docker $DOCKER_VERSION instalado"
    else
        print_warning "Docker $DOCKER_VERSION puede ser viejo. Se recomienda >= $REQUIRED_DOCKER_VERSION"
    fi
else
    print_error "Docker no está instalado"
    print_info "Instalá Docker desde https://docker.com/"
    exit 1
fi

# Verificar Docker Compose
if docker compose version > /dev/null 2>&1; then
    print_success "Docker Compose disponible"
else
    print_error "Docker Compose no está disponible"
    print_info "Asegurate de tener Docker Desktop (Mac/Windows) o docker-compose-plugin (Linux)"
    exit 1
fi

# Verificar que Docker daemon está corriendo
if docker info > /dev/null 2>&1; then
    print_success "Docker daemon está corriendo"
else
    print_error "Docker daemon no está corriendo"
    print_info "Iniciá Docker Desktop o ejecutá: sudo systemctl start docker"
    exit 1
fi

# ==========================================
# 4. INSTALAR DEPENDENCIAS
# ==========================================
print_header "4. Instalando dependencias"

if [ -f "pnpm-lock.yaml" ]; then
    print_info "Instalando desde pnpm-lock.yaml..."
    pnpm install --frozen-lockfile
else
    print_info "Instalando dependencias..."
    pnpm install
fi

print_success "Dependencias instaladas"

# ==========================================
# 5. CONFIGURAR VARIABLES DE ENTORNO
# ==========================================
print_header "5. Configurando variables de entorno"

if [ -f ".env" ]; then
    print_warning ".env ya existe. ¿Querés sobrescribirlo? (s/N)"
    read -r response
    if [[ ! "$response" =~ ^[Ss]$ ]]; then
        print_info "Manteniendo .env existente"
    else
        cp .env.example .env
        print_success ".env creado desde .env.example"
    fi
else
    cp .env.example .env
    print_success ".env creado desde .env.example"
fi

print_warning "IMPORTANTE: Editá .env con tus valores antes de continuar"
print_info "Presioná Enter cuando estés listo para continuar..."
read -r

# ==========================================
# 6. LEVANTAR INFRAESTRUCTURA
# ==========================================
print_header "6. Levantando infraestructura (Docker)"

cd infra/docker

# Verificar si ya están corriendo
if docker compose ps | grep -q "Up"; then
    print_warning "Algunos contenedores ya están corriendo"
    print_info "Reiniciando..."
    docker compose down
fi

docker compose up -d

print_success "Infraestructura levantada"
print_info "PostgreSQL: localhost:5432"
print_info "Redis: localhost:6379"
print_info "Adminer: http://localhost:8080"

# Esperar a que PostgreSQL esté listo
print_info "Esperando a que PostgreSQL esté listo..."
sleep 5

until docker compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
    print_info "Esperando PostgreSQL..."
    sleep 2
done

print_success "PostgreSQL listo"

cd ../..

# ==========================================
# 7. EJECUTAR MIGRACIONES
# ==========================================
print_header "7. Ejecutando migraciones de Prisma"

cd apps/api

if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations)" ]; then
    print_info "Aplicando migraciones existentes..."
    npx prisma migrate deploy
else
    print_info "Creando migración inicial..."
    npx prisma migrate dev --name init
fi

print_success "Migraciones aplicadas"

# ==========================================
# 8. GENERAR PRISMA CLIENT
# ==========================================
print_header "8. Generando Prisma Client"

npx prisma generate

print_success "Prisma Client generado"

# ==========================================
# 9. SEED DE DATOS (opcional)
# ==========================================
print_header "9. Datos de desarrollo"

print_info "¿Querés cargar datos de ejemplo? (S/n)"
read -r seed_response

if [[ ! "$seed_response" =~ ^[Nn]$ ]]; then
    npx prisma db seed
    print_success "Datos de ejemplo cargados"
else
    print_info "Saltando seed de datos"
fi

cd ../..

# ==========================================
# 10. BUILD DE PAQUETES INTERNOS
# ==========================================
print_header "10. Building paquetes internos"

pnpm build:packages

print_success "Paquetes internos compilados"

# ==========================================
# 11. VERIFICACIÓN FINAL
# ==========================================
print_header "11. Verificación final"

# Verificar health check
print_info "Verificando API health..."
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    print_success "API respondiendo en http://localhost:3001"
else
    print_warning "API no está corriendo todavía (es normal, iniciá el dev server)"
fi

# ==========================================
# RESUMEN
# ==========================================
print_header "✅ Setup completado!"

echo ""
echo "Próximos pasos:"
echo ""
echo "1. Iniciar desarrollo:"
echo "   pnpm dev              # Todo junto"
echo "   pnpm dev:api          # Solo API"
echo "   pnpm dev:mini-app     # Solo Mini-App"
echo ""
echo "2. Verificar instalación:"
echo "   curl http://localhost:3001/health"
echo ""
echo "3. Abrir Mini-App:"
echo "   http://localhost:5173"
echo ""
echo "4. Gestionar base de datos:"
echo "   http://localhost:8080 (Adminer)"
echo ""
echo "5. Documentación:"
echo "   docs/installation/README.md"
echo ""
print_info "Si tenés problemas, consultá docs/installation/troubleshooting.md"
