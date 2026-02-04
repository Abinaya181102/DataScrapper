#!/bin/bash
set -e

TAG=${1:-latest}

echo "Building Backend..."
docker build -t elakkiakarunakaran/ds-backend:$TAG ./backend
docker push elakkiakarunakaran/ds-backend:$TAG

echo "Building Frontend..."
docker build -t elakkiakarunakaran/ds-frontend:$TAG ./frontend
docker push elakkiakarunakaran/ds-frontend:$TAG

echo "Building NGINX..."
docker build -t elakkiakarunakaran/ds-nginx:$TAG ./nginx
docker push elakkiakarunakaran/ds-nginx:$TAG

echo "All images pushed successfully 🚀"
