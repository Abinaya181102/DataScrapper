#!/bin/bash
set -e

TAG=${1:-latest}

echo "Updating backend service..."
docker service update \
  --image elakkiakarunakaran/ds-backend:$TAG \
  --force datascrapper_backend

echo "Updating frontend service..."
docker service update \
  --image elakkiakarunakaran/ds-frontend:$TAG \
  --force datascrapper_frontend

echo "Updating nginx service..."
docker service update \
  --image elakkiakarunakaran/ds-nginx:$TAG \
  --force datascrapper_nginx

echo "Swarm services updated ✅"
