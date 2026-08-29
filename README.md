# AyurCare AI

AI-assisted patient case-taking and clinical documentation for AYUSH healthcare.

AyurCare AI helps patients provide structured health information and gives practitioners a concise case record to review. It was developed for Smart India Hackathon 2026, Problem Statement SIH26047.

> AyurCare AI does not diagnose, prescribe, or replace a qualified medical practitioner. All generated summaries and safety alerts require clinical review.

## Main Features

- Patient registration, consent, and longitudinal records
- English and Hindi patient intake with text or browser voice input
- Adaptive clinical interviews and offline draft storage
- Biomedical and Ayurvedic assessments with vitals
- Rule-based red-flag detection
- AI-assisted case summaries with a built-in mock provider
- Document upload with mock OCR extraction
- Practitioner review, follow-ups, PDF reports, and QR codes
- Separate doctor, patient, and demonstration administrator experiences

## Technology

| Area | Stack |
| --- | --- |
| Web app | React, TypeScript, Vite, Tailwind CSS |
| API | Node.js, Express, TypeScript, Zod |
| Data | PostgreSQL, Prisma ORM |
| Supporting services | Web Speech API, PDFKit, QRCode, mock AI/OCR providers |

## Quick Start

Requirements: Node.js 18+ and npm.

The quickest way to explore the project is mock mode. It runs entirely in the browser and does not require PostgreSQL.

```bash
npm install
npm --prefix client install
npm run dev:client
```

Open `http://localhost:5173`. Mock mode is enabled automatically when `VITE_API_URL` is not defined.

### Demo Accounts

| Portal | Email | Password |
| --- | --- | --- |
| Doctor | `doctor@ayurcare.ai` | `demo123` |
| Patient | `patient@ayurcare.ai` | `demo123` |
| Admin | `admin@ayurcare.ai` | `demo123` |

These credentials are for demonstration only.

## Full-Stack Setup

Full-stack mode requires a PostgreSQL database.

1. Install all dependencies.

```bash
npm install
npm --prefix client install
npm --prefix server install
```

2. Create `server/.env` from `server/.env.example` and set at least `DATABASE_URL` and `JWT_SECRET`.

3. Generate the Prisma client, create the schema, and load demo data.

```bash
npm --prefix server run db:setup
```

4. Create `client/.env` so the web app uses the API instead of mock mode.

```env
VITE_API_URL=http://localhost:3001
```

5. Start the client and API together.

```bash
npm run dev
```

The web app runs at `http://localhost:5173`; the API runs at `http://localhost:3001/api`. Check API availability at `http://localhost:3001/api/health`.

## Configuration

The server configuration template is `server/.env.example`. Important settings are:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign authentication tokens |
| `APP_URL` | Allowed web-app origin; comma-separate multiple origins |
| `AI_PROVIDER` | AI provider; defaults to `mock` |
| `OPENAI_API_KEY` | Required when using the OpenAI provider |
| `OCR_PROVIDER` | OCR provider; defaults to `mock` |
| `PORT` | API port; defaults to `3001` |

## Project Structure

```text
client/             React web application
server/src/         Express API, services, and tests
server/prisma/      PostgreSQL data model
render.yaml         Render API deployment configuration
```

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the client and API |
| `npm run build` | Build both applications |
| `npm run typecheck` | Type-check the client |
| `npm run lint` | Lint the client |
| `npm test` | Run server tests |

## Safety

This project is a clinical documentation aid, not a medical device or autonomous decision system. Practitioners remain responsible for verifying patient information, generated summaries, red flags, and all clinical decisions.
