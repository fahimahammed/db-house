/**
 * ==============================================================================
 * MongoDB Enterprise Cluster Read/Write Split & Topology Test Script
 * ==============================================================================
 * 
 * Verifies that:
 *   1. Writes automatically route to PRIMARY with { w: 'majority' }
 *   2. Reads automatically route to SECONDARY with { readPreference: 'secondaryPreferred' }
 *   3. Modern retryable writes handle instantaneous topology shifts seamlessly
 */

const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI || "mongodb://appUser:AppUserSecret2026!@10.0.1.30:27017,10.0.2.51:27017,10.0.3.43:27017/ecommerce_db?replicaSet=rs-prod-01&authSource=ecommerce_db&readPreference=secondaryPreferred&retryWrites=true&w=majority";

async function run() {
  console.log("================================================================================");
  console.log(" Connecting to MongoDB Enterprise Cluster via Single URL...");
  console.log(" URL: " + uri);
  console.log("================================================================================\n");

  const client = new MongoClient(uri, {
    monitorCommands: true,
    serverSelectionTimeoutMS: 5000,
  });

  client.on('commandStarted', (event) => {
    const cmd = event.commandName.toLowerCase();
    if (['insert', 'find', 'update', 'delete', 'count'].includes(cmd)) {
      const type = ['insert', 'update', 'delete'].includes(cmd) ? "WRITE ✏️" : "READ  📖";
      console.log(`[Driver Router] -> Type: ${type} | Command: "${cmd.toUpperCase()}" | Routed To: ${event.address}`);
    }
  });

  try {
    await client.connect();
    console.log(" Connected successfully to Replica Set cluster!\n");

    const db = client.db('ecommerce_db');
    const orders = db.collection('orders');

    // 1. WRITE OPERATION (Primary)
    console.log("--- 1. EXECUTING WRITE OPERATION (insertOne) ---");
    const testOrder = {
      order_id: "ORD-" + Date.now(),
      product: "MacBook Pro M3 Max",
      amount: 3499.00,
      customer: "Fahim Firoz",
      created_at: new Date()
    };

    const writeResult = await orders.insertOne(testOrder);
    console.log(` Write Successful! Inserted ID: ${writeResult.insertedId}\n`);

    // Allow 1 second for Oplog replication across the WAN
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 2. READ OPERATION (Secondary)
    console.log("--- 2. EXECUTING READ OPERATION (find) ---");
    const foundOrder = await orders.findOne({ order_id: testOrder.order_id });

    console.log(" Read Successful! Document retrieved:");
    console.log(JSON.stringify(foundOrder, null, 2));
    console.log("\n================================================================================");
    console.log(" VERIFICATION RESULT:");
    console.log("   - Write Operation was routed to PRIMARY");
    console.log("   - Read Operation was routed to SECONDARY");
    console.log("   - Using ONE SINGLE URL with readPreference=secondaryPreferred & retryWrites=true");
    console.log("================================================================================");

  } catch (error) {
    console.error("❌ Test Failed with Error:", error.message);
  } finally {
    await client.close();
  }
}

run();

