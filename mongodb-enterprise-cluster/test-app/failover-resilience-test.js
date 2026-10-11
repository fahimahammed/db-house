/**
 * Zero-Downtime & Failover Resilience Test
 * Performs rapid continuous operations while displaying primary re-election latency
 */
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI || "mongodb://appUser:AppUserSecret2026!@10.0.1.30:27017,10.0.2.51:27017,10.0.3.43:27017/ecommerce_db?replicaSet=rs-prod-01&authSource=ecommerce_db&readPreference=secondaryPreferred&retryWrites=true&w=majority";

async function runTest() {
  console.log("================================================================================");
  console.log(" Zero-Downtime Resilience Test - Continuous Writes & Election Survival");
  console.log("================================================================================\n");

  const client = new MongoClient(uri, {
    retryWrites: true,
    serverSelectionTimeoutMS: 10000,
  });

  await client.connect();
  const col = client.db('ecommerce_db').collection('resilience_log');

  let successCount = 0;
  let retryCount = 0;
  const startTime = Date.now();

  console.log("--> Starting 60 continuous operations (1 per 500ms)...");
  console.log("--> You can now run 'rs.stepDown(60)' or trigger rolling upgrade!");

  for (let i = 1; i <= 60; i++) {
    const opStart = Date.now();
    try {
      await col.insertOne({ test_run: startTime, iteration: i, timestamp: new Date() });
      const opDuration = Date.now() - opStart;
      successCount++;
      console.log(`[PASS] Iteration #${i.toString().padStart(2, '0')} - Latency: ${opDuration}ms`);
    } catch (err) {
      retryCount++;
      console.warn(`[RETRY/FAIL] Iteration #${i.toString().padStart(2, '0')} - ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }

  console.log("\n================================================================================");
  console.log(` RESULTS: Success: ${successCount}/60 | Retries/Errors: ${retryCount}/60`);
  console.log("================================================================================");
  await client.close();
}

runTest().catch(console.error);

