#!/usr/bin/env bash
# ==============================================================================
# Script: test_client_access.sh
# Purpose: Test if MongoDB port 27017 is reachable or properly blocked
# ==============================================================================

set -euo pipefail

TARGET_HOST="${1:-127.0.0.1}"
TARGET_PORT="${2:-27017}"
TIMEOUT_SEC="${3:-3}"

echo "=========================================================="
echo " Testing Network Access to MongoDB"
echo " Host: ${TARGET_HOST} | Port: ${TARGET_PORT} | Timeout: ${TIMEOUT_SEC}s"
echo "=========================================================="

if nc -z -w "${TIMEOUT_SEC}" "${TARGET_HOST}" "${TARGET_PORT}" 2>/dev/null; then
  echo "✅ ACCESS GRANTED: Connection to ${TARGET_HOST}:${TARGET_PORT} succeeded."
  echo "   (This machine is an authorized application server or cluster node)"
  exit 0
else
  echo "🛑 ACCESS DENIED / BLOCKED: Connection to ${TARGET_HOST}:${TARGET_PORT} timed out or was rejected."
  echo "   (Firewall rules are working! Unauthorized clients are strictly filtered)"
  exit 1
fi

