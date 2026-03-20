#!/bin/bash
echo "Starting Catholic Parish Web App..."

echo "[1/3] Starting PostgreSQL..."
sudo systemctl start postgresql
# Wait until PostgreSQL is accepting connections
until pg_isready -q; do
  echo "    Waiting for PostgreSQL to be ready..."
  sleep 2
done
echo "    PostgreSQL ready."

echo "[2/3] Starting Backend API (port 4000)..."
cd "$(dirname "$0")/backend"
pm2 start dist/index.js --name parish-backend 2>/dev/null || pm2 restart parish-backend
cd - > /dev/null
echo "    Backend started."

echo "[3/3] Starting Nginx (serves frontend on port 80)..."
sudo systemctl start nginx
echo "    Nginx started."

echo ""
echo "All services started. App is live at http://$(curl -s ifconfig.me 2>/dev/null || echo '<your-server-ip>')"
