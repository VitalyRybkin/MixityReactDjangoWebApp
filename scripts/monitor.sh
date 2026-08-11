#!/usr/bin/env bash

set -u

PROJECT_DIR="/opt/MixityReactDjangoWebApp"
BACKUP_DIR="$PROJECT_DIR/backups/postgres"

DISK_WARNING=80
DISK_CRITICAL=90
INODE_WARNING=80
INODE_CRITICAL=90

# Backup считается устаревшим после 26 часов.
BACKUP_MAX_AGE_MINUTES=$((26 * 60))

ERRORS=0
WARNINGS=0

ALERT_LINES=()


ok() {
    echo "OK: $1"
}

warning() {
    echo "WARNING: $1"
    WARNINGS=$((WARNINGS + 1))
}

critical() {
    local message="$1"

    echo "CRITICAL: $message"

    ALERT_LINES+=("CRITICAL: $message")
    ERRORS=$((ERRORS + 1))
}


echo "========================================"
echo "Mixity monitoring"
echo "Date: $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "========================================"


# --------------------------------------------------
# Disk usage
# --------------------------------------------------

DISK_USAGE="$(
    df -P / |
    awk 'NR==2 {gsub("%", "", $5); print $5}'
)"

if [ "$DISK_USAGE" -ge "$DISK_CRITICAL" ]; then
    critical "Disk usage is ${DISK_USAGE}%"
elif [ "$DISK_USAGE" -ge "$DISK_WARNING" ]; then
    warning "Disk usage is ${DISK_USAGE}%"
else
    ok "Disk usage is ${DISK_USAGE}%"
fi


# --------------------------------------------------
# Inodes
# --------------------------------------------------

INODE_USAGE="$(
    df -Pi / |
    awk 'NR==2 {gsub("%", "", $5); print $5}'
)"

if [ "$INODE_USAGE" -ge "$INODE_CRITICAL" ]; then
    critical "Inode usage is ${INODE_USAGE}%"
elif [ "$INODE_USAGE" -ge "$INODE_WARNING" ]; then
    warning "Inode usage is ${INODE_USAGE}%"
else
    ok "Inode usage is ${INODE_USAGE}%"
fi


# --------------------------------------------------
# Docker containers
# --------------------------------------------------

cd "$PROJECT_DIR" || exit 1

for SERVICE in db backend frontend; do

    CONTAINER_ID="$(docker compose ps -q "$SERVICE" 2>/dev/null)"

    if [ -z "$CONTAINER_ID" ]; then
        critical "Docker service '$SERVICE' does not exist"
        continue
    fi

    RUNNING="$(
        docker inspect \
            --format '{{.State.Running}}' \
            "$CONTAINER_ID" 2>/dev/null
    )"

    if [ "$RUNNING" != "true" ]; then
        critical "Docker service '$SERVICE' is not running"
        continue
    fi

    HEALTH="$(
        docker inspect \
            --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' \
            "$CONTAINER_ID" 2>/dev/null
    )"

    if [ "$HEALTH" = "healthy" ]; then
        ok "Docker service '$SERVICE' is healthy"
    elif [ "$HEALTH" = "none" ]; then
        warning "Docker service '$SERVICE' has no healthcheck"
    else
        critical "Docker service '$SERVICE' health=$HEALTH"
    fi

done


# --------------------------------------------------
# Public application
# --------------------------------------------------

if curl \
    --fail \
    --silent \
    --show-error \
    --max-time 15 \
    https://app.mixity.ru/ \
    >/dev/null 2>&1; then

    ok "Public application is available"

else
    critical "Public application is unavailable"
fi


# --------------------------------------------------
# PostgreSQL backup
# --------------------------------------------------

LATEST_BACKUP="$(
    find "$BACKUP_DIR" \
        -maxdepth 1 \
        -type f \
        -name 'orders_*.dump' \
        -printf '%T@ %p\n' 2>/dev/null |
    sort -nr |
    head -n 1 |
    cut -d' ' -f2-
)"

if [ -z "$LATEST_BACKUP" ]; then

    critical "No PostgreSQL backup found"

else

    BACKUP_AGE_MINUTES=$(( ($(date +%s) - $(stat -c %Y "$LATEST_BACKUP")) / 60 ))

    if [ "$BACKUP_AGE_MINUTES" -gt "$BACKUP_MAX_AGE_MINUTES" ]; then
        critical "Latest PostgreSQL backup is ${BACKUP_AGE_MINUTES} minutes old"
    else
        ok "Latest PostgreSQL backup: $(basename "$LATEST_BACKUP") (${BACKUP_AGE_MINUTES} minutes old)"
    fi

fi


echo "========================================"
echo "Warnings: $WARNINGS"
echo "Critical: $ERRORS"
echo "========================================"

if [ "$ERRORS" -gt 0 ]; then

    ALERT_ENV="/etc/mixity/monitor.env"
    ALERT_SCRIPT="$PROJECT_DIR/scripts/send_alert.py"

    ALERT_BODY="$(
        cat <<EOF
Mixity production monitoring detected critical problems.

Server: $(hostname)
Date: $(date '+%Y-%m-%d %H:%M:%S %Z')

$(printf '%s\n' "${ALERT_LINES[@]}")

Warnings: $WARNINGS
Critical: $ERRORS
EOF
    )"

    if [ -r "$ALERT_ENV" ] && [ -f "$ALERT_SCRIPT" ]; then

        set -a
        # shellcheck disable=SC1090
        source "$ALERT_ENV"
        set +a

        if printf '%s\n' "$ALERT_BODY" \
            | python3 "$ALERT_SCRIPT" \
                "[Mixity CRITICAL] Production monitoring"; then

            echo "Alert email sent."

        else
            echo "WARNING: Failed to send alert email." >&2
        fi

    else
        echo "WARNING: Email alert configuration is unavailable." >&2
    fi

    exit 1
fi

exit 0