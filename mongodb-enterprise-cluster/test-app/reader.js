/**
 * ==============================================================================
 * Terminal 2: Continuous Live Reader (Failover-Resilient)
 * ==============================================================================
 * Continuously reads from Secondary nodes (or fallback to new Primary).
 * Tracks topology changes and proves read availability during primary failover.
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

const uri = process.env.MONGO_URI || "mongodb://appUser:AppUserSecret2026!@18.143.176.226:27017,13.250.104.67:27017,18.141.4.93:27017/ecommerce_db?replicaSet=rs-prod-01&authSource=ecommerce_db&readPreference=secondaryPreferred&retryWrites=true";

async function runReader() {
  console.log("================================================================================");
  console.log(" 📖 TERMINAL 2: CONTINUOUS READER ACTIVE");
  console.log(" Read Preference: secondaryPreferred");
  console.log(" Connecting to Cluster: " + uri);
  console.log("================================================================================\n");

  const client = new MongoClient(uri, {
    monitorCommands: true,
    retryReads: true,
    serverSelectionTimeoutMS: 15000,
  });

  let activeServer = "CONNECTING...";
  client.on('commandStarted', (event) => {
    if (['find', 'count'].includes(event.commandName.toLowerCase())) {
      activeServer = event.address;
    }
  });

  await client.connect();
  console.log("✅ Reader connected! Polling live replication...\n");

  const col = client.db('ecommerce_db').collection('live_stream');

  let lastSeenSeq = 0;
  setInterval(async () => {
    const startTime = Date.now();
    try {
      const docs = await col.find().sort({ _id: -1 }).limit(1).toArray();
      const duration = Date.now() - startTime;
      const timeStr = new Date().toLocaleTimeString();

      if (docs.length > 0) {
        const doc = docs[0];
        const isNew = doc.seq !== lastSeenSeq;
        lastSeenSeq = doc.seq;

        const syncStatus = isNew ? "⚡ SYNCED" : "   IDLE  ";
        console.log(`[${timeStr}] 📖 [READ <- ${activeServer}] [${syncStatus}] Seq #${doc.seq.toString().padStart(4, '0')} | ${doc.item} (\$${doc.amount}) | Read Latency: ${duration}ms`);
      } else {
        console.log(`[${timeStr}] 📖 [READ <- ${activeServer}] Waiting for writes...`);
      }
    } catch (err) {
      console.warn(`⚠️  [READ RETRYING] -> ${err.message}`);
    }
  }, 1000);
}

runReader().catch(err => {
  console.error("Fatal Reader Error:", err);
});
