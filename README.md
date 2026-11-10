# AssetManagement

ระบบจัดการพัสดุและครุภัณฑ์ (Asset Management System) พัฒนาด้วย **Angular** (Frontend) และ **Node.js Express + MySQL** (Backend)

---

## 1. Database Setup (การติดตั้งฐานข้อมูล)

ฐานข้อมูลใช้ MySQL / MariaDB (เช่น ผ่าน XAMPP)

1. เปิด **XAMPP Control Panel** และกด Start ที่ **MySQL** และ **Apache**
2. ไปที่ **phpMyAdmin** (`http://localhost/phpmyadmin/`)
3. ไปที่แท็บ **Import** (นำเข้า) แล้วเลือกไฟล์:
   - **`database.sql`** (อยู่ที่โฟลเดอร์หลักของโปรเจกต์ Root directory)
   *(ไฟล์นี้มีคำสั่ง `CREATE DATABASE IF NOT EXISTS asset_management` ให้อัตโนมัติ พร้อมตารางและข้อมูลตัวอย่างครบถ้วน ไม่จำเป็นต้องสร้างฐานข้อมูลก่อน)*
4. กดปุ่ม **Import / Go** ที่ด้านล่างสุด

> หรือรันผ่าน Terminal (Command Prompt / PowerShell):
> ```bash
> mysql -u root -p < database.sql
> ```

---

## 2. Backend Setup (การเริ่มใช้งาน Backend)

1. เข้าไปที่โฟลเดอร์ `backend`:
   ```bash
   cd backend
   ```
2. ติดตั้ง dependencies:
   ```bash
   npm install
   ```
3. คัดลอกไฟล์ `.env.example` ไปเป็น `.env`:
   ```bash
   cp .env.example .env
   # หรือ copy .env.example .env บน Windows PowerShell
   ```
4. ตรวจสอบค่าการเชื่อมต่อฐานข้อมูลใน `.env` ให้ตรงกับ MySQL ในเครื่อง (เช่น DB_USER, DB_PASSWORD, DB_NAME)
5. รันเซิร์ฟเวอร์ Backend:
   ```bash
   npm run dev
   # Backend จะทำงานที่ http://localhost:4000
   ```

---

## 3. Frontend Setup (การเริ่มใช้งาน Frontend Angular)

1. อยู่ที่โฟลเดอร์ root ของโปรเจกต์ (`asset-management`):
   ```bash
   npm install
   ```
2. รัน Angular Development Server:
   ```bash
   ng serve
   # หรือ npm start
   ```
3. เปิดเบราว์เซอร์ไปที่ `http://localhost:4200/`
