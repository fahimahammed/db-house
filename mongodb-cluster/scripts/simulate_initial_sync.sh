#!/usr/bin/env bash
# ==============================================================================
# Script: simulate_initial_sync.sh
# Purpose: Step-by-step test for Initial Sync with Pre-existing Data on Primary
# ==============================================================================

set -euo pipefail

PRIMARY_HOST="${1:-127.0.0.1}"
NEW_NODE_HOST="${2:-127.0.0.1}"
PORT="${3:-27017}"
ADMIN_USER="${4:-clusterAdmin}"
ADMIN_PASS="${5:-ClusterAdminSecret2026!}"
APP_USER="${6:-appUser}"
APP_PASS="${7:-AppUserSecret2026!}"
APP_DB="ecommerce_db"

echo "========================================================================"
echo " STEP 1: Insert 5,000 pre-existing records on Primary BEFORE new node joins"
echo "========================================================================"

mongosh --host "${PRIMARY_HOST}" --port "${PORT}" \
  -u "${APP_USER}" -p "${APP_PASS}" --authenticationDatabase "${APP_DB}" \
  "${APP_DB}" --quiet --eval "
    db.inventory.drop();
    let bulk = [];
    for (let i = 1; i <= 5000; i++) {
      bulk.push({
        sku: 'SKU-' + i,
        name: 'Item ' + i,
        price: (Math.random() * 100).toFixed(2),
        created_at: new Date()
      });
    }
    db.inventory.insertMany(bulk);
    print('Initial records inserted on Primary: ' + db.inventory.countDocuments());
  "

echo -e "\n========================================================================"
echo " STEP 2: Issue rs.add() to join ${NEW_NODE_HOST}:${PORT}"
echo "========================================================================"

mongosh --host "${PRIMARY_HOST}" --port "${PORT}" \
  -u "${ADMIN_USER}" -p "${ADMIN_PASS}" --authenticationDatabase admin \
  --quiet --eval "
    let members = rs.status().members.map(m => m.name);
    let target = '${NEW_NODE_HOST}:${PORT}';
    if (!members.includes(target)) {
      rs.add({ host: target, priority: 1, votes: 1 });
      print('Node added to replica set: ' + target);
    } else {
      print('Node already present: ' + target);
    }
  "

echo -e "\n========================================================================"
echo " STEP 3: Actively watch member transition through Initial Sync states"
echo " (STARTUP -> STARTUP2 -> RECOVERING -> SECONDARY)"
echo "========================================================================"

for i in {1..30}; do
  STATE=$(mongosh --host "${PRIMARY_HOST}" --port "${PORT}" \
    -u "${ADMIN_USER}" -p "${ADMIN_PASS}" --authenticationDatabase admin \
    --quiet --eval "
      let m = rs.status().members.find(m => m.name.startsWith('${NEW_NODE_HOST}'));
      print(m ? m.stateStr : 'NOT_FOUND');
    ")

  echo "[Attempt ${i}/30] Node ${NEW_NODE_HOST} current state: ${STATE}"

  if [ "${STATE}" == "SECONDARY" ]; then
    echo ">> CONGRATULATIONS! Node successfully transitioned to SECONDARY."
    break
  fi
  sleep 2
done

echo -e "\n========================================================================"
echo " STEP 4: Query the new Secondary node directly to verify data integrity"
echo "========================================================================"

mongosh --host "${NEW_NODE_HOST}" --port "${PORT}" \
  -u "${APP_USER}" -p "${APP_PASS}" --authenticationDatabase "${APP_DB}" \
  "${APP_DB}" --quiet --eval "
    db.getMongo().setReadPref('secondaryPreferred');
    let count = db.inventory.countDocuments();
    print('Verified document count on new Secondary: ' + count + ' / 5000');
    if (count === 5000) {
      print('>> 100% OF PRE-EXISTING DATA SYNCED AUTOMATICALLY! <<');
    } else {
      print('>> WARNING: Data count mismatch! <<');
    }
  "

