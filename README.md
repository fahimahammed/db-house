# db-house

Production-Grade Database Infrastructure & Automation Repository.

---

## 📁 Repository Overview

| Component | Description | Path |
| :--- | :--- | :--- |
| **MongoDB Enterprise Cluster** | **Production-grade HA cluster with App Server Binding, Automated Backups, PITR Disaster Recovery & Zero-Downtime Migration** | [`mongodb-enterprise-cluster/`](mongodb-enterprise-cluster/README.md) |
| **MongoDB Cluster** | Production-ready 3-node MongoDB 7.0 replica set automation across multi-AZ subnets | [`mongodb-cluster/`](mongodb-cluster/README.md) |
| **AWS Infrastructure (IaC)** | Pulumi script provisioning AWS VPC, multi-AZ subnets, security groups, and EC2 instances | [`pulumi/`](pulumi/) |
| **Ansible Lab & Guides** | Ansible cheat sheet, modular playbooks, Jinja2 templates, and task simulations | [`ansible/`](ansible/README.md) |
| **Automation Makefile** | Quick commands to manage Pulumi cloud resources, clean caches, and tear down instances | [`Makefile`](Makefile) |

---

## 🏗️ Architecture & Blueprint Highlights

- **Multi-AZ High Availability:** 3-node replica set (1 Primary + 2 Secondaries) distributed across 3 AWS Availability Zones (`ap-southeast-1a`, `ap-southeast-1b`, `ap-southeast-1c`).
- **Production OS & Engine Tuning:** Disabled Transparent Huge Pages (THP), tuned kernel parameters (`vm.swappiness=1`, `net.core.somaxconn=65535`), 100,000 file descriptors, and WiredTiger engine optimization.
- **Enterprise Security:** 1024-byte symmetric cluster keyfile authentication (`0400` permission) and SCRAM-SHA-256 RBAC user management.
- **Replication & Initial Sync:** Continuous Oplog replication with tailable cursors and verified 5-phase initial sync (`STARTUP` $\rightarrow$ `STARTUP2` $\rightarrow$ `RECOVERING` $\rightarrow$ `SECONDARY`).
- **Failover Resilience:** Automatic leader election within 2–3 seconds upon primary node failure (Majority Quorum $\ge 2$).

---

## 🔑 Remote Server Access & SSH Key Setup

If you manage servers using **Termius** or standard cloud PEM keypairs:

### 1. Export and Save Private Key
Save your private key locally and enforce strict permissions:
```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
# Save your key (e.g., ~/.ssh/vps_key.pem)
chmod 600 ~/.ssh/vps_key.pem
```

### 2. Configure Ansible Inventory
Update [`mongodb-cluster/inventory/hosts.ini`](file:///Users/fahimahammedfiroz/Projects/db-house/mongodb-cluster/inventory/hosts.ini) with your server IPs and key paths:
```ini
[mongodb_primary]
mongo-01 ansible_host=10.0.1.39 ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/vps_key.pem mongo_member_id=0 mongo_priority=2 mongo_votes=1

[mongodb_secondary]
mongo-02 ansible_host=10.0.2.51 ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/vps_key.pem mongo_member_id=1 mongo_priority=1 mongo_votes=1
mongo-03 ansible_host=10.0.3.43 ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/vps_key.pem mongo_member_id=2 mongo_priority=1 mongo_votes=1

[mongodb_cluster:children]
mongodb_primary
mongodb_secondary
```

---

## ⚡ Quickstart Commands

### 1. Provision Infrastructure with Pulumi
```bash
cd pulumi
source venv/bin/activate
pulumi up
```

### 2. Verify Connectivity & Deploy Cluster
```bash
cd mongodb-cluster

# Test SSH connection to all nodes
ansible mongodb_cluster -m ping

# Deploy entire MongoDB replica set cluster
ansible-playbook playbooks/site.yml
```

### 3. Run Verification Tests
```bash
# Verify live replication sync
ansible-playbook playbooks/05_test_replication_sync.yml

# Test initial sync behavior with pre-existing data
ansible-playbook playbooks/06_test_new_member_initial_sync.yml
```

### 4. Cleanup & Cost Control
```bash
# Teardown MongoDB services on servers
ansible-playbook playbooks/cleanup.yml

# Destroy AWS resources and clean local caches
make destroy
make clean
```
