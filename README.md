# db-house

Production-Grade Database Infrastructure & Automation Repository.

## Architectures & Blueprints

- [MongoDB Enterprise Cluster Production Architecture & Ansible Automation](file:///Users/fahimahammedfiroz/Projects/db-house/MONGODB_PRODUCTION_ARCHITECTURE.md)
  - 3-Node High-Availability Replica Set (1 Primary + 2 Secondaries)
  - Production Performance Tuning (XFS, WiredTiger, THP deactivation, Kernel Sysctl)
  - Enterprise Security (TLS 1.3, internal keyfile, SCRAM-SHA-256 RBAC, Firewall)
  - Automated Continuous Backup & Point-in-Time Recovery (PITR) to S3/MinIO
  - Zero-Downtime Rolling Version Upgrades & Feature Compatibility Version management
  - Dynamic Node Addition & Initial Data Sync
  - Observability & Monitoring (Prometheus + Grafana + PMM Control Panel)
  - Horizontal Scaling Roadmap (Replica Set to Sharded Cluster)

- [Ansible জিরো টু হিরো: বাংলা হ্যান্ডস-অন লার্নিং গাইড](file:///Users/fahimahammedfiroz/Projects/db-house/ansible/README.md)
  - নতুনদের জন্য ধাপে ধাপে Ansible শেখার কমপ্লিট বাংলা টিউটোরিয়াল
  - কোনো রিমোট সার্ভার ছাড়া লোকাল পিসিতে প্র্যাকটিস করার ৪টি রেডিমেড প্লেবুক
  - Ansible মডিউল, ভ্যারিয়েবল, লুপ, হ্যান্ডলার এবং Jinja2 টেমপ্লেট
  - MongoDB কনফিগারেশন অটোমেশন সিমুলেশন ল্যাব

---

## 🌐 রিমোট সার্ভার ম্যানেজমেন্ট ও Termius ইন্টিগ্রেশন (Remote Server Quickstart)

আপনি যদি সার্ভার ম্যানেজ করার জন্য **Termius** ব্যবহার করেন, তবে নিচের ৩টি ধাপে Ansible দিয়ে রিমোট সার্ভারে কানেক্ট করতে পারবেন:

### ১. Termius থেকে Private Key এক্সপোর্ট করুন
1. Termius অ্যাপ ওপেন করুন -> **Keychain / Vault**-এ যান।
2. আপনার সার্ভার Key-টির পাশে `...` ক্লিক করে **Export / Copy Private Key** করুন।
3. আপনার Mac টার্মিনালে সেভ করুন:
   ```bash
   mkdir -p ~/.ssh && chmod 700 ~/.ssh
   nano ~/.ssh/termius_key
   # কী পেস্ট করে Ctrl+O, Enter, Ctrl+X চেপে সেভ করুন
   chmod 600 ~/.ssh/termius_key
   ```

### ২. ইনভেন্টরি ফাইলে রিমোট সার্ভার লিংক করুন (`ansible/inventory.ini`)
```ini
[mongodb_cluster]
mongo-01 ansible_host=10.0.10.11 ansible_user=ubuntu
mongo-02 ansible_host=10.0.10.12 ansible_user=ubuntu
mongo-03 ansible_host=10.0.10.13 ansible_user=ubuntu

[mongodb_cluster:vars]
ansible_ssh_private_key_file=~/.ssh/termius_key
ansible_python_interpreter=/usr/bin/python3
ansible_ssh_common_args='-o StrictHostKeyChecking=no'
```

### ৩. রিমোট সার্ভারে এক ক্লিকে কানেকশন ও প্লেবুক টেস্ট
```bash
cd ansible

# ১. সব সার্ভারে একসাথে পিং টেস্ট:
ansible mongodb_cluster -m ping

# ২. সব সার্ভারের মেমোরি ও আপটাইম চেক:
ansible mongodb_cluster -a "uptime"

# ৩. রিমোট প্লেবুক রান করা:
ansible-playbook -i inventory.ini playbooks/site_deploy.yml
```

> বিস্তারিত রিমোট ট্রাবলশুটিং ও স্টেপ-বাই-স্টেপ গাইডের জন্য দেখুন: [ansible/README.md](file:///Users/fahimahammedfiroz/Projects/db-house/ansible/README.md#পদ্ধতি-২-রিমোট-সার্ভারে-চালানো-remote-execution-via-ssh)

