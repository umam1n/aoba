#!/bin/bash

# Define colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting AOBA Development Server...${NC}"

# Kill background processes on script exit (Ctrl+C)
trap 'kill 0' SIGINT

# Start Backend (Django)
echo -e "${BLUE}[Backend]${NC} Starting Django server on http://localhost:8000..."
cd apps/backend || exit 1
source venv/bin/activate
python manage.py runserver 8000 &
BACKEND_PID=$!
cd ../..

# Start Frontend (Next.js)
echo -e "${BLUE}[Frontend]${NC} Starting Next.js server on http://localhost:3000..."
cd apps/frontend || exit 1
npm run dev &
FRONTEND_PID=$!
cd ../..

# Wait for all background processes to finish (or until user interrupts)
echo -e "${GREEN}Both servers are running! Press Ctrl+C to stop.${NC}"
wait $BACKEND_PID $FRONTEND_PID
