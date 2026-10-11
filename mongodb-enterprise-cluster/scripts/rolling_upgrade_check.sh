#!/usr/bin/env bash
# ==============================================================================
# Script: rolling_upgrade_check.sh
# Purpose: Check cluster readiness before or after a rolling version upgrade
# ==============================================================================

set -euo pipefail

PRIMARY_HOST="${1:-127.0.0.1}"
PORT="${2:-27017}"
ADMIN_USER="${3:-clusterAdmin}"
ADMIN_PASS="${4:-ClusterAdminSecret2026!}"

echo "=========================================================="
echo " Checking Rolling Upgrade Health & Versions..."
echo " Primary: ${PRIMARY_HOST}:${PORT}"
echo "=========================================================="

mongosh --host "${PRIMARY_HOST}" --port "${PORT}" \
  -u "${ADMIN_USER}" -p "${ADMIN_PASS}" --authenticationDatabase admin \
  --eval '
    let status = rs.status();
    let fcv = db.adminCommand({ getParameter: 1, featureCompatibilityVersion: 1 });
    let build = db.adminCommand({ buildInfo: 1 });

    print("\n--- CLUSTER HEALTH SUMMARY ---");
    print("Replica Set: " + status.set + " (OK: " + status.ok + ")");
    print("Primary Server Version: " + build.version);
    print("Feature Compatibility Version (FCV): " + fcv.featureCompatibilityVersion.version);

    print("\n--- MEMBER ROLES & HEALTH ---");
    status.members.forEach(m => {
      print("  -> Node: " + m.name.padEnd(25) + " State: " + m.stateStr.padEnd(12) + " Health: " + m.health + " | Uptime: " + m.uptime + "s");
    });

    let unhealthy = status.members.filter(m => m.health !== 1);
    if (unhealthy.length === 0) {
      print("\n✅ CLUSTER IS 100% HEALTHY FOR ROLLING UPGRADE!");
    } else {
      print("\n❌ WARNING: Unhealthy members detected!");
    }
  '

