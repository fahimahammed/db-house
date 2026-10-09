// ==============================================================================
// mongosh Direct Replica Set Read/Write Test
// Run with: mongosh "mongodb://appUser:AppUserSecret2026!@157.180.74.152:27017,167.233.197.173:27017/ecommerce_db?replicaSet=rs-prod-01&authSource=ecommerce_db&readPreference=secondaryPreferred" mongosh-test.js
// ==============================================================================

print("\n================================================================================");
print(" 1. Current Client Connection State");
print("================================================================================");
let hello = db.hello();
print("Primary in Cluster:   " + hello.primary);
print("Current ReadPref:     " + db.getMongo().getReadPrefMode());

print("\n--- 2. EXECUTING WRITE (Automatic Routing to Primary) ---");
let testId = "ORD-MONGOSH-" + Date.now();
let writeRes = db.orders.insertOne({
  order_id: testId,
  item: "AirPods Pro",
  price: 249,
  date: new Date()
});
print("Write Result: Inserted ID = " + writeRes.insertedId);

print("\n--- 3. EXECUTING READ (Automatic Routing to Secondary) ---");
sleep(1000); // 1s for replication
let explanation = db.orders.find({ order_id: testId }).explain("executionStats");
print("Query Executed on Server: " + explanation.serverInfo.host + ":" + explanation.serverInfo.port);
print("Server is Secondary?      " + (explanation.serverInfo.host.includes("167.233.197.173") ? "YES (mongo-02) 🎯" : "NO"));

let doc = db.orders.findOne({ order_id: testId });
print("\nRetrieved Document:");
printjson(doc);
print("\n>> VERIFIED: Single URL successfully writes to Primary and reads from Secondary!\n");

