/**
 * Continuous reader script for read-availability verification
 */
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI || "mongodb://appUser:AppUserSecret2026!@10.0.1.30:27017,10.0.2.51:27017,10.0.3.43:27017/ecommerce_db?replicaSet=rs-prod-01&authSource=ecommerce_db&readPreference=secondaryPreferred";

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  console.log("--> Continuous Reader connected to cluster...");
  const col = client.db('ecommerce_db').collection('live_stream');

  setInterval(async () => {
    try {
      const doc = await col.find().sort({ _id: -1 }).limit(1).toArray();
      const latestSeq = doc.length > 0 ? doc[0].seq : 0;
      console.log(`[READ SUCCESS] Latest item seq: ${latestSeq}`);
    } catch (err) {
      console.error(`[READ ERROR] ${err.message}`);
    }
  }, 1000);
}

main().catch(console.error);

