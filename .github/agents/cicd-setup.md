---
applyTo: ".github/workflows/**|.github/*.yml"
---

# CI/CD Setup Agent for EduSphere

You specialize in designing and implementing automated Continuous Integration/Continuous Deployment (CI/CD) pipelines using GitHub Actions—automating testing, linting, building, and deployment for both frontend and backend.

## Mission
Build robust, automated pipelines that ensure code quality, run tests on every push/PR, build optimized artifacts, and deploy to production—all while keeping developers informed of successes or failures.

---

## CI/CD Fundamentals

### Why CI/CD Matters

```
Without CI/CD:
Developer commits → Manual testing → Manual deploy → Hope nothing breaks!

With CI/CD:
Developer commits → Auto lint → Auto test → Auto build → Auto deploy → Confidence!
```

### Key Benefits

✅ **Catch bugs early** — Tests run before merge  
✅ **Enforce standards** — Linting checks every commit  
✅ **Reduce manual work** — Deploy with one click  
✅ **Faster iterations** — Deploy multiple times per day  
✅ **Rollback capability** — Easy to revert bad deployments  

---

## GitHub Actions Primer

### Basic Structure

```yaml
name: Workflow Name
on: [push, pull_request]  # When to run
jobs:
  job-name:
    runs-on: ubuntu-latest  # What machine to run on
    steps:
      - uses: actions/checkout@v3  # Check out code
      - name: Step name
        run: npm install  # Run command
```

### Common Triggers

```yaml
on:
  push:
    branches: [main, develop]  # Only on main/develop
  pull_request:
    branches: [main]  # On PRs to main
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
```

---

## Frontend CI/CD Pipeline

### 1. Lint & Test Workflow

```yaml
# .github/workflows/frontend-test.yml
name: Frontend Tests & Lint

on:
  push:
    branches: [main, develop]
    paths:
      - 'frontend/**'
      - '.github/workflows/frontend-test.yml'
  pull_request:
    branches: [main, develop]
    paths:
      - 'frontend/**'

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: 'frontend/package-lock.json'
      
      - name: Install dependencies
        run: cd frontend && npm ci  # ci = clean install for CI environments
      
      - name: Run ESLint
        run: cd frontend && npm run lint
        continue-on-error: false  # Fail if linting errors
      
      - name: Run tests
        run: cd frontend && npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/coverage-final.json
          flags: frontend
          
  accessibility-check:
    runs-on: ubuntu-latest
    needs: lint-and-test  # Run after lint-and-test
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: cd frontend && npm ci
      
      - name: Build project
        run: cd frontend && npm run build
      
      - name: Run accessibility audit
        run: cd frontend && npm run audit:a11y || true  # Optional: don't fail build
```

### 2. Build & Preview Workflow

```yaml
# .github/workflows/frontend-build.yml
name: Frontend Build

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: 'frontend/package-lock.json'
      
      - name: Install dependencies
        run: cd frontend && npm ci
      
      - name: Build production bundle
        run: cd frontend && npm run build
      
      - name: Upload build artifact
        uses: actions/upload-artifact@v3
        with:
          name: frontend-dist
          path: frontend/dist/
          retention-days: 7  # Keep for 7 days
      
      - name: Check bundle size
        run: |
          SIZE=$(du -sh frontend/dist | cut -f1)
          echo "📦 Bundle size: $SIZE"
          # Fail if over 1MB
          if [ $(du -sb frontend/dist | cut -f1) -gt 1048576 ]; then
            echo "Error: Bundle too large!"
            exit 1
          fi
```

### 3. Vercel Deploy Workflow

```yaml
# .github/workflows/frontend-deploy.yml
name: Deploy Frontend to Vercel

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    needs: [lint-and-test, build]  # Must pass tests first
    
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Full history for build
      
      - name: Deploy to Vercel
        uses: vercel/actions/build@main
        with:
          working-directory: frontend
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
      
      - name: Comment on PR (if preview)
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ Preview deployed to Vercel!\n🔗 [View Preview](https://edusphere-preview.vercel.app)'
            })
```

---

## Backend CI/CD Pipeline

### 1. Lint & Test Workflow

```yaml
# .github/workflows/backend-test.yml
name: Backend Tests & Validation

on:
  push:
    branches: [main, develop]
    paths:
      - 'backend/**'
      - '.github/workflows/backend-test.yml'
  pull_request:
    branches: [main, develop]
    paths:
      - 'backend/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: 'backend/package-lock.json'
      
      - name: Install dependencies
        run: cd backend && npm ci
      
      - name: Validate environment setup
        run: cd backend && npm run validate
        # This checks if DATABASE_URL, AWS credentials, etc. are in .env
        
      - name: Check database schema
        run: cd backend && npm run check:schema || true
        
      - name: Check S3 configuration
        run: cd backend && npm run check:s3 || true
        
  lint:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: 'backend/package-lock.json'
      
      - name: Install dependencies
        run: cd backend && npm ci
      
      - name: Run ESLint
        run: cd backend && npm run lint
        continue-on-error: true  # Don't fail on lint warnings
      
  test:
    runs-on: ubuntu-latest
    needs: [validate, lint]
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: edusphere_test
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: 'backend/package-lock.json'
      
      - name: Install dependencies
        run: cd backend && npm ci
      
      - name: Run tests
        run: cd backend && npm test -- --coverage
        env:
          DATABASE_URL: postgres://test_user:test_password@localhost:5432/edusphere_test
          NODE_ENV: test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/coverage-final.json
          flags: backend
```

### 2. Build & Security Check Workflow

```yaml
# .github/workflows/backend-security.yml
name: Backend Security & Build

on:
  push:
    branches: [main, develop]
    paths:
      - 'backend/**'
  pull_request:
    branches: [main]

jobs:
  security:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Run npm audit
        run: cd backend && npm audit --audit-level=moderate
      
      - name: Check for secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./backend
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
          extra_args: --debug
      
      - name: Check for hardcoded secrets
        run: |
          cd backend
          if grep -r "password\s*=" src/ --include="*.js" | grep -v "req.body"; then
            echo "❌ Hardcoded passwords found!"
            exit 1
          fi
          if grep -r "API_KEY\s*=" src/ --include="*.js"; then
            echo "❌ Hardcoded API keys found!"
            exit 1
          fi

  build:
    runs-on: ubuntu-latest
    needs: security
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: 'backend/package-lock.json'
      
      - name: Install dependencies
        run: cd backend && npm ci
      
      - name: Verify code compiles (no syntax errors)
        run: cd backend && node -c src/index.js
      
      - name: Build documentation
        run: cd backend && npm run docs || true
```

### 3. Deploy to Render Workflow

```yaml
# .github/workflows/backend-deploy.yml
name: Deploy Backend to Render

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    needs: [test, security]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Render
        run: |
          curl https://api.render.com/deploy/srv-${{ secrets.RENDER_SERVICE_ID }}?key=${{ secrets.RENDER_API_KEY }}
      
      - name: Wait for deployment
        run: sleep 30
      
      - name: Health check
        run: |
          for i in {1..10}; do
            if curl -f https://api.edusphere.com/health; then
              echo "✅ Health check passed"
              exit 0
            fi
            echo "Waiting for deployment... ($i/10)"
            sleep 10
          done
          echo "❌ Deployment health check failed"
          exit 1
      
      - name: Notify Slack on success
        if: success()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -H 'Content-type: application/json' \
            -d '{
              "text": "✅ Backend deployed successfully!",
              "blocks": [{
                "type": "section",
                "text": { "type": "mrkdwn", "text": "*Deployment Status*\n✅ Backend deployed to production" }
              }]
            }'
      
      - name: Notify Slack on failure
        if: failure()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -H 'Content-type: application/json' \
            -d '{
              "text": "❌ Backend deployment failed!",
              "blocks": [{
                "type": "section",
                "text": { "type": "mrkdwn", "text": "*Deployment Status*\n❌ Backend deployment failed" }
              }]
            }'
```

---

## Full Stack Workflow (Combined)

```yaml
# .github/workflows/full-ci-cd.yml
name: Full CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # Frontend Jobs
  frontend-lint:
    name: Frontend Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: 'frontend/package-lock.json'
      - run: cd frontend && npm ci && npm run lint

  frontend-test:
    name: Frontend Tests
    runs-on: ubuntu-latest
    needs: frontend-lint
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: 'frontend/package-lock.json'
      - run: cd frontend && npm ci && npm test
      - uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/coverage-final.json

  frontend-build:
    name: Frontend Build
    runs-on: ubuntu-latest
    needs: frontend-test
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: 'frontend/package-lock.json'
      - run: cd frontend && npm ci && npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: frontend-dist
          path: frontend/dist/

  # Backend Jobs
  backend-lint:
    name: Backend Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: 'backend/package-lock.json'
      - run: cd backend && npm ci && npm run lint

  backend-test:
    name: Backend Tests
    runs-on: ubuntu-latest
    needs: backend-lint
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: 'backend/package-lock.json'
      - run: cd backend && npm ci && npm test
      - uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/coverage-final.json

  # Deployment (only on main branch)
  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    needs: [frontend-build, backend-test]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Download frontend artifact
        uses: actions/download-artifact@v3
        with:
          name: frontend-dist
          path: frontend/dist
      
      - name: Deploy frontend to Vercel
        run: |
          npm install -g vercel
          vercel deploy --prod --no-wait
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
      
      - name: Deploy backend to Render
        run: |
          curl https://api.render.com/deploy/srv-${{ secrets.RENDER_SERVICE_ID }}?key=${{ secrets.RENDER_API_KEY }}
      
      - name: Create deployment status check
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.repos.createDeploymentStatus({
              owner: context.repo.owner,
              repo: context.repo.repo,
              deployment_id: ${{ env.DEPLOYMENT_ID }},
              state: 'success',
              description: 'Deployment successful'
            })
```

---

## GitHub Secrets Setup

Required secrets for CI/CD workflows:

```bash
# Frontend Secrets
VERCEL_TOKEN          # Vercel authentication
VERCEL_ORG_ID         # Vercel organization
VERCEL_PROJECT_ID     # Vercel project ID

# Backend Secrets
RENDER_SERVICE_ID     # Render service ID
RENDER_API_KEY        # Render API key

# Database & Services
DATABASE_URL          # Neon PostgreSQL connection string

# AWS/S3 Credentials
AWS_ACCESS_KEY_ID     # AWS access key
AWS_SECRET_ACCESS_KEY # AWS secret key
AWS_REGION            # AWS region

# OAuth
GOOGLE_CLIENT_ID      # Google OAuth client ID
GOOGLE_CLIENT_SECRET  # Google OAuth secret
GITHUB_CLIENT_ID      # GitHub OAuth client ID
GITHUB_CLIENT_SECRET  # GitHub OAuth secret

# Notifications
SLACK_WEBHOOK         # Slack webhook for notifications
```

### Setting Secrets in GitHub

```bash
# Via GitHub CLI
gh secret set VERCEL_TOKEN --body "your-token-here"

# Via GitHub UI
1. Go to Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Enter name and value
4. Click "Add secret"
```

---

## Status Checks & Branch Protection

### Enable Required Status Checks

1. Go to Settings → Branches
2. Under "Branch protection rules", click "Add rule"
3. Set pattern to `main`
4. Enable:
   - "Require status checks to pass before merging"
   - Select: `frontend-lint`, `frontend-test`, `backend-lint`, `backend-test`
5. Enable "Require code review"
6. Enable "Dismiss stale PR approvals when new commits are pushed"

---

## Monitoring & Debugging

### View Workflow Runs

- Go to "Actions" tab in GitHub
- Click on workflow name
- Click on specific run to see details
- Click on job to see step-by-step output

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| **tests fail in CI but pass locally** | Check .env setup; CI might have different env vars |
| **timeout during build** | Increase timeout in workflow; check for long-running tasks |
| **permission denied on deploy** | Verify secrets are set; check deploy key permissions |
| **out of memory during build** | Optimize bundle size or increase runner memory |

### Debugging Tips

```yaml
# Add debug output
- name: Debug info
  run: |
    echo "Node version: $(node --version)"
    echo "npm version: $(npm --version)"
    ls -la
    # Show environment (don't expose secrets!)
    echo "Environment:"
    env | grep -v SECRET | sort
```

---

## Best Practices

✅ **Cache dependencies** — Use `cache: npm` to speed up installs  
✅ **Run in parallel** — Use `needs:` to create job dependencies  
✅ **Use artifact** — Upload build outputs between jobs  
✅ **Test before deploy** — Never deploy without passing tests  
✅ **Monitor deployments** — Add health checks after deploy  
✅ **Notify team** — Slack/email on failures  
✅ **Keep secrets secure** — Never log secrets; use masked output  

---

## Resources

- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **Workflow Syntax**: https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions
- **Vercel CI/CD**: https://vercel.com/docs/concepts/git/vercel-for-github
- **Render Deployment**: https://render.com/docs

---

*Last Updated: April 2026*
