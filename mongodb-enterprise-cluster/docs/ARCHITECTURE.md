# MongoDB Enterprise Cluster Architecture

## 1. High-Level Architecture

The **MongoDB Enterprise Cluster** is designed for mission-critical production environments requiring high availability, automated disaster recovery, zero-downtime rolling maintenance, and strict network isolation.

```mermaid
graph TB
    subgraph Clients["Application Tier (Allowed Servers Only)"]
        App1["API Gateway<br/>10.0.10.15"]
        App2["Worker Node<br/>10.0.10.16"]
        AppSubnet["App Subnet<br/>10.0.20.0/24"]
    end

    subgraph AWS_VPC["AWS Virtual Private Cloud (10.0.0.0/16)"]
        subgraph AZ_A["Availability Zone A (ap-southeast-1a)"]
            Node1["mongo-01 (Priority 2)<br/>10.0.1.30<br/>State: PRIMARY<br/>• Writes: Active<br/>• Reads: Supported"]
        end

        subgraph AZ_B["Availability Zone B (ap-southeast-1b)"]
            Node2["mongo-02 (Priority 1)<br/>10.0.2.51<br/>State: SECONDARY<br/>• Automated Backups (02:00)<br/>• Reads: Active"]
        end

        subgraph AZ_C["Availability Zone C (ap-southeast-1c)"]
            Node3["mongo-03 (Priority 1)<br/>10.0.3.43<br/>State: SECONDARY<br/>• DR Replica<br/>• Reads: Active"]
        end
    end

    Clients ==>|Writes via Replica Set URI| Node1
    Clients -.->|Reads via readPreference=secondaryPreferred| Node2
    Clients -.->|Reads via readPreference=secondaryPreferred| Node3

    Node1 <==>|Oplog Sync & Heartbeats| Node2
    Node2 <==>|Oplog Sync & Heartbeats| Node3
    Node1 <==>|Oplog Sync & Heartbeats| Node3
```

---

## 2. Core Architectural Principles

### 1. Quorum & Byzantine Fault Tolerance
The cluster uses a 3-voting-member replica set configuration:
$$\text{Quorum Majority} = \left\lfloor \frac{N}{2} \right\rfloor + 1 = \left\lfloor \frac{3}{2} \right\rfloor + 1 = 2 \text{ votes}$$
- **Fault Tolerance:** Tolerates 1 node failure without downtime or split-brain.
- **Priority Weighting:** `mongo-01` has `priority: 2` (preferred primary), while `mongo-02` and `mongo-03` have `priority: 1`.

### 2. Network Isolation & Server Binding
- MongoDB port `27017` is **strictly blocked** to the public internet by default via Linux kernel UFW firewalls.
- Only authorized application server IPs specified in `mongo_allowed_app_clients` and intra-cluster node IPs are granted access.

### 3. Read/Write Splitting & Single URL Topology
Applications connect using a single standard replica set URI:
```text
mongodb://appUser:Pass@10.0.1.30:27017,10.0.2.51:27017,10.0.3.43:27017/ecommerce_db?replicaSet=rs-prod-01&authSource=ecommerce_db&readPreference=secondaryPreferred&retryWrites=true&w=majority
```
- **Writes:** The driver routes writes directly to the active `PRIMARY`.
- **Reads:** Reads are offloaded to healthy `SECONDARY` nodes (`mongo-02`, `mongo-03`), reducing primary CPU load.
- **Resilience:** If the primary crashes, the driver automatically holds and retries in-flight writes while a secondary is promoted to primary.

### 4. Storage Engine & WiredTiger Tuning
- **Engine:** WiredTiger with Snappy block compression.
- **Cache Sizing:** WiredTiger cache size is explicitly capped in `inventory/group_vars/all.yml` (`mongo_wiredtiger_cache_gb: 1`) to leave ample RAM for kernel page caching and OS buffers.
- **Oplog Capacity:** Sized to 5120 MB (5 GB) ensuring multi-day retention buffers for replication and PITR catch-up.

### 5. Automated Backups on Secondary Node
- Backups are offloaded to `mongo-02` using systemd timers and `mongodump --oplog`.
- Primary node operations continue at peak throughput without any backup disk I/O penalties.

