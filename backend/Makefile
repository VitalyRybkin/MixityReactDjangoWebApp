# ============================================================================
# Mixity backend Makefile
# ============================================================================
# Run this Makefile from the backend/ directory.
#
# Main workflows:
#   make sync               - create/update local Python environment
#   make bootstrap          - restore LOCAL dev config from Bitwarden and seed DB
#   make test               - run tests
#   make check              - run code-quality checks without modifying files
#   make format             - format Python code
#   make prod-seeds-apply   - pull seed users from Bitwarden and apply them to PROD
#
# Bitwarden note:
#   If the CLI says "You are not logged in", run once:
#       bw login
#
#   The targets below unlock the vault when needed. If BW_SESSION is already
#   exported, it is reused and no additional unlock prompt is required.
# ============================================================================

.DEFAULT_GOAL := help

# ----------------------------------------------------------------------------
# Common settings
# ----------------------------------------------------------------------------

PYTHON_VERSION := 3.12.11
UV := uv run --active python
DJANGO := $(UV) manage.py

# Python packages/directories checked by formatters and linters.
CODE_DIRS := catalog logistic stock core/tests contacts order common repairs

# Docker Compose file is one directory above backend/.
COMPOSE := docker compose -f ../docker-compose.yml

# Bitwarden/local configuration files.
ENV_FILE := credentials/.env
DOCKER_ENV_FILE := .env.docker
SEED_FILE := credentials/seed_users.json
GROUPS_FIXTURE := django_groups_fixture.json

# Database defaults. Can be overridden, for example:
#   make db-backup POSTGRES_USER=other POSTGRES_DB=other_db
POSTGRES_USER ?= rybkin
POSTGRES_DB ?= orders

# Backup retention in days.
BACKUP_RETENTION_DAYS ?= 5
DB_BACKUP_DIR := ../backups/postgres
MEDIA_BACKUP_DIR := ../backups/media

# Reuse an existing BW_SESSION when available; otherwise ask Bitwarden to unlock.
BW_SESSION_CMD = BW_SESSION="$${BW_SESSION:-$$(bw unlock --raw)}"

.PHONY: \
	help \
	sync doctor \
	test test-cov \
	format check pre-commit \
	run shell migrations migrate show collectstatic \
	env-pull env-push docker-env-pull docker-env-push \
	env-check seeds-pull seeds-push seeds-check \
	fixtures users seed bootstrap prod-seeds-apply \
	db-backup db-backups db-restore \
	media-backup media-backups \
	merge-release release-master


# ----------------------------------------------------------------------------
# Help
# ----------------------------------------------------------------------------

help:
	@echo "Mixity backend commands"
	@echo
	@echo "Local environment:"
	@echo "  make sync                 Recreate .venv and install dependencies"
	@echo "  make doctor               Run local architecture/environment diagnostics"
	@echo "  make bootstrap            Pull dev env + seed users from Bitwarden and prepare local DB"
	@echo
	@echo "Development:"
	@echo "  make run                  Run Django development server"
	@echo "  make shell                Open Django shell"
	@echo "  make migrations [app=x]  Create migrations"
	@echo "  make migrate [app=x]      Apply migrations"
	@echo "  make show                 Show migration status"
	@echo
	@echo "Quality:"
	@echo "  make test [app=x]         Run tests"
	@echo "  make test-cov [app=x]     Run tests with coverage"
	@echo "  make format               Format Python code"
	@echo "  make check                Check formatting/lint/types without modifying files"
	@echo "  make pre-commit           Run all pre-commit hooks"
	@echo
	@echo "Bitwarden:"
	@echo "  make env-pull             Bitwarden -> local credentials/.env"
	@echo "  make env-push             local credentials/.env -> Bitwarden"
	@echo "  make seeds-pull           Bitwarden -> credentials/seed_users.json"
	@echo "  make seeds-push           local seed_users.json -> Bitwarden"
	@echo "  make docker-env-pull      Bitwarden PROD config -> .env.docker"
	@echo "  make docker-env-push      .env.docker -> Bitwarden PROD config"
	@echo
	@echo "Production:"
	@echo "  make prod-seeds-apply     Pull seed users and apply them to production DB"
	@echo
	@echo "Backups:"
	@echo "  make db-backup            Create PostgreSQL backup"
	@echo "  make db-backups           List PostgreSQL backups"
	@echo "  make db-restore FILE=...  Restore PostgreSQL backup"
	@echo "  make media-backup         Create media archive"
	@echo "  make media-backups        List media archives"
	@echo
	@echo "Git workflow:"
	@echo "  make merge-release       Merge current feature branch into release"
	@echo "  make release-master      Merge tested release into master and trigger deploy"


# ----------------------------------------------------------------------------
# Local Python environment
# ----------------------------------------------------------------------------

# Recreate the local virtual environment from scratch.
# uv uses the platform-appropriate build of Python $(PYTHON_VERSION).
sync:
	rm -rf .venv
	uv venv --python $(PYTHON_VERSION)
	uv sync --all-groups
	uv run pre-commit install

# Project-specific environment/architecture diagnostics.
doctor:
	@bash ./scripts/arch-doctor.sh


# ----------------------------------------------------------------------------
# Tests
# ----------------------------------------------------------------------------

# Examples:
#   make test
#   make test app=repairs
#   make test app=order/tests/test_order_upd.py
test:
	uv run pytest --ds=backend.settings -rs $(if $(app),$(app),)

# Coverage for the whole backend or one app.
# Examples:
#   make test-cov
#   make test-cov app=repairs
test-cov:
	uv run pytest --ds=backend.settings -rs \
		$(if $(app),$(app),) \
		--cov=$(if $(app),$(app),.) \
		--cov-report=term-missing


# ----------------------------------------------------------------------------
# Formatting, linting and type checking
# ----------------------------------------------------------------------------

# FORMAT modifies files.
format:
	$(UV) -m isort $(CODE_DIRS) \
		--skip-glob "*/migrations/*" \
		--skip-glob "*/fixtures/*"
	$(UV) -m black $(CODE_DIRS) \
		--exclude "/(\.git|\.hg|\.mypy_cache|\.tox|\.venv|venv|env|_build|build|dist|media|swagger_ui/static|migrations|__pycache__|fixtures|templates)/" \
		--include "\.py$$"

# CHECK must never change source files. Suitable for CI and before push.
check:
	$(UV) -m isort $(CODE_DIRS) \
		--check-only \
		--skip-glob "*/migrations/*" \
		--skip-glob "*/fixtures/*"
	$(UV) -m black $(CODE_DIRS) \
		--check \
		--exclude "/(\.git|\.hg|\.mypy_cache|\.tox|\.venv|venv|env|_build|build|dist|media|swagger_ui/static|migrations|__pycache__|fixtures|templates)/" \
		--include "\.pyi?$$"
	$(UV) -m flake8 $(CODE_DIRS) --exclude migrations,__pycache__
	$(UV) -m mypy $(CODE_DIRS) --config-file=pyproject.toml

pre-commit:
	$(UV) -m pre_commit run --all-files

# ----------------------------------------------------------------------------
# Django - LOCAL development database
# ----------------------------------------------------------------------------

run:
	$(DJANGO) runserver

shell:
	$(DJANGO) shell

# Examples:
#   make migrations
#   make migrations app=repairs
migrations:
	$(DJANGO) makemigrations $(if $(app),$(app),)

# Examples:
#   make migrate
#   make migrate app=repairs
#   make migrate app=repairs mig=0004
migrate:
	$(DJANGO) migrate $(if $(app),$(app),) $(if $(mig),$(mig),)

show:
	$(DJANGO) showmigrations

collectstatic:
	$(DJANGO) collectstatic --noinput


# ----------------------------------------------------------------------------
# Bitwarden - LOCAL development configuration
# ----------------------------------------------------------------------------
#
# Local development and production use different environment items.
# Do not replace docker-env-* with env-* on the production server.
#
# If Bitwarden CLI is unauthenticated, first run:
#   bw login
# ----------------------------------------------------------------------------

# Bitwarden dev item -> credentials/.env
env-pull:
	@$(BW_SESSION_CMD) ./scripts/generate-env.sh
	@test -f "$(ENV_FILE)" || \
		(echo "Missing $(ENV_FILE)" && exit 1)

# credentials/.env -> Bitwarden dev item
env-push: env-check
	@$(BW_SESSION_CMD) ./scripts/upload-env.sh

# Validate local dev environment file without changing anything.
env-check:
	@test -f "$(ENV_FILE)" || \
		(echo "Missing $(ENV_FILE)" && exit 1)


# ----------------------------------------------------------------------------
# Bitwarden - PRODUCTION Docker environment
# ----------------------------------------------------------------------------
#
# These targets only synchronize .env.docker.
# They do NOT rebuild/restart containers and do NOT run migrations.
# ----------------------------------------------------------------------------

# Bitwarden production item -> .env.docker
docker-env-pull:
	@$(BW_SESSION_CMD) ./scripts/generate-docker-env.sh
	@test -f "$(DOCKER_ENV_FILE)" || \
		(echo "Missing $(DOCKER_ENV_FILE)" && exit 1)

# .env.docker -> Bitwarden production item
docker-env-push:
	@test -f "$(DOCKER_ENV_FILE)" || \
		(echo "Missing $(DOCKER_ENV_FILE)" && exit 1)
	@$(BW_SESSION_CMD) ./scripts/upload-docker-env.sh


# ----------------------------------------------------------------------------
# Bitwarden - seed users
# ----------------------------------------------------------------------------
#
# seed_users.json is the source used by the seed_data Django command.
# Typical password-change workflow:
#
#   LOCAL MAC:
#       edit credentials/seed_users.json
#       make seeds-push
#
#   PRODUCTION SERVER:
#       make prod-seeds-apply
#
# prod-seeds-apply updates the users/groups represented by seed_data in the
# production database. It is intentionally separate from full bootstrap.
# ----------------------------------------------------------------------------

# Bitwarden -> credentials/seed_users.json
seeds-pull:
	@$(BW_SESSION_CMD) ./scripts/generate-json.sh
	@test -f "$(SEED_FILE)" || \
		(echo "Missing $(SEED_FILE)" && exit 1)
	@jq -e . "$(SEED_FILE)" >/dev/null || \
		(echo "Invalid JSON: $(SEED_FILE)" && exit 1)

# Validate seed file without uploading or modifying anything.
seeds-check:
	@test -f "$(SEED_FILE)" || \
		(echo "Missing $(SEED_FILE)" && exit 1)
	@jq -e . "$(SEED_FILE)" >/dev/null || \
		(echo "Invalid JSON: $(SEED_FILE)" && exit 1)

# credentials/seed_users.json -> Bitwarden
seeds-push: seeds-check
	@$(BW_SESSION_CMD) ./scripts/upload-json.sh


# ----------------------------------------------------------------------------
# Local database bootstrap / seed
# ----------------------------------------------------------------------------

# Load groups/permissions fixture into the LOCAL database.
fixtures:
	$(DJANGO) loaddata "$(GROUPS_FIXTURE)"

# Apply seed users/groups to the LOCAL database.
users:
	$(DJANGO) seed_data

# Prepare LOCAL database from files already present on disk.
seed: migrate fixtures users

# Full LOCAL bootstrap from Bitwarden.
# Unlock Bitwarden only once, then pass BW_SESSION to all child make targets.
bootstrap:
	@BW_SESSION="$${BW_SESSION:-$$(bw unlock --raw)}"; \
	export BW_SESSION; \
	$(MAKE) env-pull seeds-pull seed
	@echo "Bootstrap complete (Bitwarden)."


# ----------------------------------------------------------------------------
# Production seed users
# ----------------------------------------------------------------------------
#
# Run from backend/ on the production server:
#   make prod-seeds-apply
#
# This target intentionally does NOT:
#   - pull/replace .env.docker
#   - rebuild containers
#   - run migrations
#   - load fixtures separately
#
# It only refreshes seed_users.json from Bitwarden and executes seed_data inside
# the already-running backend container.
# ----------------------------------------------------------------------------

prod-seeds-apply:
	@command -v bw >/dev/null 2>&1 || \
		(echo "Bitwarden CLI is not installed" && exit 1)
	@command -v jq >/dev/null 2>&1 || \
		(echo "jq is not installed" && exit 1)
	@command -v docker >/dev/null 2>&1 || \
		(echo "Docker is not installed" && exit 1)
	@echo "Pulling seed users from Bitwarden..."
	@$(BW_SESSION_CMD) ./scripts/generate-json.sh
	@test -f "$(SEED_FILE)" || \
		(echo "Missing $(SEED_FILE)" && exit 1)
	@jq -e . "$(SEED_FILE)" >/dev/null || \
		(echo "Invalid JSON: $(SEED_FILE)" && exit 1)
	@echo "Applying seed users to production database..."
	@$(COMPOSE) exec -T backend python manage.py seed_data --allow-non-debug
	@echo "Production seed users updated."


# ----------------------------------------------------------------------------
# PostgreSQL backups - Docker / production
# ----------------------------------------------------------------------------

# Create a compressed pg_dump backup and remove backups older than the configured
# retention period. The database container itself is not stopped.
db-backup:
	@mkdir -p "$(DB_BACKUP_DIR)"
	@set -e; \
	FILE="$(DB_BACKUP_DIR)/orders_$$(date +%Y-%m-%d_%H-%M-%S).dump"; \
	echo "Creating PostgreSQL backup: $$FILE"; \
	$(COMPOSE) exec -T db \
		pg_dump -U "$(POSTGRES_USER)" -d "$(POSTGRES_DB)" -Fc \
		> "$$FILE"; \
	if [ ! -s "$$FILE" ]; then \
		echo "Backup failed: file is empty"; \
		rm -f "$$FILE"; \
		exit 1; \
	fi; \
	echo "Backup created successfully:"; \
	ls -lh "$$FILE"; \
	echo "Removing backups older than $(BACKUP_RETENTION_DAYS) days..."; \
	find "$(DB_BACKUP_DIR)" \
		-type f \
		-name "orders_*.dump" \
		-mtime +$(BACKUP_RETENTION_DAYS) \
		-delete; \
	echo "Backup cleanup completed."

# List backups newest first.
db-backups:
	@echo "PostgreSQL backups:"
	@ls -lht "$(DB_BACKUP_DIR)"/*.dump 2>/dev/null || echo "No backups found"

# Restore a selected dump into the production database.
# WARNING: pg_restore --clean removes/replaces objects contained in the dump.
# Example:
#   make db-restore FILE=../backups/postgres/orders_2026-10-27_03-00-00.dump
db-restore:
	@if [ -z "$(FILE)" ]; then \
		echo "Usage: make db-restore FILE=../backups/postgres/<backup>.dump"; \
		exit 1; \
	fi
	@test -f "$(FILE)" || \
		(echo "Backup file not found: $(FILE)" && exit 1)
	@echo "Restoring PostgreSQL backup: $(FILE)"
	@$(COMPOSE) exec -T db \
		pg_restore \
		-U "$(POSTGRES_USER)" \
		-d "$(POSTGRES_DB)" \
		--clean \
		--if-exists \
		< "$(FILE)"
	@echo "Restore completed successfully."


# ----------------------------------------------------------------------------
# Media backups - Docker / production
# ----------------------------------------------------------------------------

# Archive the shared media volume through the frontend container, where it is
# mounted read-only. This does not modify application media.
media-backup:
	@mkdir -p "$(MEDIA_BACKUP_DIR)"
	@set -e; \
	FILE="$(MEDIA_BACKUP_DIR)/media_$$(date +%Y-%m-%d_%H-%M-%S).tar.gz"; \
	echo "Creating media backup: $$FILE"; \
	$(COMPOSE) exec -T frontend \
		tar -czf - -C /var/www/media . \
		> "$$FILE"; \
	if [ ! -s "$$FILE" ]; then \
		echo "Media backup failed: file is empty"; \
		rm -f "$$FILE"; \
		exit 1; \
	fi; \
	if ! tar -tzf "$$FILE" >/dev/null 2>&1; then \
		echo "Media backup failed: archive is invalid"; \
		rm -f "$$FILE"; \
		exit 1; \
	fi; \
	echo "Media backup created successfully:"; \
	ls -lh "$$FILE"; \
	echo "Removing media backups older than $(BACKUP_RETENTION_DAYS) days..."; \
	find "$(MEDIA_BACKUP_DIR)" \
		-type f \
		-name "media_*.tar.gz" \
		-mtime +$(BACKUP_RETENTION_DAYS) \
		-delete; \
	echo "Media backup cleanup completed."

# List media archives newest first.
media-backups:
	@echo "Media backups:"
	@ls -lht "$(MEDIA_BACKUP_DIR)"/*.tar.gz 2>/dev/null || echo "No backups found"

# ----------------------------------------------------------------------------
# Git workflow
# ----------------------------------------------------------------------------
#
# Обычный процесс разработки:
#
#   feature/... -> release -> master
#
# 1. Завершили feature:
#       make merge-release
#
#    Текущая feature-ветка будет объединена с release и отправлена в GitHub.
#    После push GitHub Actions запускает тесты для release.
#
# 2. После успешных тестов release:
#       make release-master
#
#    release будет объединена с master.
#    Push master запускает production pipeline: тесты + deploy.
#
# Обе команды требуют чистый working tree.
# ----------------------------------------------------------------------------


# Merge текущей feature-ветки в release.
#
# Запускать из feature-ветки:
#   make merge-release
#
# Например:
#   feature/repairs -> release
merge-release:
	@set -e; \
	if [ -n "$$(git status --porcelain)" ]; then \
		echo "Working tree is not clean. Commit or stash changes first."; \
		exit 1; \
	fi; \
	BRANCH="$$(git branch --show-current)"; \
	if [ "$$BRANCH" = "release" ] || [ "$$BRANCH" = "master" ]; then \
		echo "Run make merge-release from a feature branch."; \
		exit 1; \
	fi; \
	echo "Merging $$BRANCH into release..."; \
	git fetch origin; \
	git switch release; \
	git pull --ff-only origin release; \
	git merge --no-ff --no-edit "$$BRANCH";\
	git push origin release; \
	git switch "$$BRANCH"; \
	echo; \
	echo "$$BRANCH merged into release."; \
	echo "Wait for GitHub Actions tests on release before merging into master."


# Merge проверенной release-ветки в master.
#
# Запускать только после успешных GitHub Actions для release:
#   make release-master
#
# После push master GitHub Actions запускает production deploy.
release-master:
	@set -e; \
	if [ -n "$$(git status --porcelain)" ]; then \
		echo "Working tree is not clean. Commit or stash changes first."; \
		exit 1; \
	fi; \
	CURRENT_BRANCH="$$(git branch --show-current)"; \
	echo "Updating release..."; \
	git fetch origin; \
	git switch release; \
	git pull --ff-only origin release; \
	echo "Merging release into master..."; \
	git switch master; \
	git pull --ff-only origin master; \
	git merge --no-ff --no-edit release; \
	git push origin master; \
	git switch "$$CURRENT_BRANCH"; \
	echo; \
	echo "release merged into master."; \
	echo "GitHub Actions production pipeline should now run."