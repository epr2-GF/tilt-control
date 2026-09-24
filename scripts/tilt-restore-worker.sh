#!/bin/bash

set -euo pipefail

STATE_ROOT="/var/lib/tilt-control/restore"
REQUEST_FILE="${STATE_ROOT}/request"
STATUS_FILE="${STATE_ROOT}/status"
AUDIT_MARKER_FILE="${STATE_ROOT}/audit-marker"

RESTORE_SCRIPT="/opt/tilt-control/scripts/tilt-restore.sh"
BACKUP_ROOT="/mnt/tilt-server-backup"

write_status() {

    local STATUS="$1"
    local JOB_ID="$2"
    local BACKUP="$3"
    local MESSAGE="$4"

    cat > "${STATUS_FILE}" <<EOF
{
  "status": "${STATUS}",
  "job_id": "${JOB_ID}",
  "backup": "${BACKUP}",
  "message": "${MESSAGE}",
  "time": "$(date -Iseconds)"
}
EOF

    chmod 600 "${STATUS_FILE}"
}

if [ ! -d "${STATE_ROOT}" ]; then
    mkdir -p "${STATE_ROOT}"
    chmod 700 "${STATE_ROOT}"
fi

if [ ! -f "${REQUEST_FILE}" ]; then
    echo "ERROR: Restore request file not found."
    exit 1
fi

JOB_ID="$(
    sed -n 's/^job_id=//p' "${REQUEST_FILE}" |
    head -n 1
)"

BACKUP="$(
    sed -n 's/^backup=//p' "${REQUEST_FILE}" |
    head -n 1
)"

ACTOR="$(
    sed -n 's/^actor=//p' "${REQUEST_FILE}" |
    head -n 1
)"

if [ -z "${JOB_ID}" ]; then
    write_status "failed" "" "${BACKUP}" "No job ID specified"
    rm -f "${REQUEST_FILE}"
    exit 1
fi

if [ -z "${BACKUP}" ]; then
    write_status "failed" "${JOB_ID}" "" "No backup specified"
    rm -f "${REQUEST_FILE}"
    exit 1
fi

if [[ ! "${BACKUP}" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}_[0-9]{2}-[0-9]{2}-[0-9]{2}$ ]]; then
    write_status "failed" "${JOB_ID}" "${BACKUP}" "Invalid backup identifier"
    rm -f "${REQUEST_FILE}"
    exit 1
fi

BACKUP_PATH="${BACKUP_ROOT}/weekly/${BACKUP}"

if ! mountpoint -q "${BACKUP_ROOT}"; then
    write_status "failed" "${JOB_ID}" "${BACKUP}" "Backup filesystem is not mounted"
    rm -f "${REQUEST_FILE}"
    exit 1
fi

if [ ! -d "${BACKUP_PATH}" ]; then
    write_status "failed" "${JOB_ID}" "${BACKUP}" "Backup not found"
    rm -f "${REQUEST_FILE}"
    exit 1
fi

cat > "${AUDIT_MARKER_FILE}" <<EOF
{
  "job_id": "${JOB_ID}",
  "backup": "${BACKUP}",
  "actor": "${ACTOR}",
  "started": "$(date -Iseconds)"
}
EOF

chmod 600 "${AUDIT_MARKER_FILE}"

write_status \
    "running" \
    "${JOB_ID}" \
    "${BACKUP}" \
    "Restore operation started"

rm -f "${REQUEST_FILE}"

echo "Starting restore:"
echo "${BACKUP_PATH}"

if "${RESTORE_SCRIPT}" "${BACKUP_PATH}"; then

    cat > "${AUDIT_MARKER_FILE}" <<EOF
{
  "status": "success",
  "job_id": "${JOB_ID}",
  "backup": "${BACKUP}",
  "actor": "${ACTOR}",
  "started": "$(date -Iseconds)"
}
EOF

    chmod 600 "${AUDIT_MARKER_FILE}"

    write_status \
        "success" \
        "${JOB_ID}" \
        "${BACKUP}" \
        "Restore completed successfully"

    exit 0

else

    cat > "${AUDIT_MARKER_FILE}" <<EOF
{
  "status": "failed",
  "job_id": "${JOB_ID}",
  "backup": "${BACKUP}",
  "actor": "${ACTOR}",
  "started": "$(date -Iseconds)"
}
EOF

    chmod 600 "${AUDIT_MARKER_FILE}"

    write_status \
        "failed" \
        "${JOB_ID}" \
        "${BACKUP}" \
        "Restore failed and rollback was attempted"

    exit 1

fi