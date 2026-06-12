const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { requireAdmin } = require('../middleware/role.middleware');
const { cacheGet, invalidateAllCache } = require('../middleware/cache.middleware');
const { sql } = require('../db/client');

// Public: list professors (searchable)
router.get('/public/professors', cacheGet({
  scope: 'users:public:professors',
  ttlSeconds: 180,
}), async (req, res, next) => {
  try {
    const { q } = req.query;
    const params = [];
    const where = [`u.role in ('professor', 'admin')`];

    if (q) {
      params.push(`%${q}%`);
      const n = params.length;
      where.push(`(u.username ilike $${n} or coalesce(u.name, '') ilike $${n})`);
    }

    const professors = await sql.query(
      `
        select
          u.id,
          u.username,
          u.name,
          u.created_at,
          (
            select count(*)::int
            from subjects s
            where s.added_by = u.id
          ) as subjects_count,
          (
            select count(*)::int
            from resources r
            where r.uploaded_by = u.id
          ) as resources_count
        from users u
        where ${where.join(' and ')}
        order by resources_count desc, u.username asc
      `,
      params
    );

    return res.json({ professors });
  } catch (err) {
    next(err);
  }
});

// Public: professor profile + subjects + uploads
router.get('/public/professors/:username', cacheGet({
  scope: 'users:public:professor-profile',
  ttlSeconds: 120,
}), async (req, res, next) => {
  try {
    const { username } = req.params;
    const {
      branch,
      semester,
      subject_id,
      resource_type,
      q,
    } = req.query;

    const professorRows = await sql`
      select id, username, name, role, created_at
      from users
      where username = ${username}
      and role in ('professor', 'admin')
      limit 1
    `;

    const professor = professorRows[0] || null;
    if (!professor) return res.status(404).json({ error: 'Professor not found' });

    const subjects = await sql`
      select id, branch, semester, name_full, acronym, added_by, added_date
      from subjects
      where added_by = ${professor.id}
      order by semester asc, name_full asc
    `;

    const params = [professor.id];
    const clauses = ['r.uploaded_by = $1'];

    if (branch) {
      params.push(branch);
      clauses.push(`s.branch = $${params.length}`);
    }
    if (semester) {
      params.push(Number(semester));
      clauses.push(`s.semester = $${params.length}`);
    }
    if (subject_id) {
      params.push(subject_id);
      clauses.push(`r.subject_id = $${params.length}`);
    }
    if (resource_type) {
      params.push(resource_type);
      clauses.push(`r.resource_type = $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      const n = params.length;
      clauses.push(`(r.title ilike $${n} or coalesce(r.description, '') ilike $${n} or r.slug ilike $${n})`);
    }

    const resources = await sql.query(
      `
        select
          r.id,
          r.subject_id,
          r.resource_type,
          r.title,
          r.description,
          r.year,
          r.pyq_type,
          r.external_link,
          r.aws_s3_key,
          r.youtube_url,
          r.uploaded_by,
          r.created_at,
          r.slug,
          jsonb_build_object(
            'id', u.id,
            'username', u.username,
            'name', u.name,
            'role', u.role
          ) as uploader,
          case
            when s.id is null then null
            else jsonb_build_object(
              'id', s.id,
              'name_full', s.name_full,
              'acronym', s.acronym,
              'branch', s.branch,
              'semester', s.semester
            )
          end as subjects
        from resources r
        left join subjects s on s.id = r.subject_id
        left join users u on u.id = r.uploaded_by
        where ${clauses.join(' and ')}
        order by r.created_at desc
      `,
      params
    );

    return res.json({ professor, subjects, resources });
  } catch (err) {
    next(err);
  }
});

// Admin: list all users
router.get('/', authenticate, requireAdmin, cacheGet({
  scope: 'users:list',
  ttlSeconds: 120,
  varyByRole: true,
}), async (_req, res, next) => {
  try {
    const users = await sql`
      select id, username, name, email, role, created_at
      from users
      order by created_at desc
    `;
    return res.json({ users });
  } catch (err) { next(err); }
});

// Admin: update user role
router.patch('/:id/role', authenticate, requireAdmin, invalidateAllCache(), async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['student', 'professor', 'admin'].includes(role))
      return res.status(400).json({ error: 'Invalid role' });

    const targetUser = await sql`select email from users where id = ${req.params.id}`;
    if (targetUser.length === 0) return res.status(404).json({ error: 'User not found' });
    
    if (targetUser[0].email === process.env.ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Cannot modify super admin role' });
    }

    const rows = await sql`
      update users
      set role = ${role}
      where id = ${req.params.id}
      returning id, username, email, role
    `;
    const user = rows[0] || null;

    return res.json({ user });
  } catch (err) { next(err); }
});

// Admin: delete user
router.delete('/:id', authenticate, requireAdmin, invalidateAllCache(), async (req, res, next) => {
  try {
    const targetUser = await sql`select email from users where id = ${req.params.id}`;
    if (targetUser.length === 0) return res.status(404).json({ error: 'User not found' });
    
    if (targetUser[0].email === process.env.ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Cannot delete super admin' });
    }

    const rows = await sql`
      delete from users
      where id = ${req.params.id}
      returning id
    `;

    return res.json({ message: 'User deleted' });
  } catch (err) { next(err); }
});

// Authenticated: get saved resources
router.get('/saved', authenticate, cacheGet({
  scope: 'users:saved',
  ttlSeconds: 90,
  varyByUser: true,
}), async (req, res, next) => {
  try {
    const saved = await sql`
      select
        sr.id,
        sr.user_id,
        sr.resource_id,
        sr.created_at,
        jsonb_build_object(
          'id', r.id,
          'subject_id', r.subject_id,
          'resource_type', r.resource_type,
          'title', r.title,
          'description', r.description,
          'year', r.year,
          'pyq_type', r.pyq_type,
          'external_link', r.external_link,
          'aws_s3_key', r.aws_s3_key,
          'youtube_url', r.youtube_url,
          'uploaded_by', r.uploaded_by,
          'created_at', r.created_at,
          'slug', r.slug,
          'subjects', case
            when s.id is null then null
            else jsonb_build_object(
              'name_full', s.name_full,
              'acronym', s.acronym
            )
          end
        ) as resources
      from saved_resources sr
      join resources r on r.id = sr.resource_id
      left join subjects s on s.id = r.subject_id
      where sr.user_id = ${req.user.id}
      order by sr.created_at desc
    `;

    return res.json({ saved });
  } catch (err) { next(err); }
});

module.exports = router;
