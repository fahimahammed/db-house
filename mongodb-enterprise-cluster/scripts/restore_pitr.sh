#!/usr/bin/env bash
# ==============================================================================
# Script: restore_pitr.sh
# Purpose: Remotely invoke Disaster Recovery & Point-In-Time Restore via Ansible
# ==============================================================================

set -euo pipefail

usage() {
  echo "Usage: $0 [--archive=/path/to/archive.gz] [--oplog-limit='sec:inc']"
  echo ""
  echo "Examples:"
  echo "  $0                                                    # Restores latest backup on cluster"
  echo "  $0 --archive=/var/backups/mongodb/backup.archive.gz  # Restores specific archive"
  echo "  $0 --oplog-limit='1712839200:1'                       # Restores with PITR oplog timestamp"
  exit 1
}

ARCHIVE_ARG=""
OPLOG_LIMIT_ARG=""

for arg in "$@"; do
  case $arg in
    --archive=*)
      ARCHIVE_ARG="${arg#*=}"
      shift
      ;;
    --oplog-limit=*)
      OPLOG_LIMIT_ARG="${arg#*=}"
      shift
      ;;
    --help)
      usage
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLUSTER_DIR="$(dirname "${SCRIPT_DIR}")"

cd "${CLUSTER_DIR}"

EXTRA_VARS=""
if [[ -n "${ARCHIVE_ARG}" ]]; then
  EXTRA_VARS="${EXTRA_VARS} restore_archive=${ARCHIVE_ARG}"
fi
if [[ -n "${OPLOG_LIMIT_ARG}" ]]; then
  EXTRA_VARS="${EXTRA_VARS} restore_oplog_limit='${OPLOG_LIMIT_ARG}'"
fi

if [[ -n "${EXTRA_VARS}" ]]; then
  ansible-playbook playbooks/08_restore_disaster_recovery.yml -e "${EXTRA_VARS}"
else
  ansible-playbook playbooks/08_restore_disaster_recovery.yml
fi

