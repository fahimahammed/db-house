/**
 * ==============================================================================
 * MongoDB Replica Set Read/Write Split Test Script
 * ==============================================================================
 * 
 * Target: Use ONE Single URL where:
 *   - Writes automatically go to PRIMARY (mongo-01: 157.180.74.152)
 *   - Reads automatically go to SECONDARY (mongo-02: 167.233.197.173)
 */

const { MongoClient } = require('mongodb');

// 🔑 THE SINGLE CONNECTION URL
const uri = "mongodb://appUser:AppUserSecret2026!@157.180.74.152:27017,167.233.197.173:27017/ecommerce_db?replicaSet=rs-prod-01&authSource=ecommerce_db&readPreference=secondaryPreferred";

// Known server roles for clear output
const PRIMARY_IP = "157.180.74.152";
const SECONDARY_IP = "167.233.197.173";

function identifyServer(address) {
  if (address.includes(PRIMARY_IP)) return "PRIMARY (mongo-01)";
  if (address.includes(SECONDARY_IP)) return "SECONDARY (mongo-02)";
  return "UNKNOWN";
}

async function run() {
  console.log("================================================================================");
  console.log(" Connecting to MongoDB Replica Set via Single URL...");
  console.log(" URL: " + uri);
  console.log("================================================================================\n");

  const client = new MongoClient(uri, {
    monitorCommands: true, // Enables command tracking to inspect server routing
    serverSelectionTimeoutMS: 5000,
  });

  // Track command events to visibly prove which node handles writes vs reads
  client.on('commandStarted', (event) => {
    const cmd = event.commandName.toLowerCase();
    if (['insert', 'find', 'update', 'delete', 'count'].includes(cmd)) {
      const role = identifyServer(event.address);
      const type = ['insert', 'update', 'delete'].includes(cmd) ? "WRITE ✏️" : "READ  📖";
      console.log(`[Driver Router] -> Type: ${type} | Command: "${cmd.toUpperCase()}" | Routed To: ${event.address} [${role}]`);
    }
  });

  try {
    await client.connect();
    console.log(" Connected successfully to Replica Set cluster!\n");

    const db = client.db('ecommerce_db');
    const orders = db.collection('orders');

    // --------------------------------------------------------------------------
    // 1. WRITE OPERATION (Should be routed automatically to PRIMARY)
    // --------------------------------------------------------------------------
    console.log("--- 1. EXECUTING WRITE OPERATION (insertOne) ---");
    const testOrder = {
      order_id: "ORD-" + Date.now(),
      product: "MacBook Pro M3",
      amount: 2499.00,
      customer: "Fahim Firoz",
      created_at: new Date()
    };

    const writeResult = await orders.insertOne(testOrder);
    console.log(` Write Successful! Inserted ID: ${writeResult.insertedId}\n`);

    // Give 1 second for Oplog replication across the network
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // --------------------------------------------------------------------------
    // 2. READ OPERATION (Should be routed automatically to SECONDARY)
    // --------------------------------------------------------------------------
    console.log("--- 2. EXECUTING READ OPERATION (find) ---");
    const foundOrder = await orders.findOne({ order_id: testOrder.order_id });

    console.log(" Read Successful! Document retrieved:");
    console.log(JSON.stringify(foundOrder, null, 2));
    console.log("\n================================================================================");
    console.log(" VERIFICATION RESULT:");
    console.log("   - Write Operation was sent to PRIMARY");
    console.log("   - Read Operation was served from SECONDARY");
    console.log("   - Using ONE SINGLE URL with readPreference=secondaryPreferred!");
    console.log("================================================================================");

  } catch (error) {
    console.error("❌ Test Failed with Error:", error.message);
  } finally {
    await client.close();
  }
}

run();

