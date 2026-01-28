UV := uv run python -m
CATS := catalog logistic order

# Virtualenv & Setup
sync:
	rm -rf .venv
	uv sync --all-groups
	uv run pre-commit install

write:
	$(UV) pip3 freeze > requirements.txt

# Django Commands

run:
	uv run manage.py runserver

migrate:
	$(UV) manage migrate $(app)

show:
	$(UV) manage showmigrations

migrations:
	$(UV) manage makemigrations $(app)

shell:
	$(UV) python3 manage.py shell


collectstatic:
	$(UV) python3 manage.py collectstatic --noinput


# Tests

test:
	$(UV) pytest

coverage:
	$(UV) pytest --cov

# Formatting & Linting

format:
	$(UV) isort $(CATS) --skip-glob "*/migrations/*" --skip-glob "*/fixtures/*"
	$(UV) black $(CATS) --exclude "/(\.git|\.hg|\.mypy_cache|\.tox|\.venv|venv|env|_build|build|dist|media|swagger_ui/static|migrations|__pycache__|fixtures|templates)/" --include "\.py$$"

check:
	$(UV) isort $(CATS) --skip-glob "*/migrations/*" --skip-glob "*/fixtures/*"
	$(UV) black $(CATS) --exclude "/(\.git|\.hg|\.mypy_cache|\.tox|\.venv|venv|env|_build|build|dist|media|swagger_ui/static|migrations|__pycache__|fixtures|templates)/" --include "\.py$$"
	$(UV) isort $(CATS) --check-only --skip-glob "*/migrations/*"
	$(UV) black $(CATS) --check --exclude "/(\.git|\.hg|\.mypy_cache|\.tox|\.venv|venv|env|_build|\.json|build|dist|media|swagger_ui/static|migrations|__pycache__)/" --include "\.pyi?$$"
	$(UV) flake8 $(CATS) --exclude migrations,__pycache__
	$(UV) mypy $(CATS) --config-file=pyproject.toml

pre-commit:
	 $(UV) pre-commit run --all-files

# Git Shortcuts

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
FIXTURE_USERS := load_users.json

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

# ---- Django ----
db:
	@python manage.py migrate

fixtures:
	@python manage.py loaddata "$(FIXTURE_USERS)"

users:
	@python manage.py seed_users

seed: db fixtures users

# ---- workflows ----
bootstrap: env seeds seed
	@echo "Bootstrap complete (Bitwarden)."

bootstrap-no-bw: env-check seeds-check seed
	@echo "Bootstrap complete (no Bitwarden)."

