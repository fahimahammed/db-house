const { MongoClient } = require('mongodb');

async function debugCluster() {
  console.log("================================================================================");
  console.log(" 🔍 DIAGNOSTIC TOOL: Checking Direct Connection & Replica Set Config");
  console.log("================================================================================\n");

  const directUri = "mongodb://clusterAdmin:ClusterAdminSecret2026!@18.143.176.226:27017/admin?directConnection=true&serverSelectionTimeoutMS=5000";

  console.log("--> Attempting direct connection to mongo-01 (18.143.176.226)...");
  const client = new MongoClient(directUri);

  try {
    await client.connect();
    console.log("✅ Successfully connected to mongo-01 directly!\n");

    const adminDb = client.db('admin');
    const isMaster = await adminDb.command({ hello: 1 });
    console.log("1. Server Hello / isMaster Response:");
    console.log("   - Is Primary / Writable: " + isMaster.isWritablePrimary);
    console.log("   - Replica Set Name:      " + isMaster.setName);
    console.log("   - Server Advertised Me:  " + isMaster.me);
    console.log("   - Advertised Hosts:      " + JSON.stringify(isMaster.hosts));
    console.log("   - Primary Address:       " + isMaster.primary);

    console.log("\n2. Replica Set rs.conf() Members:");
    const replConfig = await adminDb.command({ replSetGetConfig: 1 });
    replConfig.config.members.forEach(m => {
      console.log(`   -> Member ID ${m._id}: host = "${m.host}" (priority: ${m.priority})`);
    });

    console.log("\n================================================================================");
    if (isMaster.me && isMaster.me.startsWith("10.0.")) {
      console.log("❌ PROBLEM FOUND: The cluster is still configured with PRIVATE IPs (" + isMaster.me + ")!");
      console.log("   Your Mac cannot route to 10.0.x.x.");
      console.log("   SOLUTION: Run 'ansible-playbook playbooks/reconfig_public_ips.yml' from the root folder.");
    } else {
      console.log("✅ Advertised addresses look correct!");
    }
    console.log("================================================================================");

  } catch (err) {
    console.error("❌ Connection failed!");
    console.error("   Error Message: " + err.message);
    if (err.message.includes("ETIMEDOUT") || err.message.includes("timed out")) {
      console.error("\n❌ FIREWALL BLOCK DETECTED:");
      console.error("   Port 27017 on 18.143.176.226 is NOT reaching your Mac.");
      console.error("   Please ensure your Mac's current public IP is in 'inventory/group_vars/all.yml'");
      console.error("   and run 'ansible-playbook playbooks/05_setup_firewall_access.yml'.");
    }
  } finally {
    await client.close();
  }
}

debugCluster();

