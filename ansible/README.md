# ⚡ Ansible Syntax Notes & Quick Cheat Sheet

A concise, practical, and copy-paste-ready reference for Ansible syntax, daily commands, inventory patterns, core modules, and best practices.

---

## 1. Essential CLI Commands

```bash
# 1. Connection ping test
ansible all -m ping
ansible mongodb_cluster -m ping

# 2. Run ad-hoc shell commands across servers
ansible mongodb_cluster -m command -a "uptime"
ansible mongodb_cluster -m command -a "free -h"
ansible mongodb_cluster -m command -a "df -h /"

# 3. Execute playbook
ansible-playbook playbooks/site.yml

# 4. Dry run (simulate execution without changing state)
ansible-playbook playbooks/site.yml --check

# 5. Diff mode (view file changes line-by-line with verbose logging)
ansible-playbook playbooks/site.yml --check --diff -v

# 6. Target a specific host (limit execution)
ansible-playbook playbooks/site.yml --limit "mongo-01"

# 7. Validate YAML syntax
ansible-playbook playbooks/site.yml --syntax-check

# 8. List all tasks in a playbook
ansible-playbook playbooks/site.yml --list-tasks

# 9. List targeted hosts
ansible-playbook playbooks/site.yml --list-hosts
```

---

## 2. Inventory Syntax (`inventory.ini`)

```ini
# Local machine group (no SSH required):
[local]
localhost ansible_connection=local

# Remote cluster group:
[mongodb_cluster]
mongo-01 ansible_host=157.180.74.152 ansible_user=root mongo_role=primary
mongo-02 ansible_host=10.0.10.12     ansible_user=root mongo_role=secondary
mongo-03 ansible_host=10.0.10.13     ansible_user=root mongo_role=secondary

# Monitoring group:
[monitoring]
mon-01 ansible_host=10.0.10.20 ansible_user=ubuntu

# Parent group of groups:
[production:children]
mongodb_cluster
monitoring

# Group variables:
[mongodb_cluster:vars]
ansible_ssh_private_key_file=~/Documents/termius-keys/codinism
ansible_python_interpreter=/usr/bin/python3
ansible_ssh_common_args='-o StrictHostKeyChecking=no'
mongo_port=27017
```

---

## 3. Configuration Engine (`ansible.cfg`)

```ini
[defaults]
inventory = ./inventory.ini
host_key_checking = False
retry_files_enabled = False
stdout_callback = default
interpreter_python = auto_silent
deprecation_warnings = False
nocows = 1

[callback_default]
result_format = yaml
```

---

## 4. Playbook Anatomy

```yaml
---
- name: Production Database Server Provisioning
  hosts: mongodb_cluster
  become: true                    # Execute tasks with sudo/root
  gather_facts: true              # Collect system telemetry

  vars:
    app_port: 27017
    db_name: "prod_db"

  tasks:
    - name: Display current target host info
      ansible.builtin.debug:
        msg: "Provisioning host: {{ inventory_hostname }} ({{ ansible_host }})"
```

---

## 5. Top 10 Core Modules (Copy-Paste Reference)

### 1. Package Management (`apt`)
```yaml
- name: Update repository cache and install utility packages
  ansible.builtin.apt:
    name:
      - curl
      - wget
      - htop
      - jq
    state: present
    update_cache: yes
```

### 2. Safe Package Upgrade (`apt upgrade`)
```yaml
- name: Safely upgrade installed packages
  ansible.builtin.apt:
    upgrade: safe   # 'safe' prevents breaking or removing existing dependencies
```

### 3. File & Directory Management (`file`)
```yaml
- name: Ensure directory exists with strict permissions
  ansible.builtin.file:
    path: /var/lib/mongodb
    state: directory
    owner: mongodb
    group: mongodb
    mode: '0700'
```

### 4. Copy File / Write Content (`copy`)
```yaml
- name: Deploy cluster security keyfile
  ansible.builtin.copy:
    content: "high_entropy_secret_key_1024_bits"
    dest: /etc/mongo-keyfile
    owner: mongodb
    group: mongodb
    mode: '0400'  # Strict requirement for MongoDB keyfiles
```

### 5. Template Deployment (`template`)
```yaml
- name: Render and deploy mongod.conf configuration
  ansible.builtin.template:
    src: templates/mongod.conf.j2
    dest: /etc/mongod.conf
    owner: mongodb
    group: mongodb
    mode: '0640'
  notify: Restart MongoDB Service
```

### 6. Service Management (`systemd`)
```yaml
- name: Ensure MongoDB service is running and enabled on boot
  ansible.builtin.systemd:
    name: mongod
    state: started
    enabled: yes
```

### 7. Run Shell Commands & Capture Output (`command` + `register`)
```yaml
- name: Check replica set status
  ansible.builtin.command: mongosh --quiet --eval "rs.status().ok"
  register: rs_status
  changed_when: false

- name: Display command result
  ansible.builtin.debug:
    msg: "Replica Status: {{ rs_status.stdout }}"
```

### 8. Modify Single Line in File (`lineinfile`)
```yaml
- name: Set Linux swappiness
  ansible.builtin.lineinfile:
    path: /etc/sysctl.conf
    line: "vm.swappiness = 1"
    state: present
```

### 9. Kernel Sysctl Parameters (`sysctl`)
```yaml
- name: Tune virtual memory max map count
  ansible.builtin.sysctl:
    name: vm.max_map_count
    value: '1048576'
    state: present
    reload: yes
```

### 10. Wait for Port Availability (`wait_for`)
```yaml
- name: Wait for MongoDB port 27017 to accept connections
  ansible.builtin.wait_for:
    port: 27017
    delay: 2
    timeout: 30
```

---

## 6. Variables and System Facts

### Modern Scoped Facts Syntax:
```yaml
# Use modern ansible_facts['...'] syntax (avoids deprecation warnings):
{{ ansible_facts['distribution'] }}           # OS Name (e.g., Ubuntu)
{{ ansible_facts['distribution_version'] }}   # OS Version (e.g., 24.04)
{{ ansible_facts['kernel'] }}                 # Kernel Version
{{ ansible_facts['memtotal_mb'] }}            # Total RAM in MB
{{ ansible_facts['architecture'] }}           # CPU Architecture (x86_64)
{{ ansible_default_ipv4.address }}            # Default Private IP Address
```

### Defining Variables in Tasks:
```yaml
- name: Define dynamic runtime facts
  ansible.builtin.set_fact:
    calculated_cache_gb: "{{ (ansible_facts['memtotal_mb'] * 0.5 / 1024) | round | int }}"
```

---

## 7. Loops and Conditionals

### 1. Simple List Loop:
```yaml
- name: Create database storage directories
  ansible.builtin.file:
    path: "/data/{{ item }}"
    state: directory
    mode: '0755'
  loop:
    - "mongo_data"
    - "mongo_logs"
    - "mongo_backups"
```

### 2. Dictionary / Object Loop:
```yaml
- name: Print configured application users
  ansible.builtin.debug:
    msg: "User: {{ item.name }} | Role: {{ item.role }}"
  loop:
    - { name: "app_user", role: "readWrite" }
    - { name: "backup_agent", role: "backup" }
    - { name: "monitor_agent", role: "clusterMonitor" }
```

### 3. Conditional Execution (`when`):
```yaml
# Single condition:
- name: Configure large cache on high-RAM servers
  ansible.builtin.debug:
    msg: "Applying 16GB cache profile"
  when: ansible_facts['memtotal_mb'] > 16000

# Multiple conditions (Logical AND):
- name: Apply Ubuntu 24.04 specific settings
  ansible.builtin.debug:
    msg: "Target OS matches Ubuntu 24.04"
  when:
    - ansible_facts['distribution'] == "Ubuntu"
    - ansible_facts['distribution_version'] == "24.04"
```

---

## 8. Handlers (Idempotent Restarts)

Handlers run only once at the end of a play, and only if a notifying task resulted in `changed`:

```yaml
tasks:
  - name: Update mongod.conf
    ansible.builtin.template:
      src: mongod.conf.j2
      dest: /etc/mongod.conf
    notify: Restart MongoDB Service

handlers:
  - name: Restart MongoDB Service
    ansible.builtin.systemd:
      name: mongod
      state: restarted
```

---

## 9. Jinja2 Templating Basics (`.j2`)

```jinja2
# Dynamic WiredTiger cache calculation
storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: {{ (ansible_facts['memtotal_mb'] * 0.5 / 1024) | round | int }}

net:
  port: {{ mongo_port }}
  bindIp: 0.0.0.0

replication:
  replSetName: {{ replica_set_name }}
```

---

## 10. Secrets Encryption (Ansible Vault)

```bash
# 1. Create a new encrypted file
ansible-vault create vault.yml

# 2. Edit an existing encrypted file
ansible-vault edit vault.yml

# 3. View encrypted file without decrypting on disk
ansible-vault view vault.yml

# 4. Encrypt an existing unencrypted file
ansible-vault encrypt secret.yml

# 5. Decrypt an encrypted file permanently
ansible-vault decrypt secret.yml

# 6. Execute playbook with interactive vault password prompt
ansible-playbook playbooks/site.yml --ask-vault-pass

# 7. Execute playbook with vault password file
ansible-playbook playbooks/site.yml --vault-password-file ~/.vault_pass.txt
```

---

## 11. Error Handling (`block`, `rescue`, `always`)

```yaml
- name: Transactional Block with Fallback
  block:
    - name: Step down current primary node
      ansible.builtin.command: mongosh --eval "rs.stepDown(60)"

    - name: Upgrade MongoDB binary packages
      ansible.builtin.apt:
        name: mongodb-org=7.0.5
        state: present

  rescue:
    - name: Handle error if block fails
      ansible.builtin.debug:
        msg: "CRITICAL: Upgrade failed! Reverting back to safe state."

  always:
    - name: Always execute cleanup verification
      ansible.builtin.command: mongosh --eval "rs.status().ok"
```

