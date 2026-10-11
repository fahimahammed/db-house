/**
 * Continuous writer script for live rolling-upgrade or chaos testing
 */
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI || "mongodb://appUser:AppUserSecret2026!@10.0.1.30:27017,10.0.2.51:27017,10.0.3.43:27017/ecommerce_db?replicaSet=rs-prod-01&authSource=ecommerce_db&readPreference=secondaryPreferred&retryWrites=true&w=majority";

async function main() {
  const client = new MongoClient(uri, { retryWrites: true });
  await client.connect();
  console.log("--> Continuous Writer connected to cluster...");
  const col = client.db('ecommerce_db').collection('live_stream');

  let seq = 0;
  setInterval(async () => {
    seq++;
    try {
      const res = await col.insertOne({ seq, time: new Date() });
      console.log(`[WRITE SUCCESS] Seq #${seq} -> ID: ${res.insertedId}`);
    } catch (err) {
      console.error(`[WRITE ERROR] Seq #${seq} -> ${err.message}`);
    }
  }, 1000);
}

main().catch(console.error);

