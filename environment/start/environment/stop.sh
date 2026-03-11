#!/bin/bash

# ==========================================
# Student Activity Portal - Stop Environment
# ==========================================

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "=========================================="
echo "  Student Activity Portal - Stopping..."
echo "=========================================="

docker compose -f "$PROJECT_ROOT/docker-compose.yml" down

echo "  Environment stopped."
echo "  Data is preserved in volume: clb_postgres_data"
echo ""
echo "  To also delete data: docker volume rm clb_postgres_data"
echo "=========================================="
