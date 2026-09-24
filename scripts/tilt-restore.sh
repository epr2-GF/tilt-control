#!/bin/bash

set -euo pipefail

SOURCE="/opt/tilt-control/backend"
BACKUP_ROOT="/mnt/tilt-server-backup"
SAFETY_ROOT="${BACKUP_ROOT}/pre-restore"

BACKUP_DIR="${1:-}"

TIMESTAMP="$(date '+%Y-%m-%d_%H-%M-%S')"
SAFETY_DIR="${SAFETY_ROOT}/${TIMESTAMP}"

FILES=(
    ".env"
    "src/data/users.json"
    "src/data/devices.json"
    "src/data/siteMessage.json"
    "src/data/auditLog.json"
    "src/data/deviceStatusLog.json"
    "src/data/sessionActivity.json"
)

ROLLBACK_NEEDED=false

rollback() {

    echo
    echo "======================================"
    echo " ROLLING BACK"
    echo "======================================"
    echo

    set +e

    pm2 stop tilt-backend >/dev/null 2>&1 || true

    for FILE in "${FILES[@]}"; do

        if [ -f "${SAFETY_DIR}/${FILE}" ]; then

            mkdir -p "${SOURCE}/$(dirname "${FILE}")"

            cp -a \
                "${SAFETY_DIR}/${FILE}" \
                "${SOURCE}/${FILE}"

            echo "  Restored ${FILE}"

        fi

    done

    chmod 600 "${SOURCE}/.env"
    chmod 600 "${SOURCE}"/src/data/*.json

    pm2 restart tilt-backend --update-env >/dev/null 2>&1 || true

    set -e

    echo
    echo "Rollback completed."
    echo

}

restore_failed() {

    echo
    echo "======================================"
    echo " RESTORE FAILED"
    echo "======================================"
    echo

    if [ "${ROLLBACK_NEEDED}" = true ]; then
        rollback
    fi

    echo "Safety backup:"
    echo "${SAFETY_DIR}"
    echo

    exit 1
}

trap restore_failed ERR

echo "======================================"
echo " Tilt Server Production RESTORE"
echo "======================================"
echo
echo "Backup:"
echo "${BACKUP_DIR}"
echo
echo "Live source:"
echo "${SOURCE}"
echo
echo "Safety backup:"
echo "${SAFETY_DIR}"
echo

if [ -z "${BACKUP_DIR}" ]; then

    echo "ERROR: No backup specified."
    echo
    echo "Usage:"
    echo "  $0 /mnt/tilt-server-backup/weekly/YYYY-MM-DD_HH-MM-SS"
    exit 1

fi

if [ ! -d "${BACKUP_DIR}" ]; then

    echo "ERROR: Backup directory does not exist:"
    echo "${BACKUP_DIR}"
    exit 1

fi

if ! mountpoint -q "${BACKUP_ROOT}"; then

    echo "ERROR: Backup filesystem is not mounted:"
    echo "${BACKUP_ROOT}"
    exit 1

fi

if [ ! -d "${SOURCE}" ]; then

    echo "ERROR: Live application directory does not exist:"
    echo "${SOURCE}"
    exit 1

fi

if [ ! -f "${BACKUP_DIR}/SHA256SUMS" ]; then

    echo "ERROR: SHA256SUMS not found."
    exit 1

fi

if [ ! -f "${BACKUP_DIR}/manifest.json" ]; then

    echo "ERROR: manifest.json not found."
    exit 1

fi

echo "Verifying selected backup..."

(
    cd "${BACKUP_DIR}"
    sha256sum -c SHA256SUMS
)

echo
echo "Backup verification successful."

echo
echo "Checking required files..."

for FILE in "${FILES[@]}"; do

    if [ ! -f "${BACKUP_DIR}/${FILE}" ]; then

        echo "ERROR: Missing backup file:"
        echo "${FILE}"
        exit 1

    fi

    echo "  OK  ${FILE}"

done

echo
echo "Creating pre-restore safety backup..."

mkdir -p "${SAFETY_ROOT}"
mkdir -p "${SAFETY_DIR}"

chmod 700 "${SAFETY_ROOT}"
chmod 700 "${SAFETY_DIR}"

for FILE in "${FILES[@]}"; do

    if [ ! -f "${SOURCE}/${FILE}" ]; then

        echo "ERROR: Missing live file:"
        echo "${SOURCE}/${FILE}"
        exit 1

    fi

    mkdir -p "${SAFETY_DIR}/$(dirname "${FILE}")"

    cp -a \
        "${SOURCE}/${FILE}" \
        "${SAFETY_DIR}/${FILE}"

    echo "  OK  ${FILE}"

done

chmod 600 "${SAFETY_DIR}/.env"
chmod 600 "${SAFETY_DIR}"/src/data/*.json

ROLLBACK_NEEDED=true

echo
echo "Safety backup created."

echo
echo "Stopping Tilt backend..."

pm2 stop tilt-backend

echo "  Backend stopped."

echo
echo "Restoring application data..."

for FILE in "${FILES[@]}"; do

    mkdir -p "${SOURCE}/$(dirname "${FILE}")"

    cp -a \
        "${BACKUP_DIR}/${FILE}" \
        "${SOURCE}/${FILE}"

    echo "  OK  ${FILE}"

done

chmod 600 "${SOURCE}/.env"
chmod 600 "${SOURCE}"/src/data/*.json

echo
echo "Verifying restored files..."

(
    cd "${SOURCE}"

    for FILE in "${FILES[@]}"; do

        EXPECTED="$(
            grep -F "  ${FILE}" \
                "${BACKUP_DIR}/SHA256SUMS" |
            awk '{print $1}'
        )"

        ACTUAL="$(
            sha256sum "${FILE}" |
            awk '{print $1}'
        )"

        if [ -z "${EXPECTED}" ]; then

            echo "ERROR: No checksum found for ${FILE}"
            exit 1

        fi

        if [ "${EXPECTED}" != "${ACTUAL}" ]; then

            echo "ERROR: Checksum mismatch:"
            echo "       ${FILE}"
            echo "       Expected: ${EXPECTED}"
            echo "       Actual:   ${ACTUAL}"
            exit 1

        fi

        echo "  OK  ${FILE}"

    done
)

echo
echo "Restored files verified."

echo
echo "Starting Tilt backend..."

pm2 restart tilt-backend --update-env

sleep 5

echo
echo "Checking backend status..."

if ! pm2 status | grep -q "tilt-backend.*online"; then

    echo "ERROR: tilt-backend is not online."
    exit 1

fi

echo "  OK  tilt-backend online."

ROLLBACK_NEEDED=false

echo
echo "======================================"
echo " RESTORE SUCCESSFUL"
echo "======================================"
echo
echo "Restored from:"
echo "${BACKUP_DIR}"
echo
echo "Safety backup retained at:"
echo "${SAFETY_DIR}"
echo
echo "The safety backup can be removed manually"
echo "after the restored application has been confirmed."
echo