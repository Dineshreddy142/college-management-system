# 🎓 College Management System (EduERP) — Technical Project Documentation

> **System Version:** 2.0.0 (Production Build)  
> **Repository:** `c:\college-management-system`  
> **Architecture:** Full-Stack Decoupled Client-Server (React 18 + Node.js Express + SQLite3)  

---

## 📌 Executive Overview
The **College Management System (EduERP)** is an enterprise-grade, multi-tenant University ERP designed to digitize and automate all academic, administrative, and operational workflows of higher education institutions.

Featuring **7 dedicated Role-Based Portals**, a **Unified Single-Card Student Profile System**, **Interactive SVG Floor Plan Editors**, and **Automated Gradebook & Attendance Telemetry**, the platform provides seamless collaboration between Students, Faculty, HODs, Principals, Parents, Office Staff, and System Administrators.

---

## 🛠️ Technology Stack

### **Frontend Architecture**
- **Core Framework:** React 18.3.1 (TypeScript)
- **Build Tooling:** Vite 6.3.5
- **Styling & Design System:** TailwindCSS 4.1, Custom Glassmorphism Theme (Dark/Light Modes)
- **Icons & UI Utilities:** Lucide React 0.487, Radix UI Primitives, Motion, Sonner Toasts
- **Data Visualization:** Recharts 2.15 (Interactive Area, Bar, Line, and Pie Charts)
- **Document Generators:** jsPDF 4.2 (PDF Dossier Downloads), XLSX 0.18 (Excel Export)
- **Vector & Real QR Engine:** `qrcode.react` (Standard High-Density QR Codes)

### **Backend Architecture**
- **Runtime Environment:** Node.js v24.19 (LTS)
- **API Framework:** Express.js REST API
- **Database Engine:** SQLite3 (Persistent file database with automated schema setup)
- **Security & Authentication:** JWT (JSON Web Tokens), BcryptJS password hashing, CORS protection
- **Multi-Port Execution:** `concurrently` (Simultaneous multi-portal dev servers)

---

## 🏛️ Multi-Portal Role Architecture (7 Dedicated Roles)

| Portal Role | Default Port | Primary Purpose & Key Capabilities |
| :--- | :--- | :--- |
| 👑 **Admin Portal** | `5171` | Full institutional control, user provisioning, block & floor editor, bulk data import/export. |
| 🎓 **Student Portal** | `5172` | Student profile card, attendance telemetry, my subjects, timetable, exam results, fees & library. |
| 👨‍🏫 **Faculty Portal** | `5173` | Attendance logging, subject mark entry, student academic feedback, class advisor telemetry. |
| 👔 **HOD Portal** | `5174` | Departmental overview, faculty allocation, curriculum planning, backlogs & academic performance. |
| 👪 **Parent Portal** | `5175` | Real-time child attendance tracker, exam grade sheets, fee receipts, warden/advisor contact. |
| 🏛️ **Principal Portal** | `5176` | Executive dashboard, institutional analytics, department ranking, accreditation reports. |
| 💼 **Office Staff Portal** | `5177` | Fee collection counter, certificate issuance, library card issuance, hostel room allocation. |

---

## 📦 Core System Modules

### 1. 👤 Complete University Student Profile (Unified Single-Card Style)
- **Master Student Card Layout:** Encloses all student telemetry inside a single glassmorphism card container.
- **Scrollbar-Less Tab Bar:** Smooth, hidden-scrollbar horizontal navigation across 10 structured sections:
  1. 📊 **Overview:** Academic summary, CGPA (8.92), SGPA (9.10), 0 active backlogs.
  2. 👤 **Personal:** Full Legal Name, First Name, Last Name, DoB, Blood Group, Nationality.
  3. 📞 **Contact & Address:** Institutional Email, Mobile Phone (Editable), Permanent & Local Addresses, Emergency Hotline.
  4. 👨‍👩‍👦 **Parent & Guardian:** Father & Mother details, occupation, phone handles.
  5. 🎓 **Academic Details:** Program (B.Tech CSE), Department, Specialization (AI & ML), Admission Type.
  6. 🆔 **University IDs:** Student ID, Roll No, Reg No, Library Card ID, Hostel Allocation ID, **Real Scannable Student QR Code**.
  7. 🏫 **Previous Education:** 10th (CBSE) & 12th (TSBIE) marks, board details, passing years.
  8. 📈 **Academic Performance:** CGPA 8.92 / 10.0, 142/160 Credits completed, overall 84.6% marks.
  9. ⚠️ **Backlogs & Arrears:** Clean record telemetry (0 standing backlogs).
  10. 👨‍🏫 **Class Advisor & HOD Details:** Assigned class advisor & HOD contact handles.

### 2. 🏢 Interactive Block & Floor Management System
- **Drag-and-Drop Floor Plan Editor:** Interactive SVG/Canvas workspace for drawing classrooms, labs, faculty cabins, rest rooms, and corridors.
- **Room Management:** Room numbering, seating capacity calculation, projector/smart board inventory tagger.
- **Floor Versioning:** Version history control for architectural changes and department room re-allocations.

### 3. 📅 Attendance & Timetable Management
- Daily attendance entry by subject faculty with instant percentage calculation (e.g. 88%).
- Automated low-attendance warnings when attendance drops below threshold (75%).
- Interactive daily/weekly timetable schedule for both students and faculty.

### 4. 📝 Examination, Marks & Gradebook System
- Internal exam (Mid-1, Mid-2) and Semester End Examination (SEE) grade processing.
- Automatic SGPA and CGPA computation following university credit weighting rules.
- Downloadable official marks dockets and grade cards.

### 5. 💳 Fee Management & Receipt Ledger
- Term-wise fee breakdown (Tuition fee, Library fee, Examination fee, Hostel fee).
- Online payment status tracking with downloadable PDF payment receipts.
- Office staff counter approval for cash/cheque fee deposits.

### 6. 📚 Digital Library Management
- Catalog search for textbooks, reference journals, and research papers.
- Issued books tracking with due dates, renewal counter, and automated late fine calculation.

### 7. 🏠 Hostel & Room Allocation
- Block-wise hostel room allocation (Hostel Block A/B/C).
- Warden contact telemetry, room mate information, and mess attendance logging.

### 8. 💼 Placement & Career Studio
- Campus placement drive listings with eligibility filtering.
- Applied company tracker (Interview schedules, offer letters, CTC details).

### 9. 🚀 Reports & Institutional Analytics
- Executive charts (CGPA distribution, attendance heatmaps, fee collection velocity).
- One-click CSV/Excel bulk export and institutional PDF dossier generation.

---

## 🔌 API Endpoint Reference

### **Authentication & User Management**
- `POST /api/auth/login` — Authenticate user and issue JWT session token.
- `POST /api/auth/forgot-password` — Trigger password reset workflow.
- `PUT /api/auth/change-password` — Force first-time login password update.
- `GET /api/profile` — Fetch authenticated student/user profile telemetry.
- `PUT /api/profile` — Update editable contact information (Phone, Address).

### **Academic & Student Records**
- `GET /api/students` — List students (Filtered by department/semester).
- `POST /api/students/bulk` — Import student records via Excel/CSV dataset.
- `GET /api/attendance` — Fetch student attendance logs.
- `POST /api/attendance` — Log class attendance session.
- `GET /api/exams/results` — Fetch student semester examination results.

### **Block & Infrastructure Management**
- `GET /api/buildings` — List campus buildings and blocks.
- `GET /api/floors/:buildingId` — Fetch floor layout vector data.
- `POST /api/floors/save` — Save updated floor plan layout and rooms.

---

## ⚙️ Local Development & Running Guide

### 1. Prerequisites
- **Node.js**: v18.0 or higher
- **npm**: v9.0 or higher

### 2. Environment Setup
Clone the repository and install all dependencies:
```bash
cd c:\college-management-system
npm install
```

### 3. Database Initialization
Seed default university records and databases:
```bash
node backend/setup_all_databases.js
```

### 4. Running the Portals
- **Run Full System (Backend + Portals):**
  ```bash
  npm run dev
  ```
- **Run Specific Portal individually:**
  - Admin Portal: `npm run dev:admin` (Port `5171`)
  - Student Portal: `npm run dev:student` (Port `5172`)
  - Faculty Portal: `npm run dev:faculty` (Port `5173`)

---

## 🔒 Security & Compliance
- **RBAC Enforcement:** Strict route protection and API middleware scoping by user role token.
- **SQL Injection Safeguards:** Prepared statements across all SQLite database queries.
- **Data Privacy:** Read-only admin protection on core university identifiers (Roll No, Reg No, Student ID).

---
*Documentation compiled and maintained for College Management System repository.*
