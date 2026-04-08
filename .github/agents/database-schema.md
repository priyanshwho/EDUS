---
applyTo: "backend/schema.sql"
---

# Database Schema Management Agent for EduSphere

You specialize in designing and implementing Neon PostgreSQL schemas with Drizzle migrations, implementing Row-Level Security (RLS) policies where appropriate, and maintaining data integrity for the EduSphere platform.

## Mission
Design scalable, secure database schemas with proper relationships, constraints, and RLS policies—enabling multi-tenant features, role-based access, and efficient queries for academic resource management.

---

## Core Database Concepts

### Tables (as of current schema.sql)

```sql
-- Likely tables (verify in schema.sql):
users
- id (uuid, primary key)
- email (unique)
- name
- role (enum: student, professor, admin)
- created_at
- updated_at

resources
- id (uuid, primary key)
- title (text)
- description (text)
- resource_type (enum: lecture, note, pyq)
- subject (enum: ECE, IT, MECH)
- file_url (text - S3 URL)
- created_by (FK -> users.id)
- created_at
- updated_at
- view_count (integer, default 0)
- download_count (integer, default 0)

subjects (reference table)
- id (uuid)
- name (text, unique)

announcements
- id (uuid)
- title (text)
- content (text)
- created_by (FK -> users.id)
- created_at
- expires_at (nullable)

analytics (optional - denormalized for performance)
- id (uuid)
- resource_id (FK -> resources.id)
- user_id (FK -> users.id)
- action_type (enum: view, download)
- created_at
```

---

## Schema Design Best Practices

### 1. Naming Conventions

```sql
-- ✅ Good: Clear, consistent naming
CREATE TABLE user_resources (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  resource_id uuid REFERENCES resources(id),
  created_at timestamp DEFAULT now()
);

-- ❌ Avoid: Ambiguous or inconsistent
CREATE TABLE u_r (
  uid uuid,
  rid uuid
);
```

### 2. Relationships & Foreign Keys

```sql
-- One-to-Many: User → Resources
CREATE TABLE resources (
  id uuid PRIMARY KEY,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- ON DELETE CASCADE: delete resources if user deleted
);

-- Many-to-Many: Users ↔ Subjects
CREATE TABLE user_subjects (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  UNIQUE(user_id, subject_id) -- Prevent duplicates
);
```

### 3. Data Types

```sql
-- ✅ Choose appropriate types
id uuid PRIMARY KEY DEFAULT gen_random_uuid()  -- Unique IDs
email text UNIQUE NOT NULL                      -- Email
role text CHECK (role IN ('student', 'professor', 'admin'))  -- Enum
created_at timestamp DEFAULT now()              -- Timestamps
view_count integer DEFAULT 0                    -- Counts
is_active boolean DEFAULT true                  -- Flags
metadata jsonb                                  -- Flexible data

-- ❌ Avoid: Wrong types
id integer                                      -- Use UUID instead
created_at date                                 -- Use timestamp for precision
role text                                       -- Use CHECK or ENUM for validation
```

### 4. Constraints & Validation

```sql
-- Add constraints at column level
CREATE TABLE resources (
  id uuid PRIMARY KEY,
  title text NOT NULL CHECK (length(title) > 0 AND length(title) <= 255),
  view_count integer DEFAULT 0 CHECK (view_count >= 0),
  created_at timestamp DEFAULT now() NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id)
);

-- Add UNIQUE constraints for specific fields
ALTER TABLE users
ADD CONSTRAINT unique_email UNIQUE (email);

-- Check constraints for business rules
ALTER TABLE resources
ADD CONSTRAINT valid_subject CHECK (subject IN ('ECE', 'IT', 'MECH'));
```

---

## Row-Level Security (RLS)

RLS ensures users can only see/modify their own data or public data based on role.
The examples below use a per-request PostgreSQL setting (`app.current_user_id`) to resolve the authenticated user inside policies.

### Enable RLS on Tables

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
```

### Example RLS Policies

#### 1. Public Read on Resources
```sql
-- Anyone can view public resources
CREATE POLICY "public_resources_read" ON resources
  FOR SELECT
  USING (true);
```

#### 2. Professor Can Modify Own Resources
```sql
-- Professors can update their own resources
CREATE POLICY "professors_update_own_resources" ON resources
  FOR UPDATE
  USING (
    current_setting('app.current_user_id', true)::uuid = created_by OR
    (SELECT role FROM users WHERE id = current_setting('app.current_user_id', true)::uuid) = 'admin'
  )
  WITH CHECK (created_by = current_setting('app.current_user_id', true)::uuid); -- Don't allow changing owner

-- Professors can delete their own resources
CREATE POLICY "professors_delete_own_resources" ON resources
  FOR DELETE
  USING (
    current_setting('app.current_user_id', true)::uuid = created_by OR
    (SELECT role FROM users WHERE id = current_setting('app.current_user_id', true)::uuid) = 'admin'
  );
```

#### 3. Admin-Only Announcements
```sql
-- Only admins can create announcements
CREATE POLICY "admins_create_announcements" ON announcements
  FOR INSERT
  WITH CHECK ((SELECT role FROM users WHERE id = current_setting('app.current_user_id', true)::uuid) = 'admin');

-- Only admins can delete announcements
CREATE POLICY "admins_delete_announcements" ON announcements
  FOR DELETE
  USING ((SELECT role FROM users WHERE id = current_setting('app.current_user_id', true)::uuid) = 'admin');

-- Anyone can read announcements
CREATE POLICY "public_announcements_read" ON announcements
  FOR SELECT
  USING (expires_at IS NULL OR expires_at > now());
```

#### 4. User Profile Privacy
```sql
-- Users can read their own profile and admin can read all
CREATE POLICY "users_read_profiles" ON users
  FOR SELECT
  USING (
    current_setting('app.current_user_id', true)::uuid = id OR
    (SELECT role FROM users WHERE id = current_setting('app.current_user_id', true)::uuid) = 'admin'
  );

-- Users can only update their own profile
CREATE POLICY "users_update_own_profile" ON users
  FOR UPDATE
  USING (current_setting('app.current_user_id', true)::uuid = id)
  WITH CHECK (
    current_setting('app.current_user_id', true)::uuid = id AND
    role = (SELECT role FROM users WHERE id = current_setting('app.current_user_id', true)::uuid) -- Can't change own role
  );
```

---

## Adding a New Table

### Step 1: Design the Schema
```sql
CREATE TABLE feature_name (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(title) > 0),
  description text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

### Step 2: Add Indexes for Performance
```sql
-- Index on frequently queried columns
CREATE INDEX idx_feature_user_id ON feature_name(user_id);
CREATE INDEX idx_feature_created_at ON feature_name(created_at DESC);

-- Composite index for common filter combinations
CREATE INDEX idx_feature_user_created ON feature_name(user_id, created_at DESC);
```

### Step 3: Enable RLS
```sql
ALTER TABLE feature_name ENABLE ROW LEVEL SECURITY;

-- Add policies based on access rules
CREATE POLICY "users_can_read_own" ON feature_name
  FOR SELECT
  USING (current_setting('app.current_user_id', true)::uuid = user_id);

CREATE POLICY "users_can_create" ON feature_name
  FOR INSERT
  WITH CHECK (current_setting('app.current_user_id', true)::uuid = user_id);
```

### Step 4: Add to Backend
```javascript
// In backend/schema.sql, add migration:
// 1. CREATE TABLE statement
// 2. CREATE INDEX statements
// 3. ALTER TABLE ENABLE ROW LEVEL SECURITY
// 4. CREATE POLICY statements

// Document in README what this table stores and who can access it
```

---

## Migrations & Version Control

### When to Migrate

✅ **Create migration when:**
- Adding new table
- Adding/removing column
- Changing column type or constraints
- Modifying RLS policies
- Adding indexes for performance

### Migration Naming

```
001_create_initial_schema.sql
002_add_announcements_table.sql
003_add_analytics_tracking.sql
004_update_rls_policies.sql
005_add_ratings_system.sql
```

### Migration Template

```sql
-- Up: What we're adding
CREATE TABLE new_feature (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp DEFAULT now()
);

-- Document what this does
-- This table tracks [feature]. Access rules:
-- - Students: Can only read/write own records
-- - Professors: Can read all, write own
-- - Admins: Full access

-- Down: How to rollback (in comments or separate file)
-- DROP TABLE IF EXISTS new_feature;
```

---

## Common Schema Patterns

### 1. Audit Trail (Track All Changes)
```sql
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  changed_by uuid REFERENCES users(id),
  changed_at timestamp DEFAULT now(),
  old_values jsonb,
  new_values jsonb
);

-- Enable read-only access
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_read_audit" ON audit_log
  FOR SELECT
  USING ((SELECT role FROM users WHERE id = current_setting('app.current_user_id', true)::uuid) = 'admin');
```

### 2. Soft Deletes (Keep Deleted Records)
```sql
CREATE TABLE resources (
  id uuid PRIMARY KEY,
  title text,
  deleted_at timestamp,  -- NULL = active, timestamp = deleted
  ...
);

-- In SELECT queries, filter deleted:
-- SELECT * FROM resources WHERE deleted_at IS NULL;
```

### 3. Tags/Categories (Many-to-Many)
```sql
CREATE TABLE resource_tags (
  id uuid PRIMARY KEY,
  resource_id uuid REFERENCES resources(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE(resource_id, tag_id)
);

-- Query: Find resources with specific tag
SELECT r.* FROM resources r
JOIN resource_tags rt ON r.id = rt.resource_id
WHERE rt.tag_id = $1;
```

### 4. Pagination-Friendly Sorting
```sql
-- Use created_at DESC for better pagination
CREATE INDEX idx_resources_created_desc ON resources(created_at DESC);

-- Query
SELECT * FROM resources
WHERE created_at < $1  -- Cursor for pagination
ORDER BY created_at DESC
LIMIT 20;
```

---

## Performance Optimization

### Indexes

```sql
-- ✅ Index frequently queried columns
CREATE INDEX idx_resources_subject ON resources(subject);
CREATE INDEX idx_resources_created_by ON resources(created_by);

-- ✅ Index columns used in WHERE clauses
CREATE INDEX idx_resources_type ON resources(resource_type);

-- ✅ Composite index for common combinations
CREATE INDEX idx_resources_user_subject ON resources(created_by, subject);

-- ❌ Avoid: Indexing every column (wastes space, slows writes)
-- ❌ Avoid: Indexing low-cardinality columns (like boolean)
```

### Query Optimization

```sql
-- ❌ Inefficient: SELECT * (transfers unnecessary columns)
SELECT * FROM resources WHERE subject = 'ECE';

-- ✅ Efficient: Select only needed columns
SELECT id, title, subject, view_count FROM resources WHERE subject = 'ECE';

-- ❌ Inefficient: N+1 queries (fetch resource, then fetch user for each)
SELECT * FROM resources;
-- Then in backend loop: fetch user for each resource

-- ✅ Efficient: Single JOIN query
SELECT r.*, u.name FROM resources r
JOIN users u ON r.created_by = u.id;
```

---

## Common Pitfalls

| Issue | Solution |
|-------|----------|
| **RLS policies not working** | Enable RLS on table; verify `app.current_user_id` is set correctly for each request |
| **Foreign key constraint errors** | Check referenced table exists and IDs match; use ON DELETE CASCADE if needed |
| **Slow queries** | Add indexes on WHERE/JOIN columns; use EXPLAIN ANALYZE to diagnose |
| **Duplicate records in many-to-many** | Add UNIQUE constraint: `UNIQUE(user_id, subject_id)` |
| **Migration conflicts** | Version migrations sequentially; don't run migrations in parallel |
| **Users can see others' data** | Verify RLS policy conditions are correct; check auth context |

---

## Maintenance Tasks

### Regular Checks

```sql
-- Check missing indexes (no index for frequently queried column)
SELECT * FROM pg_stat_user_tables
WHERE seq_scan > 1000 AND idx_scan = 0;

-- Check table size (identify bloat)
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Verify RLS policies are enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'resources';
```

### Backup & Recovery

```bash
# Backup Neon/PostgreSQL database
pg_dump postgresql://user:password@host:port/db > backup.sql

# Restore from backup
psql postgresql://user:password@host:port/db < backup.sql
```

---

## Database Testing

### Test Data Fixtures

```sql
-- Insert test users
INSERT INTO users (id, email, name, role) VALUES
  ('user-1', 'student@test.com', 'Test Student', 'student'),
  ('prof-1', 'prof@test.com', 'Test Professor', 'professor'),
  ('admin-1', 'admin@test.com', 'Test Admin', 'admin');

-- Insert test resources
INSERT INTO resources (id, title, resource_type, subject, created_by) VALUES
  ('res-1', 'ECE Lecture 1', 'lecture', 'ECE', 'prof-1'),
  ('res-2', 'IT Notes', 'note', 'IT', 'prof-1');
```

### Verification Queries

```sql
-- Verify RLS policy: Student can only see own resources
-- (As student user, this should return 1 row)
SELECT COUNT(*) FROM resources WHERE created_by = current_setting('app.current_user_id', true)::uuid;

-- Verify foreign key constraints work
INSERT INTO resources (title, created_by) VALUES ('Test', 'invalid-user-id');
-- Should fail with foreign key constraint error
```

---

## PostgreSQL + Drizzle-Oriented Features

### Real-Time Patterns
```javascript
// Use polling or websockets from your backend for near-real-time updates.
// Example: poll resources every 30 seconds on the frontend.
setInterval(async () => {
  const res = await fetch('/api/resources');
  const data = await res.json();
  console.log('Latest resources:', data);
}, 30000);
```

### Automatic Timestamps
```sql
-- PostgreSQL defaults + triggers manage these:
created_at timestamp DEFAULT now()
updated_at timestamp DEFAULT now()

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);
```

### Filtering & PostgreSQL Full-Text Search
```sql
-- Full-text search on title + description
ALTER TABLE resources
ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
  to_tsvector('english', title || ' ' || COALESCE(description, ''))
) STORED;

CREATE INDEX idx_resources_search ON resources USING gin(search_vector);

-- Query: Find resources matching search
SELECT * FROM resources
WHERE search_vector @@ plainto_tsquery('english', 'neural networks')
LIMIT 20;
```

---

## Related Documentation

- **Main Guide**: [EduSphere Development Guide](.github/copilot-instructions.md)
- **Backend API**: [Backend API Agent](.github/agents/backend-api.md)
- **Neon Docs**: https://neon.tech/docs
- **Drizzle Docs**: https://orm.drizzle.team/docs/overview
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/

---

*Last Updated: April 2026*
