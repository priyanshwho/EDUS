# EduSphere Development Guide for AI Agents

## Project Overview

**EduSphere** is a production-ready, full-stack academic resource platform with:
- **Frontend**: React 19 + Vite 6 SPA with role-based dashboards
- **Backend**: Express.js API with Neon PostgreSQL (Drizzle), AWS S3 uploads, OAuth authentication
- **Resources**: PYQs (Previous Year Question Papers), Class Notes, Lectures, Skill Development Courses
- **Access Model**: Public landing pages, role-based dashboards (Student/Professor/Admin), resource filtering by subject/skill

---

## Tech Stack Reference

| Layer | Technology | Version/Notes |
|-------|-----------|--------------|
| **Frontend** | React | 19.0.0, ESM module system |
| | Build Tool | Vite 6.2.0 |
| | Router | React Router v7.6.1 |
| | Styling | Tailwind CSS 3.4.17 + custom CSS (index.css) |
| **Backend** | Runtime | Node.js 18+ (CommonJS) |
| | Framework | Express 4.19.2 |
| | Database | Neon PostgreSQL |
| | Auth | JWT + Passport.js (Google, GitHub OAuth) |
| | File Storage | AWS S3 (Tigris integration) |
| **Dev Tools** | Linting | ESLint 9.21.0 (React hooks + refresh rules) |
| | File Upload | Multer 1.4.5 |
| | Validation | express-validator 7.0.1 |

---

## Key Files & Entry Points

### Frontend
- **App.jsx** — React Router setup, route definitions, AuthProvider wrapper
- **src/main.jsx** — Vite entry point
- **src/context/AuthContext.jsx** — Global authentication state (user, roles, token)
- **src/pages/** — Route-level components (PascalCase with PascalCase suffix: `Login.jsx`, `Lectures_Page.jsx`)
- **src/components/** — Reusable UI components, organized by function (Header, Footer, ProtectedRoute, etc.)
- **src/dashboard/** — Role-based dashboard containers (StudentDashboard, ProfessorDashboard, AdminDashboard)
- **src/services/** — API client service, resource service, auth service

### Backend
- **src/index.js** — Express server setup, middleware registration, route mounting, error handler
- **src/routes/** — Route modules: auth, resources, subjects, upload, analytics, announcements, users
- **src/controllers/** — Request handlers for each route
- **src/middleware/** — authenticate.js (JWT verification), role.middleware.js (role-based access), legacy.middleware.js (legacy feature deprecation)
- **src/db/** — Neon SQL + Drizzle client and schema
- **src/config/** — S3 and Passport configuration
- **src/services/** — S3 service (upload/download), slug service
- **src/validators/** — express-validator rules for input validation
- **schema.sql** — PostgreSQL schema with tables for resources, users, announcements, etc.

---

## Project Structure & Conventions

### Directory Organization

```
frontend/src/
├── components/
│   ├── design/           # Design component library
│   ├── Ui_*/             # Feature-specific UI (Ui_Lectures, Ui_Notes, etc.)
│   ├── Npx/              # Demo/NPX components
│   ├── previews/         # Preview/showcase components
│   ├── Header.jsx
│   ├── Footer.jsx
│   └── ProtectedRoute.jsx # Auth-aware route wrapper
├── Pages/
│   ├── Lectures_Page.jsx
│   ├── Pyqs_Page.jsx
│   ├── Notes_Page.jsx
│   ├── Login.jsx
│   ├── Signup.jsx
│   ├── ProfessorPin.jsx
│   ├── AuthCallback.jsx  # OAuth callback handler
│   └── ResourcePage.jsx  # Dynamic resource viewer
├── dashboard/
│   ├── StudentDashboard.jsx
│   ├── ProfessorDashboard.jsx
│   └── AdminDashboard.jsx
├── assets/
│   └── svg/              # React SVG icon components
├── context/
│   └── AuthContext.jsx   # Global auth state (token, user role, permissions)
├── services/
│   ├── api.js            # Axios/fetch API client with auth headers
│   ├── auth.service.js
│   └── resource.service.js
├── hooks/
│   ├── useResources.js   # Fetch resources with filters
│   └── useUpload.js      # Handle file uploads to S3
├── constants/
│   ├── Database.json     # Resource data (subjects, skills, etc.)
│   ├── Gemini.json       # AI model config
│   └── index.js          # Exported constants
└── utils/                # Helper functions
```

```
backend/src/
├── routes/
│   ├── auth.routes.js           # Login, signup, OAuth callbacks
│   ├── resource.routes.js        # CRUD for academic resources
│   ├── subject.routes.js         # Subject/category management
│   ├── upload.routes.js          # S3 file upload/download
│   ├── analytics.routes.js       # Professor analytics, platform stats
│   ├── announcement.routes.js    # Admin announcements
│   └── user.routes.js            # User profile, preferences
├── controllers/
│   ├── auth.controller.js
│   ├── resource.controller.js
│   ├── subject.controller.js
│   └── [others]
├── middleware/
│   ├── authenticate.js           # JWT verification (Bearer token)
│   ├── role.middleware.js        # Role-based access (student, professor, admin)
│   └── legacy.middleware.js      # Feature deprecation handlers
├── services/
│   ├── s3.service.js             # AWS S3 operations (upload, presigned URLs)
│   └── slug.service.js           # URL slug generation/validation
├── validators/
│   ├── auth.validator.js
│   └── resource.validator.js
├── db/
│   ├── client.js                 # Neon SQL + Drizzle client
│   └── schema.js                 # Drizzle schema definitions
├── config/
│   ├── s3.config.js              # Tigris AWS SDK config
│   └── passport.config.js        # OAuth strategies
├── utils/
│   └── response.js               # Standardized response format
└── schema.sql                    # PostgreSQL schema (roles, tables, policies)
```

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| **React Components & Pages** | PascalCase | `Header.jsx`, `Lectures_Page.jsx`, `StudentDashboard.jsx` |
| **Variables & Functions** | camelCase | `fetchResources()`, `userRole`, `handleSubmit()` |
| **Constants** | UPPER_SNAKE_CASE | `API_BASE_URL`, `MAX_FILE_SIZE` |
| **Route Paths** | lowercase + hyphens | `/api/auth/login`, `/api/resources/search` |
| **Database Tables** | snake_case | `user_roles`, `resource_categories`, `file_uploads` |
| **CSS Classes** | Tailwind when possible, else kebab-case | `bg-blue-500`, `.card-header` |

---

## Build & Development Commands

### Frontend
```bash
cd frontend

# Development server (http://localhost:5173 or 0.0.0.0:5173)
npm run dev

# Production build
npm run build

# Lint check
npm run lint

# Preview production build
npm run preview
```

### Backend
```bash
cd backend

# Development server (nodemon, port 5001)
npm run dev

# Production server
npm start

# Validation scripts
npm run validate      # Check .env setup
npm run check:roles   # Verify role configurations
npm run check:slug    # Verify slug format rules
npm run check:s3      # Verify S3/Tigris setup
```

---

## Environment Configuration

### Frontend (.env or .env.local)
```env
VITE_API_BASE_URL=http://localhost:5001/api
VITE_OAUTH_REDIRECT_URI=http://localhost:5173/auth/callback
```

### Backend (.env)
```env
# Server
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Neon PostgreSQL
DATABASE_URL=postgresql://user:password@ep-xxxxxx.region.aws.neon.tech/edusphere?sslmode=require

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# AWS S3 / Tigris
AWS_REGION=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=...

# File Upload
MAX_FILE_SIZE=52428800  # 50MB
```

Access example `.env` files:
- Backend: `backend/.env.example`

---

## Authentication & Authorization Flow

### JWT + OAuth Pattern
1. **Initial OAuth**: User clicks "Login with Google/GitHub" → Redirects to OAuth provider → Backend verifies token → Backend generates JWT → JWT stored in `AuthContext`
2. **Subsequent requests**: API client adds `Authorization: Bearer <JWT>` header
3. **Middleware**: `authenticate.js` verifies JWT; `role.middleware.js` checks permissions

### User Roles
- **student** — Can view/download resources, submit feedback
- **professor** — Can create resources, view analytics for own resources
- **admin** — Full platform access, manage users, create announcements

### Protected Routes
```jsx
<ProtectedRoute requiredRole="professor">
  <ProfessorDashboard />
</ProtectedRoute>
```

---

## API Patterns & Conventions

### Request/Response Format
**Success Response:**
```json
{
  "status": "success",
  "data": { ... },
  "message": "Operation completed"
}
```

**Error Response:**
```json
{
  "status": "error",
  "error": "Descriptive error message",
  "code": "ERROR_CODE"
}
```

### Endpoint Categories

| Category | Purpose | Example Endpoints |
|----------|---------|-------------------|
| **Auth** | Login, signup, OAuth callbacks | POST `/auth/login`, POST `/auth/signup`, GET `/auth/google/callback` |
| **Resources** | CRUD academic materials | GET `/resources/search`, POST `/resources`, GET `/resources/{id}` |
| **Subjects** | Category/subject management | GET `/subjects`, POST `/subjects` |
| **Upload** | S3 file operations | POST `/upload/presigned-url`, GET `/upload/{fileId}` |
| **Analytics** | Professor/platform metrics | GET `/analytics/professor/{id}`, GET `/analytics/platform` |
| **Announcements** | Admin-created broadcasts | GET `/announcements`, POST `/announcements` |
| **Users** | Profile, preferences | GET `/users/{id}`, PATCH `/users/{id}` (auth required) |

### Input Validation Pattern
Use `express-validator` for all POST/PATCH endpoints:
```js
const { body, validationResult } = require('express-validator');

router.post('/resource', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('subject').isIn(['ECE', 'IT', 'MECH']).withMessage('Invalid subject'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  // Process...
});
```

---

## Key Features & Implementation Notes

### 1. Role-Based Dashboards
- **StudentDashboard**: Browse resources by subject/skill, download materials, track progress
- **ProfessorDashboard**: Create/edit own resources, view analytics (views, downloads, engagement)
- **AdminDashboard**: Manage users, publish announcements, platform-wide analytics

**Implementation Pattern:**
- Route protection via `ProtectedRoute` component with `requiredRole` prop
- API authorization via middleware: `authenticate()` → `authorizeRole('professor')`

### 2. Resource Management
- Resources stored in Neon PostgreSQL via Drizzle
- Metadata: title, subject, type (lecture/note/pyq), file_url (S3), created_by (professor), created_at
- Filtering: by subject, type, skill level; search by title/description
- File access: Presigned URLs for S3 downloads

### 3. File Upload (S3/Tigris)
- Frontend initiates upload → Backend returns presigned URL → Frontend uploads directly to S3 → Backend stores metadata
- Max file size: 50MB (configurable)
- Supported types: PDF, DOCX, PPT, images

**Hook Pattern:**
```jsx
const { upload, uploading, error } = useUpload();
await upload(file, { subject: 'ECE', type: 'lecture' });
```

### 4. OAuth Integration
- Google & GitHub sign-in via Passport.js
- Callback routes: `/auth/google/callback`, `/auth/github/callback`
- On first sign-in: Create user in Neon users table, assign default role (student)
- JWT issued upon successful OAuth verification

### 5. Analytics
- **Professor**: Track views/downloads of own resources
- **Platform**: Total resources, user count, engagement metrics
- Queries: Role-scoped SQL queries and middleware authorization ensure data isolation

---

## Development Workflow

### Adding a New Feature

#### 1. **Backend-First Approach (Recommended)**
```
1. Extend schema.sql (if new table/field needed)
2. Create validator in src/validators/
3. Create controller function in src/controllers/
4. Add route to src/routes/
5. Test with curl/Postman
6. Document endpoint in this guide
```

#### 2. **Frontend Integration**
```
1. Create service function in src/services/
2. Create page or component in src/Pages/ or src/components/
3. Use useResources() hook or custom fetch
4. Wire into App.jsx routing
5. Test end-to-end
```

#### 3. **Commit & Code Review**
- Branch naming: `feature/resource-filtering`, `fix/auth-redirect`
- Commit messages: `feat: add resource filtering by subject`
- PR template: Description, testing steps, environment changes

### Testing Strategy

- **Backend**: Manual testing via curl/Postman; consider adding Jest for unit tests
- **Frontend**: Manual testing in browser; ESLint for code quality
- **Integration**: Test OAuth flow, file uploads, role-based access in dev environment

### Debugging Common Issues

| Issue | Diagnosis | Solution |
|-------|-----------|----------|
| **CORS Error** | API blocked by frontend origin | Check `CORS_ORIGIN` in backend config matches `CLIENT_URL` |
| **JWT Invalid** | Token missing or expired | Ensure `Authorization: Bearer <token>` header is set; refresh token if expired |
| **S3 Upload Fails** | AWS credentials or bucket config | Run `npm run check:s3` in backend; verify bucket permissions |
| **Neon Connection** | Database unreachable | Check `DATABASE_URL` in .env; verify Neon project/branch status and network access |
| **OAuth Redirect Loop** | Callback URI mismatch | Ensure `OAUTH_REDIRECT_URI` matches registered redirect in OAuth app settings |

---

## Deployment Guidelines

### Frontend (Vercel Recommended)
```bash
# Build locally
npm run build

# Deploy via Vercel CLI
vercel deploy --prod
```

**Environment Variables (Vercel Dashboard):**
- `VITE_API_BASE_URL` → Production API URL
- `VITE_OAUTH_REDIRECT_URI` → Production callback URL

### Backend (Flexible: Render, Railway, AWS EC2, etc.)
```bash
# Set environment variables in hosting dashboard
# Deploy: Push to main → CI/CD triggers build & deploy
```

**Pre-deployment Checklist:**
- [ ] Run all validation scripts: `npm run validate`, `npm run check:roles`, `npm run check:s3`
- [ ] Test OAuth providers (Google & GitHub) redirects
- [ ] Verify S3/Tigris bucket is accessible
- [ ] Database migrations applied: Check schema.sql
- [ ] CORS origin updated to production frontend URL
- [ ] JWT secret is strong and unique per environment
- [ ] Error logging configured (optional: Sentry, LogRocket)

---

## Contributing & Code Review Guidelines

### Before Submitting PR

1. **Code Quality**
   - Run `npm run lint` (frontend); fix all warnings
   - No console.log in production code (use proper logging)
   - Comments for complex logic only (code should be self-documenting)

2. **Testing**
   - Manual end-to-end testing in dev environment
   - Verify on multiple devices/browsers (frontend)
   - Test with different user roles (student/professor/admin)

3. **Commit Hygiene**
   - Atomic commits: Each commit represents one logical change
   - Descriptive messages: `fix: correct JWT expiry calculation` (not: `fix stuff`)

4. **PR Description**
   - Summary of changes
   - Motivation/context
   - Testing steps for reviewer
   - Screenshots (if UI changes)
   - Breaking changes (if any)

### Code Review Expectations

- **Readability**: Code is self-documenting logic
- **Conventions**: Follows naming/organization patterns in this guide
- **Error Handling**: All API calls handle success/error states
- **Security**: No hardcoded secrets, proper input validation, auth checks before data access
- **Performance**: Reasonable request/response sizes; consider caching for expensive queries

---

## Architecture Decisions & Rationale

1. **Separate Frontend & Backend Repos** (within single monorepo)
   - Allows independent scaling, deployment, and development cycles
   - Frontend can be CDN-hosted (Vercel); backend on separate server

2. **Neon PostgreSQL + Drizzle**
   - Serverless PostgreSQL with branch-based workflows
   - Type-safe schema/query layer with Drizzle
   - Reduced operational overhead with standard SQL portability

3. **AWS S3/Tigris for File Storage**
   - Decouples file storage from database
   - Presigned URLs for secure, time-limited downloads
   - Scalable for 1000s of resource files

4. **JWT + OAuth Hybrid**
   - OAuth handles initial authentication (trust provider)
   - JWT enables stateless API (scales across multiple backend instances)
   - Refresh tokens for extended sessions

5. **React Router v7**
   - Native ESM support
   - Simplified nested routing for complex dashboards
   - Built-in form handling (future integration)

---

## Links to Related Documentation

- [React 19 Migration Guide](https://react.dev/blog/2024/12/05/react-19)
- [Vite Documentation](https://vitejs.dev/)
- [React Router v7 Docs](https://reactrouter.com/)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Neon Documentation](https://neon.tech/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [AWS S3 Presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)
- [Passport.js Strategies](http://www.passportjs.org/strategies/)

---

## Quick Reference Commands

```bash
# Frontend
cd frontend && npm run dev          # Start dev server
npm run lint                        # Check for syntax/style issues
npm run build                       # Create production bundle

# Backend
cd backend && npm run dev           # Start with nodemon
npm run start                       # Production start
npm run validate                    # Check environment setup
npm run check:s3                    # Verify S3 configuration

# Git
git checkout -b feature/my-feature  # Create feature branch
git commit -m "feat: description"   # Semantic commit message
git push origin feature/my-feature  # Push and open PR
```

---

## Next Steps for New Contributors

1. ✅ **Read this guide** to understand project structure & conventions
2. ✅ **Clone & setup repos** — Install Node 18+, npm deps, .env files
3. ✅ **Verify setup** — Run dev servers and access http://localhost:5173
4. ✅ **Test OAuth** — Sign in with Google/GitHub to verify auth flow
5. ❓ **Pick a task** — Check GitHub Issues for "good first issue" labels
6. ✅ **Create branch** — `git checkout -b feature/issue-title`
7. ✅ **Develop & test** — Commit atomically, write descriptive messages
8. ✅ **Submit PR** — Include description, testing steps, screenshots

**Questions?** Open a GitHub Issue or contact maintainers.

---

*Last Updated: April 2026*
*Applies to: Frontend (React 19 + Vite 6) & Backend (Express.js + Neon/Drizzle)*
