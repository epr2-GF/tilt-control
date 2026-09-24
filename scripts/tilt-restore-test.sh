#!/bin/bash

set -euo pipefail

BACKUP_DIR="${1:-}"
TEST_ROOT="/tmp/tilt-restore-test"

FILES=(
    ".env"
    "src/data/users.json"
    "src/data/devices.json"
    "src/data/siteMessage.json"
    "src/data/auditLog.json"
    "src/data/deviceStatusLog.json"
    "src/data/sessionActivity.json"
)

if [ -z "${BACKUP_DIR}" ]; then
    echo "Usage:"
    echo "  $0 /mnt/tilt-server-backup/manual/YYYY-MM-DD_HH-MM-SS"
    exit 1
fi

if [ ! -d "${BACKUP_DIR}" ]; then
    echo "ERROR: Backup directory does not exist:"
    echo "${BACKUP_DIR}"
    exit 1
fi

if [ ! -f "${BACKUP_DIR}/SHA256SUMS" ]; then
    echo "ERROR: SHA256SUMS not found"
    exit 1
fi

if [ ! -f "${BACKUP_DIR}/manifest.json" ]; then
    echo "ERROR: manifest.json not found"
    exit 1
fi

echo "======================================"
echo " Tilt Server Restore TEST"
echo "======================================"
echo
echo "Backup:"
echo "${BACKUP_DIR}"
echo
echo "Destination:"
echo "${TEST_ROOT}"
echo

rm -rf "${TEST_ROOT}"
mkdir -p "${TEST_ROOT}"

echo "Verifying backup..."

(
    cd "${BACKUP_DIR}"
    sha256sum -c SHA256SUMS
)

echo
echo "Backup verification successful."
echo
echo "Restoring files to temporary directory..."

for FILE in "${FILES[@]}"; do
    if [ ! -f "${BACKUP_DIR}/${FILE}" ]; then
        echo "ERROR: Missing backup file:"
        echo "${FILE}"
        rm -rf "${TEST_ROOT}"
        exit 1
    fi

    mkdir -p "${TEST_ROOT}/$(dirname "${FILE}")"
    cp -a "${BACKUP_DIR}/${FILE}" "${TEST_ROOT}/${FILE}"

    echo "  OK  ${FILE}"
done

echo
echo "Verifying restored files..."

(
    cd "${TEST_ROOT}"

    for FILE in "${FILES[@]}"; do
        HASH="$(grep -F "  ${FILE}" "${BACKUP_DIR}/SHA256SUMS" | awk '{print $1}')"

        if [ -z "${HASH}" ]; then
            echo "ERROR: No checksum found for ${FILE}"
            exit 1
        fi

        ACTUAL="$(sha256sum "${FILE}" | awk '{print $1}')"

        if [ "${HASH}" != "${ACTUAL}" ]; then
            echo "ERROR: Checksum mismatch:"
            echo "       ${FILE}"
            exit 1
        fi

        echo "  OK  ${FILE}"
    done
)

echo
echo "======================================"
echo " RESTORE TEST SUCCESSFUL"
echo "======================================"
echo
echo "Temporary restore:"
echo "${TEST_ROOT}"
echo
echo "The live Tilt application was NOT modified."
echo
