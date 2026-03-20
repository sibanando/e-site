# Catholic Parish Web App — Step-by-Step Setup

> Complete guide to install, configure, and run the application from scratch.

---

## Prerequisites

Before you begin, make sure you have the following installed:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18 or higher | https://nodejs.org |
| npm | comes with Node.js | — |
| PostgreSQL | 14 or higher | https://www.postgresql.org/download |

Verify your installations:
```bash
node --version    # should print v18.x.x or higher
npm --version     # should print 9.x.x or higher
psql --version    # should print psql (PostgreSQL) 14.x or higher
```

---

## Step 1 — Clone / Open the Project

Open a terminal and navigate to the project folder:

```bash
cd "Catholic Parish Web App"
```

---

## Step 2 — Install All Dependencies

Install both backend and frontend packages in one command:

```bash
npm run install:all
```

This runs `npm install` inside both `backend/` and `frontend/` folders.

> **Expected output:** Two `node_modules/` folders are created — one in `backend/` and one in `frontend/`.

---

## Step 3 — Create the PostgreSQL Database

Open a new terminal and connect to PostgreSQL:

```bash
psql -U postgres
```

Then run:

```sql
CREATE DATABASE parish_db;
\q
```

Or in a single command:

```bash
psql -U postgres -c "CREATE DATABASE parish_db;"
```

---

## Step 4 — Configure Environment Variables

Open `backend/.env` and update the database credentials if needed:

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/parish_db
JWT_SECRET=parish-app-jwt-secret-change-in-production-2024
JWT_REFRESH_SECRET=parish-app-refresh-secret-change-in-production-2024
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

> Replace `YOUR_PASSWORD` with your actual PostgreSQL password.

---

## Step 5 — Run the Database Schema Migration

Apply the full database schema (creates all 16 tables):

```bash
psql -U postgres -d parish_db -f backend/src/db/schema.sql
```

> **Expected output:** A series of `CREATE TABLE`, `CREATE INDEX`, and `INSERT` messages with no errors.

---

## Step 6 — Seed Demo Data

Populate the database with sample parish data:

```bash
cd backend
npm run db:seed
```

> **Expected output:**
> ```
> Seed completed successfully!
> Users created:
>   Admin:  admin@stmarys.org / Admin@1234
>   Clerk:  clerk@stmarys.org / Clerk@1234
>   Priest: priest@stmarys.org / Priest@1234
> ```

Go back to the root after seeding:

```bash
cd ..
```

---

## Step 7 — Start the Development Servers

### Option A — Double-click `start.bat` *(Windows, recommended)*

Double-click **`start.bat`** in the project root. It will:
1. Start the PostgreSQL Docker container (`parish-postgres`)
2. Launch the Backend API in a minimized window (port 4000)
3. Launch the Frontend in a minimized window (port 5173)
4. Open the app in your browser automatically

### Option B — Run both servers together (terminal)

```bash
npm run dev
```

### Option C — Run in separate terminals

**Terminal 1 — Backend API:**
```bash
npm run dev:backend
```
> Starts on: http://localhost:4000

**Terminal 2 — Frontend:**
```bash
npm run dev:frontend
```
> Starts on: http://localhost:5173

---

## Step 7b — Stop All Services

When you are done, shut everything down cleanly:

### Option A — Double-click `stop.bat` *(Windows, recommended)*

Double-click **`stop.bat`** in the project root. It will:
1. Kill the Backend API process (port 4000)
2. Kill the Frontend process (port 5173)
3. Stop the PostgreSQL Docker container (`parish-postgres`)

### Option B — Stop manually

```bash
# Kill backend (port 4000)
# Kill frontend (port 5173)
# Then stop Docker container:
docker stop parish-postgres
```

---

## Step 8 — Open the App in Your Browser

Visit: **http://localhost:5173**

You will see the **Parish Manager login screen**.

---

## Step 9 — Log In

Use one of the demo accounts created during seeding:

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Parish Admin | admin@stmarys.org | Admin@1234 | Full access |
| Sacramental Clerk | clerk@stmarys.org | Clerk@1234 | Create/update records |
| Priest | priest@stmarys.org | Priest@1234 | Approve sacraments |

---

## Step 10 — Explore the Application

After logging in, you will land on the **Dashboard**. From the left sidebar, navigate to:

| Module | What you can do |
|--------|----------------|
| **Dashboard** | View summary stats, charts, quick actions |
| **Families** | Browse families, view family cards, add members |
| **People** | Search parishioners, view sacramental timeline, generate certificates |
| **Sacraments** | View all records by type, filter by person name / date / celebrant, export CSV |
| **Certificates** | Manage certificate requests, view templates |
| **Admin** | Parish settings, user list, audit log *(Admin only)* |

---

## Optional — PDF Generation with Puppeteer

By default, certificates fall back to HTML if Puppeteer is not installed. To enable full PDF generation:

```bash
cd backend
npm install puppeteer
```

> Puppeteer downloads a Chromium browser (~300 MB) on first install.

---

## Optional — AWS S3 for Certificate Storage (Production)

Add these to `backend/.env`:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=parish-certificates
```

---

## Verify a Certificate (Public)

Anyone can verify a certificate without logging in by visiting:

```
http://localhost:5173/verify/<QR_TOKEN>
```

The QR token is printed on each generated certificate.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `psql: command not found` | Add PostgreSQL `bin` folder to your PATH |
| `ECONNREFUSED` on backend start | PostgreSQL is not running — start it first |
| `relation does not exist` error | Schema migration was not run — repeat Step 5 |
| `Seed failed: duplicate key` | Database already seeded — skip Step 6 or drop and recreate the DB |
| Frontend blank page | Check that backend is running on port 4000 |
| Login fails with correct credentials | Check `JWT_SECRET` is set in `backend/.env` |
| `stop.bat` says "no process found" | Services were already stopped or started via terminal (not `start.bat`) |
| Sacrament filter not returning results | Click **Apply** after entering filter values; use **Clear** to reset all filters |

---

## Project Structure Reference

```
Catholic Parish Web App/
├── STEPS.md                       ← You are here
├── SETUP.md                       ← Extended setup reference
├── CHANGELOG.md                   ← Record of all changes made to the app
├── start.bat                      ← Start all services (Windows)
├── stop.bat                       ← Stop all services (Windows)
├── package.json                   ← Root scripts (dev, install:all)
│
├── backend/                       ← Node.js + Express + TypeScript
│   ├── .env                       ← Environment variables
│   ├── package.json
│   └── src/
│       ├── index.ts               ← Express entry point (port 4000)
│       ├── db/
│       │   ├── schema.sql         ← PostgreSQL schema (all tables)
│       │   ├── seed.ts            ← Demo data seeder
│       │   └── pool.ts            ← DB connection pool
│       ├── middleware/
│       │   ├── auth.ts            ← JWT verification
│       │   ├── rbac.ts            ← Role-based access guards
│       │   └── audit.ts           ← Immutable audit logging
│       ├── routes/
│       │   ├── auth.ts            ← POST /auth/login, /auth/refresh
│       │   ├── families.ts        ← GET/POST/PUT /families
│       │   ├── people.ts          ← GET/POST/PUT /people
│       │   ├── sacraments.ts      ← GET/POST/PUT /sacraments
│       │   ├── certificates.ts    ← PDF generation + requests
│       │   └── admin.ts           ← Audit log, reports, settings
│       └── utils/
│           └── pdf.ts             ← Puppeteer PDF + QR code
│
└── frontend/                      ← React + TypeScript + Tailwind CSS
    ├── index.html
    ├── package.json
    ├── tailwind.config.js         ← Navy, gold, ivory palette
    ├── vite.config.ts             ← Dev proxy → backend:4000
    └── src/
        ├── main.tsx
        ├── App.tsx                ← React Router routes
        ├── index.css              ← Tailwind + print styles
        ├── api/client.ts          ← Axios with auto token refresh
        ├── contexts/
        │   └── AuthContext.tsx    ← Login/logout/role state
        ├── components/
        │   ├── Layout.tsx         ← Sidebar + main area shell
        │   ├── ProtectedRoute.tsx ← Auth + role guard
        │   ├── PageHeader.tsx
        │   └── StatCard.tsx
        ├── pages/
        │   ├── Login.tsx
        │   ├── Dashboard.tsx
        │   ├── Families.tsx
        │   ├── FamilyDetail.tsx
        │   ├── People.tsx
        │   ├── PersonDetail.tsx
        │   ├── Sacraments.tsx
        │   ├── Certificates.tsx
        │   ├── Admin.tsx
        │   └── Verify.tsx         ← Public: /verify/:token
        └── types/index.ts         ← TypeScript interfaces
```

---

*Catholic Parish Web App — MVP v1.0 | March 2026 | Last updated: 2026-03-17*
