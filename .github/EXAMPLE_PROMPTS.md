---
title: Example Prompts for EduSphere AI Development
---

# Example Prompts for EduSphere AI Development

This document shows practical examples of how to use the workspace instructions and agent guides effectively for different development scenarios.

## 🎯 Component Development Examples

### Example 1: Create a Resource Filter Component

**Your Prompt:**
```
Create a ResourceFilterComponent that allows filtering by subject (ECE, IT, MECH), 
type (lecture, note, pyq), and search text. Include:
- Multi-select subject filter with checkboxes
- Radio buttons for type selection
- Search input field
- "Clear filters" button
- Should be mobile-responsive
- Accessible with keyboard navigation
```

**Why it works:**
- References specific requirements (subjects, types, search)
- Asks for accessibility
- Mentions responsive design
- The component-creator agent will automatically load and:
  - Organize in `frontend/src/components/design/`
  - Use PascalCase naming: `ResourceFilterComponent.jsx`
  - Apply Tailwind utilities for styling
  - Add PropTypes for type safety
  - Include accessibility patterns (aria-labels, focus management)

---

### Example 2: Build a Resource Card Display

**Your Prompt:**
```
Create a ResourceCard component that displays:
- Resource title (max 50 chars)
- Subject tag (small badge)
- Resource type (icon + text)
- Author name
- Download count with icon
- Click handler to view resource
Include hover effect, make it feel interactive, and ensure it works well in a grid layout.
```

**What happens:**
- Agent creates component in `frontend/src/components/`
- Uses Tailwind for styling (`shadow-md`, `hover:shadow-lg`, etc.)
- Accepts onClick callback for interactivity
- Exports with PropTypes for document props
- Works seamlessly in grids with consistent spacing

---

## 📄 Page Building Examples

### Example 3: Build the Lectures Browse Page

**Your Prompt:**
```
Create a LecturesPage that:
1. Fetches lectures from `/api/resources?type=lecture`
2. Shows ResourceFilterPanel on left sidebar (mobile: collapsible)
3. Displays filtered results in responsive grid
4. Has loading spinner while fetching
5. Shows "No lectures found" if empty
6. Allows sorting by date, views, or downloads
7. Pagination with 12 lectures per page
Include proper error handling for failed requests.
```

**Agent execution:**
- Creates `frontend/src/Pages/Lectures_Page.jsx` with:
  - `useResources()` hook for data fetching
  - Loading/error/empty states
  - Responsive layout: 1 col mobile, 2 cols tablet, 3 cols desktop
  - Filter state management with URL params (so filters are shareable)
  - Pagination logic

---

### Example 4: Create Professor Dashboard

**Your Prompt:**
```
Build ProfessorDashboard with:
1. Welcome section with professor name
2. Quick-stats cards (Total Uploads, Total Views, Total Downloads)
3. List of professor's uploaded resources with:
   - Thumbnail/preview
   - Title, upload date
   - View count, download count
   - Edit & delete buttons
4. "Upload new resource" button linking to upload form
5. Only accessible to users with professor role
Include analytics refreshing every 30 seconds and proper auth checks.
```

**Expected output:**
- Component automatically wrapped with `<ProtectedRoute requiredRole="professor">`
- Fetches from `/api/analytics/professor/{userId}`
- Updates component layout responsively
- Handles refresh logic with useEffect + interval cleanup

---

## 🔌 Backend API Examples

### Example 5: Create Resource Management API

**Your Prompt:**
```
Create API endpoints for resource management:

POST /api/resources — Create resource (professor/admin only)
  Body: { title, subject, type, description, file_url }
  Validate: title required, subject in ['ECE','IT','MECH'], type in ['lecture','note','pyq']

GET /api/resources — List resources with filtering
  Query: ?subject=ECE&type=lecture&search=ch1&page=1&limit=20
  
GET /api/resources/:id — Get single resource details

PATCH /api/resources/:id — Update resource (owner or admin only)
  Body: { title, description, ... }

DELETE /api/resources/:id — Delete (admin only)

Include proper error handling, role checks, and input validation.
```

**Agent creates:**
- `backend/src/routes/resource.routes.js` with all endpoints
- `backend/src/controllers/resource.controller.js` with business logic
- `backend/src/validators/resource.validator.js` with express-validator rules
- Middleware: authentication + role authorization on protected routes
- Standard response format (status, data, message)

---

### Example 6: Add Analytics Tracking

**Your Prompt:**
```
Add analytics endpoints:

GET /api/analytics/professor/:id — Get professor's resource analytics
  Returns: {
    total_uploads: number,
    total_views: number,
    total_downloads: number,
    resources: [{ id, title, views, downloads }, ...]
  }
  Only accessible by professor (owner) or admin

GET /api/analytics/platform — Platform-wide stats (admin only)
  Returns: {
    total_resources: number,
    total_users: number,
    total_views: number,
    resources_by_subject: { ECE: num, IT: num, ... }
  }
```

**Output:**
- Analytics service with database queries
- Proper caching/optimization to avoid N+1 queries
- Role-scoped SQL queries and middleware authorization ensuring data isolation

---

## 🎨 Styling Examples

### Example 7: Design Responsive Navigation

**Your Prompt:**
```
Create a responsive navigation header:
- Logo on left
- Desktop: Horizontal nav links (Home, Lectures, Notes, Pyqs, Skills)
- Mobile: Hamburger menu that opens slide-in drawer
- Search bar on desktop (right of nav), below logo on mobile
- User profile dropdown (if logged in)
- Sticky header that doesn't cover content
- Use blue accent color for active links
Ensure it's accessible with keyboard navigation.
```

**Styling agent creates:**
- Mobile-first layout: hamburger + drawer initially
- `lg:` breakpoint: horizontal nav appears, hamburger hidden
- Tailwind utilities: `flex`, `gap-4`, `sticky top-0`, `z-50`
- Focus states: `focus:outline-blue-500`
- Accessibility: `aria-label`, `role="navigation"`

---

### Example 8: Design Card Grid

**Your Prompt:**
```
Create a responsive card grid for displaying resources:
- 1 column on mobile (< 640px)
- 2 columns on tablet (640px - 1024px)
- 3 columns on desktop (> 1024px)
- Each card has rounded corners, subtle shadow
- On hover: shadow grows, slight scale up (transform: scale-105)
- Cards have padding inside with title, description, action buttons
- Consistent gap between cards (4 units = 16px)
```

**Result:**
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {resources.map(r => <ResourceCard key={r.id} {...r} />)}
</div>
```

---

## 🗄️ Database Examples

### Example 9: Add Resource Rating System

**Your Prompt (uses database instructions):**
```
Add a rating system to resources:

1. Create new table: ratings
   Columns: id, resource_id (FK), user_id (FK), rating (1-5), created_at
   
2. Add API endpoints:
   POST /api/resources/:id/rate — Rate a resource
     Body: { rating: 1-5 }
     
   GET /api/resources/:id/ratings — Get average rating & count

3. Update resource table to include avg_rating column (calculated)

Include proper validation (rating 1-5), prevent duplicate ratings per user, and RLS policies.
```

---

### Example 10: Create Announcement System

**Your Prompt (uses database instructions):**
```
Create announcements feature for admins:

1. Database table: announcements
   Fields: id, title, content, created_by (fk: users), created_at, expires_at

2. API endpoints:
   GET /api/announcements — Fetch active announcements (public)
   POST /api/announcements — Create announcement (admin only)
   DELETE /api/announcements/:id — Delete (admin only)

3. Frontend:
   - Display banner on homepage showing latest announcement
   - Full announcements page with list of all announcements
   - Admin panel to create/delete announcements

Include proper filtering for expiration date.
```

---

## ✅ Testing Pattern Examples

### Example 11: Test Resource Filtering

**Your Prompt (uses testing instructions):**
```
Write tests for resource filtering:

Test GET /api/resources with filters:
1. Filter by subject — should only return ECE resources when subject=ECE
2. Filter by type — should only return lectures when type=lecture
3. Multiple filters — subject AND type both applied
4. Invalid subject — should return 400 error
5. Search — should find resources by title or description
6. Pagination — page 2 should skip first 20 results

Use Jest + Supertest for API testing.
```

---

### Example 12: Test Authentication

**Your Prompt (uses testing instructions):**
```
Test authentication middleware:

1. Valid JWT token — request should pass through
2. Missing token — should return 401 Unauthorized
3. Malformed token — should return 401 Invalid token
4. Expired token — should return 401 Token expired
5. Invalid signature — should return 401
6. Role-based access — professor endpoint should reject students

Test with various token payloads and scenarios.
```

---

## 🚀 Deployment & CI/CD Examples

### Example 13: Set Up CI/CD Pipeline

**Your Prompt (uses CI/CD instructions):**
```
Create GitHub Actions workflow for:
1. Run ESLint on frontend changes
2. Run backend tests (if added)
3. Build frontend (npm run build)
4. Deploy frontend to Vercel on main branch
5. Deploy backend to Render on main branch
6. Run validation scripts (npm run validate, npm run check:s3)
7. Notify on Slack/email if deployment fails

Should only deploy when all checks pass.
```

---

### Example 14: Add Pre-deployment Validation

**Your Prompt (uses deployment instructions):**
```
Create deployment validation script that checks:
1. All .env variables are set (frontend & backend)
2. Database connection is working
3. S3/Tigris credentials are valid
4. OAuth credentials configured
5. No console.log statements in production code
6. No hardcoded secrets in git history
7. Git working directory is clean

Should print clear report and fail if critical checks don't pass.
```

---

## 🔧 Git Hooks & Convention Examples

### Example 15: Enforce Naming Conventions

**Your Prompt (uses Git hooks instructions):**
```
Create pre-commit hook that:
1. Checks component filenames are PascalCase
2. Checks page filenames end with _Page
3. Checks route/controller filenames are kebab-case
4. Prevents committing console.log in production code
5. Prevents committing .env files
6. Runs ESLint before commit

If any check fails, prevent commit and show helpful error message.
```

---

### Example 16: Enforce Commit Message Convention

**Your Prompt (uses Git hooks instructions):**
```
Create commit message validation:

Valid formats:
- feat: add new feature
- fix: fix a bug
- docs: update documentation
- refactor: refactor code
- style: adjust styling
- test: add tests
- chore: maintenance tasks

Invalid:
- "fix stuff"
- "Update component"
- "asdf"

Show helpful error on invalid format before committing.
```

---

## 💡 How to Use These Examples

### Step 1: Copy the prompt
Grab any example prompt and use it exactly or modify it for your needs.

### Step 2: Use with AI Agent
Paste into GitHub Copilot Chat or your AI agent and reference the instructions:

```
You are developing EduSphere following .github/copilot-instructions.md

[Paste example prompt here]

Create this component/API/feature following the project conventions.
```

### Step 3: Agent Loads Relevant Guide
The agent will automatically load:
- **Component prompt** → Loads `component-creator.md`
- **Page prompt** → Loads `page-builder.md`
- **API prompt** → Loads `backend-api.md`
- **Styling prompt** → Loads `styling-specialist.md`
- **Database prompt** → Loads `database-schema.md`
- **Testing prompt** → Loads `testing-patterns.md`
- **CI/CD prompt** → Loads `cicd-setup.md`
- **Git hooks prompt** → Loads `git-hooks.md`

### Step 4: Review & Integrate
- Review generated code
- Run linting/testing
- Make adjustments as needed
- Commit with semantic message

---

## 🎯 Pro Tips for Best Results

### ✅ Good Prompts
- **Specific**: "Create component that..." vs. "Make a thing"
- **Detailed**: Include fields, validation, error cases
- **Contextual**: Mention where it's used (page name, API endpoint)
- **Constraints**: Include responsive breakpoints, accessibility needs
- **Examples**: Show expected data structures or UI mockups

### ❌ Common Mistakes
- Too vague: "Create a component"
- Missing requirements: Forgot about error handling
- No context: Doesn't mention role/permissions
- Ignored instructions: Doesn't follow naming conventions
- No testing: Forgot to ask for test cases

---

## 📋 Quick Prompt Templates

### Component Template
```
Create a [ComponentName] component for [use case]:
- Should display/accept [data/input]
- Styling: [specific look, colors, spacing]
- Responsive: [mobile/tablet/desktop behavior]
- Accessibility: [keyboard nav, ARIA labels, focus states]
- Props: [list expected props]
- Interactions: [click handlers, events]
```

### Page Template
```
Build [PageName] page that:
1. Fetches data from [API endpoint]
2. Shows [components] in [layout]
3. Has [filter/search/sort options]
4. States: [loading, error, empty, success]
5. Actions: [click handlers, navigation]
6. Protection: [public/student/professor/admin]
```

### API Template
```
Create API endpoints for [feature]:
- [METHOD] [/path] — [Description]
  Input: [fields and types]
  Output: [response structure]
  Auth: [who can access]
  Validation: [rules]
  
Repeat for each endpoint needed.
```

---

## 🔗 Related Documentation

- **Main Guide**: `.github/copilot-instructions.md`
- **Quick Reference**: `.github/QUICK_REFERENCE.md`
- **Component Creator**: `.github/agents/component-creator.md`
- **Page Builder**: `.github/agents/page-builder.md`
- **Backend API**: `.github/agents/backend-api.md`
- **Styling Specialist**: `.github/agents/styling-specialist.md`
- **Database Schema**: `.github/agents/database-schema.md` (coming soon)
- **Testing Patterns**: `.github/agents/testing-patterns.md` (coming soon)
- **CI/CD Setup**: `.github/agents/cicd-setup.md` (coming soon)
- **Git Hooks**: `.github/agents/git-hooks.md` (coming soon)

---

*Last Updated: April 2026*
*Version: 1.0*
