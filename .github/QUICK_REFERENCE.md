---
title: EduSphere Development Quick Reference
---

# EduSphere Development Quick Reference

## 🚀 Quick Start

### First Time Setup
```bash
# Install dependencies
cd frontend && npm install
cd ../backend && npm install

# Configure environment
# Frontend: Create frontend/.env.local with VITE_API_BASE_URL
# Backend: Create backend/.env with database credentials

# Start dev servers
# Terminal 1: cd frontend && npm run dev  # localhost:5173
# Terminal 2: cd backend && npm run dev   # localhost:5001
```

### Common Commands
```bash
# Frontend
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # Check code quality
npm run preview   # Preview production build

# Backend
npm run dev       # Start with nodemon
npm start         # Production start
npm run validate  # Check .env setup
npm run check:s3  # Verify S3/Tigris config
```

---

## 📁 File Location Guide

| Task | Location | Convention |
|------|----------|-----------|
| **Create React component** | `frontend/src/components/` | PascalCase: `Button.jsx` |
| **Create React page** | `frontend/src/Pages/` | PascalCase + suffix: `Lectures_Page.jsx` |
| **Create API route** | `backend/src/routes/` | kebab-case: `auth.routes.js` |
| **Create route handler** | `backend/src/controllers/` | PascalCase class: `ResourceController.js` |
| **Add input validation** | `backend/src/validators/` | Feature name: `resource.validator.js` |
| **Add middleware** | `backend/src/middleware/` | kebab-case: `authenticate.js` |
| **Add utility function** | `frontend/src/utils/` or `backend/src/utils/` | camelCase: `formatDate.js` |
| **Add custom hook** | `frontend/src/hooks/` | camelCase with `use` prefix: `useResources.js` |

---

## 🎨 Component Creation Checklist

- [ ] Created file in `frontend/src/components/` with PascalCase name
- [ ] Component receives destructured props with defaults
- [ ] Has PropTypes or JSDoc for type documentation
- [ ] Styles use Tailwind utilities first, custom CSS only if necessary
- [ ] Includes accessibility features (focus states, ARIA labels, semantic HTML)
- [ ] Works on mobile, tablet, and desktop (responsive)
- [ ] No console.log statements in production code
- [ ] Exported with `export default` or named export
- [ ] Can be tested standalone in a page

---

## 📄 Page Creation Checklist

- [ ] Created file in `frontend/src/Pages/` with PascalCase + `_Page` suffix
- [ ] Integrated into `App.jsx` routing
- [ ] Data fetching uses custom hooks (e.g., `useResources()`)
- [ ] Has loading state (spinner or skeleton)
- [ ] Has error state with user-friendly message
- [ ] Has empty state if no data found
- [ ] Uses `ProtectedRoute` wrapper if auth-required
- [ ] Mobile-first responsive design (sm:, md:, lg: breakpoints)
- [ ] SEO-friendly: proper heading hierarchy, descriptions
- [ ] Accessible: keyboard navigation, ARIA labels, focus management

---

## 🔌 API Route Creation Checklist

- [ ] Created file in `backend/src/routes/` with `feature.routes.js` name
- [ ] Mounted in `backend/src/index.js` with `/api/path` prefix
- [ ] All POST/PATCH requests have input validation
- [ ] Protected routes use `authenticate` middleware
- [ ] Role checks use `authorizeRole()` middleware
- [ ] Responses follow standardized format (status, data, message)
- [ ] Error responses have meaningful messages
- [ ] HTTP status codes are correct (201 for POST, 204 for DELETE, etc.)
- [ ] Endpoint documented with JSDoc comments
- [ ] Tested with Postman or curl before submitting PR

---

## 🔐 Authentication & Authorization

### Protecting a Frontend Route
```jsx
import { ProtectedRoute } from '../components/ProtectedRoute';
import { ProfessorDashboard } from '../dashboard/ProfessorDashboard';

<Route 
  path="/dashboard/professor" 
  element={
    <ProtectedRoute requiredRole="professor">
      <ProfessorDashboard />
    </ProtectedRoute>
  } 
/>
```

### Protecting an API Endpoint
```javascript
const { authenticate } = require('../middleware/authenticate');
const { authorizeRole } = require('../middleware/role.middleware');

router.post(
  '/create',
  authenticate,              // Check JWT is valid
  authorizeRole('professor'), // Check user role
  async (req, res) => { ... }
);
```

### Getting Current User Data
```jsx
// Frontend
import { AuthContext } from '../context/AuthContext';
const { user, token } = useContext(AuthContext);

// Backend
const userId = req.user.id;  // Set by authenticate middleware
const userRole = req.user.role;
```

---

## 📊 Styling Patterns

### Responsive Grid (Most Common)
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map((item) => <Card key={item.id} {...item} />)}
</div>
```
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3 columns

### Button Variants
```jsx
// Primary
<button className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold">

// Secondary
<button className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold">

// Danger
<button className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold">
```

### Form Input
```jsx
<div className="mb-4">
  <label className="block mb-2 font-semibold">Label</label>
  <input className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
</div>
```

---

## 🐛 Debugging Common Issues

### 1. API Request Returns 401 (Unauthorized)
**Problem**: Token missing or invalid
```bash
# Check 1: Token is being sent
# Browser DevTools → Network → Request Headers → Authorization: Bearer <token>

# Check 2: Token is valid
# Backend: Middleware authenticate.js is receiving token?
```

### 2. CORS Error
**Problem**: Frontend can't reach backend
```bash
# Solution: Backend/index.js CORS origin must match frontend URL
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

# Restart backend server after changing .env
```

### 3. Tailwind Classes Not Applying
**Problem**: CSS not loading
```bash
# Solution: Restart dev server
npm run dev

# Or check tailwind.config.js includes correct file paths:
content: ['./index.html', './src/**/*.{js,jsx}']
```

### 4. OAuth Redirect Loop
**Problem**: Login redirects back to login
```bash
# Solution: Callback URI mismatch
# Check:
# 1. OAUTH_REDIRECT_URI in frontend .env
# 2. Registered callback in Google/GitHub OAuth app settings
# Both must match exactly (including protocol, domain, path)
```

### 5. S3 Upload Fails
**Problem**: File upload to S3 not working
```bash
# Solution: Check S3 credentials in backend .env
# Run:
npm run check:s3

# Then verify:
# - AWS_ACCESS_KEY_ID is correct
# - AWS_SECRET_ACCESS_KEY is correct
# - AWS_REGION matches S3 bucket region
# - S3_BUCKET name is correct
```

---

## 📋 Pre-Commit Checklist

Before pushing code:

- [ ] No console.log() statements in production code
- [ ] No hardcoded secrets or API keys
- [ ] Code follows naming conventions (camelCase variables, PascalCase components)
- [ ] All imports/exports are correct
- [ ] ESLint passing: `npm run lint` (frontend)
- [ ] Changes actually work in browser / tested with Postman (backend)
- [ ] Responsive design tested on mobile, tablet, desktop
- [ ] Accessibility: keyboard navigation works, focus visible
- [ ] No typos in variable/function names or UI text

---

## 📝 Git Workflow

### Create Feature Branch
```bash
git checkout -b feature/short-description
# E.g.: feature/add-resource-filtering, fix/auth-redirect
```

### Commit with Semantic Messages
```bash
git commit -m "feat: add resource filtering by subject"
git commit -m "fix: jwt expiry validation error"
git commit -m "refactor: extract ResourceCard component"
git commit -m "docs: update API documentation"
```

### Push & Create PR
```bash
git push origin feature/short-description
# Then open PR on GitHub with description of changes
```

---

## 🔍 Code Review Checklist (For Reviewers)

- [ ] Code follows EduSphere conventions (naming, file organization)
- [ ] Changes match PR description; no unrelated modifications
- [ ] Input validation on backend for all POST/PATCH requests
- [ ] Authentication/authorization checks on protected endpoints
- [ ] Error handling: no unhandled promise rejections
- [ ] Responsive design: tested on mobile/tablet/desktop
- [ ] Accessibility: keyboard navigation, ARIA labels, semantic HTML
- [ ] Performance: no N+1 queries, reasonable bundle size
- [ ] Comments only on complex logic; code is self-documenting
- [ ] Tests pass; lint passes

---

## 🚀 Deployment Pre-Check

### Before Deploying Frontend
```bash
cd frontend
npm run lint        # No errors
npm run build       # Builds successfully
npm run preview     # Preview production build locally
```

**Environment Variables (Vercel):**
- `VITE_API_BASE_URL` = production backend URL
- `VITE_OAUTH_REDIRECT_URI` = production callback URL

### Before Deploying Backend
```bash
cd backend
npm run validate    # .env setup correct
npm run check:s3    # S3 credentials valid
```

**Environment Variables (hosting provider):**
- All required .env vars set (see `backend/.env.example`)
- `NODE_ENV=production`
- Database migrations applied

---

## 📚 Resources & Links

- **Project Guide**: `.github/copilot-instructions.md`
- **React Component Tips**: `.github/agents/component-creator.md`
- **Page Building Tips**: `.github/agents/page-builder.md`
- **API Development Tips**: `.github/agents/backend-api.md`
- **Styling Guide**: `.github/agents/styling-specialist.md`
- **React 19 Docs**: https://react.dev
- **Vite Docs**: https://vitejs.dev
- **Tailwind CSS**: https://tailwindcss.com
- **Express.js**: https://expressjs.com
- **Neon**: https://neon.tech/docs
- **Drizzle ORM**: https://orm.drizzle.team/docs/overview

---

## ❓ Asking for Help

1. **Check this guide first** — Most common issues are in Debugging section
2. **Search GitHub Issues** — Your problem might be already solved
3. **Ask in team chat/PR comments** — Include:
   - What you're trying to do
   - What error you're getting
   - What you've already tried
   - Code snippet if relevant

---

*Last Updated: April 2026*
*Version: 1.0 (Production-ready)*
