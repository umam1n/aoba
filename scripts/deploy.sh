#!/bin/bash
# AOBA Backend Deployment Script

echo "Deploying AOBA Backend..."

# Stop the service if running (requires systemd setup)
# sudo systemctl stop aoba-backend.service

# Pull latest code
git pull origin main

# Navigate to backend
cd apps/backend

# Create virtual environment if not exists
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Run migrations (already run via GitHub Actions, but good for local fallback)
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Start Gunicorn server (example)
# gunicorn aoba.wsgi:application --bind 0.0.0.0:8000 --workers 3 --daemon

echo "Deployment completed successfully! Restart your services."
