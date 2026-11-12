# ระบบจัดการพัสดุและครุภัณฑ์ (Asset Management System)

ระบบบริหารจัดการและติดตามสถานะครุภัณฑ์ พัสดุ และการยืม-คืน สำหรับหน่วยงานและมหาวิทยาลัยรามคำแหง พัฒนาด้วยสถาปัตยกรรมโมเดิร์นเว็บแอปพลิเคชันแบบแยกส่วน (Decoupled Architecture) โดยใช้ **Angular 20** (Frontend) และ **Node.js Express + MySQL/MariaDB** (Backend)

---

## 🌟 ฟีเจอร์หลักของระบบ (Key Features)

### 1. 📦 การจัดการข้อมูลครุภัณฑ์ (Asset Management)
- เพิ่ม, แก้ไข, ลบ และดูรายละเอียดข้อมูลครุภัณฑ์
- บันทึกเลขทะเบียนครุภัณฑ์, Serial Number, ยี่ห้อ, รุ่น, ปีงบประมาณ, ฝ่าย/หน่วยงาน, อาคารสถานที่ และห้องที่จัดเก็บ
- อัปโหลดและจัดการรูปภาพของครุภัณฑ์ (รองรับ JPG, PNG, WEBP, GIF พร้อมจำกัดขนาด 5 MB)
- ระบบค้นหาอัจฉริยะ (Search) ค้นหาจากชื่อครุภัณฑ์, เลขครุภัณฑ์ หรือ Serial Number
- ระบบกรองข้อมูล (Filter) ตามสถานะการใช้งาน และปีงบประมาณ

### 2. 🔄 การติดตามสถานะและประวัติครุภัณฑ์ (Status Lifecycle & History)
- รองรับสถานะหลัก 3 สถานะ: `ใช้งาน`, `ชำรุด`, `จำหน่าย`
- เปลี่ยนสถานะได้สะดวกรวดเร็วผ่านหน้ารายการ
- **ระบบบันทึกประวัติ (Audit Log):** บันทึกการเปลี่ยนแปลงสถานะทุกครั้ง พร้อมระบุผู้แก้ไข วันเวลา และหมายเหตุ/เหตุผลที่เปลี่ยน

### 3. 📋 ระบบการยืม - คืนครุภัณฑ์ (Asset Checkouts & Returns)
- บันทึกการเบิก/ยืมครุภัณฑ์ พร้อมระบุผู้ยืม วันเวลา และสถานที่/ห้องที่นำไปใช้งาน
- ตรวจสอบรายการครุภัณฑ์ที่กำลังถูกยืมอยู่แบบ Real-time
- บันทึกการคืนครุภัณฑ์เมื่อนำกลับมาส่ง
- แยกมุมมองการดูรายการ: ผู้ใช้ทั่วไปดูประวัติของตนเอง / ผู้ดูแลระบบ (Admin) ตรวจสอบและจัดการได้ทั้งหมด

### 4. 🏢 ระบบฝ่าย/หน่วยงาน และปีงบประมาณ (Departments & Budget Year)
- จัดการรายชื่อฝ่าย/หน่วยงาน สำหรับจัดกลุ่มครุภัณฑ์
- กำหนดปีงบประมาณ (พ.ศ.) ให้กับครุภัณฑ์แต่ละรายการ เพื่อความสะดวกในการตรวจนับและจัดทำรายงาน

### 5. 👤 ระบบโปรไฟล์ผู้ใช้งาน (User Profile & Avatar)
- จัดการข้อมูลส่วนตัว: ชื่อ-นามสกุล, ตำแหน่ง, ห้องทำงาน, ชั้น และฝ่าย/สำนัก
- อัปโหลดและเปลี่ยนรูปภาพประจำตัว (Avatar)

### 6. 🔐 ระบบยืนยันตัวตนและการกำหนดสิทธิ์ (Authentication & RBAC)
- **สิทธิ์ผู้ใช้งาน (Roles):** แบ่งออกเป็น `ADMIN` (ผู้ดูแลระบบ) และ `USER` (ผู้ใช้งานทั่วไป)
- **ระบบล็อกอิน 2 รูปแบบ:**
  - **Authen365 (SSO มหาวิทยาลัยรามคำแหง):** สำหรับผู้ดูแลระบบ (Admin) ยืนยันตัวตนผ่านระบบกลางของมหาวิทยาลัย
  - **Simulated / Local Login:** สำหรับโหมดทดสอบและพัฒนา (Development) เข้าใช้งานได้ทันที
- **ความปลอดภัย:** ป้องกันหน้าด้วย **Angular Route Guard** (`authGuard`) และส่ง Token ยืนยันสิทธิ์ทุก Request ผ่าน **HTTP Interceptor**

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

### Frontend (Client-side)
- **Framework:** Angular 20 (Standalone Components, Signals, Reactive Architecture)
- **Language:** TypeScript 5.9
- **Styling:** Modern Responsive CSS (Custom Design System, Flexbox, CSS Grid)
- **Routing & State:** Angular Router, RxJS 7.8, HTTP Client Interceptors

### Backend (Server-side & API)
- **Runtime:** Node.js 18+
- **Framework:** Express.js 5
- **Database Driver:** `mysql2` (Connection Pool with Promises)
- **File Upload:** `multer` (จำกัดขนาดและประเภทไฟล์ภาพ)
- **Security:** `helmet` (HTTP Headers Security), `cors` (Cross-Origin Resource Sharing)

### Database
- **Database Engine:** MySQL 8.0+ หรือ MariaDB 10.4+ (รองรับผ่าน XAMPP)
- **Encoding:** `utf8mb4_unicode_ci` (รองรับภาษาไทยสมบูรณ์แบบ)

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
asset-management/
├── backend/                       # โฟลเดอร์ระบบ Backend (Node.js API)
│   ├── sql/                       # สคริปต์ฐานข้อมูลและไฟล์ Migration ต่างๆ
│   │   ├── 001_schema.sql         # โครงสร้างตารางพื้นฐาน
│   │   ├── ...                    # Migration scripts ตามเวอร์ชัน
│   │   └── asset_management_dump.sql # Dump สำรองของฐานข้อมูล
│   ├── src/
│   │   ├── config/                # การตั้งค่าการเชื่อมต่อฐานข้อมูล (db.js)
│   │   ├── middleware/            # Middleware ตรวจสอบสิทธิ์ (auth.middleware.js)
│   │   ├── routes/                # Endpoint APIs (auth, assets, profile, departments)
│   │   ├── app.js                 # Express Application Configuration
│   │   └── server.js              # Entry point สำหรับเริ่มเซิร์ฟเวอร์
│   ├── uploads/                   # ที่จัดเก็บรูปภาพอัปโหลด (assets, avatars)
│   ├── .env.example               # ไฟล์ตัวอย่าง Environment Variables
│   └── package.json               # Dependencies ของ Backend
├── src/                           # โฟลเดอร์ระบบ Frontend (Angular 20)
│   ├── app/
│   │   ├── components/            # UI Modals & Reusable Layout Components
│   │   │   ├── asset-form-modal/  # ฟอร์มเพิ่ม/แก้ไขครุภัณฑ์
│   │   │   ├── department-form-modal/ # ฟอร์มจัดการฝ่าย/หน่วยงาน
│   │   │   └── layout/            # Sidebar และ Topbar Navigation
│   │   ├── pages/                 # หน้าหลักของระบบ
│   │   │   ├── assets-page/       # หน้ารายการครุภัณฑ์
│   │   │   ├── checkouts-page/    # หน้าระบบยืม-คืน
│   │   │   ├── login-page/        # หน้าเข้าสู่ระบบ
│   │   │   └── profile-page/      # หน้าโปรไฟล์ผู้ใช้
│   │   └── services/              # API Client Services, Auth Guard & Interceptors
├── public/                        # Static assets (โลโก้มหาวิทยาลัย, Favicon)
├── database.sql                   # ไฟล์ฐานข้อมูลตัวเต็ม (พร้อมคำสั่งสร้าง DB อัตโนมัติ)
├── angular.json                   # การตั้งค่า Angular CLI
├── package.json                   # Dependencies ของ Frontend
└── README.md                      # คู่มือการติดตั้งและใช้งานระบบ
```

---

## ⚙️ ข้อกำหนดเบื้องต้น (Prerequisites)

ก่อนเริ่มใช้งาน ให้ตรวจสอบว่าเครื่องของคุณได้ติดตั้งโปรแกรมเหล่านี้แล้ว:
1. **Node.js**: เวอร์ชัน 18.x ขึ้นไป ([ดาวน์โหลด Node.js](https://nodejs.org/))
2. **XAMPP** หรือ **MySQL Server**: สำหรับรัน MySQL/MariaDB ([ดาวน์โหลด XAMPP](https://www.apachefriends.org/))
3. **Git**: สำหรับดาวน์โหลดและจัดการซอร์สโค้ด

---

## 🚀 ขั้นตอนการติดตั้งและเริ่มใช้งาน (Installation & Setup)

### ขั้นตอนที่ 1: โคลนโปรเจกต์ (Clone Repository)
```bash
git clone https://github.com/icedolrawee/asset-management.git
cd asset-management
```

---

### ขั้นตอนที่ 2: ติดตั้งฐานข้อมูล (Database Setup)

ฐานข้อมูลมีไฟล์ **`database.sql`** อยู่ที่โฟลเดอร์หลักของโปรเจกต์ ซึ่งมีคำสั่ง `CREATE DATABASE IF NOT EXISTS` พร้อมตารางและข้อมูลตัวอย่างครบถ้วน

#### วิธีที่ 1: นำเข้าผ่าน phpMyAdmin (แนะนำสำหรับผู้ใช้ XAMPP)
1. เปิด **XAMPP Control Panel** แล้วกด **Start** ที่โมดูล **Apache** และ **MySQL**
2. เปิดเว็บเบราว์เซอร์ไปที่: `http://localhost/phpmyadmin/`
3. คลิกแท็บ **Import (นำเข้า)** ที่เมนูด้านบน
4. กดปุ่ม **Choose File (เลือกไฟล์)** แล้วเลือกไฟล์ **`database.sql`** จากโฟลเดอร์โปรเจกต์
5. เลื่อนลงล่างสุดแล้วกด **Import (หรือ Go)** ระบบจะสร้างฐานข้อมูล `asset_management` พร้อมข้อมูลตัวอย่างให้อัตโนมัติ

#### วิธีที่ 2: นำเข้าผ่าน Terminal / Command Line
```bash
# บน Windows Command Prompt:
mysql -u root -p < database.sql

# หรือบน PowerShell:
cmd.exe /c "mysql -u root < database.sql"
```

---

### ขั้นตอนที่ 3: ติดตั้งและเปิดใช้งาน Backend (Node.js API)

1. เปิด Terminal แล้วเข้าไปที่โฟลเดอร์ `backend`:
   ```bash
   cd backend
   ```
2. ติดตั้ง Dependencies:
   ```bash
   npm install
   ```
3. สร้างไฟล์ `.env` สำหรับตั้งค่าสภาพแวดล้อม:
   ```bash
   # บน Windows PowerShell:
   Copy-Item .env.example .env

   # บน Mac/Linux หรือ Command Prompt:
   cp .env.example .env
   ```
4. ตรวจสอบค่าการเชื่อมต่อฐานข้อมูลในไฟล์ `backend/.env` (หากรัน MySQL ผ่าน XAMPP ค่าเริ่มต้นมักเป็น User: `root` และไม่มี Password สามารถใช้ค่าเริ่มต้นได้ทันที)
5. เริ่มการทำงานของเซิร์ฟเวอร์ Backend:
   ```bash
   npm run dev
   ```
   > 📡 Backend API จะเริ่มทำงานที่: `http://localhost:4000`

---

### ขั้นตอนที่ 4: ติดตั้งและเปิดใช้งาน Frontend (Angular)

1. เปิด Terminal ใหม่ (ให้อยู่ที่โฟลเดอร์หลัก `asset-management`):
   ```bash
   npm install
   ```
2. เริ่มการทำงานของ Angular Development Server:
   ```bash
   npm start
   # หรือรันผ่าน ng serve
   ```
3. เปิดเบราว์เซอร์แล้วเข้าไปที่:
   ```text
   http://localhost:4200/
   ```

---

## 🔑 ข้อมูลบัญชีสำหรับทดสอบระบบ (Default Test Accounts)

ระบบเตรียมบัญชีตัวอย่างไว้ให้พร้อมทดสอบทั้งระดับสิทธิ์ Admin และ User:

| อีเมล (Username) | รหัสผ่าน (Password) | สิทธิ์ (Role) | รูปแบบการล็อกอิน | หมายเหตุ |
| :--- | :--- | :---: | :--- | :--- |
| **`test-dev07@ru.ac.th`** | *(รหัส Authen365)* | **ADMIN** | Authen365 มหาวิทยาลัย | สิทธิ์ผู้ดูแลระบบ จัดการข้อมูลและสถานะได้ทุกส่วน |
| **`ice@gmail.com`** | `user1234` | **USER** | Local / Simulate Login | ผู้ใช้งานทั่วไป (ดลรวี มุ้ยแก้ว) |
| **`gun@gmail.com`** | `user1234` | **USER** | Local / Simulate Login | ผู้ใช้งานทั่วไป (กัน นรีรัตร) |

---

## 📋 ข้อมูล Environment Variables (`backend/.env`)

| ตัวแปร | ค่าเริ่มต้น | คำอธิบาย |
| :--- | :--- | :--- |
| `PORT` | `4000` | พอร์ตสำหรับรัน Backend API Server |
| `NODE_ENV` | `development` | สภาพแวดล้อมการทำงาน (`development` / `production`) |
| `DB_HOST` | `127.0.0.1` | Host Address ของ MySQL Server |
| `DB_PORT` | `3306` | พอร์ตของ MySQL Server |
| `DB_USER` | `root` | ชื่อผู้ใช้ MySQL |
| `DB_PASSWORD` | *(ว่าง)* | รหัสผ่าน MySQL |
| `DB_NAME` | `asset_management` | ชื่อฐานข้อมูล |
| `CORS_ORIGIN` | `http://localhost:4200` | โดเมนของ Frontend ที่อนุญาตให้เรียกใช้งาน API |
| `JWT_SECRET` | *(Random Secret)* | คีย์สำหรับเข้ารหัส Token การยืนยันตัวตน |
| `ADMIN_EMAIL` | `test-dev07@ru.ac.th` | อีเมล Admin ที่ได้รับอนุญาตผ่าน Authen365 |
| `AUTHEN365_URL` | `https://service-regisapps.ru.ac.th/authen365/login` | Endpoint บริการ Authen365 ของมหาวิทยาลัยรามคำแหง |
| `UPLOAD_DIR` | `uploads` | โฟลเดอร์สำหรับเก็บไฟล์รูปภาพที่อัปโหลด |

---

## 🌐 สรุป REST API Endpoints

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/admin-login` - เข้าสู่ระบบสำหรับ Admin ผ่าน Authen365
- `POST /api/auth/simulate-user-login` - เข้าสู่ระบบสำหรับ User (โหมดทดสอบ)
- `GET /api/auth/me` - ดึงข้อมูลผู้ใช้ปัจจุบันที่กำลังล็อกอินอยู่

### 📦 Assets (`/api/assets`)
- `GET /api/assets` - ดึงรายการครุภัณฑ์ทั้งหมด (รองรับ Query: `search`, `status`, `department`, `budgetYear`)
- `GET /api/assets/:id` - ดึงข้อมูลรายละเอียดครุภัณฑ์รายชิ้น
- `POST /api/assets` - เพิ่มรายการครุภัณฑ์ใหม่ *(Admin Only)*
- `PUT /api/assets/:id` - แก้ไขข้อมูลครุภัณฑ์ *(Admin Only)*
- `DELETE /api/assets/:id` - ลบรายการครุภัณฑ์ *(Admin Only)*
- `PATCH /api/assets/:id/status` - ปรับปรุงสถานะครุภัณฑ์ (ใช้งาน, ชำรุด, จำหน่าย) *(Admin Only)*
- `GET /api/assets/:id/history` - ดึงประวัติการเปลี่ยนสถานะของครุภัณฑ์

### 📋 Checkouts (`/api/assets/checkouts`)
- `GET /api/assets/checkouts` - ดึงรายการครุภัณฑ์ที่กำลังถูกยืม
- `POST /api/assets/:id/checkout` - บันทึกการยืมครุภัณฑ์
- `POST /api/assets/:id/return` - บันทึกการคืนครุภัณฑ์
- `DELETE /api/assets/checkouts/:id` - ยกเลิกรายการยืม *(Admin Only)*

### 🏢 Departments (`/api/departments`)
- `GET /api/departments` - ดึงรายชื่อฝ่าย/หน่วยงานทั้งหมด
- `POST /api/departments` - เพิ่มรายชื่อฝ่ายใหม่ *(Admin Only)*
- `DELETE /api/departments/:name` - ลบรายชื่อฝ่าย *(Admin Only)*

### 👤 Profile (`/api/profile`)
- `GET /api/profile` - ดึงข้อมูลโปรไฟล์ผู้ใช้ปัจจุบัน
- `PUT /api/profile` - แก้ไขข้อมูลโปรไฟล์ส่วนตัว
- `POST /api/profile/avatar` - อัปโหลดรูปภาพประจำตัว (Avatar)

---

## 🛠️ การแก้ไขปัญหาที่พบบ่อย (Troubleshooting)

1. **เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล (`ECONNREFUSED 127.0.0.1:3306`):**
   - ตรวจสอบว่าได้กด **Start** ที่บริการ MySQL ใน XAMPP Control Panel หรือยัง
   - ตรวจสอบค่า `DB_PORT`, `DB_USER` และ `DB_PASSWORD` ในไฟล์ `backend/.env` ให้ตรงกับเครื่องของคุณ
2. **รูปภาพไม่แสดงผล (Broken Image):**
   - ตรวจสอบว่า Backend กำลังทำงานอยู่ที่พอร์ต 4000 หรือไม่
   - ตรวจสอบว่ามีโฟลเดอร์ `backend/uploads/assets` และ `backend/uploads/avatars` อยู่ในโปรเจกต์
3. **พอร์ต 4200 หรือ 4000 ถูกใช้งานอยู่แล้ว (Port in use):**
   - หากพอร์ต 4200 ชน สามารถรัน Frontend ด้วยคำสั่ง `ng serve --port 4300`
   - หากพอร์ต 4000 ชน สามารถแก้ไขค่า `PORT` ในไฟล์ `backend/.env` เป็นพอร์ตอื่นได้
