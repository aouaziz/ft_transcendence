DB_SERVICE=db
REDIS_SERVICE=redis
BACKEND_SERVICE=backend
FRONTEND_SERVICE=frontend
NGINX_SERVICE=nginx
MIGRATIONS_SCRIPT=./backend/run_migrations.sh

RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[0;33m
BLUE=\033[0;34m
RESET=\033[0m

all: start-services run-migrations

start-db:
	@echo "$(BLUE)Starting DB service...$(RESET)"
	docker-compose up -d $(DB_SERVICE)

start-redis:
	@echo "$(BLUE)Starting Redis service...$(RESET)"
	docker-compose up -d $(REDIS_SERVICE)

start-backend:
	@echo "$(BLUE)Starting Backend service...$(RESET)"
	docker-compose up -d $(BACKEND_SERVICE)

start-frontend:
	@echo "$(BLUE)Starting Frontend service...$(RESET)"
	docker-compose up -d $(FRONTEND_SERVICE)

start-services: start-db start-redis start-backend start-frontend
	@echo "$(BLUE)Building and starting all services...$(RESET)"
	docker-compose up --build -d

run-migrations:
	@echo "$(YELLOW)Running migrations...$(RESET)"
	$(MIGRATIONS_SCRIPT)

clean:
	@echo "$(RED)Cleaning up containers...$(RESET)"
	docker-compose down

fclean:
	@echo "$(RED)Cleaning up containers and volumes...$(RESET)"
	docker-compose down -v --remove-orphans
	docker volume prune -af
	docker image prune -af
	docker system prune -af

re : fclean all

