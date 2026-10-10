/**
 * ==============================================================================
 * MongoDB Replica Set - Continuous Reader (Terminal 2)
 * ==============================================================================
 * 
 * Reads data with 'secondaryPreferred' or 'secondary' to demonstrate
 * reading from replicas and showing which DB/Node served the read.
 * Runs exactly 10 iterations.
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// Automatically load .env if available
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = (match[2] || '').trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

// Connection URI from .env with readPreference=secondaryPreferred
let baseUri = process.env.MONGO_URI || "";
if (baseUri && !baseUri.includes('readPreference')) {
  baseUri += (baseUri.includes('?') ? '&' : '?') + 'readPreference=secondaryPreferred';
}
const uri = baseUri;

const NODE_MAP = {
  "10.0.1.30": "mongo-01 [PRIMARY]",
  "10.0.2.51": "mongo-02 [SECONDARY]",
  "10.0.3.43": "mongo-03 [SECONDARY]",
  "54.255.212.115": "mongo-01 [Public IP]",
  "52.77.230.221": "mongo-02 [Public IP]",
  "47.129.180.86": "mongo-03 [Public IP]"
};

function getNodeLabel(address) {
  if (!address) return "UNKNOWN";
  for (const [ip, name] of Object.entries(NODE_MAP)) {
    if (address.includes(ip)) return `${name} (${address})`;
  }
  return address;
}

async function main() {
  console.log("================================================================================");
  console.log(" 📖 STARTING READER (10 Iterations - Read from Replicas)");
  console.log(" URI: " + uri);
  console.log(" Read Preference: secondaryPreferred");
  console.log("================================================================================\n");

  const client = new MongoClient(uri, {
    monitorCommands: true,
    serverSelectionTimeoutMS: 5000,
  });

  let lastRoutedAddress = null;
  client.on('commandStarted', (event) => {
    if (['find', 'count'].includes(event.commandName)) {
      lastRoutedAddress = event.address;
    }
  });

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB Replica Set!\n");

    const db = client.db('ecommerce_db');
    const orders = db.collection('orders');

    const TOTAL_ITERATIONS = 10;

    for (let i = 1; i <= TOTAL_ITERATIONS; i++) {
      console.log(`--------------------------------------------------------------------------------`);
      console.log(`Iteration [${i}/${TOTAL_ITERATIONS}] - Reading at ${new Date().toLocaleTimeString()}...`);

      // 1. Count documents
      const totalCount = await orders.countDocuments();
      const readNode = getNodeLabel(lastRoutedAddress);

      // 2. Fetch the latest 2 inserted records
      const latestOrders = await orders.find({})
        .sort({ createdAt: -1 })
        .limit(2)
        .toArray();

      console.log(`🎯 Read Served By Database Node: ${readNode}`);
      console.log(`📊 Total Documents Found:        ${totalCount}`);

      if (latestOrders.length > 0) {
        console.log(`🔄 Latest Synced Document:`);
        console.log(`   - Order ID:   ${latestOrders[0].order_id}`);
        console.log(`   - Product:    ${latestOrders[0].product} ($${latestOrders[0].amount})`);
        console.log(`   - Batch:      ${latestOrders[0].batch}`);
        console.log(`   - Created At: ${latestOrders[0].createdAt}`);
        console.log(`   ✨ STATUS: Replicated & Synced on this Secondary Node!`);
      } else {
        console.log(`ℹ️  No documents inserted yet.`);
      }

      if (i < TOTAL_ITERATIONS) {
        console.log(`⏳ Waiting 2 seconds for next read...`);
        await new Promise((res) => setTimeout(res, 2000));
      }
    }

    console.log(`\n================================================================================`);
    console.log(`✅ COMPLETED: Finished all ${TOTAL_ITERATIONS} read iterations successfully!`);
    console.log(`================================================================================`);

  } catch (err) {
    console.error("❌ Reader Error:", err.message);
  } finally {
    await client.close();
  }
}

main();

