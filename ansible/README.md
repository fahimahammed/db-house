# 📘 Ansible জিরো টু হিরো: সম্পূর্ণ মাস্টার হ্যান্ডস-অন গাইড
### জিরো থেকে প্রোডাকশন-গ্রেড অটোমেশন ও MongoDB ক্লাস্টার ম্যানেজমেন্ট

স্বাগতম! আপনি যদি আগে কখনও **Ansible** ব্যবহার না করে থাকেন, তবে এটি আপনার জন্য একটি সম্পূর্ণ প্র্যাকটিক্যাল রোডম্যাপ। এই ডকুমেন্টটি এমনভাবে সাজানো হয়েছে যেন আপনি নিজের কম্পিউটারে কোনো রিমোট সার্ভার ছাড়াই প্র্যাকটিস শুরু করতে পারেন এবং ধাপে ধাপে বাস্তব ক্লাউড সার্ভার ও এন্টারপ্রাইজ-গ্রেড **MongoDB Replica Set Cluster** পরিচালনার দক্ষতা অর্জন করতে পারেন।

---

## 📑 সূচিপত্র (Table of Contents)

1. [Ansible কী এবং কেন এটি ইন্ডাস্ট্রি স্ট্যান্ডার্ড?](#১-ansible-কী-এবং-কেন-এটি-ইন্ডাস্ট্রি-স্ট্যান্ডার্ড)
2. [Ansible আর্কিটেকচার ও কাজের প্রক্রিয়া (Under the Hood)](#২-ansible-আর্কিটেকচার-ও-কাজের-প্রক্রিয়া-under-the-hood)
3. [আপনার কম্পিউটারে Ansible সেটআপ ও ভেরিফিকেশন](#৩-আপনার-কম্পিউটারে-ansible-সেটআপ-ও-ভেরিফিকেশন)
4. [Ansible কনফিগারেশন ইঞ্জিন (`ansible.cfg`)](#৪-ansible-কনফিগারেশন-ইঞ্জিন-ansiblecfg)
5. [ইনভেন্টরি (Inventory) আর্কিটেকচার ও হোস্ট গ্রুপিং](#৫-ইনভেন্টরি-inventory-আর্কিটেকচার-ও-হোস্ট-গ্রুপিং)
6. [লোকাল বনাম রিমোট এক্সিকিউশন (Local vs Remote Execution)](#৬-লোকাল-বনাম-রিমোট-এক্সিকিউশন-local-vs-remote-execution)
7. [Termius ব্যবহারকারীদের জন্য স্পেশাল SSH Key সেটআপ গাইড](#৭-termius-ব্যবহারকারীদের-জন্য-স্পেশাল-ssh-key-সেটআপ-গাইড)
8. [Ad-Hoc কমান্ডস: টার্মিনালে এক ক্লিকে সার্ভার পরিচালনা](#৮-ad-hoc-কমান্ডস-টার্মিনালে-এক-ক্লিকে-সার্ভার-পরিচালনা)
9. [Ansible Playbook ইন-ডেপথ: স্ট্রাকচার ও সিনট্যাক্স](#৯-ansible-playbook-ইন-ডেপথ-স্ট্রাকচার-ও-সিনট্যাক্স)
10. [সবচেয়ে গুরুত্বপূর্ণ কোর মডিউলসমূহ (Core Modules Reference)](#১০-সবচেয়ে-গুরুত্বপূর্ণ-কোর-মডিউলসমূহ-core-modules-reference)
11. [Variables, Facts, Loops এবং Conditionals](#১১-variables-facts-loops-এবং-conditionals)
12. [ত্রুটি নিয়ন্ত্রণ ও ব্লক সিস্টেম (Error Handling: Block, Rescue, Always)](#১২-ত্রুটি-নিয়ন্ত্রণ-ও-ব্লক-সিস্টেম-error-handling-block-rescue-always)
13. [Jinja2 টেমপ্লেট ইঞ্জিন এবং Handlers](#১৩-jinja2-টেমপ্লেট-ইঞ্জিন-এবং-handlers)
14. [Ansible Roles: মডুলার ও প্রফেশনাল প্রজেক্ট স্ট্রাকচার](#১৪-ansible-roles-মডুলার-ও-প্রফেশনাল-প্রজেক্ট-স্ট্রাকচার)
15. [Ansible Vault: পাসওয়ার্ড, সার্টিফিকেট ও গোপন তথ্য এনক্রিপশন](#১৫-ansible-vault-পাসওয়ার্ড-সার্টিফিকেট-ও-গোপন-তথ্য-এনক্রিপশন)
16. [হ্যান্ডস-অন প্র্যাকটিস ল্যাব: ৪টি প্লেবুক চালানোর গাইড](#১৬-হ্যান্ডস-অন-প্র্যাকটিস-ল্যাব-৪টি-প্লেবুক-চালানোর-গাইড)
17. [MongoDB প্রোডাকশন ক্লাস্টারের সাথে সংযোগ](#১৭-mongodb-প্রোডাকশন-ক্লাস্টারের-সাথে-সংযোগ)
18. [সমস্যা সমাধান ও ট্রাবলশুটিং (Troubleshooting & FAQs)](#১৮-সমস্যা-সমাধান-ও-ট্রাবলশুটিং-troubleshooting--faqs)

---

## ১. Ansible কী এবং কেন এটি ইন্ডাস্ট্রি স্ট্যান্ডার্ড?

সহজ ভাষায়: **Ansible হলো একটি Infrastructure as Code (IaC) এবং Configuration Management টুল।**

ঐতিহ্যগতভাবে সিস্টেম অ্যাডমিনরা একাধিক সার্ভার কনফিগার করার জন্য ব্যাশ (Bash) স্ক্রিপ্ট লিখতেন অথবা এক এক করে SSH দিয়ে ঢুকে কাজ করতেন। এই পদ্ধতির ৩টি বড় সমস্যা:
1. **Human Error:** ৫টি সার্ভারে কাজ করার সময় একটিতে কোনো প্যাকেজ বা কনফিগ ফাইল মিস হওয়া খুবই স্বাভাবিক।
2. **স্কেলেবিলিটি সমস্যা:** ১০০টি সার্ভারে একই স্ক্রিপ্ট চালানো অত্যন্ত সময়সাপেক্ষ ও জটিল।
3. **স্ক্রিপ্ট ক্র্যাশ:** কোনো স্ক্রিপ্ট মাঝপথে ফেইল করলে সার্ভার একটি আনপ্রেডিক্টেবল স্টেটে চলে যায়।

### Ansible-এর ৪টি বৈপ্লবিক বৈশিষ্ট্য:
- **১. Agentless (কোনো ক্লায়েন্ট এজেন্ট নেই):** Puppet বা Chef-এর মতো টার্গেট সার্ভারে কোনো ব্যাকগ্রাউন্ড ডেমন বা এজেন্ট ইন্সটল রাখতে হয় না। রিমোট মেশিনে সাধারণ **SSH** এবং **Python** থাকলেই Ansible স্বয়ংক্রিয়ভাবে কাজ করতে পারে।
- **২. Idempotence (আইডেমপোটেন্সি):** আপনি একটি প্লেবুক ১ বার রান করুন অথবা ১০০ বার রান করুন—সিস্টেম যদি ইতিমধ্যে কাঙ্ক্ষিত স্টেটে থাকে, তবে Ansible নতুন করে কোনো পরিবর্তন করবে না। অর্থাৎ সিস্টেমের কোনো ডাউনটাইম বা কনফিগ ব্রোকেন হওয়ার ঝুঁকি নেই।
- **৩. YAML সিনট্যাক্স (Human Readable):** কোনো জটিল কোডিং ভাষা শিখতে হয় না। ইংরেজি বাক্যের মতো পড়তে পারা যায় এমন ডিক্লেয়ারেটিভ সিনট্যাক্স।
- **৪. Push-based Architecture:** কন্ট্রোল নোড থেকে সরাসরি সার্ভারগুলোতে কমান্ড এবং কনফিগারেশন পুশ করা হয়।

---

## ২. Ansible আর্কিটেকচার ও কাজের প্রক্রিয়া (Under the Hood)

Ansible কীভাবে কাজ করে তা বোঝার জন্য নিচের ডায়াগ্রামটি লক্ষ্য করুন:

```
+-------------------------------------------------------------+
|               Control Node (আপনার Mac / PC)                 |
|  - Ansible Engine & Modules                                 |
|  - Inventory File (সার্ভার লিস্ট ও আইপি)                   |
|  - Playbooks (YAML অটোমেশন কোড)                             |
|  - Group Variables & Secrets (Vault)                        |
+-------------------------------------------------------------+
                               |
               +---------------+---------------+
               | OpenSSH Transport (Port 22)   |
               | (বা Local Connection)         |
               v                               v
+-------------------------------+ +-------------------------------+
|  Managed Node 1: mongo-01     | |  Managed Node 2: mongo-02     |
|  - OS: Ubuntu Linux           | |  - OS: Ubuntu Linux           |
|  - Python 3 Runtime           | |  - Python 3 Runtime           |
|  - MongoDB Service (Primary)  | |  - MongoDB Service (Secondary)|
+-------------------------------+ +-------------------------------+
```

### কাজের ধাপসমূহ (Step-by-Step Execution Lifecycle):
1. **কন্ট্রোল নোড প্লেবুক পড়ে:** Ansible আপনার YAML প্লেবুক এবং ইনভেন্টরি ফাইল বিশ্লেষণ করে।
2. **মডিউল কোড জেনারেট করে:** প্রতিটি টাস্কের জন্য Ansible ব্যাকগ্রাউন্ডে একটি ছোট পাইথন স্ক্রিপ্ট তৈরি করে।
3. **SSH দিয়ে ট্রান্সফার করে:** SFTP/SCP দিয়ে সেই পাইথন স্ক্রিপ্ট টার্গেট সার্ভারের `/tmp` ডিরেক্টরিতে পাঠায়।
4. **সার্ভারে এক্সিকিউট করে:** টার্গেট সার্ভারের লোকাল পাইথন দিয়ে স্ক্রিপ্টটি রান করিয়ে JSON আউটপুট সংগ্রহ করে।
5. **ক্লিনআপ করে:** কাজ শেষ হওয়া মাত্রই `/tmp` থেকে সেই টেম্পোরারি পাইথন ফাইল স্বয়ংক্রিয়ভাবে মুছে ফেলে।

---

## ৩. আপনার কম্পিউটারে Ansible সেটআপ ও ভেরিফিকেশন

আপনার অপারেটিং সিস্টেম **macOS** হলে নিচের নির্দেশনা অনুসরণ করুন:

### ধাপ ১: Homebrew দিয়ে ইন্সটলেশন (প্রস্তাবিত)
টার্মিনালে কমান্ড দিন:
```bash
brew update
brew install ansible
```

*(যদি Python `pip` ব্যবহার করতে চান: `pip3 install ansible`)*

### ধাপ ২: ইন্সটলেশন নিশ্চিত করুন
```bash
ansible --version
```

**আউটপুট প্রিভিউ:**
```text
ansible [core 2.16.x]
  config file = /Users/.../ansible.cfg
  configured module search path = ...
  ansible python module location = ...
  python version = 3.10+
```

---

## ৪. Ansible কনফিগারেশন ইঞ্জিন (`ansible.cfg`)

প্রতিটি প্রজেক্টে একটি `ansible.cfg` ফাইল রাখা বেস্ট প্র্যাকটিস। এতে বারবার কমান্ড লাইনে লম্বা ফ্ল্যাগ টাইপ করতে হয় না।

আমাদের এই প্রজেক্টের [`ansible.cfg`](file:///Users/fahimahammedfiroz/Projects/db-house/ansible/ansible.cfg) ফাইলের ব্যাখ্যা:

```ini
[defaults]
# ডিফল্ট ইনভেন্টরি ফাইলের পাথ
inventory = ./inventory.ini

# প্রথমবার নতুন সার্ভারে SSH করার সময় 'yes/no' প্রম্পট বন্ধ রাখা
host_key_checking = False

# কোনো টাস্ক ফেইল করলে অপ্রয়োজনীয় .retry ফাইল তৈরি না করা
retry_files_enabled = False

# টার্মিনালে আউটপুট পরিষ্কার ও কালারফুল YAML ফরম্যাটে দেখানো (Modern Ansible)
stdout_callback = default

[callback_default]
result_format = yaml


# টার্গেট সার্ভারে পাইথন পাথ স্বয়ংক্রিয়ভাবে খুঁজে নেওয়া
interpreter_python = auto_silent

# কাউসে (Cowsay) ব্যানার বন্ধ রাখা
nocows = 1

# এক সাথে কতগুলো সার্ভারে কাজ চলবে (প্যারালাল এক্সিকিউশন)
forks = 10
```

---

## ৫. ইনভেন্টরি (Inventory) আর্কিটেকচার ও হোস্ট গ্রুপিং

ইনভেন্টরি হলো আপনার সার্ভারগুলোর অ্যাড্রেস বুক। এটি সাধারণত `INI` অথবা `YAML` ফরম্যাটে লেখা হয়।

### ৫.১ ইনভেন্টরি ফাইলের অ্যানাটমি (`inventory.ini`):
```ini
# ১. লোকাল গ্রুপ: নিজের পিসিতে টেস্টের জন্য
[local]
localhost ansible_connection=local

# ২. ডাটাবেস ক্লাস্টার গ্রুপ: প্রোডাকশন বা ক্লাউড সার্ভারের জন্য
[mongodb_cluster]
mongo-01 ansible_host=10.0.10.11 ansible_user=ubuntu mongo_role=primary   mongo_priority=2
mongo-02 ansible_host=10.0.10.12 ansible_user=ubuntu mongo_role=secondary mongo_priority=1
mongo-03 ansible_host=10.0.10.13 ansible_user=ubuntu mongo_role=secondary mongo_priority=1

# ৩. মনিটরিং গ্রুপ
[monitoring]
mon-01 ansible_host=10.0.10.20 ansible_user=ubuntu

# ৪. গ্রুপের ভেতরের গ্রুপ (Parent Group):
[production:children]
mongodb_cluster
monitoring

# ৫. ক্লাস্টার-ওয়াইড কমন ভ্যারিয়েবল:
[mongodb_cluster:vars]
ansible_ssh_private_key_file=~/.ssh/termius_key
ansible_python_interpreter=/usr/bin/python3
ansible_ssh_common_args='-o StrictHostKeyChecking=no'
mongo_port=27017
```

### ৫.২ ইনভেন্টরি ভ্যালিডেশন কমান্ড:
ইনভেন্টরি ঠিকমতো লেখা হয়েছে কি না তা চেক করতে রান করুন:
```bash
# সব হোস্টের গ্রাফিকাল ট্রি দেখতে:
ansible-inventory -i inventory.ini --graph

# নির্দিষ্ট গ্রুপের হোস্ট লিস্ট দেখতে:
ansible-inventory -i inventory.ini --list
```

---

## ৬. লোকাল বনাম রিমোট এক্সিকিউশন (Local vs Remote Execution)

Ansible-এর অন্যতম সৌন্দর্য হলো আপনি একই প্লেবুক লোকাল টেস্ট করতে পারেন আবার রিমোট প্রোডাকশনেও চালাতে পারেন।

### পদ্ধতি ১: লোকাল মোড (Local Mode)
- **কখন ব্যবহার করবেন:** Ansible শেখার সময়, প্লেবুক ড্রাফট করার সময় অথবা সিআই/সিডি (GitHub Actions) রানারে।
- **কীভাবে কাজ করে:** কোনো SSH লাগে না। `ansible_connection=local` দিলে Ansible সরাসরি আপনার বর্তমান মেশিনের সাব-প্রসেস হিসেবে চলে।
- **চালানোর নিয়ম:**
  ```bash
  ansible local -m ping
  ansible-playbook -i inventory.ini playbooks/01_hello_world.yml
  ```

---

### পদ্ধতি ২: রিমোট মোড (Remote Mode)
- **কখন ব্যবহার করবেন:** বাস্তব ক্লাউড ভিএম (AWS EC2, Hetzner, DigitalOcean) বা ফিজিক্যাল বেয়ার-মেটাল সার্ভারে।
- **কীভাবে কাজ করে:** কন্ট্রোল নোড থেকে ওপেনএসএসএইচ (OpenSSH) এর মাধ্যমে রিমোট নোডে কমান্ড এক্সিকিউট করে।
- **চালানোর নিয়ম:**
  ```bash
  ansible mongodb_cluster -m ping
  ansible-playbook -i inventory.ini playbooks/site_deploy.yml
  ```

---

## ৭. Termius ব্যবহারকারীদের জন্য স্পেশাল SSH Key সেটআপ গাইড

আপনি যদি সার্ভার ম্যানেজ করার জন্য **Termius** অ্যাপ ব্যবহার করে থাকেন, তবে সেই একই SSH Key দিয়ে Ansible চালানোর সম্পূর্ণ নিয়ম নিচে দেওয়া হলো:

```
[ Termius App ]
       | (Export Private Key)
       v
[ Mac: ~/.ssh/termius_key ] (chmod 600)
       |
       v
[ Ansible Inventory: ansible_ssh_private_key_file=~/.ssh/termius_key ]
       |
       +================> [ Remote Ubuntu Servers ]
```

### ৩ মিনিটের প্র্যাকটিক্যাল সেটআপ:

#### ধাপ ১: Termius থেকে কী কপি করুন
1. আপনার Mac-এ **Termius** অ্যাপ ওপেন করুন।
2. সাইডবার থেকে **Keychain** (অথবা **Vault / Keys**) অপশনে যান।
3. আপনার সার্ভার Key-টির পাশে **`...` (থ্রি-ডট মেনু)**-তে ক্লিক করুন।
4. **Export** অথবা **Copy Private Key** সিলেক্ট করুন।

#### ধাপ ২: ম্যাক টার্মিনালে সেভ করুন
টার্মিনাল ওপেন করে নিচের ৩টি কমান্ড রান করুন:
```bash
# ১. .ssh ফোল্ডার তৈরি ও পারমিশন নিশ্চিত করা
mkdir -p ~/.ssh && chmod 700 ~/.ssh

# ২. ফাইলে কী পেস্ট করা
nano ~/.ssh/termius_key
```
*(ন্যানো এডিটর খুললে পেস্ট করুন, তারপর `Ctrl + O` চেপে `Enter` দিন, এরপর `Ctrl + X` দিয়ে বের হয়ে আসুন)*

#### ধাপ ৩: ফাইলের পারমিশন লক করুন (সবচেয়ে গুরুত্বপূর্ণ)
```bash
chmod 600 ~/.ssh/termius_key
```
> ⚠️ **সতর্কতা:** SSH প্রটোকলের কঠোর নিয়ম অনুযায়ী ফাইলের পারমিশন `600` না হলে কোনো কানেকশন সম্ভব হবে না (`Bad permissions` এরর দেখাবে)।

#### ধাপ ৪: টেস্ট কানেকশন
```bash
ssh -i ~/.ssh/termius_key ubuntu@YOUR_SERVER_IP
```
যদি পাসওয়ার্ড ছাড়াই রিমোট সার্ভারে শেল ওপেন হয়ে যায়, তার মানে আপনার সেটআপ শতভাগ প্রস্তুত!

---

## ৮. Ad-Hoc কমান্ডস: টার্মিনালে এক ক্লিকে সার্ভার পরিচালনা

কোনো ফাইল না লিখে টার্মিনালে চটজলদি একাধিক সার্ভারে কমান্ড রান করাকে বলে **Ad-Hoc Command**।

### সিনট্যাক্স:
```bash
ansible <টার্গেট_হোস্ট_বা_গ্রুপ> -i <ইনভেন্টরি> -m <মডিউল> -a "<প্যারামিটার>"
```

### বাস্তব জীবনের সেরা ১০টি Ad-Hoc কমান্ড:

1. **কানেক্টিভিটি চেক (Ping):**
   ```bash
   ansible mongodb_cluster -m ping
   ```

2. **সব সার্ভারের আপটাইম ও লোড অ্যাভারেজ চেক:**
   ```bash
   ansible mongodb_cluster -m command -a "uptime"
   ```

3. **সব সার্ভারের ফ্রি মেমোরি দেখা:**
   ```bash
   ansible mongodb_cluster -m command -a "free -h"
   ```

4. **ডিস্ক স্পেস চেক (`df -h`):**
   ```bash
   ansible mongodb_cluster -m command -a "df -h /var/lib"
   ```

5. **যেকোনো প্যাকেজ আপডেট করা (যেমন curl):**
   ```bash
   ansible mongodb_cluster -m apt -a "name=curl state=latest update_cache=yes" --become
   ```

6. **MongoDB সার্ভিস রিস্টার্ট করা:**
   ```bash
   ansible mongodb_cluster -m systemd -a "name=mongod state=restarted" --become
   ```

7. **সার্ভার থেকে কনফিগ ফাইল লোকাল পিসিতে নামানো (Fetch):**
   ```bash
   ansible mongo-01 -m fetch -a "src=/etc/mongod.conf dest=/tmp/fetched_configs/ flat=yes"
   ```

8. **যেকোনো শেল স্ক্রিপ্ট এক ক্লিকে সব সার্ভারে চালানো:**
   ```bash
   ansible mongodb_cluster -m script -a "/path/to/my_healthcheck.sh"
   ```

9. **কোনো ফাইল তৈরি বা ডিলিট করা:**
   ```bash
   ansible mongodb_cluster -m file -a "path=/tmp/test.txt state=absent"
   ```

10. **সার্ভার রিবুট দেওয়া (নিরাপদে রিবুট করে ব্যাক আসা পর্যন্ত অপেক্ষা করবে):**
    ```bash
    ansible mongodb_cluster -m reboot --become
    ```

---

## ৯. Ansible Playbook ইন-ডেপথ: স্ট্রাকচার ও সিনট্যাক্স

Playbook হলো YAML ফাইল যেখানে অটোমেশনের যাবতীয় লজিক লিপিবদ্ধ থাকে।

### একটি প্রোডাকশন প্লেবুকের স্ট্রাকচার:
```yaml
---
- name: Production Web & Database Server Provisioning
  hosts: mongodb_cluster
  become: true                    # Run tasks with sudo
  gather_facts: true              # Collect system telemetry
  serial: 1                       # Rolling execution: 1 host at a time (zero downtime)

  vars:
    target_package: "mongodb-org"
    listen_port: 27017

  tasks:
    - name: Ensure prerequisite packages are installed
      ansible.builtin.apt:
        name:
          - gnupg
          - curl
        state: present
        update_cache: yes

    - name: Configure MongoDB main parameters
      ansible.builtin.template:
        src: templates/mongod.conf.j2
        dest: /etc/mongod.conf
        owner: mongodb
        group: mongodb
        mode: '0640'
      notify: Restart MongoDB Service

  handlers:
    - name: Restart MongoDB Service
      ansible.builtin.systemd:
        name: mongod
        state: restarted
```

### প্লেবুক চালানোর প্রয়োজনীয় ফ্ল্যাগসমূহ:
- **ড্রাই রান (Dry Run / Test Mode):** সার্ভারে কোনো পরিবর্তন না করে শুধু চেক করতে:
  ```bash
  ansible-playbook playbooks/site.yml --check
  ```
- **ডিফ মোড (Diff Mode):** কনফিগ ফাইলে কী কী লাইন পরিবর্তন হবে তা আগে দেখতে:
  ```bash
  ansible-playbook playbooks/site.yml --check --diff
  ```
- **নির্দিষ্ট ট্যাগ রান করা (Tags):**
  ```bash
  ansible-playbook playbooks/site.yml --tags "config,restart"
  ```
- **নির্দিষ্ট একটি সার্ভারে সীমাবদ্ধ রাখা (Limit):**
  ```bash
  ansible-playbook playbooks/site.yml --limit "mongo-01"
  ```

---

## ১০. সবচেয়ে গুরুত্বপূর্ণ কোর মডিউলসমূহ (Core Modules Reference)

| মডিউল নাম | বিবরণ | প্র্যাকটিক্যাল কোড স্নিপেট |
| :--- | :--- | :--- |
| `ansible.builtin.apt` | প্যাকেজ ইন্সটল, আপডেট ও আনইন্সটল (Debian/Ubuntu) | `apt: { name: mongodb-org, state: present }` |
| `ansible.builtin.file` | ডিরেক্টরি, ফাইল তৈরি ও পারমিশন (`chmod`, `chown`) | `file: { path: /var/lib/mongodb, state: directory, mode: '0700', owner: mongodb }` |
| `ansible.builtin.copy` | ফাইল কপি করা বা স্ট্রিং কনটেন্ট রাইট করা | `copy: { src: keyfile, dest: /etc/keyfile, mode: '0400' }` |
| `ansible.builtin.template` | Jinja2 ডাইনামিক কনফিগ ফাইল তৈরি | `template: { src: mongod.conf.j2, dest: /etc/mongod.conf }` |
| `ansible.builtin.systemd` | সিস্টেম সার্ভিস স্টার্ট, স্টপ, এনেবল বা রিস্টার্ট | `systemd: { name: mongod, state: started, enabled: yes }` |
| `ansible.builtin.command` | রিমোট টার্মিনাল কমান্ড চালানো (নিরাপদ, শেল পাইপ ছাড়া) | `command: mongosh --eval "rs.status().ok"` |
| `ansible.builtin.shell` | জটিল শেল কমান্ড বা পাইপ (`\|`, `>`, `&&`) চালানো | `shell: cat /sys/kernel/mm/transparent_hugepage/enabled` |
| `ansible.builtin.lineinfile` | ফাইলে নির্দিষ্ট টেক্সট লাইন খোঁজা ও রিপ্লেস করা | `lineinfile: { path: /etc/sysctl.conf, line: 'vm.swappiness=1' }` |
| `ansible.builtin.sysctl` | লিনাক্স কার্নেল প্যারামিটার পরিবর্তন ও লোড | `sysctl: { name: 'vm.max_map_count', value: '1048576', state: present, reload: yes }` |
| `ansible.builtin.user` | সিস্টেম ইউজার তৈরি ও গ্রুপিং | `user: { name: mongodb, system: yes, shell: /bin/false }` |
| `ansible.builtin.wait_for` | পোর্ট ওপেন হওয়া পর্যন্ত অপেক্ষা করা | `wait_for: { port: 27017, delay: 2, timeout: 30 }` |

---

## ১১. Variables, Facts, Loops এবং Conditionals

### ১১.১ ভ্যারিয়েবল স্কোপ ও প্রেসিডেন্স (Variables)
Ansible-এ ভ্যারিয়েবল বিভিন্ন স্তরে ডিক্লেয়ার করা যায়:
1. `group_vars/` (পুরো গ্রুপের জন্য)
2. `host_vars/` (নির্দিষ্ট কোনো একটি হোস্টের জন্য)
3. প্লেবুকের `vars:` ব্লকে
4. টাস্কের ভেতরে `register:` দিয়ে পূর্ববর্তী কমান্ডের আউটপুট ভ্যারিয়েবলে স্টোর করা:
   ```yaml
   - name: Check current replica status
     ansible.builtin.command: mongosh --quiet --eval "rs.status().ok"
     register: rs_status
     changed_when: false

   - name: Print status result
     ansible.builtin.debug:
       msg: "Replica Status is: {{ rs_status.stdout }}"
   ```

### ১১.২ সিস্টেম ফ্যাক্টস (System Facts)
Ansible শুরুতেই সার্ভারের সকল হার্ডওয়্যার তথ্য সংগ্রহ করে (`ansible_facts`):
- `{{ ansible_distribution }}` -> Ubuntu / Debian / Rocky
- `{{ ansible_memtotal_mb }}` -> মোট র্যামের পরিমাণ
- `{{ ansible_processor_vcpus }}` -> মোট CPU কোর সংখ্যা
- `{{ ansible_default_ipv4.address }}` -> প্রাইভেট আইপি অ্যাড্রেস

### ১১.৩ লুপস (Loops)
```yaml
- name: Create multiple directories for MongoDB storage
  ansible.builtin.file:
    path: "/data/mongodb/{{ item.path }}"
    mode: "{{ item.mode }}"
    state: directory
  loop:
    - { path: "db", mode: "0700" }
    - { path: "logs", mode: "0755" }
    - { path: "backups", mode: "0700" }
```

### ১১.৪ কন্ডিশনালস (`when`)
```yaml
- name: Tune WiredTiger Cache for Large Memory Servers
  ansible.builtin.lineinfile:
    path: /etc/mongod.conf
    line: "      cacheSizeGB: 32"
  when: ansible_memtotal_mb > 64000
```

---

## ১২. ত্রুটি নিয়ন্ত্রণ ও ব্লক সিস্টেম (Error Handling: Block, Rescue, Always)

প্রোডাকশন গ্রেড অটোমেশনে কোনো টাস্ক ফেইল করলে সিস্টেম যেন ক্র্যাশ না করে সে জন্য `block`, `rescue`, এবং `always` ব্যবহার করা হয় (যেমনটা প্রোগ্রামিংয়ের `try-catch-finally`):

```yaml
- name: Perform Safe Database Migration with Fallback
  block:
    - name: Attempt rolling version step-down
      ansible.builtin.command: mongosh --eval "rs.stepDown(60)"

    - name: Upgrade MongoDB binary packages
      ansible.builtin.apt:
        name: mongodb-org=7.0.5
        state: present

  rescue:
    - name: Rollback and notify alert webhook on failure
      ansible.builtin.debug:
        msg: "CRITICAL: Upgrade failed! Reverting back to previous stable node state."

  always:
    - name: Always verify cluster quorum is active
      ansible.builtin.command: mongosh --eval "rs.status().members.length"
```

---

## ১৩. Jinja2 টেমপ্লেট ইঞ্জিন এবং Handlers

### ১৩.১ Jinja2 সিনট্যাক্স (`.j2`):
টেমপ্লেট ফাইলের ভেতরে ডাইনামিক পাইথন এক্সপ্রেশন ব্যবহার করা যায়:
```jinja2
# Dynamic WiredTiger Cache calculation in mongod.conf.j2
storage:
  wiredTiger:
    engineConfig:
      # Automatically assign 50% of available RAM
      cacheSizeGB: {{ (ansible_memtotal_mb * 0.5 / 1024) | round | int }}
```

### ১৩.২ Handlers (হ্যান্ডলারস):
টাস্কের মধ্যে `notify:` কল করলে হ্যান্ডলার রেজিস্টার হয়। একটি প্লেবুকে ১০টি কনফিগ পরিবর্তন হলেও হ্যান্ডলার মাত্র **একবারই** সার্ভিস রিস্টার্ট করবে:
```yaml
tasks:
  - name: Update mongod.conf
    ansible.builtin.template:
      src: mongod.conf.j2
      dest: /etc/mongod.conf
    notify: Restart Mongod

handlers:
  - name: Restart Mongod
    ansible.builtin.systemd:
      name: mongod
      state: restarted
```

---

## ১৪. Ansible Roles: মডুলার ও প্রফেশনাল প্রজেক্ট স্ট্রাকচার

বড় প্রজেক্টে প্লেবুককে ছোট ছোট পুনঃব্যবহারযোগ্য মডিউলে ভাগ করতে **Roles** ব্যবহার করা হয়।

### আদর্শ ডিরেক্টরি স্ট্রাকচার:
```text
roles/
└── mongodb_server/
    ├── defaults/        # লোয়েস্ট প্রায়োরিটি ডিফল্ট ভ্যারিয়েবল
    │   └── main.yml
    ├── vars/            # হাই প্রায়োরিটি ভ্যারিয়েবল
    │   └── main.yml
    ├── tasks/           # মূল টাস্ক সমূহের লিস্ট
    │   └── main.yml
    ├── handlers/        # সার্ভিস রিস্টার্ট হ্যান্ডলার
    │   └── main.yml
    ├── templates/       # Jinja2 (.j2) কনফিগ ফাইলসমূহ
    │   └── mongod.conf.j2
    ├── files/           # ফিক্সড ফাইলসমূহ (যেমন SSL কী-ফাইল)
    │   └── mongo-keyfile
    └── meta/            # ডিপেনডেন্সি ও ইনফরমেশন
        └── main.yml
```

---

## ১৫. Ansible Vault: পাসওয়ার্ড, সার্টিফিকেট ও গোপন তথ্য এনক্রিপশন

ডাটাবেসের পাসওয়ার্ড ও কী-ফাইল কখনোই প্লেইন টেক্সটে গিটহাবে পুশ করবেন না। Ansible Vault দিয়ে AES-256 এনক্রিপ্ট করে রাখবেন।

### প্রয়োজনীয় কমান্ডস:

1. **নতুন এনক্রিপ্টেড ফাইল তৈরি করা:**
   ```bash
   ansible-vault create inventory/production/vault.yml
   ```
   *(একটি পাসওয়ার্ড সেট করতে বলবে)*

2. **বিদ্যমান ফাইল এনক্রিপ্ট করা:**
   ```bash
   ansible-vault encrypt secret_file.yml
   ```

3. **এনক্রিপ্টেড ফাইল এডিট করা:**
   ```bash
   ansible-vault edit inventory/production/vault.yml
   ```

4. **এনক্রিপ্ট করা ফাইল দেখে নেওয়া (View):**
   ```bash
   ansible-vault view inventory/production/vault.yml
   ```

5. **প্লেবুক রান করার সময় ভল্ট পাসওয়ার্ড দেওয়া:**
   ```bash
   ansible-playbook -i inventory.ini playbooks/site.yml --ask-vault-pass
   ```

---

## ১৬. হ্যান্ডস-অন প্র্যাকটিস ল্যাব: ৪টি প্লেবুক চালানোর গাইড

আপনার প্র্যাকটিসের সুবিধার জন্য এই ফোল্ডারের [`playbooks/`](file:///Users/fahimahammedfiroz/Projects/db-house/ansible/playbooks) ডিরেক্টরিতে ৪টি রেডিমেড প্লেবুক প্রস্তুত রাখা হয়েছে।

### ল্যাব রান করার স্টেপ-বাই-স্টেপ নিয়ম:

```bash
cd /Users/fahimahammedfiroz/Projects/db-house/ansible
```

#### ল্যাব ১: বেসিক টাস্ক ও আইডেমপোটেন্সি টেস্ট
```bash
ansible-playbook playbooks/01_hello_world.yml
```
> **কী শিখবেন:** কীভাবে টাস্ক রান হয়, `/tmp` ডিরেক্টরিতে ডিরেক্টরি ও ফাইল তৈরি হয় এবং ২য় বার রান করলে কেন `changed` না হয়ে `ok` দেখায় (Idempotency)।

#### ল্যাব ২: সিস্টেম ফ্যাক্টস ও লুপস
```bash
ansible-playbook playbooks/02_variables_and_facts.yml
```
> **কী শিখবেন:** কীভাবে আপনার পিসির আর্কিটেকচার, মেমোরি ইত্যাদি ফ্যাক্টস রিড করা যায় এবং লুপ ব্যবহার করে একাধিক ইউজার ও ফোল্ডার একবারে বানানো যায়।

#### ল্যাব ৩: Jinja2 টেমপ্লেট ও হ্যান্ডলার
```bash
ansible-playbook playbooks/03_handlers_and_templates.yml
```
> **কী শিখবেন:** Jinja2 টেমপ্লেট ডাইনামিক ভ্যালু বসিয়ে কীভাবে কনফিগ ফাইল বানায় এবং ফাইল পরিবর্তন হলে কীভাবে হ্যান্ডলার ট্রিগার হয়।

#### ল্যাব ৪: প্রোডাকশন MongoDB সিমুলেশন ল্যাব
```bash
ansible-playbook playbooks/04_practice_mongodb_task.yml
```
> **কী শিখবেন:** বাস্তব MongoDB সার্ভারে যেভাবে ডেটা পাথ, সিকিউর কি-ফাইল (`chmod 400`), এবং `mongod.conf` তৈরি করা হয়—তার ১০০% রিয়েল সিমুলেশন।

---

## ১৭. MongoDB প্রোডাকশন ক্লাস্টারের সাথে সংযোগ

আপনি যখন এই ৪টি ল্যাব সফলভাবে বুঝতে পারবেন, তখন আপনি সরাসরি আমাদের মূল ক্লাস্টার আর্কিটেকচার [MONGODB_PRODUCTION_ARCHITECTURE.md](file:///Users/fahimahammedfiroz/Projects/db-house/MONGODB_PRODUCTION_ARCHITECTURE.md)-এ বর্ণিত এন্টারপ্রাইজ সিস্টেমটি ডিপ্লয় করার জন্য প্রস্তুত হবেন:

```
[ আপনার শেখা Ansible স্কিল ]
             |
             +---> ১. ৩টি নোডে কার্নেল টিউনিং ও THP বন্ধ করা (common_os_hardening)
             +---> ২. TLS/SSL সার্টিফিকেট ও Keyfile বিতরণ করা (mongodb_pki)
             +---> ৩. প্রোডাকশন mongod.conf ও WiredTiger ক্যাশ অপ্টিমাইজ করা
             +---> ৪. স্বয়ংক্রিয়ভাবে rs.initiate() দিয়ে ৩-নোড রেপ্লিকাসেট চালু করা
             +---> ৫. প্রতি ৫ মিনিটে S3-তে Oplog Continuous Backup ও PITR চালু করা
             +---> ৬. জিরো-ডাউনটাইম রোলিং ভার্সন আপগ্রেড পরিচালনা করা
```

---

## ১৮. সমস্যা সমাধান ও ট্রাবলশুটিং (Troubleshooting & FAQs)

### ১. `UNREACHABLE! Permission denied (publickey)`
- **কারণ:** সার্ভারে পাবলিক কী ম্যাচ করছে না অথবা সঠিক ইউজারনেম দেওয়া হয়নি।
- **সমাধান:** 
  1. `inventory.ini`-তে `ansible_user` চেক করুন (`ubuntu` নাকি `root` নাকি অন্য কিছু)।
  2. টার্মিনালে সরাসরি পরীক্ষা করুন:
     ```bash
     ssh -i ~/.ssh/termius_key ubuntu@YOUR_IP
     ```

### ২. `Permissions 0644 for '~/.ssh/termius_key' are too open`
- **কারণ:** প্রাইভেট কী ফাইলটি অন্যান্য ব্যবহারকারীদের পড়ার অনুমতি দেওয়া আছে।
- **সমাধান:**
  ```bash
  chmod 600 ~/.ssh/termius_key
  ```

### ৩. `Failed to find required executable: python`
- **কারণ:** টার্গেট লিনাক্স সার্ভারে Python 3 নেই।
- **সমাধান:** সার্ভারে একবার SSH করে রান করুন:
  ```bash
  sudo apt update && sudo apt install -y python3
  ```

### ৪. `Missing sudo password / Incorrect sudo password`
- **কারণ:** সার্ভারে কাজ করার জন্য `become: true` দেওয়া হয়েছে কিন্তু ইউজারটির পাসওয়ার্ডহীন sudo প্রিভিলেজ নেই।
- **সমাধান:** প্লেবুক চালানোর সময় `-K` (বড় হাতের K) ফ্ল্যাগ দিন:
  ```bash
  ansible-playbook -i inventory.ini playbooks/site.yml -K
  ```

### ৫. `Host key verification failed`
- **কারণ:** নতুন সার্ভারের ফিঙ্গারপ্রিন্ট পরিচিত নয়।
- **সমাধান:** `ansible.cfg` ফাইলে `host_key_checking = False` নিশ্চিত করুন অথবা `ansible_ssh_common_args='-o StrictHostKeyChecking=no'` ব্যবহার করুন।
