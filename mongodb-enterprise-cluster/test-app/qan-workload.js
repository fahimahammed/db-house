/**
 * ==============================================================================
 * MongoDB Query Analytics (QAN) Workload Generator
 * ==============================================================================
 * Generates distinct query fingerprints with varying execution profiles
 * to populate Percona PMM Query Analytics (QAN) in real time:
 *
 *   1. Point Lookup (Indexed read)
 *   2. Unindexed Scan (COLLSCAN regex search)
 *   3. Aggregation Pipeline ($match, $group, $sort)
 *   4. Range Query with In-Memory Sort
 *   5. Bulk Insert (insertMany)
 *   6. Multi-Document Update (updateMany)
 *   7. Document Deletion (deleteMany)
 *   8. Controlled High-Latency Query (sleep > 120ms to trigger slowOp profiler)
 *
 * Usage:
 *   node qan-workload.js          # Continuous workload loop
 *   node qan-workload.js --once   # Single test batch
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// Auto-load .env
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
    envLines.forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
    });
  }
} catch (e) {}

const uri = process.env.MONGO_URI || "mongodb://appUser:AppUserSecret2026!@13.212.211.250:27017,3.0.98.60:27017,47.129.180.28:27017/ecommerce_db?replicaSet=rs-prod-01&authSource=ecommerce_db&readPreference=secondaryPreferred&retryWrites=true&w=majority";

const runOnce = process.argv.includes('--once');
const CATEGORIES = ['Electronics', 'Books', 'Home', 'Fashion', 'Sports', 'Automotive'];
const STATUSES = ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REFUNDED'];

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAmount(min = 10, max = 1500) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

async function prepareSampleData(collection) {
  const count = await collection.countDocuments();
  if (count < 200) {
    console.log(`[Setup] Seeding initial sample data (current: ${count})...`);
    const docs = [];
    for (let i = 1; i <= 250; i++) {
      docs.push({
        order_id: 10000 + i,
        customer_name: `Customer_${i}`,
        category: randomElement(CATEGORIES),
        status: randomElement(STATUSES),
        amount: randomAmount(),
        items_count: Math.floor(Math.random() * 5) + 1,
        notes: `Order note ${i} with priority ${randomElement(['normal', 'urgent', 'rush', 'low'])}`,
        created_at: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 30))
      });
    }
    await collection.insertMany(docs);
    console.log(`[Setup] Seeded 250 sample documents.`);
  }

  // Create an index on order_id for indexed query tests
  await collection.createIndex({ order_id: 1 });
}

async function executeQANWorkload(db, iteration) {
  const orders = db.collection('orders');

  console.log(`\n================================================================================`);
  console.log(`>>> QAN WORKLOAD ITERATION #${iteration} [${new Date().toISOString()}]`);
  console.log(`================================================================================`);

  // Query 1: Bulk Insert (Write fingerprint)
  try {
    const newOrders = [];
    for (let i = 0; i < 5; i++) {
      const id = Date.now() + i;
      newOrders.push({
        order_id: id,
        customer_name: `User_${id % 1000}`,
        category: randomElement(CATEGORIES),
        status: 'PENDING',
        amount: randomAmount(20, 800),
        items_count: Math.floor(Math.random() * 3) + 1,
        notes: `Batch order note ${id} urgent delivery required`,
        created_at: new Date()
      });
    }
    const t0 = Date.now();
    const insertRes = await orders.insertMany(newOrders);
    console.log(`[1. BULK INSERT] Inserted ${insertRes.insertedCount} orders (${Date.now() - t0} ms)`);
  } catch (err) {
    console.error(`[1. BULK INSERT Error]`, err.message);
  }

  // Query 2: Indexed Point Lookup (Fast Read fingerprint)
  try {
    const t0 = Date.now();
    const doc = await orders.findOne({ order_id: 10050 });
    console.log(`[2. INDEXED FIND] findOne({ order_id: 10050 }) -> ${doc ? 'FOUND' : 'NOT FOUND'} (${Date.now() - t0} ms)`);
  } catch (err) {
    console.error(`[2. INDEXED FIND Error]`, err.message);
  }

  // Query 3: Unindexed Scan with Regex (COLLSCAN fingerprint)
  try {
    const t0 = Date.now();
    const searchPattern = randomElement(['urgent', 'rush', 'priority']);
    const unindexedResults = await orders.find({
      notes: { $regex: searchPattern, $options: 'i' }
    }).limit(20).toArray();
    console.log(`[3. UNINDEXED COLLSCAN] Regex find("${searchPattern}") -> ${unindexedResults.length} matches (${Date.now() - t0} ms)`);
  } catch (err) {
    console.error(`[3. UNINDEXED COLLSCAN Error]`, err.message);
  }

  // Query 4: Aggregation Pipeline (Analytics fingerprint)
  try {
    const t0 = Date.now();
    const aggResult = await orders.aggregate([
      { $match: { amount: { $gte: 50 } } },
      {
        $group: {
          _id: "$category",
          totalRevenue: { $sum: "$amount" },
          avgItems: { $avg: "$items_count" },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]).toArray();
    console.log(`[4. AGGREGATION] $group by category -> ${aggResult.length} groups computed (${Date.now() - t0} ms)`);
  } catch (err) {
    console.error(`[4. AGGREGATION Error]`, err.message);
  }

  // Query 5: Range Filter with In-Memory Sort
  try {
    const t0 = Date.now();
    const rangeResults = await orders.find({
      amount: { $gte: 100, $lte: 600 }
    }).sort({ created_at: -1 }).limit(15).toArray();
    console.log(`[5. RANGE + SORT] Amount 100..600 sorted by created_at -> ${rangeResults.length} docs (${Date.now() - t0} ms)`);
  } catch (err) {
    console.error(`[5. RANGE + SORT Error]`, err.message);
  }

  // Query 6: Multi-Document Update (Update fingerprint)
  try {
    const t0 = Date.now();
    const updateRes = await orders.updateMany(
      { status: 'PENDING', amount: { $gt: 400 } },
      { $set: { status: 'PROCESSING', processed_at: new Date() } }
    );
    console.log(`[6. UPDATE] updateMany(PENDING -> PROCESSING) -> Matched: ${updateRes.matchedCount}, Modified: ${updateRes.modifiedCount} (${Date.now() - t0} ms)`);
  } catch (err) {
    console.error(`[6. UPDATE Error]`, err.message);
  }

  // Query 7: Controlled Slow Query (> 120ms to trigger slowOp profiler threshold)
  try {
    const t0 = Date.now();
    // Scan with full JavaScript evaluation to simulate heavy processing
    const slowRes = await orders.find({
      $where: "function() { sleep(125); return this.amount > 1000; }"
    }).limit(1).toArray();
    console.log(`[7. SLOW QUERY] $where with sleep(125ms) -> Completed in ${Date.now() - t0} ms (Triggers slowOp profiler)`);
  } catch (err) {
    // Some MongoDB configs disable $where; fallback to complex regex scan if restricted
    const t0 = Date.now();
    const fallback = await orders.find({
      notes: { $regex: ".*(urgent|rush|delivery|priority).*", $options: "i" },
      amount: { $gt: 0 }
    }).toArray();
    console.log(`[7. SLOW QUERY (Fallback)] Heavy regex scan -> ${fallback.length} docs (${Date.now() - t0} ms)`);
  }

  // Query 8: Deletion of Expired / Old Records (Delete fingerprint)
  try {
    const t0 = Date.now();
    const deleteRes = await orders.deleteMany({
      status: 'CANCELLED',
      created_at: { $lt: new Date(Date.now() - 86400000 * 20) }
    });
    console.log(`[8. DELETE] deleteMany(old CANCELLED) -> Deleted: ${deleteRes.deletedCount} (${Date.now() - t0} ms)`);
  } catch (err) {
    console.error(`[8. DELETE Error]`, err.message);
  }
}

async function main() {
  console.log("================================================================================");
  console.log(" 🚀 PERCONA PMM QUERY ANALYTICS (QAN) WORKLOAD GENERATOR");
  console.log(" Target: " + uri);
  console.log(` Mode:   ${runOnce ? "Single Test Run (--once)" : "Continuous Loop (Interval: 3s)"}`);
  console.log("================================================================================");

  const client = new MongoClient(uri, {
    retryWrites: true,
    retryReads: true,
    serverSelectionTimeoutMS: 10000
  });

  try {
    await client.connect();
    console.log("Connected successfully to MongoDB Enterprise Cluster.");
    const db = client.db('ecommerce_db');
    const orders = db.collection('orders');

    await prepareSampleData(orders);

    let iteration = 1;
    if (runOnce) {
      await executeQANWorkload(db, iteration);
      console.log("\nWorkload complete. Check Percona PMM QAN dashboard for newly captured fingerprints.");
      await client.close();
      process.exit(0);
    } else {
      while (true) {
        await executeQANWorkload(db, iteration++);
        console.log("\nWaiting 3 seconds before next workload cycle... (Press Ctrl+C to stop)");
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  } catch (err) {
    console.error("Fatal workload error:", err);
    process.exit(1);
  }
}

main();

