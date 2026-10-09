# 🚀 Production MongoDB Replica Set Cluster (Ansible Automation)

MongoDB Production Architecture ব্লুপ্রিন্ট অনুযায়ী নির্মিত এই ল্যাব প্রজেক্টের মাধ্যমে ৩টি ভিন্ন ভিন্ন VPS-এ স্বয়ংক্রিয়ভাবে একটি হাই-অ্যাভেইলেবিলিটি (High-Availability) সম্পন্ন MongoDB রেপ্লিকাসেট ক্লাস্টার তৈরি করা যায়।

---

## 📌 মূল ফিচারসমূহ

1. **৩টি নোডের রেপ্লিকাসেট (Topology):**
   - ১টি **Primary** নোড (Read & Write)
   - ২টি **Secondary** নোড (Replication & Voting Quorum)
2. **ভিন্ন ভিন্ন SSH Private Key সাপোর্ট:**
   - প্রতিটি VPS-এর নিজস্ব আলাদা SSH প্রাইভেট কি (`ansible_ssh_private_key_file`) ইনভেন্টরিতে সরাসরি কনফিগার করা যায়।
3. **পূর্ববর্তী স্টেবল ভার্সন ব্যবহার:**
   - ডিফল্টভাবে **MongoDB 7.0** ব্যবহার করা হয়েছে (যা লেটেস্ট ৮.০ এর পূর্ববর্তী এন্টারপ্রাইজ স্টেবল ভার্সন; চাইলে ৬.০ ও ব্যবহার করা যায়)।
4. **ডেটা সিঙ্ক ও ইনিশিয়াল সিঙ্ক পরীক্ষা:**
   - প্রাইমারিতে পূর্ব থেকে ডেটা থাকলে নতুন রেপ্লিকা কীভাবে স্বয়ংক্রিয়ভাবে পুরো ডেটা সিঙ্ক করে (`STARTUP2` $\rightarrow$ `RECOVERING` $\rightarrow$ `SECONDARY`) তা প্রমাণ ও টেস্ট করার জন্য বিশেষ প্লেবুক ও স্ক্রিপ্ট অন্তর্ভুক্ত।
5. **প্রোডাকশন-গ্রেড হার্ডেনিং:**
   - Swappiness 1, Somaxconn 65535, File Descriptors 100,000, Transparent Huge Pages (THP) ডিসেবল, 1024-byte সিমেট্রিক ক্লাস্টার Keyfile ও SCRAM-SHA-256 অথেনটিকেশন।

---

## 📂 ডিরেক্টরি কাঠামো (Directory Structure)

```text
ansible/mongodb-cluster/
├── ansible.cfg                          # Ansible কনফিগারেশন ও অপ্টিমাইজেশন
├── inventory/
│   ├── hosts.ini                        # ৩টি VPS-এর আলাদা আলাদা SSH Private Key ও IP
│   └── group_vars/
│       └── all.yml                      # MongoDB ভার্সন (7.0), পোর্ট, ও গ্লোবাল ভেরিয়েবল
├── playbooks/
│   ├── 01_system_prep.yml               # কার্নেল টিউনিং, THP সার্ভিস, লিমিট কনফিগ
│   ├── 02_install_mongodb.yml           # MongoDB 7.0 রিপো ও প্যাকেজ পিনিং
│   ├── 03_configure_mongodb.yml         # mongod.conf ও 1024-byte Keyfile ডিস্ট্রিবিউশন
│   ├── 04_init_replicaset.yml           # রেপ্লিকাসেট ইনিশিয়েট ও সেকেন্ডারি যুক্তকরণ
│   ├── 05_test_replication_sync.yml     # রিয়েল-টাইম ডেটা রেপ্লিকেশন টেস্ট
│   ├── 06_test_new_member_initial_sync.yml # প্রি-এক্সিস্টিং ডেটা ও ইনিশিয়াল সিঙ্ক টেস্ট
│   └── site.yml                         # মাস্টার প্লেবুক (০১ থেকে ০৪ এক ক্লিকে রান)
├── templates/
│   └── mongod.conf.j2                   # প্রোডাকশন টিউনড mongod কনফিগারেশন টেমপ্লেট
├── scripts/
│   ├── verify_cluster.sh                # ক্লাস্টার হেলথ ও ওপলগ উইন্ডো চেকার
│   ├── test_data_sync.sh                # ডেটা রাইট ও রিড ভেরিফিকেশন স্ক্রিপ্ট
│   └── simulate_initial_sync.sh         # ইনিশিয়াল সিঙ্ক লাইভ সিমুলেশন স্ক্রিপ্ট
└── docs/
    ├── 01_PREREQUISITES_AND_VPS_SETUP.md # VPS প্রস্তুতকরণ ও প্রাইভেট কি কনফিগারেশন
    ├── 02_ARCHITECTURE_AND_VERSION_CHOICE.md # কেন ৩ নোড এবং MongoDB 7.0
    ├── 03_STEP_BY_STEP_DEPLOYMENT_GUIDE.md # এক এক ধাপ করে রান করার পূর্ণাঙ্গ গাইড
    ├── 04_DATA_REPLICATION_AND_INITIAL_SYNC_DEEP_DIVE.md # ডেটা সিঙ্ক ও ইনিশিয়াল সিঙ্কের গভীর ব্যাখ্যা
    └── 05_TESTING_AND_VERIFICATION_PLAYBOOK.md # হাতে-কলমে টেস্ট করার কমান্ডসমূহ
```

---

## ⚡ কুইক স্টার্ট (Quick Start Guide)

### ১. ইনভেন্টরি আপডেট করুন:
`inventory/hosts.ini` ফাইলটি ওপেন করে আপনার ৩টি VPS-এর IP এবং প্রাইভেট কি-এর সঠিক পাথ দিন:
```ini
[mongodb_primary]
mongo-01 ansible_host=1.2.3.4 ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/vps1.pem mongo_member_id=0 mongo_priority=2 mongo_votes=1

[mongodb_secondary]
mongo-02 ansible_host=1.2.3.5 ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/vps2.pem mongo_member_id=1 mongo_priority=1 mongo_votes=1
mongo-03 ansible_host=1.2.3.6 ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/vps3.pem mongo_member_id=2 mongo_priority=1 mongo_votes=1
```

### ২. কানেক্টিভিটি টেস্ট করুন:
```bash
ansible mongodb_cluster -m ping
```

### ৩. সম্পূর্ণ ক্লাস্টার ডেপ্লয় করুন:
```bash
ansible-playbook playbooks/site.yml
```
*(অথবা এক এক ধাপ করে দেখতে চাইলে `playbooks/01_system_prep.yml` থেকে `04_init_replicaset.yml` রান করুন।)*

### ৪. লাইভ ডেটা সিঙ্ক ও প্রি-এক্সিস্টিং ডেটা টেস্ট করুন:
```bash
# রিয়েল-টাইম সিঙ্ক টেস্ট
ansible-playbook playbooks/05_test_replication_sync.yml

# মাস্টার ডিবিতে আগে থেকে ডেটা থাকলে কীভাবে সিঙ্ক হয় তা টেস্ট
ansible-playbook playbooks/06_test_new_member_initial_sync.yml
```

---

## 📚 বিস্তারিত ডকুমেন্টেশন লিংক

- [০১. Prerequisites ও ভিন্ন ভিন্ন VPS SSH কি সেটআপ](docs/01_PREREQUISITES_AND_VPS_SETUP.md)
- [০২. আর্কিটেকচার ও MongoDB 7.0 ভার্সন নির্বাচন](docs/02_ARCHITECTURE_AND_VERSION_CHOICE.md)
- [০৩. স্টেপ-বাই-স্টেপ ডেপ্লয়মেন্ট গাইড](docs/03_STEP_BY_STEP_DEPLOYMENT_GUIDE.md)
- [০৪. ডেটা রেপ্লিকেশন ও ইনিশিয়াল সিঙ্কের অভ্যন্তরীণ মেকানিজম (Deep Dive)](docs/04_DATA_REPLICATION_AND_INITIAL_SYNC_DEEP_DIVE.md)
- [০৫. টেস্টিং, ভেরিফিকেশন ও ফেইলওভার প্লেবুক](docs/05_TESTING_AND_VERIFICATION_PLAYBOOK.md)

