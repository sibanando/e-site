# Changelog

All notable changes to the Catholic Parish Web App are documented here.

---

## [Unreleased] — 2026-03-17

### Added — `start.sh` and `stop.sh` Linux service scripts

- Created `start.sh`: starts PostgreSQL (systemctl), waits for it to be ready, starts backend via PM2, starts Nginx. Prints the public IP when done.
- Created `stop.sh`: stops backend (PM2), frontend port, and PostgreSQL (systemctl).
- Both scripts are Linux/EC2 equivalents of `start.bat` / `stop.bat`.
- Referenced in `EC2-MIGRATION.md` under new "Starting Services" and "Stopping Services" sections.

---

### Added — `stop.sh` Linux service shutdown script

- Created `stop.sh` at the project root as a Linux/EC2 equivalent of `stop.bat`.
- Stops services in order: Backend API (PM2 / port 4000), Frontend (port 5173), PostgreSQL (`systemctl`).
- Referenced in `EC2-MIGRATION.md` under a new "Stopping Services" section.

---

### Added — `EC2-MIGRATION.md` deployment guide

- Created `EC2-MIGRATION.md` at the project root with a full step-by-step guide to migrate the app to an AWS EC2 instance.
- Covers: EC2 provisioning, security group rules, PostgreSQL setup, backend build + PM2, frontend Vite build + Nginx reverse proxy, HTTPS via Certbot, and daily pg_dump backups.

---

### Updated — `STEPS.md` documentation

- **Step 7** (Start servers) — added **Option A: `start.bat`** as the recommended Windows method with a description of what it does.
- **Step 7b** (new section) — added stop instructions with **Option A: `stop.bat`** and a manual fallback.
- **Step 10** (Explore the app) — updated Sacraments module description to mention person name filter.
- **Troubleshooting** — added two new rows: `stop.bat` "no process found" and sacrament filter usage tip.
- **Project Structure** — added `CHANGELOG.md`, `start.bat`, and `stop.bat` entries.
- Updated footer timestamp to `2026-03-17`.

---

### Added — `stop.bat` service shutdown script

- **Created `stop.bat`** at the project root, mirroring `start.bat`.
- Stops services in reverse order:
  1. **Backend API** — kills the process listening on port `4000` using `netstat` + `taskkill`.
  2. **Frontend** — kills the process listening on port `5173` using the same method.
  3. **PostgreSQL (Docker)** — runs `docker stop parish-postgres`.
- Each step prints a status line so the user can see what was stopped.

---

### Fixed — Sacraments Page: Search & Filter Not Working

**Issue:** The Sacraments page filters (sacrament type tabs, date range, celebrant) were not returning filtered results. Additionally, there was no way to search records by person name.

#### Backend — `backend/src/routes/sacraments.ts`

- **Added `personName` query parameter** to the `GET /api/sacraments` route.
- **Added SQL condition** for person name search:
  - Matches against `p.first_name`, `p.last_name`, or the full name (`first_name + ' ' + last_name`) using `ILIKE` (case-insensitive, partial match).
  - Example: searching `"reyes"` will match `"Carmen Reyes"`.

```ts
// Before
const { typeCode, personId, celebrant, dateFrom, dateTo, status, ... } = req.query;

// After
const { typeCode, personId, personName, celebrant, dateFrom, dateTo, status, ... } = req.query;
if (personName) {
  conditions.push(`(p.first_name ILIKE $${idx} OR p.last_name ILIKE $${idx} OR CONCAT(p.first_name, ' ', p.last_name) ILIKE $${idx})`);
  params.push(`%${personName}%`);
  idx++;
}
```

#### Frontend — `frontend/src/pages/Sacraments.tsx`

- **Added `personSearch` state variable** (`useState('')`).
- **Added "Search by person name…" input field** in the filter bar (placed before the celebrant field).
- **Updated `load()` function signature** to accept and pass `personSearch` as the `person` parameter, sent to the API as `personName`.
- **Updated `handleTabChange()`** to pass `personSearch` when switching sacrament type tabs.
- **Updated Clear button** to reset `personSearch` state and pass empty string to `load()`.

**Filter bar now includes:**
| Field | Filters By |
|---|---|
| Sacrament type tabs | `typeCode` — exact match on sacrament type |
| From / To date | `dateFrom` / `dateTo` — date range on `sacraments.date` |
| Person name input | `personName` — partial, case-insensitive match on `first_name` / `last_name` |
| Celebrant input | `celebrant` — partial, case-insensitive match on `sacraments.celebrant` |

---

*v1.0 — Initial release, March 2026*
