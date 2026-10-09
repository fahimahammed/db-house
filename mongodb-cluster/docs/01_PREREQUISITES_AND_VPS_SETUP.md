# 01. Prerequisites & VPS Setup Guide

এই গাইডে আলোচনা করা হয়েছে কীভাবে ৩টি ভিন্ন ভিন্ন VPS প্রস্তুত করবেন এবং প্রতিটি VPS-এর জন্য আলাদা আলাদা SSH Private Key দিয়ে Ansible Inventory কনফিগার করবেন।

---

## ১. VPS রিকোয়ারমেন্টস

| সার্ভার রোল | হোস্টনেম | সাজেস্টেড স্পেসিফিকেশন | ওএস (OS) |
| :--- | :--- | :--- | :--- |
| **Node 1 (Primary)** | `mongo-01` | 2+ vCPU, 4GB+ RAM, 20GB+ SSD | Ubuntu 22.04 LTS / 24.04 LTS |
| **Node 2 (Secondary 1)** | `mongo-02` | 2+ vCPU, 4GB+ RAM, 20GB+ SSD | Ubuntu 22.04 LTS / 24.04 LTS |
| **Node 3 (Secondary 2)** | `mongo-03` | 2+ vCPU, 4GB+ RAM, 20GB+ SSD | Ubuntu 22.04 LTS / 24.04 LTS |

---

## ২. ভিন্ন ভিন্ন SSH Private Key কনফিগারেশন

যেহেতু আপনার ৩টি VPS-এর জন্য ৩টি ভিন্ন প্রাইভেট কি (Private Key) রয়েছে, তাই Ansible-এর প্রতিটা হোস্টের জন্য সরাসরি `ansible_ssh_private_key_file` প্যারামিটার ডিফাইন করা হয়েছে।

### কি ফাইল পারমিশন নিশ্চিত করুন:
আপনার লোকাল মেশিনে SSH Key গুলোর পারমিশন অবশ্যই `0600` বা `0400` হতে হবে:
```bash
chmod 600 ~/.ssh/vps1_private_key.pem
chmod 600 ~/.ssh/vps2_private_key.pem
chmod 600 ~/.ssh/vps3_private_key.pem
```

---

## ৩. `inventory/hosts.ini` সেটআপ

ফাইলটি ওপেন করে আপনার বাস্তব VPS-এর IP, ইউজারনেম এবং প্রাইভেট কি-এর সঠিক পাথ দিন:

```ini
[mongodb_primary]
mongo-01 ansible_host=203.0.113.10 ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/vps1_private_key.pem mongo_member_id=0 mongo_priority=2 mongo_votes=1

[mongodb_secondary]
mongo-02 ansible_host=203.0.113.11 ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/vps2_private_key.pem mongo_member_id=1 mongo_priority=1 mongo_votes=1
mongo-03 ansible_host=203.0.113.12 ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/vps3_private_key.pem mongo_member_id=2 mongo_priority=1 mongo_votes=1

[mongodb_cluster:children]
mongodb_primary
mongodb_secondary
```

> **টিপস:** 
> - যদি আপনার VPS-এর ইউজার `root` হয়, তবে `ansible_user=root` লিখবেন।
> - `mongo_priority=2` দেওয়া হয়েছে Node-1 এ, যাতে ক্লাস্টার স্টার্ট হলে এটিই সর্বদা অগ্রাধিকার ভিত্তিতে **PRIMARY** নির্বাচিত হয়।

---

## ৪. ফায়ারওয়াল ও নেটওয়ার্ক পোর্ট রিকোয়ারমেন্টস

৩টি VPS-কে পরস্পরের সাথে যুক্ত হতে হবে। নিচের পোর্টগুলো উন্মুক্ত রাখুন:
1. **Port 22 (SSH):** Ansible কন্ট্রোলার থেকে ৩টি VPS-এ কানেক্ট করার জন্য।
2. **Port 27017 (MongoDB):** ৩টি নোডের পারস্পরিক ও ক্লায়েন্ট কমিউনিকেশনের জন্য।

VPS-এ UFW ফায়ারওয়াল থাকলে এলাউ করার কমান্ড:
```bash
sudo ufw allow 22/tcp
sudo ufw allow 27017/tcp
sudo ufw reload
```

---

## ৫. Ansible পিং টেস্ট (Connectivity Verification)

সবগুলো VPS ঠিকঠাক কানেক্ট হচ্ছে কি না তা ভেরিফাই করতে রান করুন:

```bash
cd ansible/mongodb-cluster
ansible mongodb_cluster -m ping
```

যদি সব নোডে `SUCCESS` রিটার্ন করে, তবে পরিবেশ পরবর্তী ধাপের জন্য সম্পূর্ণ প্রস্তুত!

