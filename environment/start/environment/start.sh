#!/bin/bash

# ==========================================
# Student Activity Portal - Start Environment
# ==========================================

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"

echo "=========================================="
echo "  Student Activity Portal - Starting..."
echo "=========================================="

# ------------------------------------------
# 1. Stop & remove old containers if exist
# ------------------------------------------
for CONTAINER in clb_database_container clb_redis_container; do
  if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
    echo "[1/5] Removing existing container: $CONTAINER"
    docker rm -f "$CONTAINER"
  fi
done

# ------------------------------------------
# 2. Start services via docker-compose
# ------------------------------------------
echo "[2/5] Starting PostgreSQL + Redis..."
docker compose -f "$PROJECT_ROOT/docker-compose.yml" up -d

# ------------------------------------------
# 3. Wait for PostgreSQL to be healthy
# ------------------------------------------
echo "[3/5] Waiting for PostgreSQL to be ready..."

MAX_RETRIES=30
RETRY=0

until docker exec clb_database_container pg_isready -U root -d clb_db > /dev/null 2>&1; do
  RETRY=$((RETRY + 1))
  if [ "$RETRY" -ge "$MAX_RETRIES" ]; then
    echo "ERROR: PostgreSQL did not become ready in time."
    exit 1
  fi
  echo "  Waiting... ($RETRY/$MAX_RETRIES)"
  sleep 2
done

echo "  PostgreSQL is ready!"

# ------------------------------------------
# 4. Wait for Redis to be healthy
# ------------------------------------------
echo "[4/5] Waiting for Redis to be ready..."

RETRY=0

until docker exec clb_redis_container redis-cli ping 2>/dev/null | grep -q "PONG"; do
  RETRY=$((RETRY + 1))
  if [ "$RETRY" -ge "$MAX_RETRIES" ]; then
    echo "ERROR: Redis did not become ready in time."
    exit 1
  fi
  echo "  Waiting... ($RETRY/$MAX_RETRIES)"
  sleep 2
done

echo "  Redis is ready!"

# ------------------------------------------
# 5. Generate Prisma Client
# ------------------------------------------
echo "[5/5] Generating Prisma client..."
cd "$BACKEND_DIR"
npx prisma generate

# ------------------------------------------
# Done
# ------------------------------------------
echo ""
echo "=========================================="
echo "  Environment is ready!"
echo "  PostgreSQL : postgresql://root:root@localhost:5432/clb_db"
echo "  Redis      : redis://localhost:6379"
echo "  Run: cd backend && npm run dev"
echo "=========================================="