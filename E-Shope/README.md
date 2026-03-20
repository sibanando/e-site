# E-Shope

A full-stack e-commerce application — React + Vite frontend, Node/Express backend, PostgreSQL database.

## Features

- Product catalog, shopping cart, user auth (JWT)
- Checkout with mock PhonePe / Google Pay / UPI QR
- Admin panel (product & user management)
- Seller panel with stats

## Stack

| Layer    | Tech                          |
|----------|-------------------------------|
| Frontend | React 19, Vite 7, Nginx       |
| Backend  | Node 20, Express, `pg`        |
| Database | PostgreSQL 16                 |
| Infra    | Kubernetes (kind) / Docker Compose |

---

## Run with Kubernetes (recommended)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running)
- [kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installation)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)

### One-command deploy

```bash
# From project root
bash k8s/deploy.sh
```

Then open **http://localhost:8080**

### What the script does
1. Creates a kind cluster with ingress port mappings
2. Installs nginx ingress controller
3. Builds backend + frontend Docker images
4. Loads them into the kind cluster (no registry needed)
5. Applies all K8s manifests via kustomize
6. Waits for every pod to be `Ready`

### After code changes (fast reload)

```bash
bash k8s/redeploy.sh backend    # rebuild + reload backend only
bash k8s/redeploy.sh frontend   # rebuild + reload frontend only
bash k8s/redeploy.sh            # both
```

### Tear down

```bash
bash k8s/teardown.sh
```

### Kubernetes manifests (`k8s/`)

| File | Purpose |
|------|---------|
| `namespace.yaml` | `apnidunia` namespace |
| `postgres-secret.yaml` | DB credentials + JWT secret |
| `configmap.yaml` | Non-secret env vars |
| `postgres-pvc.yaml` | 20 Gi PVC (kind local-path provisioner) |
| `postgres-deployment.yaml` | Postgres 16, `PGDATA` subdir, Recreate strategy |
| `postgres-service.yaml` | ClusterIP on 5432 |
| `backend-deployment.yaml` | Express API, initContainer waits for pg |
| `backend-service.yaml` | ClusterIP on 5000 |
| `frontend-deployment.yaml` | Nginx serving Vite build |
| `frontend-service.yaml` | ClusterIP on 80 |
| `ingress.yaml` | Routes `/api` → backend, `/` → frontend |
| `kind-config.yaml` | Cluster config with port 8080→80 mapping |

### Access

| URL | Description |
|-----|-------------|
| http://localhost:8080 | Frontend |
| http://localhost:8080/api/health | Backend health |
| http://localhost:8080/admin | Admin panel |

**Admin credentials:** `sibanando` / `Sib@1984`

---

## Run with Docker Compose (simple local dev)

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:8181 |
| Backend API | http://localhost:5000 |

---

## Project structure

```
E-Shope/
├── backend/          # Express API
│   ├── index.js      # Entry point
│   └── src/
│       ├── config/db.js
│       └── routes/
├── frontend/         # React + Vite
│   └── src/
├── k8s/              # Kubernetes manifests
│   ├── deploy.sh
│   ├── redeploy.sh
│   └── teardown.sh
└── docker-compose.yml
```

## Notes

- Database is seeded with demo users and products on first start
- Auth uses JWT stored in LocalStorage
- Tailwind is disabled — all styles use React inline `style={{}}`
