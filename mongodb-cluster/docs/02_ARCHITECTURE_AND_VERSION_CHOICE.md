# 02. Architecture & MongoDB Version Choice

## ১. ক্লাস্টার আর্কিটেকচার ওভারভিউ

প্রোডাকশন গ্রেড মঙ্গোডিবি ক্লাস্টারে হাই-অ্যাভেইলেবিলিটি (High Availability) নিশ্চিত করার জন্য সর্বনিম্ন ৩টি নোড প্রয়োজন হয়।

```mermaid
graph TD
    subgraph Client ["Application Traffic"]
        App["App Server / Microservice"]
    end

    subgraph Cluster ["MongoDB 3-Node Replica Set (rs-prod-01)"]
        Node1["<b>mongo-01</b><br/>Role: PRIMARY<br/>Priority: 2<br/>Reads & Writes"]
        Node2["<b>mongo-02</b><br/>Role: SECONDARY<br/>Priority: 1<br/>Read Replica (Oplog Sync)"]
        Node3["<b>mongo-03</b><br/>Role: SECONDARY<br/>Priority: 1<br/>Read Replica (Voting Member)"]

        Node1 <-->|Heartbeat (every 2s)| Node2
        Node2 <-->|Heartbeat (every 2s)| Node3
        Node1 <-->|Heartbeat (every 2s)| Node3

        Node1 -.->|Continuous Oplog Streaming| Node2
        Node1 -.->|Continuous Oplog Streaming| Node3
    end

    App -->|Primary Write/Read| Node1
    App -.->|Read Preference = secondaryPreferred| Node2
    App -.->|Read Preference = secondaryPreferred| Node3
```

---

## ২. কেন ৩টি নোড আবশ্যক? (Quorum & Split-Brain Prevention)

MongoDB Raft-লাইক কনসেনসাস প্রোটোকল ব্যবহার করে। ক্লাস্টারে লিডার (Primary) নির্বাচন করার জন্য **Majority Quorum** পূরণ হতে হয়:

$$\text{Majority} = \left\lfloor \frac{N}{2} \right\rfloor + 1$$

৩টি নোডের ক্ষেত্রে:
$$\text{Majority} = \left\lfloor \frac{3}{2} \right\rfloor + 1 = 1 + 1 = 2$$

- যদি ১টি নোড সম্পূর্ণ ক্র্যাশ বা নেটওয়ার্ক বিচ্ছিন্ন হয়, তবে বাকি ২টি নোড মেজরিটি (২ $\ge$ ২) পূরণ করে এবং সাথে সাথে নতুন একজন Primary ইলেক্ট করে নিতে পারে।
- ২-নোডের আর্কিটেকচারে ১টি নষ্ট হলে বাকি থাকে ১টি, যা মেজরিটি গঠন করতে পারে না। ফলে ডাটাবেজ ডাউন হয়ে যায়। তাই সর্বনিম্ন বিজোড় সংখ্যা (Odd count = 3) ব্যবহার করা হয়।

---

## ৩. কেন MongoDB 7.0 (Previous Stable Version) বেছে নেওয়া হলো?

ব্যবহারকারীর রিকোয়ারমেন্ট অনুযায়ী পূর্ববর্তী একটি স্টেবল ভার্সন ব্যবহার করা হয়েছে:
- **বর্তমান লেটেস্ট:** MongoDB 8.0
- **পূর্ববর্তী এন্টারপ্রাইজ স্টেবল:** MongoDB 7.0 (বা 6.0)

### সুবিধার দিকসমূহ:
1. **Battle-Tested Stability:** লক্ষ লক্ষ প্রোডাকশন সার্ভারে পরীক্ষিত ও বাগ-ফিক্সড।
2. **ভবিষ্যতের আপগ্রেড টেস্টিং:** পরবর্তীতে প্রোডাকশন আর্কিটেকচারের সেকশন ৯ অনুযায়ী জিরো-ডাউনটাইম রোলিং আপগ্রেড (Rolling Upgrade from 7.0 $\rightarrow$ 8.0) ড্রিল টেস্ট করা সম্ভব।
3. **কনফিগারেশন স্বাধীনতা:** `inventory/group_vars/all.yml`-এ `mongo_version: "7.0"` কে সহজেই পরিবর্তন করে `"6.0"` করা যায়।

---

## ৪. ইন্টারনাল মেকানিজম

1. **WiredTiger Storage Engine:**
   - ডেটা কম্প্রেশন (Snappy)।
   - মেমোরি ম্যানেজমেন্টের জন্য ক্যাশ সাইজ লিমিটেশন (Default: 1GB per node in lab)।
2. **Shared Cluster Keyfile (`/etc/mongodb/mongo-keyfile`):**
   - ৩টি VPS একে অপরের সাথে সুরক্ষিতভাবে কথা বলার জন্য 1024-byte সিমেট্রিক কি ব্যবহার করে। বহিরাগত কেউ এই কি ছাড়া রেপ্লিকাসেটে যুক্ত হতে পারে না।
3. **Oplog (`local.oplog.rs`):**
   - একটি ক্যাপড কালেকশন (Capped collection) যা প্রাইমারিতে ঘটা প্রতিটি রাইট অপারেশন ক্রম অনুসারে রেকর্ড রাখে।

