UV := uv run --active python
DJ := $(UV) manage.py
CATS := catalog logistic stock core/tests contacts order common

# ---- VIRTUALENV & SETUP ----
sync:
	rm -rf .venv
	uv venv --python cpython-3.12.11-macos-aarch64-none
	uv sync --all-groups
	uv run pre-commit install

doctor:
	@bash ./scripts/arch-doctor.sh

write:
	$(UV) pip3 freeze > requirements.txt

# ---- TESTS ----

test:
	uv run pytest --ds=backend.settings -rs $(if $(app),$(app),)

test-cov:
	uv run pytest --ds=backend.settings -rs --cov=$(if $(app),$(app),) $(if $(app),$(app),)/ --cov-report=term-missing

coverage:
	uv run pytest --cov

# ---- FORMATTING & LINTING ----

format:
	$(UV) -m isort $(CATS) --skip-glob "*/migrations/*" --skip-glob "*/fixtures/*"
	$(UV) -m black $(CATS) --exclude "/(\.git|\.hg|\.mypy_cache|\.tox|\.venv|venv|env|_build|build|dist|media|swagger_ui/static|migrations|__pycache__|fixtures|templates)/" --include "\.py$$"

check:
	$(UV) -m isort $(CATS) --skip-glob "*/migrations/*" --skip-glob "*/fixtures/*"
	$(UV) -m black $(CATS) --exclude "/(\.git|\.hg|\.mypy_cache|\.tox|\.venv|venv|env|_build|build|dist|media|swagger_ui/static|migrations|__pycache__|fixtures|templates)/" --include "\.py$$"
	$(UV) -m isort $(CATS) --check-only --skip-glob "*/migrations/*"
	$(UV) -m black $(CATS) --check --exclude "/(\.git|\.hg|\.mypy_cache|\.tox|\.venv|venv|env|_build|\.json|build|dist|media|swagger_ui/static|migrations|__pycache__)/" --include "\.pyi?$$"
	$(UV) -m flake8 $(CATS) --exclude migrations,__pycache__
	$(UV) -m mypy $(CATS) --config-file=pyproject.toml

pre-commit:
	$(UV) -m pre_commit run --all-files

# --- GIT SHORTCUTS ---

# Merge feature branch into dev
# Usage: make merge-dev branch=bug-fix
merge-releases:
	git checkout releases && git merge $(br)

# Merge releases into master and push with tags
releases:
	git checkout master && git merge dev && git push

# Tag release
# Usage: make tag version=1.2.0
tag:
	git tag -a v$(ver) -m "Release v$(ver)"
	git push --tags

# Fetch the latest updates and then remove any stale remote-tracking branches
prune:
	git fetch --prune

# Force to reset local git repository from origin
reset:
	git fetch origin $(br)
	git reset --hard origin/$(br)


# ---- BITWARDEN WORKFLOW ----

.PHONY: \
	env-pull \
	seeds-pull \
	seeds-push \
	env-check \
	seeds-check \
	fixtures \
	users \
	seed \
	bootstrap \
	bootstrap-no-bw

ENV_FILE := credentials/.env
DOCKER_ENV_FILE := .env.docker
SEED_FILE := credentials/seed_users.json
FIXTURE_USERS := django_groups_fixture.json

BW_SESSION_CMD = BW_SESSION="$$(bw unlock --raw)"

# Bitwarden → local .env
env-pull:
	@$(BW_SESSION_CMD) ./scripts/generate-env.sh
	@test -f "$(ENV_FILE)" || \
		(echo "Missing $(ENV_FILE)" && exit 1)

docker-env-pull:
	@$(BW_SESSION_CMD) ./scripts/generate-docker-env.sh
	@test -f "$(DOCKER_ENV_FILE)" || \
		(echo "Missing $(DOCKER_ENV_FILE)" && exit 1)

# local .env → Bitwarden
env-push:
	@test -f "$(ENV_FILE)" || \
		(echo "Missing $(ENV_FILE)" && exit 1)
	@$(BW_SESSION_CMD) ./scripts/upload-env.sh

docker-env-push:
	@test -f "$(DOCKER_ENV_FILE)" || \
		(echo "Missing $(DOCKER_ENV_FILE)" && exit 1)
	@$(BW_SESSION_CMD) ./scripts/upload-docker-env.sh

# Bitwarden → local seed_users.json
seeds-pull:
	@$(BW_SESSION_CMD) ./scripts/generate-json.sh
	@test -f "$(SEED_FILE)" || \
		(echo "Missing $(SEED_FILE)" && exit 1)
	@$(UV) -m json.tool "$(SEED_FILE)" >/dev/null

# DB backup / restore

db-backup:
	@mkdir -p backups/postgres
	@FILE="backups/postgres/orders_$$(date +%Y-%m-%d_%H-%M-%S).dump"; \
	echo "Creating PostgreSQL backup: $$FILE"; \
	docker compose exec -T db sh -c \
		'pg_dump -U "$$rybkin" -d "$$orders" -Fc' \
		> "$$FILE"; \
	if [ ! -s "$$FILE" ]; then \
		echo "Backup failed: file is empty"; \
		rm -f "$$FILE"; \
		exit 1; \
	fi; \
	echo "Backup created successfully:"; \
	ls -lh "$$FILE"

# Local seed_users.json → Bitwarden
seeds-push: seeds-check
	@$(BW_SESSION_CMD) ./scripts/upload-json.sh

# Local file checks
env-check:
	@test -f "$(ENV_FILE)" || \
		(echo "Missing $(ENV_FILE). Copy it here." && exit 1)

seeds-check:
	@test -f "$(SEED_FILE)" || \
		(echo "Missing $(SEED_FILE). Copy it here." && exit 1)
	@$(UV) -m json.tool "$(SEED_FILE)" >/dev/null

# Django seeding
fixtures:
	$(DJ) loaddata "$(FIXTURE_USERS)"

users:
	$(DJ) seed_data

seed: migrate fixtures users

# Bitwarden → files → Django
bootstrap: env-pull seeds-pull seed
	@echo "Bootstrap complete (Bitwarden)."

# Existing local files → Django
bootstrap-no-bw: env-check seeds-check seed
	@echo "Bootstrap complete (no Bitwarden)."

run:
	$(DJ) runserver

migrate:
	$(DJ) migrate $(if $(app),$(app),) $(if $(mig),$(mig),)

show:
	$(DJ) showmigrations

migrations:
	$(DJ) makemigrations $(if $(app),$(app),)

shell:
	$(DJ) shell


collectstatic:
	$(DJ) collectstatic --noinput

