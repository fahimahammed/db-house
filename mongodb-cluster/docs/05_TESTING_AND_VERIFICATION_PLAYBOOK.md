# 05. Testing & Verification Playbook

এই গাইডে হাতে-কলমে ডেটা সিঙ্ক্রোনাইজেশন এবং ইনিশিয়াল সিঙ্ক পরীক্ষা করার সমস্ত পদ্ধতি বর্ণিত হলো।

---

## ১. টেস্ট কেস ১: রিয়েল-টাইম রেপ্লিকেশন টেস্ট (স্বয়ংক্রিয় প্লেবুক)

প্রাইমারিতে নতুন ডেটা ইনসার্ট করার সাথে সাথে সেকেন্ডারি নোডগুলোতে তা তাৎক্ষণিক সিঙ্ক হয় কি না তা যাচাই করার প্লেবুক:

```bash
ansible-playbook playbooks/05_test_replication_sync.yml
```

**যা যা ঘটে:**
1. `mongo-01` (Primary)-এ ৫০টি ইউনিক টেস্ট ডকুমেন্ট ইনসার্ট করে।
2. ৩ সেকেন্ড বিরতি দিয়ে `mongo-02` এবং `mongo-03`-এ সরাসরি কোয়েরি চালায়।
3. যদি উভয় সেকেন্ডারিতে ঠিক ৫০টি ডকুমেন্টের হুবহু মিল পাওয়া যায়, তবে সবুজ অক্ষরে `SYNC VERIFIED` দেখাবে।
4. রেপ্লিকেশন ল্যাগ (Replication Lag) সেকেন্ডে আউটপুট প্রিন্ট করবে।

---

## ২. টেস্ট কেস ২: প্রি-এক্সিস্টিং ডেটা ও ইনিশিয়াল সিঙ্ক টেস্ট

**প্রশ্ন:** মাস্টার ডিবিতে আগে থেকেই ডেটা থাকলে নতুন রেপ্লিকা তৈরি করার সাথে সাথে কীভাবে সিঙ্ক হয়?

এটি সরাসরি টেস্ট করার জন্য নিচের প্লেবুকটি রান করুন:

```bash
ansible-playbook playbooks/06_test_new_member_initial_sync.yml
```

**যা যা ঘটে:**
1. এটি `mongo-01`-এ ৫,০০০টি প্রি-এক্সিস্টিং রেকর্ড (`db.legacy_archive`) ইনসার্ট করে।
2. সেকেন্ডারি নোডগুলোতে নজর রাখে এবং দেখে যে ৫,০০০টি রেকর্ডই ক্লোন হয়ে সেকেন্ডারিতে এসেছে কি না।
3. সেকেন্ডারি সার্ভারের `/var/log/mongodb/mongod.log` থেকে Initial Sync এর লাইভ লগ ট্রেস প্রদর্শন করে (`STARTUP2` $\rightarrow$ `RECOVERING` $\rightarrow$ `SECONDARY`)।

---

## ৩. টেস্ট কেস ৩: স্ক্রিপ্ট দিয়ে হ্যান্ডস-অন ভেরিফিকেশন

### ক. ক্লাস্টার হেলথ ও ওপলগ উইন্ডো চেক:
```bash
./scripts/verify_cluster.sh <PRIMARY_IP> 27017 clusterAdmin "ClusterAdminSecret2026!"
```

### খ. লাইভ ডেটা রাইট ও রিড টেস্ট:
```bash
./scripts/test_data_sync.sh <PRIMARY_IP> <SECONDARY1_IP> <SECONDARY2_IP> 27017
```

### গ. ইনিশিয়াল সিঙ্ক সিমুলেশন স্ক্রিপ্ট:
```bash
./scripts/simulate_initial_sync.sh <PRIMARY_IP> <NEW_NODE_IP> 27017
```

---

## ৪. টেস্ট কেস ৪: হাই-অ্যাভেইলেবিলিটি ও অটোমেটিক ফেইলওভার টেস্ট (Chaos Test)

MongoDB-র স্বয়ংক্রিয় লিডার নির্বাচন ও উচ্চ প্রাপ্যতা পরীক্ষা করুন:

### ধাপ ১: ক্লাস্টারের বর্তমান প্রাইমারি আইডেন্টিফাই করুন
```bash
mongosh --host <PRIMARY_IP>:27017 -u clusterAdmin -p "ClusterAdminSecret2026!" --authenticationDatabase admin --eval "rs.isMaster().primary"
```

### ধাপ ২: প্রাইমারি VPS-এ SSH করে mongod সার্ভিস বন্ধ করে দিন
```bash
ssh -i ~/.ssh/vps1_private_key.pem ubuntu@<PRIMARY_IP>
sudo systemctl stop mongod
```

### ধাপ ৩: যেকোনো সেকেন্ডারি নোডে গিয়ে স্ট্যাটাস চেক করুন
```bash
ssh -i ~/.ssh/vps2_private_key.pem ubuntu@<SECONDARY1_IP>
mongosh --eval "rs.status().members.forEach(m => print(m.name + ' -> ' + m.stateStr))"
```
**ফলাফল:** আপনি দেখতে পাবেন ২ থেকে ৩ সেকেন্ডের মধ্যে বাকি ২টি সেকেন্ডারির মধ্য থেকে একটি নোড স্বয়ংক্রিয়ভাবে **PRIMARY** নির্বাচিত হয়ে গেছে!

### ধাপ ৪: পুরোনো প্রাইমারিকে আবার চালু করুন
```bash
ssh -i ~/.ssh/vps1_private_key.pem ubuntu@<PRIMARY_IP>
sudo systemctl start mongod
```
**ফলাফল:** পুরোনো প্রাইমারিটি চালু হয়ে দেখতে পাবে ইতিমধ্যে নতুন একজন প্রাইমারি রয়েছে। ফলে সে বিনম্রভাবে **SECONDARY** হিসেবে ক্লাস্টারে যুক্ত হয়ে মিসিং Oplog ডেটা সিঙ্ক করে নিবে।

