/**
 * ==============================================================================
 * MongoDB Replica Set - Continuous Writer (Terminal 1)
 * ==============================================================================
 * 
 * Writes random batches of documents periodically to the PRIMARY node.
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

const uri = process.env.MONGO_URI;

const NODE_MAP = {
  "10.0.1.30": "mongo-01 (Primary Candidate)",
  "10.0.2.51": "mongo-02 (Secondary)",
  "10.0.3.43": "mongo-03 (Secondary)",
  "54.255.212.115": "mongo-01 (Public IP)",
  "52.77.230.221": "mongo-02 (Public IP)",
  "47.129.180.86": "mongo-03 (Public IP)"
};

function getNodeLabel(address) {
  if (!address) return "UNKNOWN";
  for (const [ip, name] of Object.entries(NODE_MAP)) {
    if (address.includes(ip)) return `${name} [${address}]`;
  }
  return address;
}

const PRODUCTS = ["MacBook Pro M3", "iPhone 15 Pro", "Sony WH-1000XM5", "iPad Air", "Dell XPS 15", "Keychron K2"];

async function main() {
  console.log("================================================================================");
  console.log(" 🚀 STARTING WRITER (Writes exclusively to PRIMARY)");
  console.log(" URI: " + uri);
  console.log("================================================================================\n");

  const client = new MongoClient(uri, {
    monitorCommands: true,
    serverSelectionTimeoutMS: 5000,
  });

  client.on('commandStarted', (event) => {
    if (event.commandName === 'insert') {
      console.log(`[WRITE EVENT] ✏️  Routed To: ${getNodeLabel(event.address)} | Command: INSERT`);
    }
  });

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB Replica Set!\n");

    const db = client.db('ecommerce_db');
    const orders = db.collection('orders');

    let batchNumber = 1;

    // Loop indefinitely: insert a random number of items every 3 seconds
    while (true) {
      const count = Math.floor(Math.random() * 5) + 1; // 1 to 5 random orders
      const docs = [];

      for (let i = 1; i <= count; i++) {
        docs.push({
          order_id: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          product: PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)],
          amount: parseFloat((Math.random() * 1500 + 100).toFixed(2)),
          batch: batchNumber,
          createdAt: new Date(),
        });
      }

      const result = await orders.insertMany(docs);
      console.log(`[Batch #${batchNumber}] 📦 Inserted ${result.insertedCount} items successfully at ${new Date().toLocaleTimeString()}`);

      batchNumber++;
      await new Promise((res) => setTimeout(res, 3000)); // Wait 3 seconds
    }
  } catch (err) {
    console.error("❌ Writer Error:", err.message);
  } finally {
    await client.close();
  }
}

main();

