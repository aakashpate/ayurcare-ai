# AyurCare AI

**Smart India Hackathon 2026 — Problem Statement SIH26047**

*Patient Case-Taking Software for Ministry of Ayush*

---

## Overview

AyurCare AI is a multilingual AI-assisted patient case-taking and clinical documentation platform for AYUSH healthcare settings. It helps collect, organize, summarize, and review clinical information.

**Core Principle:** Patient speaks → AyurCare structures → Doctor verifies → Better consultation.

**Important:** This software does NOT autonomously diagnose, prescribe, or replace qualified medical practitioners. All AI-generated outputs require physician review.

---

## Features

### P0 — Core Features (Working)

- **Patient Registration** with auto-generated IDs (AYU-2026-XXXX)
- **Consent Management** with timestamp recording
- **Multilingual Support** (English, Hindi)
- **Adaptive Clinical Interview** with voice input fallback
- **Dual-Lens Clinical Record** (Biomedical + Ayurvedic)
- **Vitals Recording** (BP, pulse, temperature, weight, height, SpO2)
- **Red-Flag Safety Engine** with rule-based detection
- **AI Case Brief Generation** with mock fallback
- **Document Upload & OCR** with demo extraction
- **Doctor Review & Approval** workflow
- **Patient Timeline** with longitudinal records
- **Follow-up Scheduling**
- **PDF Export**
- **Role-Based Access Control** (Admin, Doctor, Student, Patient)
- **Demo Mode** with sample patient data
- **Offline Draft Caching** (localStorage)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL with Prisma ORM |
| Validation | Zod |
| AI | Provider abstraction with MockAIProvider |
| Voice | Browser Web Speech API |
| OCR | Mock extraction with demo fallback |
| PDF | PDFKit |
| QR | qrcode library |

---

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Git

---

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd ayurcare-ai
```

### 2. Install dependencies

```bash
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

### 3. Set up environment variables

```bash
cd server
cp .env.example .env
```

Edit `.env` with your PostgreSQL credentials:

```
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/ayurcare_ai"
JWT_SECRET="your-secret-key-here"
```

### 4. Set up database

```bash
cd server
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
```

### 5. Start development servers

```bash
# From root directory
npm run dev
```

Or start servers separately:

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ayurcare.ai | demo123 |
| Doctor | doctor@ayurcare.ai | demo123 |
| Patient | patient@ayurcare.ai | demo123 |

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Patients
- `GET /api/patients` - List patients (supports search, pagination)
- `GET /api/patients/:id` - Get patient with encounters
- `POST /api/patients` - Create patient
- `PATCH /api/patients/:id` - Update patient

### Encounters
- `POST /api/encounters` - Create encounter
- `GET /api/encounters/:id` - Get encounter
- `PATCH /api/encounters/:id` - Update encounter
- `POST /api/encounters/:id/responses` - Save interview response
- `GET /api/encounters/:id/next-question` - Get next adaptive question
- `PUT /api/encounters/:id/biomedical` - Save biomedical assessment
- `PUT /api/encounters/:id/ayurvedic` - Save ayurvedic assessment
- `PUT /api/encounters/:id/vitals` - Save vitals
- `POST /api/encounters/:id/generate-summary` - Generate AI summary
- `PATCH /api/encounters/:id/summary` - Update summary
- `POST /api/encounters/:id/approve` - Approve case
- `GET /api/encounters/:id/red-flags` - Get red flags
- `POST /api/encounters/:id/check-red-flags` - Check for red flags
- `PUT /api/encounters/:id/finalize` - Finalize encounter

### Documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/:id` - Get document
- `GET /api/documents/patient/:patientId` - Get patient documents

### Follow-ups
- `GET /api/follow-ups/due` - Get due follow-ups
- `POST /api/follow-ups` - Create follow-up
- `PATCH /api/follow-ups/:id` - Update follow-up

### Reports
- `GET /api/reports/:encounterId/pdf` - Export PDF
- `GET /api/reports/:encounterId/qr` - Generate QR code

---

## Demo Scenario (SIH 3-Minute Presentation)

1. **0:00-0:20** - Explain the problem: Patient history-taking is time-consuming and fragmented
2. **0:20-1:10** - Patient selects Hindi, begins adaptive voice/touch interview
3. **1:10-1:40** - Upload old prescription, show OCR extraction
4. **1:40-2:10** - Show red-flag detection and AI case brief
5. **2:10-2:40** - Switch to doctor interface, verify and approve
6. **2:40-3:00** - Show longitudinal timeline, offline support, future ABDM interoperability

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (React)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │Dashboard │ │ Patients │ │ Interview│ │  Review  │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                      ↓                                      │
│              API Service (Axios)                            │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   Server (Express)                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │  Routes  │ │Services  │ │  AI/OCR  │ │Red Flags │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                      ↓                                      │
│              Prisma ORM                                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | - |
| JWT_SECRET | Secret for JWT tokens | - |
| JWT_EXPIRES_IN | Token expiration time | 7d |
| AI_PROVIDER | AI provider (mock/openai) | mock |
| OPENAI_API_KEY | OpenAI API key (optional) | - |
| OCR_PROVIDER | OCR provider (mock) | mock |
| APP_URL | Frontend URL | http://localhost:5173 |
| UPLOAD_MAX_MB | Max upload size in MB | 10 |
| PORT | Server port | 3001 |

---

## Safety Disclaimer

AyurCare AI assists with information collection and clinical documentation. It does not provide a final diagnosis or replace professional clinical judgment. All generated summaries and alerts require practitioner review.

---

## Fallback Behavior

| Feature | Primary | Fallback |
|---------|---------|----------|
| Voice Input | Web Speech API | Text input |
| AI Summary | OpenAI API | MockAIProvider |
| OCR | Cloud API | Demo extraction |
| Network | Online | Local draft caching |

---

## Future Enhancements (Post-SIH)

- Full ABDM/FHIR interoperability
- Real-time SMS/WhatsApp reminders
- Advanced analytics dashboard
- Multi-clinic support
- Mobile application
- Seasonal/Ritucharya reminders

---

## License

This project was developed for Smart India Hackathon 2026.

---

**SIH 2026 | Ministry of Ayush | Problem Statement SIH26047**
