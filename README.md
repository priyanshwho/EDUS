# EduSphere — Academic Resource Platform

> Making Your Academic Life Easier — notes, tips, tools, and real support every day.

![EduSphere Preview](frontend/public/image.png)

A production-ready, modular academic platform with role-based access control, Google Drive legacy support, Tigris S3 uploads, Neon PostgreSQL + Drizzle, and OAuth.

---

## Project Structure

```
Edusphere/
├── backend/                  # Express.js API server
│   ├── src/
│   │   ├── analytics/        # Professor & platform analytics
│   │   ├── auth/             # JWT utilities
│   │   ├── config/           # S3, Passport config
│   │   ├── db/               # Neon + Drizzle client/schema
│   │   ├── controllers/      # Route handlers
│   │   ├── middleware/       # Auth, role, legacy protection
│   │   ├── routes/           # Express routers
│   │   └── services/         # S3 service, slug service
│   ├── schema.sql            # PostgreSQL schema (Neon compatible)
│   ├── drizzle.config.js     # Drizzle Kit configuration
│   ├── .env.example
│   └── package.json
│
├── frontend/                 # React + Vite + Tailwind
│   └── src/
│       ├── context/          # AuthContext (global auth state)
│       ├── dashboard/        # StudentDashboard, ProfessorDashboard, AdminDashboard
│       ├── hooks/            # useResources, useUpload
│       ├── Pages/            # Login, Signup, ProfessorPin, AuthCallback, ...
│       ├── services/         # api.js, auth.service, resource.service, ...
│       └── components/       # ProtectedRoute, Header, ...
│
└── .github/
    └── scripts/              # Validation scripts
        ├── validate-env.js
        ├── check-roles.js
        ├── check-slug-format.js
        ├── verify-permissions.js
        ├── verify-s3-config.js
        └── setup-check.js
```

---

## Quick Setup

### 1. Clone & install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

```bash
cp .env.example backend/.env
# Fill in backend/.env with your credentials (see below)
```

Required values:
- **Neon PostgreSQL** — `DATABASE_URL`
- **JWT secrets** — two different 32+ char random strings
- **Google OAuth** — client ID + secret from [console.cloud.google.com](https://console.cloud.google.com)
- **GitHub OAuth** — client ID + secret from [github.com/settings/developers](https://github.com/settings/developers)
- **ADMIN_EMAIL** — `priyanshu82711@gmail.com` (auto-detected as admin on login)
- **PROFESSOR_PIN** — 4–8 digit PIN known only to professors
- **Tigris S3** — access key, secret, bucket name from [fly.io](https://fly.io/docs/reference/tigris/)

### 3. Apply the database schema

Open your Neon SQL editor (or any PostgreSQL client connected to your Neon database) and run:

```sql
-- Paste the contents of backend/schema.sql
```

### 4. Validate configuration

```bash
cd backend
npm run validate       # env vars
npm run check:roles    # role middleware
npm run check:slug     # slug format
npm run check:s3       # S3 config
```

Or run all at once:

```bash
node .github/scripts/setup-check.js
```

### 5. Start

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

---

## Authentication

| Method         | Flow |
|----------------|------|
| Email/Password | Signup → Login → JWT |
| Google OAuth   | `/api/auth/google` → callback → JWT |
| GitHub OAuth   | `/api/auth/github` → callback → JWT |
| Professor PIN  | Login → `pin_required: true` → `/auth/verify-pin` → full JWT |

**Admin auto-detection**: If the logged-in email matches `ADMIN_EMAIL`, the role is overridden to `admin` automatically.

---

## Role Permissions

| Action                         | Student | Professor | Admin |
|--------------------------------|:-------:|:---------:|:-----:|
| View/preview/download          | ✅      | ✅        | ✅    |
| Save resources                 | ✅      | ✅        | ✅    |
| Share resources                | ✅      | ✅        | ✅    |
| Upload PDF / YouTube           | ❌      | ✅ (own)  | ✅    |
| Upload Drive links (legacy)    | ❌      | ❌        | ✅    |
| Edit/delete own uploads        | ❌      | ✅        | ✅    |
| Edit/delete any upload         | ❌      | ❌        | ✅    |
| Post announcements             | ❌      | ✅        | ✅    |
| Add subjects                   | ❌      | ✅        | ✅    |
| Manage users                   | ❌      | ❌        | ✅    |
| View analytics                 | ❌      | ✅ (own)  | ✅ (all) |

---

## Slug Format

```
<acronym>-<resource_type>-sem<semester>[-<pyq_type>][-<year>]
```

Examples:
- `daa-pyq-sem3-major-2023`
- `os-notes-sem4-2024`
- `dbms-assignment-sem5`

Slugs are:
- Lowercase + hyphen-separated
- Unique (suffix appended if conflict)
- Immutable after creation

---

## S3 Upload Flow

```
Client → POST /api/upload/presign → { uploadUrl, key }
Client → PUT <uploadUrl> (file directly to Tigris)
Client → POST /api/resources { aws_s3_key: key, ...meta }
```

Download uses pre-signed GET URLs (10 min expiry). Credentials never exposed to client.

---

## Validation Scripts

| Script | Command |
|--------|---------|
| All checks | `node .github/scripts/setup-check.js` |
| Env vars | `npm run validate` |
| Roles | `npm run check:roles` |
| Slug format | `npm run check:slug` |
| S3 config | `npm run check:s3` |
| Permissions | `node .github/scripts/verify-permissions.js` |
