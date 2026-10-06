# Project Structure & Directory Layout Map

## Repository Layout
```
college-management-system/
├── AGENTS.md                   # Workspace Integrity & Quality Rules
├── README.md                   # Quickstart guide & port overview
├── package.json                # Frontend dependencies & scripts
├── vite.config.ts              # Vite configuration with aliases & dev server ports
├── tsconfig.json               # TypeScript compiler configuration
├── schema.sql                  # Primary MySQL database schema
├── complete_project_report.md  # Comprehensive project feature report
├── project_documentation.md    # Detailed module documentation
├── .planning/                  # GSD planning directory
│   ├── codebase/               # Codebase maps (STACK, ARCHITECTURE, STRUCTURE...)
│   └── onboarding/             # Onboarding summary & status
├── backend/                    # Node.js + Express REST API Server
│   ├── server.js               # Main server entrypoint & middleware assembly
│   ├── db.js                   # MySQL connection pool setup
│   ├── init_db.js              # Comprehensive table initializer & column migrations
│   ├── package.json            # Backend dependencies & scripts
│   ├── controllers/            # Controller business logic modules
│   ├── middlewares/            # Auth JWT middleware, RBAC checks, Error Handlers
│   ├── models/                 # Model abstractions & DB queries
│   ├── routes/                 # Express Router modules (32 endpoints)
│   ├── services/               # Gemini AI service, Face Auth service, Mailer service
│   ├── utils/                  # Logger, response helpers, security utils
│   └── validators/             # Zod input validation schemas
└── src/                        # React / Vite Frontend Application
    ├── main.tsx                # React root component entrypoint
    ├── api/                    # Axios API client setup & endpoints
    ├── app/                    # Feature modules (admin, audit, governance)
    ├── components/             # Reusable UI components (buttons, modals, tables)
    ├── hooks/                  # Custom React hooks (useAuth, useFetch)
    ├── portals/                # Multi-role portals (admin, student, faculty, hod...)
    ├── services/               # Client-side services & API wrappers
    ├── styles/                 # Tailwind CSS & global styles
    └── utils/                  # Helper formatting functions
```

## Key Controller & Route Directory Index
- `backend/routes/authRoutes.js`: Authentication, login, password reset, WebAuthn registration, JWT tokens.
- `backend/routes/studentRoutes.js`: Student profiles, academics, semester updates.
- `backend/routes/facultyRoutes.js`: Faculty assignments, workloads, subject allocations.
- `backend/routes/academicRoutes.js`: Semesters, courses, subjects, schedules.
- `backend/routes/aiRoutes.js`: Gemini AI integration endpoints.
- `backend/routes/faceAuthRoutes.js`: Facial recognition & ONNX embedding endpoints.
- `backend/routes/blockRoutes.js`: Infrastructure block management & dynamic asset tracking.
