/**
 * ==============================================================================
 * Terminal 1: Continuous Live Writer (Routes to PRIMARY)
 * ==============================================================================
 * Continuously writes new transactions into the MongoDB Enterprise Cluster.
 * Monitors connection and visibly proves all writes go to PRIMARY.
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
  console.log(" ✏️  TERMINAL 1: CONTINUOUS WRITER ACTIVE");
  console.log(" Connecting to Cluster: " + uri);
  console.log("================================================================================\n");

  const client = new MongoClient(uri, {
    monitorCommands: true,
    retryWrites: true,
    serverSelectionTimeoutMS: 5000,
  });

  let activeServer = "CONNECTING...";
  client.on('commandStarted', (event) => {
    if (['insert', 'update'].includes(event.commandName.toLowerCase())) {
      activeServer = event.address;
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

      const result = await col.insertOne(payload, { writeConcern: { w: 'majority' } });
      const duration = Date.now() - startTime;
      const timeStr = new Date().toLocaleTimeString();

      console.log(`[${timeStr}] ✏️  [WRITE -> ${activeServer}] Seq #${seq.toString().padStart(4, '0')} | ${payload.item} (\$${payload.amount}) | Latency: ${duration}ms`);
    } catch (err) {
      console.error(`❌ [WRITE FAILED] Seq #${seq} -> ${err.message}`);
      if (seq === 1 && client.topology) {
        console.log("\n🔍 Topology Diagnostic (Why servers were not selected):");
        for (const [address, server] of client.topology.description.servers) {
          console.log(`   -> Host [${address}]: Type=${server.type} | Error=${server.error?.message || 'none'}`);
        }
        console.log("\n👉 If hosts show Private IPs (10.0.x.x) or cannot be reached from outside AWS,");
        console.log("   run 'ansible-playbook playbooks/reconfig_public_ips.yml' to switch cluster to Public IPs.\n");
      }
    }
  }, 1000);
}

runWriter().catch(err => {
  console.error("Fatal Writer Error:", err);
});
