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
	bw-check \
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
SEED_FILE := credentials/seed_users.json
FIXTURE_USERS := django_groups_fixture.json

# Verify that Bitwarden CLI is available and unlocked
bw-check:
	@command -v bw >/dev/null 2>&1 || \
		(echo "Bitwarden CLI is not installed." && exit 1)
	@command -v jq >/dev/null 2>&1 || \
		(echo "jq is not installed. Run: brew install jq" && exit 1)
	@test -n "$$BW_SESSION" || \
		(echo 'BW_SESSION is not set. Run:' && \
		 echo '  bw login' && \
		 echo '  export BW_SESSION="$$(bw unlock --raw)"' && \
		 exit 1)
	@bw status --session "$$BW_SESSION" \
		| jq -e '.status == "unlocked"' >/dev/null || \
		(echo "Bitwarden session is not unlocked." && \
		 echo 'Run: export BW_SESSION="$$(bw unlock --raw)"' && \
		 exit 1)

# Bitwarden → local .env
env-pull: bw-check
	@./generate-env.sh
	@test -f "$(ENV_FILE)" || \
		(echo "Missing $(ENV_FILE)" && exit 1)

# Bitwarden → local seed_users.json
seeds-pull: bw-check
	@./generate-json.sh
	@test -f "$(SEED_FILE)" || \
		(echo "Missing $(SEED_FILE)" && exit 1)
	@$(UV) -m json.tool "$(SEED_FILE)" >/dev/null

# Local seed_users.json → Bitwarden
seeds-push: bw-check seeds-check
	@./upload-json.sh

# Checks for machines without Bitwarden
env-check:
	@test -f "$(ENV_FILE)" || \
		(echo "Missing $(ENV_FILE). Copy it here." && exit 1)

seeds-check:
	@test -f "$(SEED_FILE)" || \
		(echo "Missing $(SEED_FILE). Copy it here." && exit 1)
	@$(UV) -m json.tool "$(SEED_FILE)" >/dev/null

# ---- DJANGO SEEDING ----

fixtures:
	$(DJ) loaddata "$(FIXTURE_USERS)"

users:
	$(DJ) seed_data

seed: migrate fixtures users

# Bitwarden → local files → database
bootstrap: env-pull seeds-pull seed
	@echo "Bootstrap complete (Bitwarden)."

# Existing local files → database
bootstrap-no-bw: env-check seeds-check seed
	@echo "Bootstrap complete (no Bitwarden)."
# ---- DJANGO COMMANDS ----

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

