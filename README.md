# BME Smart System (Hospital Biomedical Engineering Management)

ระบบบริหารจัดการและประเมินผลงานวิศวกรรมชีวการแพทย์ (BME - Biomedical Engineering)
ประกอบด้วย:
- **CSI Survey & Feedback**: ระบบประเมินความพึงพอใจการให้บริการเครื่องมือแพทย์
- **Staff Roster & Org Chart**: ผังองค์กรและทำเนียบรายชื่อบุคลากร
- **Coaching & Performance**: บันทึกและติดตามการพัฒนาทักษะ (6 สัปดาห์)
- **Activity & Happy Life Dashboard**: บันทึกชั่วโมงกิจกรรมและรายงานสรุปภาพรวม

---

## 🚀 ข้อกำหนดและสิ่งจำเป็น (Prerequisites)
- **Node.js**: เวอร์ชั่น 18 ขึ้นไป (แนะนำ Node.js 20 หรือ 22)
- **npm** หรือ **yarn** หรือ **pnpm**

---

## 📦 วิธีติดตั้งและเริ่มใช้งาน (Getting Started)

### 1. ติดตั้ง Dependencies
เปิด Terminal หรือ Command Prompt ในโฟลเดอร์โปรเจกต์ แล้วพิมพ์คำสั่ง:
```bash
npm install
```

### 2. ตั้งค่า Environment Variables (ถ้ามี)
คัดลอกไฟล์ `.env.example` เป็น `.env`
```bash
cp .env.example .env
```
*(ระบบทำงานแบบ Full-Stack เชื่อมต่อกับ Google Sheets ผ่าน Webhook / Apps Script และ CSV sync อัตโนมัติ)*

### 3. รันโปรเจกต์ในโหมด Development
```bash
npm run dev
```
หลังจากรันคำสั่งแล้ว เปิดเว็บเบราว์เซอร์ไปที่:
👉 **http://localhost:3000**

---

## 🛠️ คำสั่งต่างๆ ในโปรเจกต์ (Available Scripts)

- `npm run dev`: เริ่มต้นเซิร์ฟเวอร์ Express และ Vite ในโหมดพัฒนา (Development mode) ที่พอร์ต 3000
- `npm run build`: คอมไพล์ Frontend (Vite) และ Backend (`server.ts` ผ่าน esbuild) สำหรับ Production
- `npm run start`: รัน Production server จากไฟล์ที่คอมไพล์ในโฟลเดอร์ `dist/`
- `npm run lint`: ตรวจสอบความถูกต้องของ TypeScript Types

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```
├── index.html                 # หน้า HTML หลักของระบบ
├── server.ts                  # Backend Express Server (API Proxy, Google Sheets Data Sync)
├── vite.config.ts             # การตั้งค่า Vite & Tailwind CSS v4
├── package.json               # รายการ Dependencies และ Scripts
├── public/                    # ไฟล์ภาพและ Static Assets
└── src/
    ├── main.tsx               # Entry Point ของ React
    ├── App.tsx                # คอมโพเนนต์หลัก จัดการ Routing / Navigation
    ├── index.css              # สไตล์ Tailwind CSS
    ├── types.ts               # นิยาม TypeScript Interfaces & Types ทั้งหมด
    ├── components/            # คอมโพเนนต์หน้าจอแต่ละโมดูล
    │   ├── ActivityDashboard.tsx    # แดชบอร์ดกิจกรรม Happy Life / HR-PTP
    │   ├── CoachingTracker.tsx      # ระบบติดตามผลการโค้ชชิ่ง
    │   ├── CSISurveyForm.tsx        # แบบฟอร์มประเมินความพึงพอใจ CSI
    │   ├── CSIDashboard.tsx         # แดชบอร์ดวิเคราะห์ผลคะแนน CSI
    │   ├── OrgChart.tsx             # ผังโครงสร้างองค์กร
    │   └── StaffDirectory.tsx       # ทำเนียบรายชื่อบุคลากร
    ├── services/
    │   └── storage.ts         # Service จัดการ State, LocalStorage & Google Sheets Sync
    ├── data/
    │   └── initialData.ts     # ฐานข้อมูลเริ่มต้น
    └── utils/
        └── staffAvatars.ts    # ฟังก์ชันช่วยจัดการรูปโปรไฟล์พนักงาน
```
