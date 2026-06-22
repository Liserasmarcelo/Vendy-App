#!/bin/bash
# ==========================================
# SCRIPT DE DIAGNÓSTICO DE VENDY
# ==========================================
# Uso: ./scripts/diagnose.sh

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

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
    ((ERRORS++))
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

check_command() {
    command -v "$1" > /dev/null 2>&1
}

# ==========================================
# INICIO
# ==========================================

clear
print_header "Diagnóstico de Vendy"
echo "Fecha: $(date)"
echo "OS: $(uname -s) $(uname -r)"
echo ""

# ==========================================
# 1. NODE.JS
# ==========================================
print_header "1. Node.js"

if check_command node; then
    NODE_VERSION=$(node --version)
    print_success "Node.js: $NODE_VERSION"
else
    print_error "Node.js no instalado"
fi

# ==========================================
# 2. PNPM
# ==========================================
print_header "2. pnpm"

if check_command pnpm; then
    PNPM_VERSION=$(pnpm --version)
    print_success "pnpm: $PNPM_VERSION"
else
    print_error "pnpm no instalado"
fi

# ==========================================
# 3. DOCKER
# ==========================================
print_header "3. Docker"

if check_command docker; then
    DOCKER_VERSION=$(docker --version)
    print_success "$DOCKER_VERSION"
    
    if docker info > /dev/null 2>&1; then
        print_success "Docker daemon corriendo"
    else
        print_error "Docker daemon no corriendo"
    fi
    
    if docker compose version > /dev/null 2>&1; then
        print_success "Docker Compose disponible"
    else
        print_error "Docker Compose no disponible"
    fi
else
    print_error "Docker no instalado"
fi

# ==========================================
# 4. INFRAESTRUCTURA DOCKER
# ==========================================
print_header "4. Infraestructura Docker"

if [ -f "infra/docker/docker-compose.yml" ]; then
    cd infra/docker
    
    # PostgreSQL
    if docker compose ps | grep -q "postgres.*Up"; then
        print_success "PostgreSQL corriendo"
        
        # Verificar conectividad
        if docker compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
            print_success "PostgreSQL responde a conexiones"
        else
            print_error "PostgreSQL no responde a conexiones"
        fi
    else
        print_error "PostgreSQL no corriendo"
    fi
    
    # Redis
    if docker compose ps | grep -q "redis.*Up"; then
        print_success "Redis corriendo"
        
        if docker compose exec -T redis redis-cli ping > /dev/null 2>&1; then
            print_success "Redis responde a PING"
        else
            print_error "Redis no responde"
        fi
    else
        print_error "Redis no corriendo"
    fi
    
    cd ../..
else
    print_error "docker-compose.yml no encontrado"
fi

# ==========================================
# 5. VARIABLES DE ENTORNO
# ==========================================
print_header "5. Variables de entorno"

if [ -f ".env" ]; then
    print_success ".env existe"
    
    # Verificar variables clave
    REQUIRED_VARS=(
        "DATABASE_URL"
        "REDIS_URL"
        "PARENT_BOT_TOKEN"
        "CHILD_BOT_TOKEN"
        "JWT_SECRET"
        "JWT_REFRESH_SECRET"
    )
    
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^$VAR=" .env && [ "$(grep "^$VAR=" .env | cut -d= -f2)" != "" ]; then
            print_success "$VAR configurado"
        else
            print_error "$VAR faltante o vacío"
        fi
    done
else
    print_error ".env no existe"
fi

# ==========================================
# 6. PUERTOS
# ==========================================
print_header "6. Puertos"

PORTS=(3001 5173 5432 6379 8080)
PORT_NAMES=("API" "Mini-App" "PostgreSQL" "Redis" "Adminer")

for i in "${!PORTS[@]}"; do
    port="${PORTS[$i]}"
    name="${PORT_NAMES[$i]}"
    
    if lsof -i :$port > /dev/null 2>&1; then
        print_success "Puerto $port ($name) en uso"
    else
        print_warning "Puerto $port ($name) libre"
    fi
done

# ==========================================
# 7. DEPENDENCIAS
# ==========================================
print_header "7. Dependencias"

if [ -d "node_modules" ]; then
    print_success "node_modules existe"
    
    # Verificar paquetes clave
    if [ -d "node_modules/fastify" ]; then
        print_success "Fastify instalado"
    else
        print_error "Fastify no instalado"
    fi
    
    if [ -d "node_modules/react" ]; then
        print_success "React instalado"
    else
        print_error "React no instalado"
    fi
    
    if [ -d "node_modules/@prisma/client" ]; then
        print_success "Prisma Client instalado"
    else
        print_error "Prisma Client no instalado"
    fi
else
    print_error "node_modules no existe. Ejecutá: pnpm install"
fi

# ==========================================
# 8. PRISMA
# ==========================================
print_header "8. Prisma"

if [ -f "apps/api/prisma/schema.prisma" ]; then
    print_success "schema.prisma existe"
    
    if [ -d "apps/api/node_modules/.prisma/client" ]; then
        print_success "Prisma Client generado"
    else
        print_warning "Prisma Client no generado. Ejecutá: cd apps/api && npx prisma generate"
    fi
    
    # Verificar migraciones
    if [ -d "apps/api/prisma/migrations" ] && [ "$(ls -A apps/api/prisma/migrations)" ]; then
        print_success "Migraciones existen"
    else
        print_warning "No hay migraciones. Ejecutá: cd apps/api && npx prisma migrate dev"
    fi
else
    print_error "schema.prisma no encontrado"
fi

# ==========================================
# 9. GIT
# ==========================================
print_header "9. Git"

if check_command git; then
    GIT_VERSION=$(git --version)
    print_success "$GIT_VERSION"
    
    if [ -d ".git" ]; then
        print_success "Repositorio Git inicializado"
        
        BRANCH=$(git branch --show-current)
        print_info "Branch actual: $BRANCH"
        
        # Verificar si hay cambios sin commitear
        if git diff --quiet; then
            print_success "No hay cambios sin commitear"
        else
            print_warning "Hay cambios sin commitear"
        fi
    else
        print_warning "No es un repositorio Git"
    fi
else
    print_error "Git no instalado"
fi

# ==========================================
# 10. DISCO
# ==========================================
print_header "10. Espacio en disco"

if check_command df; then
    DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
    DISK_AVAIL=$(df -h . | awk 'NR==2 {print $4}')
    
    if [ "$DISK_USAGE" -lt 80 ]; then
        print_success "Uso de disco: ${DISK_USAGE}% ($DISK_AVAIL disponible)"
    else
        print_warning "Uso de disco: ${DISK_USAGE}% ($DISK_AVAIL disponible)"
    fi
else
    print_warning "No se pudo verificar espacio en disco"
fi

# ==========================================
# RESUMEN
# ==========================================
print_header "Resumen"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    print_success "¡Todo está en orden! 🎉"
elif [ $ERRORS -eq 0 ]; then
    print_warning "Hay $WARNINGS advertencias. Revisalas arriba."
else
    print_error "Hay $ERRORS errores y $WARNINGS advertencias. Corregí los errores antes de continuar."
fi

echo ""
echo "Para más ayuda: docs/installation/troubleshooting.md"
