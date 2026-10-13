# MongoDB Profiling and Percona PMM Monitoring

## 1. Architecture Diagram

This diagram shows how the three MongoDB replica set nodes connect to the dedicated PMM monitoring server.

```mermaid
flowchart TB
    subgraph Cluster["MongoDB Replica Set rs-prod-01"]
        direction TB

        subgraph Node1["mongo-01 Primary"]
            M1["mongod 27017<br/>profiling: slowOp"]
            A1["pmm-agent client"]
            M1 --> A1
        end

        subgraph Node2["mongo-02 Secondary"]
            M2["mongod 27017<br/>profiling: slowOp"]
            A2["pmm-agent client"]
            M2 --> A2
        end

        subgraph Node3["mongo-03 Secondary"]
            M3["mongod 27017<br/>profiling: slowOp"]
            A3["pmm-agent client"]
            M3 --> A3
        end
    end

    subgraph MonitoringHost["Monitoring Server"]
        direction TB
        PMM["Percona PMM Server<br/>VictoriaMetrics, ClickHouse QAN, Grafana"]
    end

    A1 -->|"Push metrics and QAN (TLS 443)"| PMM
    A2 -->|"Push metrics and QAN (TLS 443)"| PMM
    A3 -->|"Push metrics and QAN (TLS 443)"| PMM
```

## 2. Essential Commands

### Step 1: Deploy PMM Monitoring Server
Run this command to start the PMM Server container using Docker:
```bash
ansible-playbook -i inventory/hosts.ini playbooks/13_deploy_pmm_server.yml
```

### Step 2: Install PMM Client and Register MongoDB Nodes
Run this command to install the client, connect to PMM Server, and start query profiling:
```bash
ansible-playbook -i inventory/hosts.ini playbooks/12_install_pmm_client.yml
```

### Step 3: Verify Client and Service Status
Check the status of all agents and registered services across the cluster:
```bash
ansible mongodb_cluster -i inventory/hosts.ini -m command -a "pmm-admin list"
```

Or run the automated verification script:
```bash
./scripts/verify_pmm.sh
```

### Step 4: Generate Live Traffic for Profiling
Generate real read and write queries from the test application:
```bash
cd test-app
npm run writer
npm run reader
```

## 3. Monitoring Dashboards

### Replica Set Summary
This dashboard tracks primary status, secondary nodes, replication lag, and real-time opcounters for reads and writes.

![MongoDB Replica Set Summary](../assets/replset-summery.png)

### MongoDB Instance Overview
This dashboard tracks database throughput, connections, WiredTiger cache usage, and execution latency.

![MongoDB Instance Overview](../assets/mongo-instance-overview.png)

### Node and OS Overview
This dashboard tracks CPU usage, memory utilization, disk IOPS, and network traffic for each host machine.

![Node and OS Overview](../assets/node-overview.png)

