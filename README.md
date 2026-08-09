# 🎓 College Management System

A comprehensive College ERP & Management System featuring an intuitive React/Vite Frontend, Node.js/Express Backend API, and Python/Flask Biometrics & Face Recognition Service.

---

## ⚡ Quick Start: Run Everything in One Click!

You can launch all 3 services (**Frontend**, **Node.js Backend**, and **Python Face Service**) with any of the following one-click methods:

### Option 1: Double-Click Batch File (Windows GUI)
Simply double-click:
* **`run_all.bat`** or **`start.bat`** in the project folder to start all 3 services in a single unified dashboard window.
* **`run_split_windows.bat`** if you prefer each service to have its own dedicated command window.

---

### Option 2: Using npm / Node Terminal
From the project root directory, run:
```bash
npm start
# OR
npm run dev
# OR
node run_all.js
```

---

### Option 3: Using PowerShell
```powershell
.\run_all.ps1
```

---

## 🌐 Services Overview & Port Map

Once started, the services are available at:

| Service | Technology | URL / Port | Description |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | React + Vite + Tailwind | [http://localhost:5173](http://localhost:5173) | Main College Management ERP Portal |
| **Backend API** | Node.js + Express + MySQL | [http://localhost:5000](http://localhost:5000) | RESTful API for auth, academics, students, faculty |
| **Face AI Service** | Python + Flask + SQLAlchemy | [http://localhost:5001](http://localhost:5001) | Biometric face recognition, verification & liveness |

---

## 🛠️ Individual Service Commands

If you need to start any service independently:

* **Frontend Only**: `npm run dev:frontend` (or `npx vite`)
* **Node Backend Only**: `npm run dev:backend` (or `node backend/server.js`)
* **Python Face Service Only**: `npm run dev:python` (or `python face_service/app.py`)
* **Database Setup / Migrations**: `npm run setup:db`

---

## 🛑 Stopping Services
Press `Ctrl + C` in the terminal to stop all 3 services cleanly.