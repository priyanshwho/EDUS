const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { requireAdmin } = require('../middleware/role.middleware');
const { sql } = require('../db/client');

// Admin: list all users
router.get('/', authenticate, requireAdmin, async (_req, res, next) => {
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
router.patch('/:id/role', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['student', 'professor', 'admin'].includes(role))
      return res.status(400).json({ error: 'Invalid role' });

    const rows = await sql`
      update users
      set role = ${role}
      where id = ${req.params.id}
      returning id, username, email, role
    `;
    const user = rows[0] || null;
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({ user });
  } catch (err) { next(err); }
});

// Admin: delete user
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const rows = await sql`
      delete from users
      where id = ${req.params.id}
      returning id
    `;
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

    return res.json({ message: 'User deleted' });
  } catch (err) { next(err); }
});

// Authenticated: get saved resources
router.get('/saved', authenticate, async (req, res, next) => {
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
