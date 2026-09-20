# 🎓 College Management System

A comprehensive College ERP & Management System featuring an intuitive React/Vite Frontend and Node.js/Express Backend API.

---

## ⚡ Quick Start: Run Everything in One Click!

You can launch all services (**Frontend** and **Node.js Backend**) with any of the following one-click methods:

### Option 1: Double-Click Batch File (Windows GUI)
Simply double-click:
* **`run_all.bat`** or **`start.bat`** in the project folder to start all services in a single unified dashboard window.
* **`run_split_windows.bat`** if you prefer each service to have its own dedicated command window.

---

### Option 2: Using npm / Node Terminal
From the project root directory, run:
```bash
npm run dev
```

---

## 🌐 Services Overview & Port Map

Once started, the services are available at:

| Service | Technology | URL / Port | Description |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | React + Vite + Tailwind | [http://localhost:5173](http://localhost:5173) | Main College Management ERP Portal |
| **Backend API** | Node.js + Express + MySQL | [http://localhost:5000](http://localhost:5000) | RESTful API for auth, academics, students, faculty |

---

## 🛠️ Individual Service Commands

If you need to start any service independently:

* **Frontend Only**: `npm run dev:frontend` (or `npx vite`)
* **Node Backend Only**: `npm run dev:backend` (or `node backend/server.js`)
* **Database Setup / Migrations**: `npm run setup:db`

---

## 🛑 Stopping Services