# 📘 Ansible জিরো টু হিরো: সম্পূর্ণ বাংলা হ্যান্ডস-অন গাইড
### সহজে Ansible শিখুন এবং স্টেপ-বাই-স্টেপ প্র্যাকটিস করুন

স্বাগতম! আপনি যদি আগে কখনও Ansible ব্যবহার না করে থাকেন, তবে চিন্তার কোনো কারণ নেই। এই গাইডটি এমনভাবে তৈরি করা হয়েছে যেন আপনি একদম শুরু থেকে শিখে সরাসরি আপনার MongoDB ক্লাস্টার ম্যানেজমেন্টের মতো বাস্তব প্রজেক্টে কাজ করতে পারেন।

---

## 📑 সূচিপত্র (Table of Contents)
1. [Ansible কী এবং কেন শিখবেন?](#১-ansible-কী-এবং-কেন-শিখবেন)
2. [Ansible কীভাবে কাজ করে? (Core Concept)](#২-ansible-কীভাবে-কাজ-করে-core-concept)
3. [আপনার কম্পিউটারে Ansible সেটআপ (Installation)](#৩-আপনার-কম্পিউটারে-ansible-সেটআপ-installation)
4. [লোকাল প্র্যাকটিস ল্যাব সেটআপ (কোনো সার্ভার কেনা ছাড়াই)](#৪-লোকাল-প্র্যাকটিস-ল্যাব-সেটআপ-কোনো-সার্ভার-কেনা-ছাড়া)
5. [ইনভেন্টরি (Inventory) ফাইল কী?](#৫-ইনভেন্টরি-inventory-ফাইল-কী)
6. [Ad-Hoc কমান্ড: এক লাইনে সার্ভার চালানো](#৬-ad-hoc-কমান্ড-এক-লাইনে-সার্ভার-চালানো)
7. [Ansible Playbook: সার্ভার অটোমেশনের প্রাণ](#৭-ansible-playbook-সার্ভার-অটোমেশনের-প্রাণ)
8. [সবচেয়ে গুরুত্বপূর্ণ কিছু মডিউল (Core Modules)](#৮-সবচেয়ে-গুরুত্বপূর্ণ-কিছু-মডিউল-core-modules)
9. [Variables, Loops এবং Conditionals](#৯-variables-loops-এবং-conditionals)
10. [Handlers এবং Jinja2 Templates](#১০-handlers-এবং-jinja2-templates)
11. [Ansible Roles: প্রজেক্টকে গুছিয়ে রাখা](#১১-ansible-roles-প্রজেক্টকে-গুছিয়ে-রাখা)
12. [Ansible Vault: পাসওয়ার্ড ও গোপন তথ্য লক করা](#১২-ansible-vault-পাসওয়ার্ড-ও-গোপন-তথ্য-লক-করা)
13. [এই ফোল্ডারের প্র্যাকটিস ফাইলগুলো চালানোর নিয়ম](#১৩-এই-ফোল্ডারের-প্র্যাকটিস-ফাইলগুলো-চালানোর-নিয়ম)

---

## ১. Ansible কী এবং কেন শিখবেন?

সহজ কথায়: **Ansible হলো একটি Infrastructure as Code (IaC) এবং Configuration Management টুল।**

মনে করুন, আপনার ১০টি সার্ভার আছে। প্রত্যেকটিতে:
- MongoDB ইন্সটল করতে হবে
- কিছু সিকিউরিটি রুলস অন করতে হবে
- কনফিগারেশন ফাইল পরিবর্তন করতে হবে
- ডাটাবেস সার্ভিস রিস্টার্ট করতে হবে

ম্যানুয়ালি করতে গেলে আপনাকে ১০ বার SSH দিয়ে ঢুকতে হবে, কমান্ড দিতে হবে—এতে প্রচুর সময় নষ্ট হবে এবং ভুল হওয়ার সম্ভাবনা থাকে।

**Ansible দিয়ে:**
আপনি মাত্র একবার একটি কোড (Playbook) লিখবেন। এরপর একটি কমান্ড দিলে Ansible নিজে থেকে ১০টি সার্ভারেই প্যারালালি সব কাজ নিখুঁতভাবে করে ফেলবে।

### Ansible-এর বিশেষ সুবিধাসমূহ:
1. **Agentless (কোনো এজেন্ট লাগে না):** টার্গেট সার্ভারে কোনো সফটওয়্যার বা ডেমন ইন্সটল করতে হয় না। শুধুমাত্র সাধারণ **SSH** থাকলেই চলে।
2. **Idempotent (আইডেমপোটেন্ট):** এটি অত্যন্ত শক্তিশালী বৈশিষ্ট্য। এর মানে হলো—আপনি একটি প্লেবুক ১০ বার রান করলেও সার্ভারে কোনো ক্ষতি হবে না। যদি কোনো কাজ ইতিমধ্যে করা থাকে (যেমন ফাইল কপি করা আছে), Ansible সেটা আবার করবে না (Status: `ok`), আর যদি না থাকে তবেই করবে (Status: `changed`)।
3. **সহজ ইংরেজি সিনট্যাক্স (YAML):** কোনো জটিল প্রোগ্রামিং ল্যাঙ্গুয়েজ শিখতে হয় না, শুধুমাত্র পড়তে সহজ এমন YAML ফরম্যাটে লেখা হয়।

---

## ২. Ansible কীভাবে কাজ করে? (Core Concept)

```
+---------------------------+
|    Control Node (আপনার পিসি) |
|  - Ansible ইন্সটল করা থাকে  |
|  - Playbooks & Inventory  |
+---------------------------+
              |
              | (SSH কানেকশন - পোর্ট ২২)
              v
     +-----------------+-----------------+
     |                 |                 |
     v                 v                 v
[Server 1: Mongo-01] [Server 2: Mongo-02] [Server 3: Mongo-03]
```

- **Control Node:** যে কম্পিউটার থেকে Ansible রান করা হয় (যেমন আপনার ম্যাকবুক বা ল্যাপটপ)।
- **Managed Nodes:** যে সার্ভারগুলোকে আপনি কন্ট্রোল করতে চান (যেমন আপনার ৩টি MongoDB সার্ভার)।
- **SSH:** কন্ট্রোল নোড শুধুমাত্র SSH দিয়ে ম্যানেজড নোডে কমান্ড পাঠায় এবং পাইথন কোড এক্সিকিউট করে আউটপুট নিয়ে আসে।

---

## ৩. আপনার কম্পিউটারে Ansible সেটআপ (Installation)

আপনার অপারেটিং সিস্টেম যদি **macOS** হয়:

### স্টেপ ১: Homebrew দিয়ে ইন্সটল করুন
ট্যার্মিনালে রান করুন:
```bash
brew install ansible
```

অথবা Python `pip` দিয়ে ইন্সটল করতে চাইলে:
```bash
pip3 install ansible
```

### স্টেপ ২: ইন্সটলেশন চেক করুন
```bash
ansible --version
```
যদি `ansible [core 2.x.x]` আউটপুট দেখতে পান, তবে আপনার সেটআপ রেডি!

---

---

## ৪. লোকাল (Local) নাকি রিমোট (Remote): কীভাবে চালাবেন?

Ansible দিয়ে মূলত দুইভাবে কাজ করা যায়:
1. **লোকাল মোড (Local Mode):** কোনো দূরবর্তী সার্ভার ছাড়া নিজের কম্পিউটারে টেস্ট বা প্র্যাকটিস করার জন্য।
2. **রিমোট মোড (Remote Mode):** বাস্তব ক্লাউড/ভিপিএস সার্ভারে (যেমন AWS, DigitalOcean, Hetzner ইত্যাদি) কাজ করার জন্য।

নিচে দুটি পদ্ধতিরই সম্পূর্ণ স্টেপ-বাই-স্টেপ নিয়ম দেওয়া হলো:

---

### পদ্ধতি ১: লোকাল মেশিনে চালানো (Local Execution)

লোকাল মোডে কোনো **SSH কানেকশন তৈরি হয় না**। Ansible সরাসরি আপনার লোকাল অপারেটিং সিস্টেমের প্রসেস হিসেবে টাস্কগুলো রান করে।

#### ১.১ ইনভেন্টরি ফাইলে যা লিখতে হয়:
`inventory.ini` ফাইলে লোকালের জন্য নিচের মতো লিখবেন:
```ini
[local]
localhost ansible_connection=local
```
> **ম্যাজিক লাইন:** `ansible_connection=local` লিখলেই Ansible বুঝে নেয় যে এটি কোনো রিমোট সার্ভার নয়, তাই SSH করার চেষ্টা করবে না।

#### ১.২ প্লেবুকে যা লিখতে হয়:
```yaml
---
- name: Local Environment Test Playbook
  hosts: local               # Inventory [local] group
  gather_facts: false

  tasks:
    - name: Create local test directory
      ansible.builtin.file:
        path: /tmp/my_local_test
        state: directory
```


#### ১.৩ টার্মিনালে চালানোর কমান্ড:
- **কানেকশন টেস্ট:**
  ```bash
  ansible local -m ping
  ```
- **প্লেবুক রান করা:**
  ```bash
  ansible-playbook playbooks/01_hello_world.yml
  ```

---

### পদ্ধতি ২: রিমোট সার্ভারে চালানো (Remote Execution via SSH)

প্রোডাকশন বা ক্লাউডে যখন MongoDB ইনস্টল করবেন, তখন আপনাকে রিমোট মোডে চালাতে হবে। Ansible রিমোট সার্ভারের সাথে **SSH** প্রোটোকল দিয়ে কথা বলে।

#### ২.১ পূর্বশর্ত (Prerequisites):
১. রিমোট সার্ভারের আইপি (যেমন: `192.168.1.101`) এবং ইউজারনেম (যেমন: `ubuntu` বা `root`) থাকতে হবে।  
২. সার্ভারে **Python 3** ইনস্টল থাকতে হবে (`sudo apt install python3 -y`)।  
৩. পাসওয়ার্ড ছাড়া ঢোকার জন্য SSH Key সেটআপ করে নেওয়া সবচেয়ে নিরাপদ।

#### ২.২ SSH Key সেটআপ করার নিয়ম (মাত্র ২ মিনিট):
আপনার লোকাল পিসি (Mac) থেকে একবার রান করুন:
```bash
# ১. কী না থাকলে নতুন কী তৈরি করুন (এন্টার চেপে শেষ করুন):
ssh-keygen -t ed25519

# ২. পাবলিক কী রিমোট সার্ভারে কপি করে পাঠান:
ssh-copy-id ubuntu@192.168.1.101
ssh-copy-id ubuntu@192.168.1.102
ssh-copy-id ubuntu@192.168.1.103
```
*এখন `ssh ubuntu@192.168.1.101` দিলে পাসওয়ার্ড ছাড়াই লগইন হবে।*

#### ২.৩ ইনভেন্টরি ফাইলে রিমোট সার্ভার কনফিগারেশন:
`inventory.ini` ফাইলে লিখবেন:
```ini
[mongodb_cluster]
mongo-01 ansible_host=192.168.1.101 ansible_user=ubuntu
mongo-02 ansible_host=192.168.1.102 ansible_user=ubuntu
mongo-03 ansible_host=192.168.1.103 ansible_user=ubuntu

# এই গ্রুপের সব সার্ভারের জন্য কমন সেটিংস:
[mongodb_cluster:vars]
ansible_ssh_private_key_file=~/.ssh/id_ed25519
ansible_python_interpreter=/usr/bin/python3
```

#### ২.৪ রিমোট সার্ভারের জন্য প্লেবুক লেখার নিয়ম:
রিমোট সার্ভারে রুট পারমিশন দিয়ে কাজ করতে প্লেবুকে `become: true` ব্যবহার করতে হয়:
```yaml
---
- name: Remote MongoDB Server Configuration
  hosts: mongodb_cluster      # Inventory remote group
  become: true                # Execute with sudo/root privileges

  tasks:
    - name: Update apt cache and install prerequisites
      ansible.builtin.apt:
        name: curl
        state: present
        update_cache: yes
```


#### ২.৫ টার্মিনালে চালানোর কমান্ড:
- **রিমোট সার্ভারগুলোতে কানেকশন পিং টেস্ট:**
  ```bash
  ansible mongodb_cluster -m ping
  ```
  *(সবগুলো সার্ভার থেকে `"ping": "pong"` আউটপুট আসবে)*

- **রিমোট প্লেবুক রান করা:**
  ```bash
  ansible-playbook -i inventory.ini playbooks/site_deploy.yml
  ```

- **যদি SSH Key ছাড়া পাসওয়ার্ড দিয়ে চালাতে চান:**
  ```bash
  # -k দিলে SSH পাসওয়ার্ড চাইবে, -K দিলে sudo পাসওয়ার্ড চাইবে
  ansible-playbook -i inventory.ini playbooks/site_deploy.yml -k -K
  ```

---

## ৫. লোকাল বনাম রিমোট: দ্রুত তুলনা (Quick Cheat Sheet)

| ফিচার | লোকাল মোড (Local Mode) | রিমোট মোড (Remote Mode) |
| :--- | :--- | :--- |
| **কানেকশন টাইপ** | `ansible_connection=local` | `SSH` (Secure Shell) |
| **সার্ভার প্রয়োজন?** | না (নিজের পিসিতেই রান হয়) | হ্যাঁ (রিমোট আইপি/ক্লাউড ভিপিএস) |
| **SSH কী বা পাসওয়ার্ড?** | দরকার নেই | দরকার আছে (`ssh-copy-id` বা পাসওয়ার্ড) |
| **টার্গেট ওএস** | সাধারণত macOS / Linux ল্যাপটপ | Ubuntu / Debian / RHEL সার্ভার |
| **প্রধান উদ্দেশ্য** | প্র্যাকটিস, টেস্টিং ও প্লেবুক ডেভেলপমেন্ট | প্রোডাকশন ডিপ্লয়মেন্ট ও অটোমেশন |


---

## ৬. Ad-Hoc কমান্ড: এক লাইনে সার্ভার চালানো

কোনো প্লেবুক না লিখে টার্মিনালে চটজলদি এক লাইনে কমান্ড চালানোকে বলে **Ad-Hoc command**।

### সিনট্যাক্স:
`ansible <গ্রুপ_বা_হোস্ট> -i <ইনভেন্টরি_ফাইল> -m <মডিউল> -a "<আর্গুমেন্ট>"`

### উদাহরণ ১: সার্ভার কানেকশন টেস্ট (Ping)
```bash
ansible local -i inventory.ini -m ping
```
*সফল হলে আউটপুট আসবে: `"ping": "pong"`*

### উদাহরণ ২: সার্ভারের ডিস্ক স্পেস চেক (`df -h`)
```bash
ansible local -i inventory.ini -m command -a "df -h"
```

### উদাহরণ ৩: মেমোরি ইনফরমেশন চেক
```bash
ansible local -i inventory.ini -m command -a "free -m"
```

---

## ৭. Ansible Playbook: সার্ভার অটোমেশনের প্রাণ

Playbook হলো YAML ফাইলে লেখা নির্দেশনাবলি। একটি প্লেবুকে এক বা একাধিক **Play** থাকে, এবং প্রতিটি প্লে-তে অনেকগুলো **Task** থাকে।

### বেসিক প্লেবুকের অ্যানাটমি:
```yaml
---
- name: My First Ansible Playbook       # Play Name
  hosts: local                        # Target hosts
  gather_facts: false                 # Skip gathering system facts

  tasks:                              # List of tasks
    - name: Print a welcome message
      ansible.builtin.debug:
        msg: "Hello! I am learning Ansible."

    - name: Ensure practice directory exists
      ansible.builtin.file:
        path: /tmp/my_practice_folder
        state: directory
        mode: '0755'
```

### কীভাবে প্লেবুক রান করবেন?
```bash
ansible-playbook -i inventory.ini playbooks/01_hello_world.yml
```

---

## ৮. সবচেয়ে গুরুত্বপূর্ণ কিছু মডিউল (Core Modules)

Ansible-এ সব কাজ বিভিন্ন **Modules**-এর মাধ্যমে হয়। মুখস্থ করার দরকার নেই, নিচের মডিউলগুলোই ৯০% সময় কাজে লাগে:

| মডিউল | কী কাজ করে? | উদাহরণ |
| :--- | :--- | :--- |
| `debug` | স্ক্রিনে কোনো ভ্যালু বা মেসেজ প্রিন্ট করা | `debug: msg="Task complete"` |
| `file` | ফাইল/ফোল্ডার তৈরি, ডিলিট ও পারমিশন সেট | `file: path=/tmp/data state=directory` |
| `copy` | লোকাল পিসি থেকে সার্ভারে ফাইল কপি করা | `copy: src=app.conf dest=/etc/app.conf` |
| `template` | Jinja2 ভ্যারিয়েবল সহ কনফিগ ফাইল পাঠানো | `template: src=mongod.conf.j2 dest=/etc/mongod.conf` |
| `apt` / `yum` | প্যাকেজ ইন্সটল করা (Ubuntu/RedHat) | `apt: name=mongodb-org state=present` |
| `systemd` / `service` | সার্ভিস Start, Stop, Enable, Restart | `systemd: name=mongod state=started enabled=yes` |
| `command` / `shell` | টার্মিনাল কমান্ড রান করা | `command: mongosh --eval "rs.status()"` |
| `lineinfile` | কোনো ফাইলের ভেতরের নির্দিষ্ট লাইন বদলানো | `lineinfile: path=/etc/sysctl.conf line="vm.swappiness=1"` |
| `user` / `group` | সিস্টেম ইউজার তৈরি ও পারমিশন দেওয়া | `user: name=mongod shell=/bin/false` |

---

## ৯. Variables, Loops এবং Conditionals

### ৯.১ ভ্যারিয়েবল (Variables)
তথ্য বারবার হার্ডকোড না করে এক জায়গায় ডিফাইন করা:
```yaml
vars:
  mongo_port: 27017
  db_user: "app_admin"

tasks:
  - name: Display configured MongoDB port
    ansible.builtin.debug:
      msg: "MongoDB port is set to {{ mongo_port }}"
```

### ৯.২ লুপ (Loops)
একাধিক আইটেমের ওপর একই কাজ করা (`loop`):
```yaml
tasks:
  - name: Ensure required database directories exist
    ansible.builtin.file:
      path: "{{ item }}"
      state: directory
      mode: '0755'
    loop:
      - /data/mongodb
      - /data/mongodb/logs
      - /data/mongodb/backups
```

### ৯.৩ কন্ডিশনাল (`when`)
শর্ত পূরণ হলেই কেবল টাস্ক চলবে:
```yaml
tasks:
  - name: Install curl only on Debian/Ubuntu systems
    ansible.builtin.apt:
      name: curl
      state: present
    when: ansible_os_family == "Debian"
```

---

## ১০. Handlers এবং Jinja2 Templates

### ১০.১ Jinja2 Templates (`.j2`)
কনফিগারেশন ফাইলে ডাইনামিক ভ্যারিয়েবল বসানোর জন্য ব্যবহৃত হয়।
উদাহরণ (`mongod.conf.j2`):
```yaml
net:
  port: {{ mongo_port }}
  bindIp: 0.0.0.0
replication:
  replSetName: {{ replica_set_name }}
```

### ১০.২ Handlers (হ্যান্ডলার)
কনফিগ ফাইল পরিবর্তন হলেই কেবল সার্ভিস রিস্টার্ট হবে—অন্যথায় অযথা রিস্টার্ট হবে না।
```yaml
tasks:
  - name: Deploy rendered mongod.conf template
    ansible.builtin.template:
      src: mongod.conf.j2
      dest: /etc/mongod.conf
    notify: Restart MongoDB Service     # Calls handler only when file changes

handlers:
  - name: Restart MongoDB Service
    ansible.builtin.systemd:
      name: mongod
      state: restarted
```


---

## ১১. Ansible Roles: প্রজেক্টকে গুছিয়ে রাখা

যখন একটি প্লেবুক বড় হয়ে ১০০-২০০ লাইনের হয়ে যায়, তখন সব কোড এক ফাইলে রাখা কঠিন। তখন **Roles** ব্যবহার করে কোডকে মডুলার করা হয়:

```text
roles/
└── mongodb_install/
    ├── tasks/main.yml       # কী কী কাজ হবে
    ├── handlers/main.yml    # রিস্টার্ট হ্যান্ডলার
    ├── templates/mongod.conf.j2  # কনফিগ টেমপ্লেট
    ├── vars/main.yml        # ভ্যারিয়েবল
    └── defaults/main.yml    # ডিফল্ট মান
```
আমাদের মূল MongoDB আর্কিটেকচারে আমরা এই রোলস-ভিত্তিক আর্কিটেকচার ব্যবহার করব।

---

## ১২. Ansible Vault: পাসওয়ার্ড ও গোপন তথ্য লক করা

ডাটাবেসের পাসওয়ার্ড, SSL কী-ফাইল বা ক্লাস্টার কী কখনোই প্লেইন টেক্সটে গিটহাবে রাখা উচিত নয়। Ansible-এ এর জন্য রয়েছে **Ansible Vault**।

### ফাইল এনক্রিপ্ট করার নিয়ম:
```bash
ansible-vault create group_vars/all/vault.yml
```
পাসওয়ার্ড চাইবে। এরপর ফাইলের ভেতরে তথ্য লিখবেন (যেমন: `mongo_root_password: "MySuperSecretPassword123!"`)।

### পরবর্তীতে দেখার বা এডিট করার নিয়ম:
```bash
ansible-vault edit group_vars/all/vault.yml
```

### প্লেবুক রান করার সময় পাসওয়ার্ড দেওয়া:
```bash
ansible-playbook -i inventory.ini site.yml --ask-vault-pass
```

---

## ১৩. এই ফোল্ডারের প্র্যাকটিস ফাইলগুলো চালানোর নিয়ম

আপনার সুবিধার্থে এই ফোল্ডারে ৪টি প্র্যাকটিস প্লেবুক প্রস্তুত করে দেওয়া আছে:

### ধাপ ১: টার্মিনালে এই ফোল্ডারে প্রবেশ করুন
```bash
cd /Users/fahimahammedfiroz/Projects/db-house/ansible
```

### ধাপ ২: কানেকশন টেস্ট করুন
```bash
ansible local -m ping
```
*(আউটপুটে `"ping": "pong"` দেখতে পাবেন)*

### ধাপ ৩: প্রথম প্লেবুক রান করুন (Hello World & Basics)
```bash
ansible-playbook playbooks/01_hello_world.yml
```

### ধাপ ৪: ভ্যারিয়েবল ও লুপ প্র্যাকটিস রান করুন
```bash
ansible-playbook playbooks/02_variables_and_facts.yml
```

### ধাপ ৫: টেমপ্লেট ও হ্যান্ডলার প্র্যাকটিস রান করুন
```bash
ansible-playbook playbooks/03_handlers_and_templates.yml
```

### ধাপ ৬: মক MongoDB কনফিগারেশন ড্রিল রান করুন
```bash
ansible-playbook playbooks/04_practice_mongodb_task.yml
```

এই ৪টি প্লেবুক একবার করে চালিয়ে আউটপুট পর্যবেক্ষণ করলে Ansible-এর ফান্ডামেন্টাল পুরো পরিষ্কার হয়ে যাবে। এরপর আপনি কনফিডেন্টলি মূল ক্লাস্টার প্লেবুকগুলো বুঝতে এবং চালাতে পারবেন!

