const { sql } = require('../db/client');
const { checkValidation } = require('../utils/response');
const { getPresignedDownloadUrl, deleteObject } = require('../services/s3.service');
const { generateUniqueSlug } = require('../services/slug.service');
const { blockProfessorOnLegacy } = require('../middleware/legacy.middleware');

function buildResourceFilters(query) {
  const clauses = [];
  const params = [];

  const push = (sqlFrag, value) => {
    params.push(value);
    clauses.push(sqlFrag.replace('?', `$${params.length}`));
  };

  if (query.resource_type) push('r.resource_type = ?', query.resource_type);
  if (query.pyq_type) push('r.pyq_type = ?', query.pyq_type);
  if (query.year) push('r.year = ?', Number(query.year));
  if (query.subject_id) push('r.subject_id = ?', query.subject_id);
  if (query.uploaded_by) push('r.uploaded_by = ?', query.uploaded_by);
  if (query.branch) push('s.branch = ?', query.branch);
  if (query.semester) push('s.semester = ?', Number(query.semester));

  return { clauses, params };
}

// ── GET /api/resources — list with filters ─────────────────────────────────
async function list(req, res, next) {
  try {
    if (checkValidation(req, res)) return;
    const { branch, semester, subject_id, resource_type, pyq_type, year, uploaded_by, uploaded_by_name, q } = req.query;

    const filters = buildResourceFilters({ branch, semester, subject_id, resource_type, pyq_type, year, uploaded_by });

    if (uploaded_by_name) {
      filters.params.push(`%${uploaded_by_name}%`);
      filters.clauses.push(`u.username ilike $${filters.params.length}`);
    }

    if (q) {
      filters.params.push(`%${q}%`);
      const n = filters.params.length;
      filters.clauses.push(`(
        r.title ilike $${n}
        or r.slug ilike $${n}
        or coalesce(r.description, '') ilike $${n}
        or coalesce(s.name_full, '') ilike $${n}
        or coalesce(s.acronym, '') ilike $${n}
        or coalesce(u.username, '') ilike $${n}
        or coalesce(u.name, '') ilike $${n}
      )`);
    }

    const whereSql = filters.clauses.length > 0 ? `where ${filters.clauses.join(' and ')}` : '';

    const resources = await sql.query(
      `
        select
          r.id,
          r.title,
          r.description,
          r.resource_type,
          r.year,
          r.pyq_type,
          r.external_link,
          r.aws_s3_key,
          r.youtube_url,
          r.slug,
          r.created_at,
          r.uploaded_by,
          case
            when u.id is null then null
            else jsonb_build_object(
              'id', u.id,
              'username', u.username,
              'name', u.name,
              'role', u.role
            )
          end as uploader,
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
        ${whereSql}
        order by r.created_at desc
      `,
      filters.params
    );

    return res.json({ resources });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/resources/:slug ───────────────────────────────────────────────
async function getBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    const rows = await sql`
      select
        r.*,
        case
          when u.id is null then null
          else jsonb_build_object(
            'id', u.id,
            'username', u.username,
            'name', u.name,
            'role', u.role
          )
        end as uploader,
        case
          when s.id is null then null
          else jsonb_build_object(
            'id', s.id,
            'branch', s.branch,
            'semester', s.semester,
            'name_full', s.name_full,
            'acronym', s.acronym,
            'added_by', s.added_by,
            'added_date', s.added_date
          )
        end as subjects
      from resources r
      left join subjects s on s.id = r.subject_id
      left join users u on u.id = r.uploaded_by
      where r.slug = ${slug} or r.id::text = ${slug}
      limit 1
    `;

    const data = rows[0] || null;
    if (!data) return res.status(404).json({ error: 'Resource not found' });

    // Return signed URL if S3 resource
    let signedUrl = null;
    if (data.aws_s3_key) {
      signedUrl = await getPresignedDownloadUrl(data.aws_s3_key);
    }

    return res.json({ resource: { ...data, signedUrl } });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/resources — create ───────────────────────────────────────────
async function create(req, res, next) {
  try {
    if (checkValidation(req, res)) return;
    const { subject_id, resource_type, title, description, year, pyq_type, external_link, aws_s3_key, youtube_url } = req.body;

    if (!subject_id || !resource_type || !title)
      return res.status(400).json({ error: 'subject_id, resource_type and title are required' });

    const sourceCount = [external_link, aws_s3_key, youtube_url].filter(Boolean).length;
    if (sourceCount === 0)
      return res.status(400).json({ error: 'One of external_link, aws_s3_key, or youtube_url must be provided' });
    if (sourceCount > 1)
      return res.status(400).json({ error: 'Only one of external_link, aws_s3_key, or youtube_url can be set' });



    // Resolve subject metadata for slug
    const subjectRows = await sql`
      select acronym, semester
      from subjects
      where id = ${subject_id}
      limit 1
    `;
    const subject = subjectRows[0] || null;
    if (!subject) return res.status(400).json({ error: 'Invalid subject_id' });

    const slug = await generateUniqueSlug({
      acronym:       subject.acronym,
      resource_type,
      semester:      subject.semester,
      pyq_type,
      year,
    });

    const inserted = await sql`
      insert into resources (
        subject_id, resource_type, title, description,
        year, pyq_type, external_link, aws_s3_key, youtube_url,
        uploaded_by, slug
      )
      values (
        ${subject_id}, ${resource_type}, ${title}, ${description || null},
        ${year ? Number(year) : null}, ${pyq_type || null}, ${external_link || null}, ${aws_s3_key || null}, ${youtube_url || null},
        ${req.user.id}, ${slug}
      )
      returning id
    `;
    const newId = inserted[0]?.id;

    const fullRows = await sql`
      select
        r.*,
        case
          when u.id is null then null
          else jsonb_build_object(
            'id', u.id,
            'username', u.username,
            'name', u.name,
            'role', u.role
          )
        end as uploader,
        case
          when s.id is null then null
          else jsonb_build_object(
            'id', s.id,
            'branch', s.branch,
            'semester', s.semester,
            'name_full', s.name_full,
            'acronym', s.acronym
          )
        end as subjects
      from resources r
      left join subjects s on s.id = r.subject_id
      left join users u on u.id = r.uploaded_by
      where r.id = ${newId}
      limit 1
    `;
    const resource = fullRows[0];

    return res.status(201).json({ resource });
  } catch (err) {
    next(err);
  }
}

// ── PUT /api/resources/:id — update ───────────────────────────────────────
async function update(req, res, next) {
  try {
    const { id } = req.params;

    const existingRows = await sql`
      select * from resources where id = ${id} limit 1
    `;
    const existing = existingRows[0] || null;
    if (!existing) return res.status(404).json({ error: 'Resource not found' });

    // Legacy & Ownership check (professors own-only; admins bypass)
    if (req.user.role === 'professor') {
      const isLegacy = existing.external_link && !existing.aws_s3_key;
      if (isLegacy) {
        return res.status(403).json({ error: 'Professors cannot modify legacy Google Drive content' });
      }
      if (String(existing.uploaded_by) !== String(req.user.id)) {
        return res.status(403).json({ error: 'You can only edit your own resources' });
      }
    }

    const allowedFields = ['title', 'description', 'year', 'pyq_type', 'aws_s3_key', 'youtube_url', 'external_link'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    if (Object.keys(updates).length === 0)
      return res.status(400).json({ error: 'No valid fields to update' });

    const fields = [];
    const values = [];

    Object.entries(updates).forEach(([key, value]) => {
      fields.push(`${key} = $${values.length + 1}`);
      if (key === 'year') {
        values.push(value === null || value === '' ? null : Number(value));
      } else if (['pyq_type', 'youtube_url', 'external_link', 'aws_s3_key', 'description'].includes(key)) {
        values.push(value === '' || value === null ? null : value);
      } else {
        values.push(value);
      }
    });

    values.push(id);

    await sql.query(
      `update resources set ${fields.join(', ')} where id = $${values.length}`,
      values
    );

    const fullRows = await sql`
      select
        r.*,
        case
          when u.id is null then null
          else jsonb_build_object(
            'id', u.id,
            'username', u.username,
            'name', u.name,
            'role', u.role
          )
        end as uploader,
        case
          when s.id is null then null
          else jsonb_build_object(
            'id', s.id,
            'branch', s.branch,
            'semester', s.semester,
            'name_full', s.name_full,
            'acronym', s.acronym
          )
        end as subjects
      from resources r
      left join subjects s on s.id = r.subject_id
      left join users u on u.id = r.uploaded_by
      where r.id = ${id}
      limit 1
    `;
    const resource = fullRows[0];
    if (!resource) return res.status(404).json({ error: 'Resource not found' });

    return res.json({ resource });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/resources/:id ──────────────────────────────────────────────
async function remove(req, res, next) {
  try {
    const { id } = req.params;

    const existingRows = await sql`
      select * from resources where id = ${id} limit 1
    `;
    const existing = existingRows[0] || null;
    if (!existing) return res.status(404).json({ error: 'Resource not found' });

    // Legacy protection
    const legacyCheck = blockProfessorOnLegacy(existing);
    legacyCheck(req, res, async () => {
      if (req.user.role === 'professor' && existing.uploaded_by !== req.user.id)
        return res.status(403).json({ error: 'You can only delete your own resources' });

      // Remove S3 object if applicable
      if (existing.aws_s3_key) await deleteObject(existing.aws_s3_key);

      await sql`delete from resources where id = ${id}`;
      return res.json({ message: 'Resource deleted' });
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/resources/:id/save ──────────────────────────────────────────
async function saveResource(req, res, next) {
  try {
    const { id } = req.params;

    try {
      await sql`
        insert into saved_resources (user_id, resource_id)
        values (${req.user.id}, ${id})
      `;
    } catch (err) {
      if (err?.code === '23505') {
        return res.status(409).json({ error: 'Already saved' });
      }
      throw err;
    }

    return res.status(201).json({ message: 'Resource saved' });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/resources/:id/save ────────────────────────────────────────
async function unsaveResource(req, res, next) {
  try {
    const { id } = req.params;

    await sql`
      delete from saved_resources
      where user_id = ${req.user.id}
      and resource_id = ${id}
    `;

    return res.json({ message: 'Resource unsaved' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getBySlug, create, update, remove, saveResource, unsaveResource };
