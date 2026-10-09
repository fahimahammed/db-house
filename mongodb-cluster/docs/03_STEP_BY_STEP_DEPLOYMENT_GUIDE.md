# 03. Step-by-Step Deployment Guide

এই গাইডে দেখানো হয়েছে কীভাবে এক এক ধাপ করে সম্পূর্ণ ক্লাস্টারটি ডেপ্লয় করবেন।

---

## ধাপ ১: ডিরেক্টরিতে প্রবেশ ও ইনভেন্টরি এডিট

```bash
cd /Users/fahimahammedfiroz/Projects/db-house/ansible/mongodb-cluster
```

`inventory/hosts.ini` ফাইলটি ওপেন করে আপনার ৩টি VPS-এর আইপি এবং ভিন্ন ভিন্ন SSH প্রাইভেট কি-এর লোকেশন বসান:

```ini
[mongodb_primary]
mongo-01 ansible_host=IP_OF_VPS1 ansible_user=ubuntu ansible_ssh_private_key_file=/path/to/key1.pem mongo_member_id=0 mongo_priority=2 mongo_votes=1

[mongodb_secondary]
mongo-02 ansible_host=IP_OF_VPS2 ansible_user=ubuntu ansible_ssh_private_key_file=/path/to/key2.pem mongo_member_id=1 mongo_priority=1 mongo_votes=1
mongo-03 ansible_host=IP_OF_VPS3 ansible_user=ubuntu ansible_ssh_private_key_file=/path/to/key3.pem mongo_member_id=2 mongo_priority=1 mongo_votes=1
```

---

## ধাপ ২: কানেক্টিভিটি টেস্ট

```bash
ansible mongodb_cluster -m ping
```
আউটপুটে প্রতিটা হোস্টের জন্য `"ping": "pong"` আসলে নিশ্চিত হবেন যে SSH কানেকশন কাজ করছে।

---

## ধাপ ৩: সিস্টেম প্রিপারেশন ও কার্নেল টিউনিং (Phase 1)

MongoDB-এর পারফরম্যান্স এবং স্থায়িত্বের জন্য OS কার্নেল টিউন করা, Transparent Huge Pages (THP) ডিসেবল করা এবং রিসোর্স লিমিট বাড়ানো জরুরি।

```bash
ansible-playbook playbooks/01_system_prep.yml
```

**এই প্লেবুক যা যা সম্পন্ন করে:**
- Swappiness কমিয়ে ১ করা এবং নেটওয়ার্ক বাফার বড় করা (`/etc/sysctl.d/99-mongodb.conf`)।
- ফাইল ডেসক্রিপ্টর সীমা ১০০,০০০ পর্যন্ত উন্নীত করা।
- `disable-thp.service` সিস্টেমড সার্ভিস তৈরি ও চালু করা।
- সঠিক টাইম সিঙ্ক রাখার জন্য `chrony` ইন্সটল ও চালু করা।

---

## ধাপ ৪: MongoDB প্যাকেজ ইন্সটলেশন (Phase 2)

```bash
ansible-playbook playbooks/02_install_mongodb.yml
```

**এই প্লেবুক যা যা সম্পন্ন করে:**
- MongoDB 7.0-এর অফিশিয়াল GPG কি ও Apt রিপোজিটরি যুক্ত করে।
- `mongodb-org`, `mongodb-mongosh` ইত্যাদি প্যাকেজ নির্দিষ্ট ভার্সনে ইন্সটল করে।
- প্যাকেজগুলোকে `apt-mark hold` করে পিন করে রাখে যাতে ভুলবশত আপগ্রেড না হয়ে যায়।

---

## ধাপ ৫: কনফিগারেশন ও ক্লাস্টার কি-ফাইল ডিস্ট্রিবিউশন (Phase 3)

```bash
ansible-playbook playbooks/03_configure_mongodb.yml
```

**এই প্লেবুক যা যা সম্পন্ন করে:**
- লোকাল কন্ট্রোলারে 1024-byte উচ্চ নিরাপত্তার সিমেট্রিক কি-ফাইল তৈরি করে।
- এই কি-ফাইলটি প্রতিটি VPS-এর `/etc/mongodb/mongo-keyfile` লোকেশনে পারমিশন `0400` দিয়ে স্থাপন করে।
- প্রোডাকশন রেডি `mongod.conf` কনফিগার করে সার্ভিস রিস্টার্ট করে।

---

## ধাপ ৬: রেপ্লিকাসেট ইনিশিয়ালাইজেশন ও ইউজার তৈরি (Phase 4)

```bash
ansible-playbook playbooks/04_init_replicaset.yml
```

**এই প্লেবুক যা যা সম্পন্ন করে:**
- `mongo-01`-এ `rs.initiate()` রান করে।
- রুট ও ক্লাস্টার অ্যাডমিন ইউজার `clusterAdmin` তৈরি করে।
- অ্যাপ্লিকেশনের জন্য ইউজার `appUser` তৈরি করে `ecommerce_db` ডাটাবেজে।
- `mongo-02` এবং `mongo-03`-কে স্বয়ংক্রিয়ভাবে রেপ্লিকাসেটের সেকেন্ডারি মেম্বার হিসেবে অ্যাড করে।
- শেষে পুরো ক্লাস্টারের স্ট্যাটাস স্ক্রিনে প্রিন্ট করে।

---

## এক ক্লিকে সম্পূর্ণ ক্লাস্টার ডেপ্লয় (Master Orchestration)

আপনি যদি সবগুলো ধাপ আলাদা করে না চালিয়ে একবারে চালাতে চান:

```bash
ansible-playbook playbooks/site.yml
```
এটি ক্রমান্বয়ে ০১ থেকে ০৪ প্লেবুকগুলো নির্বাহ করবে।

