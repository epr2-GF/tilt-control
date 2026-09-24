#!/bin/bash

set -euo pipefail

SOURCE="/opt/tilt-control/backend"
BACKUP_ROOT="/mnt/tilt-server-backup"
WEEKLY_ROOT="${BACKUP_ROOT}/weekly"
LATEST_ROOT="${BACKUP_ROOT}/latest"

TIMESTAMP="$(date '+%Y-%m-%d_%H-%M-%S')"
BACKUP_DIR="${WEEKLY_ROOT}/${TIMESTAMP}"
TEMP_DIR="${WEEKLY_ROOT}/.tmp-${TIMESTAMP}"

FILES=(
    ".env"
    "src/data/users.json"
    "src/data/devices.json"
    "src/data/siteMessage.json"
    "src/data/auditLog.json"
    "src/data/deviceStatusLog.json"
    "src/data/sessionActivity.json"
)

echo "======================================"
echo " Tilt Server Weekly Backup"
echo "======================================"
echo
echo "Source : ${SOURCE}"
echo "Target : ${BACKUP_DIR}"
echo

# Make sure the NFS filesystem is available.
if ! mountpoint -q "${BACKUP_ROOT}"; then
    echo "ERROR: Backup filesystem is not mounted:"
    echo "       ${BACKUP_ROOT}"
    exit 1
fi

# Make sure the source exists.
if [ ! -d "${SOURCE}" ]; then
    echo "ERROR: Source directory does not exist:"
    echo "       ${SOURCE}"
    exit 1
fi

# Make sure backup directories exist.
mkdir -p "${WEEKLY_ROOT}"
mkdir -p "${LATEST_ROOT}"

chmod 700 "${WEEKLY_ROOT}"
chmod 700 "${LATEST_ROOT}"

# Start with a temporary directory.
rm -rf "${TEMP_DIR}"
mkdir -p "${TEMP_DIR}"

echo "Copying files..."

for FILE in "${FILES[@]}"; do
    if [ ! -f "${SOURCE}/${FILE}" ]; then
        echo "ERROR: Missing source file:"
        echo "       ${SOURCE}/${FILE}"
        rm -rf "${TEMP_DIR}"
        exit 1
    fi

    mkdir -p "${TEMP_DIR}/$(dirname "${FILE}")"

    cp -a "${SOURCE}/${FILE}" "${TEMP_DIR}/${FILE}"

    echo "  OK  ${FILE}"
done

# Protect sensitive backup contents.
chmod 600 "${TEMP_DIR}/.env"
chmod 600 "${TEMP_DIR}"/src/data/*.json

echo
echo "Generating checksums..."

(
    cd "${TEMP_DIR}"
    sha256sum "${FILES[@]}" > SHA256SUMS
)

chmod 600 "${TEMP_DIR}/SHA256SUMS"

echo "  OK  SHA256SUMS"

echo
echo "Creating manifest..."

cat > "${TEMP_DIR}/manifest.json" <<EOF
{
  "backup_type": "tilt_application",
  "backup_timestamp": "${TIMESTAMP}",
  "hostname": "$(hostname)",
  "source": "${SOURCE}",
  "files": [
    ".env",
    "src/data/users.json",
    "src/data/devices.json",
    "src/data/siteMessage.json",
    "src/data/auditLog.json",
    "src/data/deviceStatusLog.json",
    "src/data/sessionActivity.json"
  ]
}
EOF

chmod 600 "${TEMP_DIR}/manifest.json"

echo "  OK  manifest.json"

echo
echo "Verifying backup..."

(
    cd "${TEMP_DIR}"
    sha256sum -c SHA256SUMS
)

echo
echo "Publishing backup..."

mv "${TEMP_DIR}" "${BACKUP_DIR}"

chmod 700 "${BACKUP_DIR}"

echo "  OK  ${BACKUP_DIR}"

echo
echo "Updating latest backup..."

rm -rf "${LATEST_ROOT}"
mkdir -p "${LATEST_ROOT}"

cp -a "${BACKUP_DIR}/." "${LATEST_ROOT}/"

chmod 700 "${LATEST_ROOT}"
chmod 600 "${LATEST_ROOT}/.env"
chmod 600 "${LATEST_ROOT}/SHA256SUMS"
chmod 600 "${LATEST_ROOT}/manifest.json"
chmod 600 "${LATEST_ROOT}"/src/data/*.json

echo "  OK  latest/"

echo
echo "Applying retention policy..."

mapfile -t BACKUPS < <(
    find "${WEEKLY_ROOT}" \
        -mindepth 1 \
        -maxdepth 1 \
        -type d \
        ! -name '.tmp-*' \
        -printf '%T@ %p\n' |
    sort -nr |
    tail -n +13 |
    cut -d' ' -f2-
)

for OLD_BACKUP in "${BACKUPS[@]}"; do
    echo "  Removing ${OLD_BACKUP}"
    rm -rf "${OLD_BACKUP}"
done

echo
echo "======================================"
echo " WEEKLY BACKUP COMPLETE"
echo "======================================"
echo
echo "Latest backup:"
echo "${BACKUP_DIR}"
echo
echo "Retained backups:"
find "${WEEKLY_ROOT}" \
    -mindepth 1 \
    -maxdepth 1 \
    -type d \
    ! -name '.tmp-*' \
    -printf '%f\n' |
sort -r
echo
