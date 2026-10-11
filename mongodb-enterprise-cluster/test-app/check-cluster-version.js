const { MongoClient } = require('mongodb');

const nodes = [
  { name: 'mongo-01', host: '18.143.176.226:27017' },
  { name: 'mongo-02', host: '13.250.104.67:27017' },
  { name: 'mongo-03', host: '18.141.4.93:27017' }
];

async function checkVersions() {
  console.log("================================================================================");
  console.log(" 🔍 MONGODB CLUSTER VERSION & FCV STATUS CHECK");
  console.log("================================================================================\n");

  for (const node of nodes) {
    const uri = `mongodb://clusterAdmin:ClusterAdminSecret2026!@${node.host}/admin?directConnection=true&serverSelectionTimeoutMS=5000`;
    const client = new MongoClient(uri);

    try {
      await client.connect();
      const adminDb = client.db('admin');
      const buildInfo = await adminDb.command({ buildInfo: 1 });
      const hello = await adminDb.command({ hello: 1 });
      
      let fcv = 'N/A';
      try {
        const fcvDoc = await adminDb.command({ getParameter: 1, featureCompatibilityVersion: 1 });
        fcv = fcvDoc.featureCompatibilityVersion.version;
      } catch (e) {
        fcv = 'Requires Primary or not accessible: ' + e.message;
      }

      const role = hello.isWritablePrimary ? '👑 PRIMARY' : (hello.secondary ? '🛡️ SECONDARY' : 'OTHER');

      console.log(`📌 [${node.name}] (${node.host}) -> Role: ${role}`);
      console.log(`   - Binary Version:                ${buildInfo.version}`);
      console.log(`   - Feature Compatibility Version: ${fcv}`);
      console.log(`   - Git Version:                   ${buildInfo.gitVersion}`);
      console.log("--------------------------------------------------------------------------------");
    } catch (err) {
      console.error(`❌ [${node.name}] Connection Failed: ${err.message}`);
      console.log("--------------------------------------------------------------------------------");
    } finally {
      await client.close();
    }
  }
}

checkVersions();

