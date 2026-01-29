UV := uv run --active python
DJ := $(UV) manage.py
CATS := catalog logistic order

# ---- VIRTUALENV & SETUP ----
sync:
	rm -rf .venv
	uv sync --all-groups
	uv run pre-commit install

doctor:
	@bash ./scripts/arch-doctor.sh

write:
	$(UV) pip3 freeze > requirements.txt

# ---- TESTS ----

test:
	uv run --active python manage.py test -v 2

coverage:
	$(UV) pytest --cov

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

.PHONY: env env-check seeds-check db fixtures users seed bootstrap bootstrap-no-bw

ENV_FILE := credentials/.env
SEED_FILE := credentials/seed_users.json
FIXTURE_USERS := django_groups_fixture.json

# ---- env generation (Bitwarden → .env) ----
env:
	@./generate-env.sh
	@test -f "$(ENV_FILE)" || (echo "Missing $(ENV_FILE)" && exit 1)

# ---- seed_users.json generation (Bitwarden → file) ----
seeds:
	@./generate-json.sh

# ---- checks for machines without Bitwarden ----
env-check:
	@test -f "$(ENV_FILE)" || (echo "Missing $(ENV_FILE). Copy it here." && exit 1)

seeds-check:
	@test -f "$(SEED_FILE)" || (echo "Missing $(SEED_FILE). Copy it here." && exit 1)
	@python -m json.tool "$(SEED_FILE)" >/dev/null

# ---- DJANGO COMMANDS ----

run:
	$(DJ) runserver

migrate:
	$(DJ) migrate $(if $(app),$(app),)

show:
	$(DJ) showmigrations

migrations:
	$(DJ) makemigrations $(if $(app),$(app),)

shell:
	$(DJ) shell


collectstatic:
	$(DJ) collectstatic --noinput

fixtures:
	$(DJ) loaddata "$(FIXTURE_USERS)"

users:
	$(DJ) seed_data

seed: migrate fixtures users

# ---- WORKFLOWS ----
bootstrap: env seeds seed
	@echo "Bootstrap complete (Bitwarden)."

bootstrap-no-bw: env-check seeds-check seed
	@echo "Bootstrap complete (no Bitwarden)."
