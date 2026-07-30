#!/usr/bin/env sh

set -eu

echo "Applying migrations..."
python manage.py migrate --noinput

echo "DJANGO_SEED_DATA=${DJANGO_SEED_DATA:-False}"

case "${DJANGO_SEED_DATA:-False}" in
    True|true|TRUE|1)
        echo "Seeding groups and users..."
        python manage.py seed_data --allow-non-debug
        ;;
    *)
        echo "Skipping seed data."
        ;;
esac

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting application..."
exec "$@"