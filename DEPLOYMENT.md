# คู่มือการ Deploy ระบบ QA Hospital

เอกสารนี้จัดทำสำหรับศูนย์คอมพิวเตอร์โรงพยาบาล เพื่อใช้ในการติดตั้งและ deploy ระบบ QA Hospital

---

## 1. ข้อมูลระบบ (System Overview)

| Component | Technology | Version |
|-----------|------------|---------|
| **Frontend** | Next.js (React) | 14.2.10 |
| **Backend** | Next.js API Routes | Node.js Runtime |
| **Database** | MySQL | 8.0+ |
| **ORM** | Prisma | 5.22.0 |
| **Runtime** | Node.js | 20.x LTS หรือใหม่กว่า |

---

## 2. Software ที่ต้องติดตั้งบน Server

### 2.1 Required Software

| Software | Version | หมายเหตุ |
|----------|---------|----------|
| **Node.js** | 20.x LTS หรือ 22.x LTS | https://nodejs.org/ |
| **npm** | มาพร้อม Node.js | Package manager |
| **MySQL Server** | 8.0+ | https://dev.mysql.com/downloads/ |

### 2.2 Optional (แนะนำ)

| Software | หมายเหตุ |
|----------|----------|
| **PM2** | Process manager สำหรับ Node.js (ช่วยให้ระบบ restart อัตโนมัติ) |
| **Nginx** | Reverse proxy (ถ้าต้องการใช้ port 80/443) |

---

## 3. การติดตั้ง MySQL Database

### 3.1 สร้าง Database และ User

เข้า MySQL ด้วย root user แล้วรันคำสั่ง:

```sql
-- สร้าง database
CREATE DATABASE qa_hospital CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- สร้าง user (เปลี่ยน password ตามต้องการ)
CREATE USER 'qa_user'@'localhost' IDENTIFIED BY 'YOUR_SECURE_PASSWORD';

-- ให้สิทธิ์
GRANT ALL PRIVILEGES ON qa_hospital.* TO 'qa_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## 4. การ Deploy Application

### 4.1 ขั้นตอนการติดตั้ง

```bash
# 1. Copy โฟลเดอร์โปรเจคไปยัง server
# (หรือใช้ git clone ถ้ามี repository)

# 2. เข้าไปในโฟลเดอร์โปรเจค
cd qa-qa-system

# 3. ติดตั้ง dependencies
npm install

# 4. ตั้งค่า environment variables
cp .env.example .env
# แก้ไขไฟล์ .env ตามหัวข้อ 4.2

# 5. สร้าง database schema
npx prisma migrate deploy

# 6. Build production
npm run build

# 7. Start server
npm start
```

### 4.2 ตั้งค่า Environment Variables

แก้ไขไฟล์ `.env`:

```
# MySQL Connection
DATABASE_URL="mysql://qa_user:YOUR_SECURE_PASSWORD@localhost:3306/qa_hospital"

# LINE Notification (ถ้าใช้)
# LINE_CHANNEL_ACCESS_TOKEN="your_token"

# Port (optional - default 3000)
# PORT=3000
```

---

## 5. การรันแบบ Production (แนะนำใช้ PM2)

### 5.1 ติดตั้ง PM2

```bash
npm install -g pm2
```

### 5.2 Start Application ด้วย PM2

```bash
# Start
pm2 start npm --name "qa-nbh" -- start

# ดู status
pm2 status

# ดู logs
pm2 logs qa-nbh

# Restart
pm2 restart qa-nbh

# Stop
pm2 stop qa-nbh

# ให้ PM2 start อัตโนมัติเมื่อ server reboot
pm2 startup
pm2 save
```

---

## 6. Port และ Network

| รายการ | ค่า |
|--------|-----|
| **Default Port** | 3000 |
| **URL เข้าใช้งาน** | http://server-ip:3000 |

### การเปลี่ยน Port

เพิ่มใน `.env`:
```
PORT=8080
```

### การใช้ Nginx Reverse Proxy (Optional)

ถ้าต้องการใช้ port 80:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 7. การตรวจสอบว่าระบบทำงานปกติ

1. เปิด browser ไปที่ `http://server-ip:3000`
2. ควรเห็นหน้า Login ของระบบ QA
3. ทดสอบ login และบันทึกข้อมูล

---

## 8. การ Backup Database

### Backup

```bash
mysqldump -u qa_user -p qa_hospital > backup_$(date +%Y%m%d).sql
```

### Restore

```bash
mysql -u qa_user -p qa_hospital < backup_file.sql
```

---

## 9. Troubleshooting

### ปัญหา: ไม่สามารถเชื่อมต่อ Database

- ตรวจสอบ MySQL service ว่ารันอยู่: `systemctl status mysql`
- ตรวจสอบ connection string ใน `.env`
- ตรวจสอบ user/password ถูกต้อง

### ปัญหา: Port ถูกใช้งานอยู่

- เปลี่ยน PORT ใน `.env`
- หรือหา process ที่ใช้ port: `netstat -tulpn | grep 3000`

### ปัญหา: Permission denied

- ตรวจสอบสิทธิ์ของโฟลเดอร์
- ใช้ `chmod -R 755 qa-qa-system`

---

## 10. ข้อมูลติดต่อ

หากมีปัญหาในการติดตั้ง กรุณาติดต่อผู้พัฒนาระบบ

---

*เอกสารนี้สร้างเมื่อ: มกราคม 2026*
