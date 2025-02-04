#!/bin/bash

# Load environment variables from the .env file
set -o allexport
source .env
set +o allexport

# Run Django migrations
echo "Running migrations..."

docker-compose exec -it backend python manage.py makemigrations auth_service
docker-compose exec -it backend python manage.py makemigrations friendship
docker-compose exec -it backend python manage.py makemigrations chat
docker-compose exec -it backend python manage.py makemigrations game
docker-compose exec -it backend python manage.py migrate
echo "Migrations completed!"