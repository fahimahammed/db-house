#!/usr/bin/env bash
# ==============================================================================
# Script: verify_cluster.sh
# Purpose: Check health, election status, member states, and replication lag
# ==============================================================================

set -euo pipefail

PRIMARY_HOST="${1:-127.0.0.1}"
PORT="${2:-27017}"
ADMIN_USER="${3:-clusterAdmin}"
ADMIN_PASS="${4:-ClusterAdminSecret2026!}"

echo "=========================================================="
echo " Connecting to Primary: ${PRIMARY_HOST}:${PORT}"
echo "=========================================================="

mongosh --host "${PRIMARY_HOST}" --port "${PORT}" \
  -u "${ADMIN_USER}" -p "${ADMIN_PASS}" --authenticationDatabase admin \
  --eval '
    print("\n--- 1. REPLICA SET STATUS ---");
    let status = rs.status();
    print("Set Name: " + status.set);
    print("My State: " + status.myState + " (" + (status.myState === 1 ? "PRIMARY" : "SECONDARY") + ")");
    print("\nMembers Summary:");
    status.members.forEach(m => {
      print("  -> ID: " + m._id + " | Host: " + m.name + " | State: " + m.stateStr + " | Health: " + m.health + " | Uptime: " + m.uptime + "s");
    });

    print("\n--- 2. REPLICATION LAG ---");
    rs.printSecondaryReplicationInfo();

    print("\n--- 3. OPLOG WINDOW DURATION ---");
    let oplogStats = db.getSiblingDB("local").oplog.rs.stats();
    print("Oplog Size: " + (oplogStats.maxSize / (1024*1024)).toFixed(2) + " MB");
    print("Oplog Used: " + (oplogStats.size / (1024*1024)).toFixed(2) + " MB");

    print("\n--- 4. FEATURE COMPATIBILITY VERSION ---");
    let fcv = db.adminCommand({ getParameter: 1, featureCompatibilityVersion: 1 });
    print("FCV: " + fcv.featureCompatibilityVersion.version);
  '

