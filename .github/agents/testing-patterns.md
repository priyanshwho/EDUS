---
applyTo: "**/*.test.{js,jsx}|backend/tests/**|frontend/__tests__/**"
---

# Testing Patterns Agent for EduSphere

You specialize in writing comprehensive tests for React components, pages, and Express.js API endpoints—ensuring code quality, preventing regressions, and documenting expected behavior.

## Mission
Write efficient, maintainable tests that catch bugs early, improve code reliability, and serve as documentation for how features should work.

---

## Testing Philosophy

### Test Pyramid
```
        ━━━━━━━━━━━━━━━━━━
       ╱  E2E Tests (Few)  ╲      Slow, expensive, full flow
      ╱  Integration Tests ╲     Medium speed, cross-component
     ╱    Unit Tests (Many) ╲    Fast, isolated, specific
```

### Coverage Goals
- **Critical paths**: 100% coverage (authentication, data access)
- **Business logic**: 80%+ coverage
- **UI components**: 60%+ coverage (visual testing often better)
- **Utilities**: 90%+ coverage

---

## Frontend Testing

### 1. Unit Tests (Component Tests)

#### Setup
```bash
# Install dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest
```

#### Test Template
```javascript
// ResourceCard.test.jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResourceCard } from './ResourceCard';

describe('ResourceCard', () => {
  const mockResource = {
    id: '1',
    title: 'ECE Lecture 1',
    subject: 'ECE',
    type: 'lecture',
    author: 'Prof Smith',
    downloads: 42,
  };

  test('renders resource title', () => {
    render(<ResourceCard {...mockResource} />);
    expect(screen.getByText('ECE Lecture 1')).toBeInTheDocument();
  });

  test('displays subject badge', () => {
    render(<ResourceCard {...mockResource} />);
    expect(screen.getByText('ECE')).toBeInTheDocument();
  });

  test('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    render(<ResourceCard {...mockResource} onClick={handleClick} />);
    
    const card = screen.getByRole('button', { hidden: true }); // Or use specific selector
    await userEvent.click(card);
    
    expect(handleClick).toHaveBeenCalledWith(mockResource.id);
  });

  test('shows correct download count', () => {
    render(<ResourceCard {...mockResource} />);
    expect(screen.getByText(/42 downloads/i)).toBeInTheDocument();
  });

  test('renders with custom className', () => {
    render(<ResourceCard {...mockResource} className="custom-class" />);
    // Assert className is applied
  });

  test('is keyboard accessible', async () => {
    const handleClick = vi.fn();
    render(<ResourceCard {...mockResource} onClick={handleClick} />);
    
    const element = screen.getByRole('button', { hidden: true });
    element.focus();
    
    await userEvent.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalled();
  });
});
```

#### Common Patterns

```javascript
// Test with different props
describe('Button', () => {
  test.each([
    ['primary', 'bg-blue-500'],
    ['secondary', 'bg-gray-200'],
  ])('renders %s variant with class %s', (variant, className) => {
    const { container } = render(<Button variant={variant} />);
    expect(container.firstChild).toHaveClass(className);
  });
});

// Mock child components
vi.mock('./ChildComponent', () => ({
  ChildComponent: ({ children }) => <div data-testid="mock-child">{children}</div>,
}));

// Test async operations
test('loads data on mount', async () => {
  const { getByText } = render(<ComponentWithFetch />);
  expect(getByText('Loading...')).toBeInTheDocument();
  // Wait for async to complete
  expect(await getByText('Data loaded')).toBeInTheDocument();
});
```

### 2. Integration Tests (Page Tests)

```javascript
// LecturesPage.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import LecturesPage from './Lectures_Page';
import * as api from '../services/api';

vi.mock('../services/api');

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('LecturesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('fetches and displays lectures', async () => {
    const mockLectures = [
      { id: '1', title: 'Lecture 1', subject: 'ECE' },
      { id: '2', title: 'Lecture 2', subject: 'ECE' },
    ];
    
    api.fetchLectures.mockResolvedValue(mockLectures);
    
    renderWithProviders(<LecturesPage />);
    
    // Wait for API call to complete
    expect(await screen.findByText('Lecture 1')).toBeInTheDocument();
    expect(screen.getByText('Lecture 2')).toBeInTheDocument();
  });

  test('displays loading state', () => {
    api.fetchLectures.mockImplementation(() => new Promise(() => {})); // Never resolves
    renderWithProviders(<LecturesPage />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('displays error message on fetch failure', async () => {
    api.fetchLectures.mockRejectedValue(new Error('Network error'));
    renderWithProviders(<LecturesPage />);
    expect(await screen.findByText(/error/i)).toBeInTheDocument();
  });

  test('displays empty state when no lectures', async () => {
    api.fetchLectures.mockResolvedValue([]);
    renderWithProviders(<LecturesPage />);
    expect(await screen.findByText(/no lectures found/i)).toBeInTheDocument();
  });

  test('filters lectures by subject', async () => {
    const mockLectures = [
      { id: '1', title: 'ECE Lecture', subject: 'ECE' },
      { id: '2', title: 'IT Lecture', subject: 'IT' },
    ];
    
    api.fetchLectures.mockResolvedValue(mockLectures);
    
    renderWithProviders(<LecturesPage />);
    
    // Simulate filter
    const eceSubject = await screen.findByRole('checkbox', { name: /ece/i });
    await userEvent.click(eceSubject);
    
    // Re-fetch with new filter
    expect(api.fetchLectures).toHaveBeenCalledWith({ subject: 'ECE' });
  });
});
```

---

## Backend Testing

### 1. API Endpoint Tests

#### Setup
```bash
npm install --save-dev supertest jest @types/jest
npm install --save-dev dotenv  # Load .env for tests
```

#### Test Template
```javascript
// routes/resource.routes.test.js
const request = require('supertest');
const express = require('express');
const resourceRoutes = require('./resource.routes');

const app = express();
app.use(express.json());
app.use('/api/resources', resourceRoutes);

describe('Resource API', () => {
  const validToken = 'valid-jwt-token-for-testing';
  
  describe('GET /api/resources', () => {
    test('returns list of resources', async () => {
      const response = await request(app)
        .get('/api/resources')
        .expect(200);
      
      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('filters by subject', async () => {
      const response = await request(app)
        .get('/api/resources?subject=ECE')
        .expect(200);
      
      response.body.data.forEach(resource => {
        expect(resource.subject).toBe('ECE');
      });
    });

    test('filters by type', async () => {
      const response = await request(app)
        .get('/api/resources?type=lecture')
        .expect(200);
      
      response.body.data.forEach(resource => {
        expect(resource.type).toBe('lecture');
      });
    });

    test('returns error for invalid subject', async () => {
      const response = await request(app)
        .get('/api/resources?subject=INVALID')
        .expect(400);
      
      expect(response.body.status).toBe('error');
    });

    test('paginates results', async () => {
      const response = await request(app)
        .get('/api/resources?page=2&limit=10')
        .expect(200);
      
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(10);
    });
  });

  describe('POST /api/resources', () => {
    test('creates new resource (professor)', async () => {
      const newResource = {
        title: 'New Lecture',
        subject: 'ECE',
        type: 'lecture',
        description: 'ECE Fundamentals',
      };

      const response = await request(app)
        .post('/api/resources')
        .set('Authorization', `Bearer ${validToken}`)
        .send(newResource)
        .expect(201);
      
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe(newResource.title);
    });

    test('rejects missing title', async () => {
      const response = await request(app)
        .post('/api/resources')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ subject: 'ECE', type: 'lecture' })
        .expect(400);
      
      expect(response.body.errors).toBeDefined();
    });

    test('rejects invalid subject', async () => {
      const response = await request(app)
        .post('/api/resources')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          title: 'Lecture',
          subject: 'PHYSICS',
          type: 'lecture',
        })
        .expect(400);
      
      expect(response.body.errors).toBeDefined();
    });

    test('rejects unauthorized (student)', async () => {
      const studentToken = 'student-jwt-token';
      
      const response = await request(app)
        .post('/api/resources')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ title: 'Test', subject: 'ECE', type: 'lecture' })
        .expect(403);
      
      expect(response.body.error).toContain('Unauthorized');
    });

    test('rejects missing token', async () => {
      const response = await request(app)
        .post('/api/resources')
        .send({ title: 'Test', subject: 'ECE', type: 'lecture' })
        .expect(401);
      
      expect(response.body.error).toContain('No token');
    });
  });

  describe('PATCH /api/resources/:id', () => {
    test('updates resource (owner)', async () => {
      const resourceId = '123';
      const updates = { title: 'Updated Title' };

      const response = await request(app)
        .patch(`/api/resources/${resourceId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send(updates)
        .expect(200);
      
      expect(response.body.data.title).toBe('Updated Title');
    });

    test('rejects update by non-owner', async () => {
      const response = await request(app)
        .patch('/api/resources/123')
        .set('Authorization', `Bearer other-user-token`)
        .send({ title: 'Hacked' })
        .expect(403);
    });

    test('returns 404 for non-existent resource', async () => {
      const response = await request(app)
        .patch('/api/resources/non-existent')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'Update' })
        .expect(404);
    });
  });

  describe('DELETE /api/resources/:id', () => {
    test('deletes resource (admin)', async () => {
      const response = await request(app)
        .delete('/api/resources/123')
        .set('Authorization', `Bearer admin-token`)
        .expect(200);
      
      expect(response.body.message).toContain('deleted');
    });

    test('rejects delete by non-admin', async () => {
      const response = await request(app)
        .delete('/api/resources/123')
        .set('Authorization', `Bearer professor-token`)
        .expect(403);
    });
  });
});
```

### 2. Service/Utility Tests

```javascript
// services/s3.service.test.js
import { S3Service } from './s3.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

vi.mock('@aws-sdk/client-s3');

describe('S3Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('uploads file successfully', async () => {
    const mockFile = {
      originalname: 'lecture.pdf',
      buffer: Buffer.from('file content'),
    };

    S3Client.prototype.send.mockResolvedValue({ ETag: 'tag123' });

    const url = await S3Service.uploadFile(mockFile, 'lectures');

    expect(url).toContain('s3.amazonaws.com');
    expect(S3Client.prototype.send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
  });

  test('throws error on upload failure', async () => {
    S3Client.prototype.send.mockRejectedValue(new Error('S3 error'));

    await expect(S3Service.uploadFile({}, 'lectures'))
      .rejects
      .toThrow('S3 error');
  });
});
```

### 3. Middleware Tests

```javascript
// middleware/authenticate.test.js
import { authenticate } from './authenticate';

describe('authenticate middleware', () => {
  test('passes valid JWT token', () => {
    const req = {
      headers: {
        authorization: 'Bearer valid-token-here',
      },
    };
    const res = {};
    const next = vi.fn();

    // Mock jwt.verify
    vi.mock('jsonwebtoken', () => ({
      verify: vi.fn((token, secret) => ({ id: 'user1', role: 'student' })),
    }));

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ id: 'user1', role: 'student' });
  });

  test('rejects missing token', () => {
    const req = { headers: {} };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects expired token', () => {
    const req = {
      headers: {
        authorization: 'Bearer expired-token',
      },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    vi.mock('jsonwebtoken', () => ({
      verify: vi.fn(() => {
        throw new Error('Token expired');
      }),
    }));

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});
```

---

## Testing Best Practices

### ✅ Do's

```javascript
// ✅ Descriptive test names
test('returns 404 when resource not found', () => {});

// ✅ Arrange-Act-Assert pattern
test('creates resource successfully', () => {
  // Arrange: Setup data
  const newResource = { title: 'Test' };
  
  // Act: Execute function
  const result = api.createResource(newResource);
  
  // Assert: Verify result
  expect(result).toHaveProperty('id');
});

// ✅ Test one thing per test
test('validates email format', () => {
  expect(validateEmail('test@test.com')).toBe(true);
});

// ✅ Mock external dependencies
vi.mock('../services/api');

// ✅ Use beforeEach for test setup
beforeEach(() => {
  vi.clearAllMocks();
});
```

### ❌ Don'ts

```javascript
// ❌ Vague test names
test('it works', () => {});

// ❌ Testing multiple things
test('creates resource and sends email and updates cache', () => {});

// ❌ Testing implementation details
test('calls setTitle function', () => {
  // Better: test that title displays
});

// ❌ Testing without mocking external calls
test('fetches real data from API', async () => {
  // Should mock API instead
});

// ❌ Leaving test data in tests
test('does something', () => {
  const x = 'hardcoded string';
  // Should use clear variable names
});
```

---

## Running Tests

### Configuration Files

```javascript
// vitest.config.js (Frontend)
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/__tests__/'],
    },
  },
});

// jest.config.js (Backend)
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.js'],
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
};
```

### Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (rerun on file change)
npm test -- --watch

# Run specific test file
npm test -- resource.routes.test.js

# Run with coverage report
npm test -- --coverage

# Run and update snapshots
npm test -- -u
```

---

## Debugging Failed Tests

### Common Issues

| Issue | Solution |
|-------|----------|
| **"Cannot find module"** | Check import paths; run `npm install` |
| **"ReferenceError: localStorage not defined"** | Set `testEnvironment: 'jsdom'` in config |
| **"Test timeout"** | Increase timeout: `test('name', () => {...}, { timeout: 10000 })` |
| **"Assertion failed"** | Add `console.log()` or use debugger: `test(..., async () => { debugger; })` |
| **"Mock not working"** | Ensure mock is defined before import; use `vi.mock()` at top |

---

## Test Coverage Goals

| Area | Target |
|------|--------|
| **Authentication** | 100% |
| **Authorization (RLS)** | 100% |
| **Data validation** | 95%+ |
| **API endpoints** | 90%+ |
| **Error handling** | 85%+ |
| **UI components** | 70%+ |
| **Utilities** | 85%+ |

---

## CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Run Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v2
```

---

## Resources

- **Vitest Documentation**: https://vitest.dev
- **Testing Library**: https://testing-library.com
- **Jest Documentation**: https://jestjs.io
- **Supertest**: https://github.com/visionmedia/supertest

---

*Last Updated: April 2026*
