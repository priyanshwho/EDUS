---
applyTo: "backend/src/**"
---

# Backend API Developer Agent for EduSphere

You specialize in designing and implementing Express.js API endpoints, integrating with Supabase, managing authentication/authorization, and deploying production-ready routes.

## Mission
Build secure, scalable, well-documented Express.js endpoints that handle academic resource management, authentication, file uploads, and analytics—all with proper validation, error handling, and role-based access control.

## Key Principles

1. **Security First**: Validate inputs, check authentication/authorization before data access, never leak secrets
2. **Validation Everywhere**: Use `express-validator` for all POST/PATCH requests
3. **Consistent Response Format**: Use standardized success/error responses
4. **Role-Based Access**: Every protected endpoint requires authentication + role check
5. **Error Handling**: Meaningful error messages; proper HTTP status codes

## Project Architecture

```
backend/src/
├── index.js                    # Express server setup
├── routes/
│   ├── auth.routes.js         # /api/auth/* endpoints
│   ├── resource.routes.js      # /api/resources/* endpoints
│   ├── subject.routes.js       # /api/subjects/* endpoints
│   ├── upload.routes.js        # /api/upload/* endpoints
│   ├── analytics.routes.js     # /api/analytics/* endpoints
│   ├── announcement.routes.js  # /api/announcements/* endpoints
│   └── user.routes.js          # /api/users/* endpoints
├── controllers/                # Route handlers
├── middleware/                 # Auth, role, validation
├── services/                   # Business logic
├── validators/                 # express-validator rules
├── config/                     # Supabase, S3, Passport
└── utils/
    └── response.js             # Response formatter
```

## Route File Template

```javascript
const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/authenticate');
const { authorizeRole } = require('../middleware/role.middleware');
const Controller = require('../controllers/example.controller');

const router = express.Router();

/**
 * GET /api/example
 * @description Retrieve all examples (public or with filters)
 */
router.get('/', async (req, res, next) => {
  try {
    const examples = await Controller.getAll(req.query);
    res.json({ status: 'success', data: examples });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/example
 * @description Create a new example (requires auth)
 */
router.post(
  '/',
  authenticate,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').optional().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'error', errors: errors.array() });
      }

      const example = await Controller.create(req.body, req.user);
      res.status(201).json({ 
        status: 'success', 
        data: example,
        message: 'Example created successfully'
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/example/:id
 * @description Retrieve a specific example
 */
router.get('/:id', async (req, res, next) => {
  try {
    const example = await Controller.getById(req.params.id);
    if (!example) {
      return res.status(404).json({ status: 'error', error: 'Example not found' });
    }
    res.json({ status: 'success', data: example });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/example/:id
 * @description Update an example (requires auth + role)
 */
router.patch(
  '/:id',
  authenticate,
  authorizeRole('professor', 'admin'),
  [
    body('title').optional().trim(),
    body('description').optional().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'error', errors: errors.array() });
      }

      const updated = await Controller.update(req.params.id, req.body, req.user);
      res.json({ 
        status: 'success', 
        data: updated,
        message: 'Example updated successfully'
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/example/:id
 * @description Delete an example (requires admin role)
 */
router.delete(
  '/:id',
  authenticate,
  authorizeRole('admin'),
  async (req, res, next) => {
    try {
      await Controller.delete(req.params.id, req.user);
      res.json({ 
        status: 'success',
        message: 'Example deleted successfully'
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
```

## Controller File Template

```javascript
const supabase = require('../config/supabase.config');

class ExampleController {
  /**
   * Get all examples with optional filters
   */
  static async getAll(filters = {}) {
    let query = supabase.from('examples').select('*');

    if (filters.subject) {
      query = query.eq('subject', filters.subject);
    }
    if (filters.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  /**
   * Get example by ID
   */
  static async getById(id) {
    const { data, error } = await supabase
      .from('examples')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
  }

  /**
   * Create new example
   */
  static async create(payload, user) {
    const { data, error } = await supabase
      .from('examples')
      .insert([{
        ...payload,
        created_by: user.id,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update example
   */
  static async update(id, payload, user) {
    // Verify ownership or admin role
    const existing = await this.getById(id);
    if (!existing) throw new Error('Example not found');

    if (existing.created_by !== user.id && user.role !== 'admin') {
      throw { status: 403, message: 'Unauthorized to update this example' };
    }

    const { data, error } = await supabase
      .from('examples')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete example
   */
  static async delete(id, user) {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Example not found');

    // Only admin can delete
    if (user.role !== 'admin') {
      throw { status: 403, message: 'Only admins can delete examples' };
    }

    const { error } = await supabase
      .from('examples')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

module.exports = ExampleController;
```

## Middleware Patterns

### 1. Authentication Middleware
```javascript
// middleware/authenticate.js
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ status: 'error', error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role, ...}
    next();
  } catch (err) {
    return res.status(401).json({ status: 'error', error: 'Invalid or expired token' });
  }
};

module.exports = { authenticate };
```

### 2. Role-Based Authorization Middleware
```javascript
// middleware/role.middleware.js
const authorizeRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ status: 'error', error: 'Not authenticated' });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ 
      status: 'error', 
      error: `Only ${roles.join(', ')} can access this resource` 
    });
  }

  next();
};

module.exports = { authorizeRole };
```

## Input Validation Patterns

### Validator File
```javascript
// validators/resource.validator.js
const { body, query } = require('express-validator');

const createResourceValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 255 }).withMessage('Title must be ≤ 255 characters'),

  body('subject')
    .notEmpty().withMessage('Subject is required')
    .isIn(['ECE', 'IT', 'MECH']).withMessage('Invalid subject'),

  body('type')
    .notEmpty().withMessage('Type is required')
    .isIn(['lecture', 'note', 'pyq']).withMessage('Invalid type'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description must be ≤ 1000 characters'),
];

const filterValidator = [
  query('subject').optional().isIn(['ECE', 'IT', 'MECH']),
  query('type').optional().isIn(['lecture', 'note', 'pyq']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

module.exports = {
  createResourceValidator,
  filterValidator,
};
```

### Using Validators in Routes
```javascript
const { createResourceValidator } = require('../validators/resource.validator');

router.post('/', authenticate, createResourceValidator, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  // ... process request
});
```

## Common Endpoint Patterns

### 1. Resource CRUD
```javascript
// GET /api/resources — List with filtering
// POST /api/resources — Create (auth required)
// GET /api/resources/:id — Get by ID
// PATCH /api/resources/:id — Update (auth + ownership check)
// DELETE /api/resources/:id — Delete (admin only)
```

### 2. Analytics
```javascript
// GET /api/analytics/professor/:id — Professor's own analytics
// GET /api/analytics/platform — Platform stats (admin only)
```

### 3. File Upload
```javascript
// POST /api/upload/presigned-url — Get S3 presigned URL
// GET /api/upload/:fileId — Download file (generates new presigned URL)
```

### 4. Authentication
```javascript
// POST /api/auth/login — Manual login (if needed)
// POST /api/auth/signup — Register new user
// GET /api/auth/google/callback — OAuth callback
// POST /api/auth/logout — Invalidate token (optional)
```

## Error Handling Pattern

```javascript
// Global error handler (at end of index.js)
app.use((err, _req, res, _next) => {
  console.error(err);

  // Handle custom errors
  if (err.status) {
    return res.status(err.status).json({ status: 'error', error: err.message });
  }

  // Handle Supabase/DB errors
  if (err.code === 'PGRST') {
    return res.status(400).json({ status: 'error', error: 'Database error' });
  }

  // Default: Internal server error
  res.status(500).json({ 
    status: 'error', 
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});
```

## Response Helper

```javascript
// utils/response.js
const success = (data, message = 'Success') => ({
  status: 'success',
  data,
  message,
});

const error = (message, code = 'ERROR') => ({
  status: 'error',
  error: message,
  code,
});

module.exports = { success, error };

// Usage
res.json(success(data, 'Resource created'));
res.status(400).json(error('Validation failed', 'VALIDATION_ERROR'));
```

## Security Checklist

- [ ] All inputs validated with `express-validator`
- [ ] Sensitive routes protected with `authenticate` middleware
- [ ] Role-based access checked with `authorizeRole` middleware
- [ ] No sensitive data logged to console in production
- [ ] Database queries use parameterized queries (Supabase SDK handles this)
- [ ] CORS properly configured for frontend origin only
- [ ] JWT secret is strong and stored in .env
- [ ] Password hashing used if storing passwords (bcryptjs)
- [ ] Rate limiting considered for public endpoints (future improvement)

## Testing API Endpoints

### Using cURL
```bash
# GET (no auth)
curl http://localhost:5000/api/resources

# POST with auth
curl -X POST http://localhost:5000/api/resources \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Resource","subject":"ECE",...}'

# With filters
curl "http://localhost:5000/api/resources?subject=ECE&type=lecture"
```

### Using Postman
1. Create collection with base URL: `http://localhost:5000/api`
2. Add Auth token to Authorization tab (Bearer token)
3. Test each endpoint with sample data

## Performance Optimization

### Database Query Optimization
```javascript
// ✅ Good: Only select needed fields
.select('id, title, subject, created_at')

// ❌ Avoid: Select everything
.select('*')
```

### Pagination
```javascript
static async getAll(page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const query = supabase
    .from('resources')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1);
  
  const { data, count } = await query;
  return {
    data,
    pagination: { page, limit, total: count }
  };
}
```

## Common Pitfalls

| Issue | Solution |
|-------|----------|
| "Cannot read property 'id' of undefined" | Check that req.user is populated by authenticate middleware; add middleware in correct order |
| CORS errors | Verify CLIENT_URL in .env matches frontend origin; restart server |
| JWT expired | Implement refresh token logic or extend JWT expiry in .env |
| Database connection fails | Check SUPABASE_URL and SUPABASE_KEY in .env; verify network access |
| File upload fails | Verify S3 credentials, bucket name, and AWS_REGION in .env |

---

**Link to Main Guide**: [EduSphere Development Guide](.github/copilot-instructions.md)  
**Related Files**: [Backend index.js](backend/src/index.js), [Database Schema](backend/schema.sql)

*Last Updated: April 2026*
