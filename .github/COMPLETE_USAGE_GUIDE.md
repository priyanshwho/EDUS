---
title: Complete Usage Guide - EduSphere AI Development System
---

# Complete Usage Guide: EduSphere AI Development System

This guide explains **how to use every tool**, instruction, agent, and script created for the EduSphere project to be maximally productive with AI-assisted development.

---

## 📚 Overview of What You Have

```
.github/
├── copilot-instructions.md        ← Main guide (read first)
├── QUICK_REFERENCE.md             ← Command checklists (bookmark this)
├── EXAMPLE_PROMPTS.md             ← Copy-paste prompt examples
├── agents/                        ← Specialized AI agent guides
│   ├── component-creator.md       ← React components
│   ├── page-builder.md            ← Full pages
│   ├── backend-api.md             ← Express endpoints
│   ├── styling-specialist.md      ← Tailwind CSS
│   ├── database-schema.md         ← PostgreSQL/Supabase
│   ├── testing-patterns.md        ← Jest/Vitest/Supertest
│   └── cicd-setup.md              ← GitHub Actions
├── hooks/                         ← Git hooks
│   ├── pre-commit                 ← Code quality checks
│   └── commit-msg                 ← Semantic commits
└── workflows/                     ← GitHub Actions (if configured)
    ├── frontend-test.yml
    ├── frontend-deploy.yml
    ├── backend-test.yml
    └── backend-deploy.yml

setup-hooks.sh                      ← Auto-setup script
```

---

## 🚀 Getting Started (First Time Setup)

### Step 1: Install Git Hooks
```bash
# Make script executable and run
chmod +x setup-hooks.sh
./setup-hooks.sh
```

Output shows:
```
✓ pre-commit hook installed
✓ commit-msg hook installed
```

**What this does**: Prevents you from committing bad code (console.log, .env files, etc.)

### Step 2: Read the Main Guide
Open `.github/copilot-instructions.md` and skim through. You don't need to memorize it—it's a reference.

### Step 3: Bookmark Quick Reference
Keep `.github/QUICK_REFERENCE.md` handy. It has common commands, checklists, and debugging tips.

### Step 4: Set Up .env Files
```bash
# Frontend
cd frontend
cp .env.example .env.local   # If available
# Add: VITE_API_BASE_URL=http://localhost:5000/api

# Backend
cd ../backend
cp .env.example .env
# Add: SUPABASE_URL, AWS credentials, OAuth secrets, etc.
```

### Step 5: Start Development Servers
```bash
# Terminal 1: Frontend
cd frontend && npm run dev

# Terminal 2: Backend
cd backend && npm run dev

# Verify:
# Frontend: http://localhost:5173
# Backend: http://localhost:5000/health → {"status":"ok"}
```

---

## 🎯 Workflow: Common Development Tasks

### ✨ Task 1: Build a New Component

**Scenario**: You need to create a `ResourceFilterPanel` component for the lectures page.

#### Step 1: Open GitHub Copilot Chat
Use Ctrl+I (or Cmd+I on Mac) in VS Code

#### Step 2: Copy a Prompt Template
From `.github/EXAMPLE_PROMPTS.md`, find the "Build a Resource Filter Component" example and copy it.

#### Step 3: Customize for Your Needs
```
Create a ResourceFilterComponent that allows filtering by subject (ECE, IT, MECH), 
type (lecture, note, pyq), and search text. Include:
- Multi-select subject filter with checkboxes
- Radio buttons for type selection
- Search input field
- "Clear filters" button
- Should be mobile-responsive
- Accessible with keyboard navigation

Follow .github/copilot-instructions.md for conventions.
```

#### Step 4: Let AI Generate
- AI loads `component-creator.md` guide automatically
- Creates `frontend/src/components/ResourceFilterPanel.jsx`
- Uses Tailwind CSS
- Includes PropTypes
- Adds accessibility

#### Step 5: Review & Integrate
```bash
# Check it compiles
npm run lint

# Use in your page
import { ResourceFilterPanel } from '../components';
```

#### Step 6: Commit
The git hooks automatically check:
- ✓ No console.log
- ✓ PascalCase naming
- ✓ Valid commit message

```bash
git add frontend/src/components/ResourceFilterPanel.jsx
git commit -m "feat: add resource filter component"
# Output: ✅ All pre-commit checks passed!
```

---

### 🌐 Task 2: Create a New API Endpoint

**Scenario**: Backend needs POST `/api/resources/rate` endpoint to rate resources.

#### Step 1: Use Database Schema Guide
Open `.github/agents/database-schema.md` and check if you need database changes. If yes:
- Add column to resources table (if not already there)
- Create ratings table
- Update schema.sql

#### Step 2: Use Backend API Guide
Copy a prompt from `.github/EXAMPLE_PROMPTS.md`:
```
Create API endpoints for rating resources:

POST /api/resources/:id/rate — Rate a resource (student+)
  Body: { rating: 1-5 }
  Response: { status: 'success', data: { rating, avgRating } }
  
GET /api/resources/:id/ratings — Get rating summary
  Response: { status: 'success', data: { avgRating, count, userRating } }

Include input validation (1-5), prevent duplicate ratings per user, auth checks.
Follow .github/agents/backend-api.md patterns.
```

#### Step 3: AI Generates
- Creates `backend/src/routes/resource.routes.js` addition
- Creates `backend/src/controllers/resource.controller.js` with logic
- Creates `backend/src/validators/resource.validator.js` with validation
- Includes proper error handling, auth checks, response format

#### Step 4: Test with Postman
```bash
POST http://localhost:5000/api/resources/123/rate
Authorization: Bearer <token>
Content-Type: application/json
{ "rating": 5 }
```

#### Step 5: Write Tests
Use `.github/agents/testing-patterns.md`:
```javascript
test('rates resource successfully', async () => {
  const response = await request(app)
    .post('/api/resources/123/rate')
    .set('Authorization', `Bearer ${validToken}`)
    .send({ rating: 5 })
    .expect(201);
  
  expect(response.body.data.rating).toBe(5);
});
```

#### Step 6: Commit
```bash
git add backend/src/
git commit -m "feat(api): add resource rating system"
```

---

### 📄 Task 3: Create a New Page

**Scenario**: Need a Student Dashboard page.

#### Step 1: Copy Page Example
From `.github/EXAMPLE_PROMPTS.md`, find "Create Professor Dashboard" and adapt:
```
Build StudentDashboard with:
1. Welcome section with student name
2. Stats cards: Resources Accessed, Downloaded, Favorited
3. List of recent resources accessed
4. Recommended resources based on subject preference
5. "Browse All Resources" button
6. Only accessible to students (require auth)
```

#### Step 2: AI Generates
- Creates `frontend/src/Pages/StudentDashboard.jsx`
- Uses `useResources()` hook for data
- Responsive layout
- Loading/error/empty states
- Protected route wrapper

#### Step 3: Add to Routing
```javascript
// In frontend/src/App.jsx
import { ProtectedRoute } from './components/ProtectedRoute';
import StudentDashboard from './Pages/StudentDashboard';

<Route 
  path="/dashboard/student" 
  element={
    <ProtectedRoute requiredRole="student">
      <StudentDashboard />
    </ProtectedRoute>
  } 
/>
```

#### Step 4: Test End-to-End
```bash
# 1. Start both servers
cd frontend && npm run dev
cd ../backend && npm run dev

# 2. Login as student at http://localhost:5173/login
# 3. Navigate to /dashboard/student
# 4. Verify data loads and displays correctly
```

#### Step 5: Commit
```bash
git add frontend/src/Pages/StudentDashboard.jsx frontend/src/App.jsx
git commit -m "feat: add student dashboard page"
```

---

## 🧪 Using Testing & Validation

### Run Tests Locally
```bash
# Frontend tests
cd frontend && npm test

# Backend tests
cd backend && npm test

# Both with coverage
npm test -- --coverage
```

### Check Code Quality
```bash
# Lint
npm run lint

# Validate setup
cd backend && npm run validate
cd backend && npm run check:s3
```

### Pre-deployment Validation
```bash
# Before pushing to main branch:
npm run lint            # No errors
npm test                # All tests pass
npm run build           # Production build succeeds

cd backend
npm run validate        # .env setup correct
```

---

## 🔄 CI/CD Integration

### Understand the Pipeline

When you push to `main`:

```
1. GitHub Actions triggered
   ↓
2. ESLint run on frontend
   ↓
3. pytest run on backend (if configured)
   ↓
4. Frontend build, bundle size check
   ↓
5. Backend security scan
   ↓
6. (If all pass) Deploy to Vercel/Render
   ↓
7. Slack notification
```

### Monitor Deployments
```bash
# GitHub UI: Actions tab
# See live logs as pipeline runs

# View deployment status:
# Frontend: https://vercel.com/dashboard
# Backend: https://render.com/dashboard
```

### Troubleshoot Pipeline Issues
```
If pipeline fails, check:
1. "Actions" tab in GitHub → click failed run
2. Scroll to see which step failed
3. Read error message
4. Common causes:
   - .env variables missing → Set in GitHub Secrets
   - Test failure → Run locally to reproduce
   - Lint error → Run npm run lint locally
   - Deploy error → Check hosting provider logs
```

---

## 📝 Semantic Commit Convention

### Commit Message Format
```
type(optional scope): description
```

#### Valid Types
| Type | Use When | Example |
|------|----------|---------|
| **feat** | Adding new feature | `feat: add resource filtering` |
| **fix** | Fixing bug | `fix: resolve JWT validation` |
| **docs** | Updating documentation | `docs: update API documentation` |
| **refactor** | Restructuring code | `refactor: simplify auth middleware` |
| **style** | Formatting/styling changes | `style: adjust resource card spacing` |
| **test** | Adding/updating tests | `test: add upload service tests` |
| **chore** | Maintenance tasks | `chore: update dependencies` |
| **perf** | Performance optimization | `perf: optimize database queries` |
| **ci** | CI/CD configuration | `ci: add GitHub Actions workflow` |

#### Examples
```bash
✓ feat: add resource filtering by subject
✓ fix(auth): resolve OAuth redirect loop
✓ docs: update README installation steps
✓ test: add tests for S3 upload
✓ refactor: extract ResourceCard component
✓ style: improve mobile responsive layout
✓ chore: update tailwind to 3.4.17

✗ fix stuff
✗ Update component
✗ asdf
```

### Git Hooks enforce this automatically
```bash
git commit -m "Update resource"
# ❌ Hook error: Invalid commit message format
# Show valid examples

git commit -m "feat: add resource filtering"
# ✅ Hook passes: Commit message format valid
```

---

## 🎓 Agent Guides Summary

Each agent automatically loads based on which files you're editing:

### Component Creator (frontend/src/components/**)
**Use when**: Creating React components
**Provides**: 
- Component template with PropTypes
- Tailwind styling patterns
- Accessibility best practices
- Testing strategies

```bash
# Editing these files?
frontend/src/components/Button.jsx
frontend/src/components/Modal.jsx
→ Component Creator loads automatically
```

### Page Builder (frontend/src/Pages/**)
**Use when**: Building full-page containers
**Provides**:
- Page template with routing
- Data fetching patterns
- Loading/error/empty states
- Performance optimization

### Backend API (.backend/src/**)
**Use when**: Creating API endpoints
**Provides**:
- Route and controller templates
- Validation patterns
- Middleware usage
- Error handling

### Styling Specialist (frontend/**/*.{jsx,css})
**Use when**: Adjusting UI/UX styling
**Provides**:
- Responsive design patterns
- Tailwind utilities
- Accessibility patterns
- Component styles

### Database Schema (backend/schema.sql)
**Use when**: Adding database features
**Provides**:
- Table design patterns
- RLS policy examples
- Index optimization
- Migration strategies

### Testing Patterns (**/*.test.{js,jsx})
**Use when**: Writing tests
**Provides**:
- Test templates (unit, integration, E2E)
- Mocking patterns
- Assertions examples
- Coverage goals

### CI/CD Setup (.github/workflows/**)
**Use when**: Setting up automation
**Provides**:
- Workflow configurations
- Deployment processes
- Monitoring & alerts
- Secret management

---

## 📋 Pre-Commit Checklist (What Hooks Check)

Your git hooks automatically verify:

✅ **Security**
- [ ] No .env files staged
- [ ] No hardcoded API keys/secrets
- [ ] No passwords in code

✅ **Code Quality**
- [ ] No console.log or debugger statements
- [ ] ESLint passes (frontend)
- [ ] Valid JSON syntax

✅ **Naming Conventions**
- [ ] Components: PascalCase (`Button.jsx`)
- [ ] Pages: PascalCase + _Page (`Lectures_Page.jsx`)
- [ ] Routes: kebab-case (`resource.routes.js`)

✅ **Git Hygiene**
- [ ] No merge conflict markers
- [ ] Proper commit message format

---

## 🚨 Debugging & Troubleshooting

### Problem: "Hook blocked my commit"

```bash
# See what the hook said
git commit -m "feat: add feature"
# Output: ❌ ERROR: console.log found in src/App.jsx

# Solution 1: Fix the issue
# Remove console.log from src/App.jsx

# Solution 2: Bypass hook (emergency only)
git commit --no-verify -m "feat: add feature"
```

### Problem: "ESLint errors during commit"

```bash
git commit -m "feat: add component"
# Output: ❌ ESLint errors found

# Fix automatically:
npm run lint -- --fix

# Then try committing again
git add .
git commit -m "feat: add component"
```

### Problem: "Invalid commit message"

```bash
git commit -m "fix stuff"
# Output: ❌ Invalid commit message format

# Use semantic format:
git commit -m "fix: resolve component rendering issue"
```

### Problem: "Deployment failed in CI/CD"

```
Check:
1. GitHub Actions tab → see which step failed
2. Common causes:
   - Missing .env secrets → GitHub Settings → Secrets → Add missing vars
   - Test failure → Run npm test locally, fix issues
   - Build error → Run npm run build locally
3. Push fix
4. Automatic re-run or manually restart
```

---

## 💡 Pro Tips & Shortcuts

### Create Feature Branch Quickly
```bash
git checkout -b feature/short-name
# Best practice names:
# feature/add-resource-filtering
# fix/auth-redirect-loop
# docs/api-endpoint-docs
```

### Quickly Find Files
```bash
# Find all components matching pattern
find frontend/src/components -name "*Card*"

# Find all routes
ls backend/src/routes/

# Find test files
find . -name "*.test.js"
```

### Use Aliases for Common Commands
```bash
# In ~/.zshrc or ~/.bashrc
alias gdc="git checkout -b feature/"
alias gn="npm"
alias gndev="npm run dev"
alias gnb="npm run build"
alias gnl="npm run lint"
alias gnt="npm test"

# Then use:
gdc add-resource-filtering  # Creates branch
gndev                       # Runs dev server
gnl                         # Runs linter
```

### View Recent Commits
```bash
git log --oneline -10
# Output:
# a1b2c3d feat: add resource filtering
# e4f5g6h fix: resolve JWT error
# i7j8k9l docs: update README
```

---

## 📚 How to Ask AI for Help

### Good AI Prompts

```
"Following .github/copilot-instructions.md, create a component that..."
"Using the patterns in .github/agents/backend-api.md, create an endpoint for..."
"Based on the testing examples in .github/agents/testing-patterns.md, write tests for..."
```

### Better Prompts (More Specific)

```
"I'm building a resource filtering feature for the LecturesPage.
- Users should filter by subject (ECE, IT, MECH) and type (lecture, note, pyq)
- Use the ResourceFilter component pattern from src/components
- Include a 'Clear filters' button and search box
- Make it mobile responsive
- Follow the conventions in .github/copilot-instructions.md"
```

### Best Prompts (Include Context)

```
"I'm in frontend/src/Pages and need to build LecturesPage.
Current state:
- Have useResources() hook that fetches resources
- Have ResourceCard component for display
- API endpoint is /api/resources?subject=X&type=Y

Need to:
1. Fetch resources with filters
2. Display in responsive grid (1 col mobile, 2 tablet, 3 desktop)
3. Add loading/error/empty states
4. Implement pagination or infinite scroll
5. Make student-accessible only

Use examples from .github/EXAMPLE_PROMPTS.md#build-the-lectures-browse-page"
```

---

## 🎯 Next: Your First Task

### Recommended Starting Task

**Create the ResourceFilterPanel component:**

1. Open `.github/EXAMPLE_PROMPTS.md` → Find "Example 2: Build a Resource Card Display"
2. Ask AI in GitHub Copilot Chat:
   ```
   Following .github/EXAMPLE_PROMPTS.md, create this component.
   ```
3. AI generates component
4. Run: `npm run lint` → no errors
5. Commit: `git add . && git commit -m "feat: add resource filter panel"`
6. Git hooks verify everything
7. Push (if ready): `git push origin feature/add-filter`

**Time to complete**: 10-15 minutes  
**Complexity**: Easy  
**Helps you learn**: Component patterns, Tailwind, git workflow

---

## 📞 When You're Stuck

```
1. Check: .github/QUICK_REFERENCE.md (Debugging Common Issues)
2. Search: .github/copilot-instructions.md (search for your issue)
3. Review: .github/agents/ (relevant guide)
4. Ask AI: Copy an example from .github/EXAMPLE_PROMPTS.md and adapt
5. Check: Test locally (npm run lint, npm test, npm run dev)
```

---

## 🚀 You're Ready!

You now have:
- ✅ Main instructions guide
- ✅ Quick reference checklists
- ✅ Example prompts to copy
- ✅ Specialized AI agent guides
- ✅ Git hooks enforcing quality
- ✅ CI/CD automation configured
- ✅ Testing patterns & setup
- ✅ This comprehensive guide

**Next step**: Open `.github/EXAMPLE_PROMPTS.md` and create your first component!

---

*Last Updated: April 2026*  
*Version: 1.0 - Complete All-in-One Guide*
