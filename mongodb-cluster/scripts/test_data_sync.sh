#!/usr/bin/env bash
# ==============================================================================
# Script: test_data_sync.sh
# Purpose: Insert test records on Primary and verify replication on Secondaries
# ==============================================================================

set -euo pipefail

PRIMARY_HOST="${1:-127.0.0.1}"
SECONDARY1_HOST="${2:-127.0.0.1}"
SECONDARY2_HOST="${3:-127.0.0.1}"
PORT="${4:-27017}"
APP_USER="${5:-appUser}"
APP_PASS="${6:-AppUserSecret2026!}"
APP_DB="ecommerce_db"

BATCH_ID="test-$(date +%s)"
NUM_DOCS=100

echo "=========================================================="
echo " 1. INSERTING ${NUM_DOCS} DOCUMENTS ON PRIMARY (${PRIMARY_HOST})"
echo "=========================================================="

mongosh --host "${PRIMARY_HOST}" --port "${PORT}" \
  -u "${APP_USER}" -p "${APP_PASS}" --authenticationDatabase "${APP_DB}" \
  "${APP_DB}" --quiet --eval "
    let batch = '${BATCH_ID}';
    let docs = [];
    for (let i = 1; i <= ${NUM_DOCS}; i++) {
      docs.push({ order_id: i, batch: batch, amount: Math.random() * 500, created_at: new Date() });
    }
    db.orders.insertMany(docs);
    print('Inserted count on Primary: ' + db.orders.countDocuments({ batch: batch }));
  "

echo -e "\nWaiting 2 seconds for Oplog replication..."
sleep 2

echo "=========================================================="
echo " 2. VERIFYING DATA ON SECONDARY 1 (${SECONDARY1_HOST})"
echo "=========================================================="

mongosh --host "${SECONDARY1_HOST}" --port "${PORT}" \
  -u "${APP_USER}" -p "${APP_PASS}" --authenticationDatabase "${APP_DB}" \
  "${APP_DB}" --quiet --eval "
    db.getMongo().setReadPref('secondaryPreferred');
    let c = db.orders.countDocuments({ batch: '${BATCH_ID}' });
    print('Count on Secondary 1: ' + c);
  "

echo "=========================================================="
echo " 3. VERIFYING DATA ON SECONDARY 2 (${SECONDARY2_HOST})"
echo "=========================================================="

mongosh --host "${SECONDARY2_HOST}" --port "${PORT}" \
  -u "${APP_USER}" -p "${APP_PASS}" --authenticationDatabase "${APP_DB}" \
  "${APP_DB}" --quiet --eval "
    db.getMongo().setReadPref('secondaryPreferred');
    let c = db.orders.countDocuments({ batch: '${BATCH_ID}' });
    print('Count on Secondary 2: ' + c);
  "

echo -e "\nReplication Verification Complete!"

