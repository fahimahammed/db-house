# MongoDB Replica Set Operations Guide

## 1. Overview

This document describes the design and operational procedures for the production MongoDB replica set cluster `rs-prod-01`.

The cluster runs on Ubuntu with three distributed nodes:
* `mongo-01`: Primary node (initial priority 2.0)
* `mongo-02`: Secondary node dedicated to automated backups (initial priority 1.0)
* `mongo-03`: Secondary node for high availability and disaster recovery (initial priority 1.0)

## 2. High Availability and Auto Failover

The cluster uses a three-node distributed consensus with an election timeout of 2 seconds or less.

When a primary node becomes unreachable:
1. The secondary nodes detect heartbeat loss within 2 seconds.
2. The remaining two nodes form a majority quorum (2 of 3 votes).
3. A new primary is elected in 3 seconds or less.
4. Applications using drivers with `retryWrites=true` seamlessly retry in-flight writes on the new primary without downtime.
5. When the former primary comes back online, it rejoins the cluster as a secondary and catches up via oplog replication.

## 3. Network Access Control and Security

### Linux Firewall Binding (UFW)
* Default incoming policy is set to deny on all database nodes.
* Port 27017 is restricted at the kernel level.
* Only allowlisted application client IPs and cluster peer nodes can send packets to port 27017.
* External unauthorized traffic is dropped immediately before reaching the database daemon.

### Authentication and Access Control
* SCRAM-SHA-256 authentication is enabled on the `admin` database.
* Intra-cluster node communication is encrypted and verified using a shared 1024-bit keyfile (`security.keyFile`).
* Role-based access control (RBAC) isolates user roles:
  * `clusterAdmin`: Cluster administration and replication management.
  * `app_user`: Read and write access limited to production application databases.
  * `pmm_user`: Read-only telemetry and profiling privileges.

## 4. Backup Operations

### Automated Secondary Backups
* Backups run every day at 02:00 UTC via a systemd timer on `mongo-02`.
* Running backups strictly on a secondary node keeps disk I/O and CPU overhead away from the primary.
* Each backup runs `mongodump` with `--oplog` and `--gzip` into `/var/backups/mongodb/`.
* A cryptographic SHA-256 checksum (`.sha256`) is generated for every archive to confirm backup integrity.
* Backups older than 7 days are automatically pruned to preserve disk space.

### On-Demand Backups
* Administrators can run manual snapshots at any time using Ansible or helper scripts.
* Archives can be saved locally on the node or downloaded directly to the Ansible controller machine.

## 5. Disaster Recovery and Point In Time Recovery (PITR)

If data is accidentally dropped or corrupted at a specific timestamp:
1. The administrator locates the exact drop timestamp in the oplog (`local.oplog.rs`).
2. The latest consistent backup archive is unpacked.
3. `mongorestore` replays oplog operations with `--oplogLimit='timestamp:increment'`.
4. The restore stops right before the drop operation, recovering all valid data up to the exact second before the incident.

## 6. Zero Downtime Rolling Upgrades

The cluster supports major version upgrades (such as 7.0 to 8.0) without service interruption:
1. Upgrade the first secondary node (`mongo-03`): stop service, install new packages, start service, and verify replication lag reaches zero.
2. Upgrade the second secondary node (`mongo-02`): stop service, install new packages, start service, and verify replication lag reaches zero.
3. Step down the current primary gracefully (`rs.stepDown()`). An upgraded secondary becomes the new primary.
4. Upgrade the former primary (`mongo-01`) while it acts as a secondary.
5. Finalize the cluster feature compatibility version (`setFeatureCompatibilityVersion`) to the new version once all members are updated.

## 7. Real Time Profiling and PMM Observability

Percona Monitoring and Management (PMM v2) provides live performance metrics and Query Analytics:
* `pmm-agent` runs on each database node and pushes telemetry out to the PMM Server over TLS on port 443.
* No inbound monitoring ports are opened on MongoDB nodes.
* Slow operations and query patterns are captured via `system.profile` and analyzed in ClickHouse.
* Grafana dashboards display replication lag, WiredTiger cache pressure, and OS resource metrics.

## 8. Client Application Verification Suite

The `test-app/` directory provides Node.js scripts to validate cluster behavior:
* `test-read-write.js`: Verifies read and write splitting with `secondaryPreferred`.
* `writer.js`: Sends continuous inserts to the primary node.
* `reader.js`: Continuously reads data from secondary nodes.
* `failover-resilience-test.js`: Confirms write persistence while forcing primary failovers.
* `disaster-recovery-test.js`: Validates point in time recovery workflows against real test data.

