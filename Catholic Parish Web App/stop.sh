#!/bin/bash
echo "Stopping Catholic Parish Web App..."

echo "[1/3] Stopping Backend API (port 4000)..."
pm2 stop parish-backend 2>/dev/null || fuser -k 4000/tcp 2>/dev/null
echo "    Backend stopped."

echo "[2/3] Stopping Frontend (port 5173)..."
fuser -k 5173/tcp 2>/dev/null
echo "    Frontend stopped."

echo "[3/3] Stopping PostgreSQL..."
sudo systemctl stop postgresql 2>/dev/null
echo "    PostgreSQL stopped."

echo ""
echo "All services stopped."
