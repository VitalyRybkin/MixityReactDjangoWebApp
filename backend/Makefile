UV := uv run python -m
CATS := catalog carrier order

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


# Load demo data
load:
	$(UV) python3 manage.py load_demo_data


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

# Create a new feature branch
# Usage: make feature name=name-of-feature
feature:
	git checkout dev && git pull && git checkout -b feature/$(name)

# Create a new hotfix branch
# Usage: make hotfix name=bug-fix
hotfix:
	git checkout master && git pull && git checkout -b hotfix/$(name)

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
