# Tech Stack Map

## Core Frameworks & Runtime
- **Frontend Runtime**: React 18 (`react` v18.3.1, `react-dom` v18.3.1)
- **Frontend Build Tool**: Vite v6.3.5 with `@vitejs/plugin-react` v4.7.0 and `@tailwindcss/vite` v4.1.12
- **Backend Runtime**: Node.js (ES Module mode `"type": "module"`)
- **Backend Framework**: Express v4.19.2
- **Database Engine**: MySQL / TiDB Cloud via `mysql2/promise` (v3.10.1)

## UI & Styling Libraries
- **CSS Framework**: Tailwind CSS v4.1.12 with `tw-animate-css` v1.3.8
- **UI Components**: Radix UI Primitives (Accordion, Alert Dialog, Avatar, Checkbox, Dialog, Dropdown Menu, Popover, Select, Tabs, Tooltip, etc.)
- **Icons**: Lucide React (`lucide-react` v0.487.0)
- **Animations**: Motion (`motion` v12.23.24)
- **Toast Notifications**: Sonner (`sonner` v2.0.3)
- **Charts & Data Viz**: Recharts (`recharts` v2.15.2)
- **Utility Libraries**: `clsx` (v2.1.1), `tailwind-merge` (v3.2.0), `class-variance-authority` (v0.7.1)

## Authentication & Security
- **JWT Authentication**: `jsonwebtoken` v9.0.2 with `bcryptjs` v3.0.3 password hashing
- **Biometric / WebAuthn**: `@simplewebauthn/browser` (v14.0.0) & `@simplewebauthn/server` (v14.0.2)
- **AI Face Authentication**: `onnxruntime-node` (v1.30.0) with ONNX face embedding models & `jpeg-js` (v0.4.4)
- **File Upload Security**: `multer` v2.2.0

## AI & Communications Integration
- **LLM / AI Capabilities**: `@google/genai` v2.13.0 (Google Gemini AI API)
- **Email Gateway**: `nodemailer` v9.0.5
- **Document & Data Processing**: `xlsx` v0.18.5, `jspdf` v4.2.1, `html2canvas` v1.4.1, `qrcode.react` v4.2.0

## Utility & Validation
- **Form Handling**: `react-hook-form` v7.55.0 with `zod` v4.4.3 (frontend) and `zod` v3.24.2 (backend)
- **Routing**: `react-router` v7.13.0
- **HTTP Client**: `axios` v1.18.1 / v1.19.0
- **Development Tooling**: `nodemon` v3.1.4, `concurrently` v10.0.4, `localtunnel` v2.0.2
