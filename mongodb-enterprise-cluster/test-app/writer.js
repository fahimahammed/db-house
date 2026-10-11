/**
 * ==============================================================================
 * Terminal 1: Continuous Live Writer (Failover-Resilient)
 * ==============================================================================
 * Continuously writes new transactions into the MongoDB Enterprise Cluster.
 * Automatically tracks failover, elections, and primary node handoffs in real-time.
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

const uri = process.env.MONGO_URI || "mongodb://appUser:AppUserSecret2026!@18.143.176.226:27017,13.250.104.67:27017,18.141.4.93:27017/ecommerce_db?replicaSet=rs-prod-01&authSource=ecommerce_db&readPreference=secondaryPreferred&retryWrites=true&w=majority";

async function runWriter() {
  console.log("================================================================================");
  console.log(" ✏️  TERMINAL 1: FAILOVER-RESILIENT LIVE WRITER");
  console.log(" Connecting to Cluster: " + uri);
  console.log("================================================================================\n");

  const client = new MongoClient(uri, {
    monitorCommands: true,
    retryWrites: true,
    retryReads: true,
    serverSelectionTimeoutMS: 15000, // Allows 15s for leader election during chaos
  });

  let activeServer = "CONNECTING...";
  client.on('commandStarted', (event) => {
    if (['insert', 'update'].includes(event.commandName.toLowerCase())) {
      activeServer = event.address;
    }
  });

  // Track topology changes and elections live
  let previousPrimary = null;
  client.on('topologyDescriptionChanged', (event) => {
    const newDesc = event.newDescription;
    const currentPrimary = Array.from(newDesc.servers.values()).find(s => s.type === 'RSPrimary');

    if (currentPrimary && currentPrimary.address !== previousPrimary) {
      if (previousPrimary) {
        console.log(`\n================================================================================`);
        console.log(` 🚨 FAILOVER DETECTED! Primary shifted: ${previousPrimary} ➔ ${currentPrimary.address}`);
        console.log(`================================================================================\n`);
      } else {
        console.log(`📌 Current Cluster Primary: ${currentPrimary.address}`);
      }
      previousPrimary = currentPrimary.address;
    }
  });

  await client.connect();
  console.log("✅ Writer connected! Starting live stream...\n");

  const col = client.db('ecommerce_db').collection('live_stream');

  let seq = 0;
  setInterval(async () => {
    seq++;
    const startTime = Date.now();
    try {
      const payload = {
        seq: seq,
        item: `Order-${seq}`,
        amount: (Math.random() * 500 + 50).toFixed(2),
        timestamp: new Date()
      };

      await col.insertOne(payload, { writeConcern: { w: 'majority' } });
      const duration = Date.now() - startTime;
      const timeStr = new Date().toLocaleTimeString();

      console.log(`[${timeStr}] ✏️  [WRITE -> ${activeServer}] Seq #${seq.toString().padStart(4, '0')} | ${payload.item} (\$${payload.amount}) | Latency: ${duration}ms`);
    } catch (err) {
      console.warn(`⚠️  [WAITING FOR NEW PRIMARY] Seq #${seq} -> ${err.message}`);
    }
  }, 1000);
}

runWriter().catch(err => {
  console.error("Fatal Writer Error:", err);
});
