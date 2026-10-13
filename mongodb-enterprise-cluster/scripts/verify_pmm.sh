#!/usr/bin/env bash
# ==============================================================================
# scripts/verify_pmm.sh - Verify Percona PMM Telemetry & Query Profiling
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLUSTER_DIR="${SCRIPT_DIR}/.."
INVENTORY="${CLUSTER_DIR}/inventory/hosts.ini"

echo "=============================================================================="
echo "🔍 Percona PMM & Query Profiler Verification Check"
echo "=============================================================================="

# 1. Check PMM-Admin Agent Status on Cluster Nodes
echo ""
echo ">>> [1/3] Checking pmm-admin status across all MongoDB nodes..."
ansible mongodb_cluster -i "${INVENTORY}" -b -m command -a "pmm-admin status"

# 2. Check Monitored Services List
echo ""
echo ">>> [2/3] Checking monitored services registered in PMM..."
ansible mongodb_cluster -i "${INVENTORY}" -b -m command -a "pmm-admin list"

# 3. Generate a Test Query to Validate QAN Profiling
echo ""
echo ">>> [3/3] Generating test query on Primary to verify Profiler capture..."
ansible mongodb_primary -i "${INVENTORY}" -b -m shell -a '
  mongosh --port 27017 admin -u "clusterAdmin" -p "ClusterAdminSecret2026!" --quiet --eval "
    use ecommerce_db;
    db.orders.insertOne({ item: \"PMM_TEST_ITEM\", latency_test: true, ts: new Date() });
    let prof = db.system.profile.find().sort({ ts: -1 }).limit(1).toArray();
    print(\"Latest Profiler Entry Captured: \" + JSON.stringify(prof[0]));
  "
'

echo ""
echo "=============================================================================="
echo "✅ PMM Verification Completed! Visit PMM Web UI to view live Query Analytics."
echo "=============================================================================="

