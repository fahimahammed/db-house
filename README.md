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

