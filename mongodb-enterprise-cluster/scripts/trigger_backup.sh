#!/usr/bin/env bash
# ==============================================================================
# Script: trigger_backup.sh
# Purpose: Remotely trigger an immediate on-demand backup on the designated
#          secondary cluster node using Ansible.
# ==============================================================================

set -euo pipefail

FETCH_FLAG="${1:-false}"

echo "=========================================================="
echo " Triggering On-Demand Backup on Cluster Secondary..."
echo " Fetch to controller: ${FETCH_FLAG}"
echo "=========================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLUSTER_DIR="$(dirname "${SCRIPT_DIR}")"

cd "${CLUSTER_DIR}"

if [[ "${FETCH_FLAG}" == "true" || "${FETCH_FLAG}" == "--fetch" ]]; then
  ansible-playbook playbooks/07_trigger_manual_backup.yml -e "fetch_to_controller=true"
else
  ansible-playbook playbooks/07_trigger_manual_backup.yml
fi

