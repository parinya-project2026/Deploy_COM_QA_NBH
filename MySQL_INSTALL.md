# คู่มือติดตั้ง MySQL สำหรับระบบ QA Hospital

เอกสารนี้แนะนำวิธีการติดตั้งและตั้งค่า MySQL สำหรับใช้งานกับระบบ QA Hospital

---

## 1. ดาวน์โหลด MySQL

### Windows

1. ไปที่ https://dev.mysql.com/downloads/installer/
2. ดาวน์โหลด **MySQL Installer for Windows**
3. เลือก **mysql-installer-community** (ขนาดใหญ่กว่า มีทุกอย่างครบ)

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install mysql-server mysql-client
```

### Linux (CentOS/RHEL)

```bash
sudo yum install mysql-server mysql-client
# หรือ
sudo dnf install mysql-server mysql-client
```

---

## 2. ติดตั้ง MySQL (Windows)

### ขั้นตอนการติดตั้ง

1. รัน MySQL Installer
2. เลือก **Custom** เพื่อเลือก components ที่ต้องการ
3. เลือกติดตั้ง:
   - MySQL Server 8.0.x
   - MySQL Workbench (GUI tool - แนะนำ)
   - Connector/J (ถ้าต้องการ)
4. คลิก **Next** และทำตามขั้นตอน

### ตั้งค่าระหว่างติดตั้ง

| การตั้งค่า | ค่าที่แนะนำ |
|-----------|------------|
| Config Type | Development Computer หรือ Server Computer |
| Port | 3306 (default) |
| Root Password | ตั้งรหัสผ่านที่ปลอดภัย |
| Windows Service | เลือก Configure MySQL Server as a Windows Service |
| Service Name | MySQL80 (default) |

---

## 3. ตั้งค่า MySQL หลังติดตั้ง

### 3.1 เข้าสู่ระบบด้วย root

**Windows (Command Prompt หรือ PowerShell)**:
```bash
mysql -u root -p
# กรอกรหัสผ่าน root ที่ตั้งไว้
```

**Linux**:
```bash
sudo mysql -u root -p
```

### 3.2 สร้าง Database สำหรับระบบ QA

```sql
-- สร้าง database พร้อม charset ที่รองรับภาษาไทย
CREATE DATABASE qa_hospital 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- ตรวจสอบว่าสร้างสำเร็จ
SHOW DATABASES;
```

### 3.3 สร้าง User สำหรับ Application

```sql
-- สร้าง user (เปลี่ยน YOUR_SECURE_PASSWORD เป็นรหัสผ่านจริง)
CREATE USER 'qa_user'@'localhost' IDENTIFIED BY 'YOUR_SECURE_PASSWORD';

-- ให้สิทธิ์เฉพาะ database qa_hospital
GRANT ALL PRIVILEGES ON qa_hospital.* TO 'qa_user'@'localhost';

-- อัพเดทสิทธิ์
FLUSH PRIVILEGES;

-- ตรวจสอบ user
SELECT User, Host FROM mysql.user WHERE User = 'qa_user';
```

### 3.4 ทดสอบการเชื่อมต่อ

```bash
# ออกจาก root ก่อน
exit

# ทดสอบเข้าด้วย user ที่สร้าง
mysql -u qa_user -p qa_hospital
# กรอกรหัสผ่านที่ตั้งไว้

# ถ้าเข้าได้ = สำเร็จ!
```

---

## 4. การตั้งค่าเพิ่มเติม (Optional)

### 4.1 เปิดให้เข้าถึงจาก Remote (ถ้าต้องการ)

แก้ไขไฟล์ my.cnf หรือ my.ini:

**Windows**: `C:\ProgramData\MySQL\MySQL Server 8.0\my.ini`
**Linux**: `/etc/mysql/mysql.conf.d/mysqld.cnf`

```ini
[mysqld]
bind-address = 0.0.0.0
```

สร้าง user สำหรับ remote access:
```sql
CREATE USER 'qa_user'@'%' IDENTIFIED BY 'YOUR_SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON qa_hospital.* TO 'qa_user'@'%';
FLUSH PRIVILEGES;
```

Restart MySQL:
```bash
# Windows
net stop MySQL80
net start MySQL80

# Linux
sudo systemctl restart mysql
```

### 4.2 ตั้งค่า Timezone

```sql
SET GLOBAL time_zone = '+07:00';
```

หรือเพิ่มใน my.cnf/my.ini:
```ini
[mysqld]
default-time-zone = '+07:00'
```

---

## 5. Connection String สำหรับ Application

หลังจากติดตั้งและตั้งค่าเสร็จ ให้ใช้ connection string นี้ในไฟล์ `.env`:

```
DATABASE_URL="mysql://qa_user:YOUR_SECURE_PASSWORD@localhost:3306/qa_hospital"
```

### ตัวอย่างเต็ม

```
DATABASE_URL="mysql://qa_user:MyStr0ngP@ssw0rd@localhost:3306/qa_hospital"
```

---

## 6. คำสั่งที่ใช้บ่อย

### จัดการ Service

**Windows**:
```bash
# Start
net start MySQL80

# Stop
net stop MySQL80

# Restart
net stop MySQL80 && net start MySQL80
```

**Linux**:
```bash
# Start
sudo systemctl start mysql

# Stop
sudo systemctl stop mysql

# Restart
sudo systemctl restart mysql

# ดู Status
sudo systemctl status mysql
```

### Backup และ Restore

```bash
# Backup
mysqldump -u qa_user -p qa_hospital > backup_qa_hospital.sql

# Restore
mysql -u qa_user -p qa_hospital < backup_qa_hospital.sql
```

---

## 7. Troubleshooting

### ปัญหา: Access denied for user

**สาเหตุ**: รหัสผ่านไม่ถูกต้อง หรือ user ไม่มีสิทธิ์

**แก้ไข**:
```sql
-- เข้าด้วย root
mysql -u root -p

-- ตรวจสอบ user
SELECT User, Host FROM mysql.user;

-- รีเซ็ตรหัสผ่าน
ALTER USER 'qa_user'@'localhost' IDENTIFIED BY 'NEW_PASSWORD';
FLUSH PRIVILEGES;
```

### ปัญหา: Can't connect to MySQL server

**สาเหตุ**: MySQL service ไม่ได้รัน

**แก้ไข**:
```bash
# Windows
net start MySQL80

# Linux
sudo systemctl start mysql
```

### ปัญหา: Unknown database

**สาเหตุ**: Database ยังไม่ได้สร้าง

**แก้ไข**:
```sql
CREATE DATABASE qa_hospital CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 8. ข้อมูลการติดตั้งที่แนะนำ

| รายการ | ค่าที่แนะนำ |
|--------|------------|
| MySQL Version | 8.0.x LTS |
| Character Set | utf8mb4 |
| Collation | utf8mb4_unicode_ci |
| Port | 3306 |
| Database Name | qa_hospital |
| Username | qa_user |

---

*เอกสารนี้สร้างเมื่อ: มกราคม 2026*
