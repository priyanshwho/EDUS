const supabase = require('../config/supabase.config');
const { checkValidation } = require('../utils/response');
const { getPresignedDownloadUrl, deleteObject } = require('../services/s3.service');
const { generateUniqueSlug } = require('../services/slug.service');
const { blockProfessorOnLegacy } = require('../middleware/legacy.middleware');

// ── GET /api/resources — list with filters ─────────────────────────────────
async function list(req, res, next) {
  try {
    if (checkValidation(req, res)) return;
    const { branch, semester, subject_id, resource_type, pyq_type, year, uploaded_by, q } = req.query;

    let query = supabase
      .from('resources')
      .select(`
        id, title, description, resource_type, year, pyq_type,
        external_link, aws_s3_key, youtube_url, slug, created_at, uploaded_by,
        subjects ( id, name_full, acronym, branch, semester )
      `)
      .order('created_at', { ascending: false });

    if (resource_type) query = query.eq('resource_type', resource_type);
    if (pyq_type)      query = query.eq('pyq_type', pyq_type);
    if (year)          query = query.eq('year', year);
    if (uploaded_by)   query = query.eq('uploaded_by', uploaded_by);
    if (subject_id)    query = query.eq('subject_id', subject_id);

    if (branch || semester) {
      // Filter via subjects join
      if (branch)    query = query.eq('subjects.branch', branch);
      if (semester)  query = query.eq('subjects.semester', semester);
    }

    if (q) {
      query = query.or(`title.ilike.%${q}%,slug.ilike.%${q}%,description.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return res.json({ resources: data });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/resources/:slug ───────────────────────────────────────────────
async function getBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    const { data, error } = await supabase
      .from('resources')
      .select(`*, subjects ( * )`)
      .eq('slug', slug)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Resource not found' });

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

    // Legacy Drive links — only admin
    if (external_link && req.user.role === 'professor')
      return res.status(403).json({ error: 'Professors cannot add legacy Drive links' });

    // Resolve subject metadata for slug
    const { data: subject, error: subErr } = await supabase
      .from('subjects')
      .select('acronym, semester')
      .eq('id', subject_id)
      .single();
    if (subErr || !subject) return res.status(400).json({ error: 'Invalid subject_id' });

    const slug = await generateUniqueSlug({
      acronym:       subject.acronym,
      resource_type,
      semester:      subject.semester,
      pyq_type,
      year,
    });

    const { data: resource, error } = await supabase
      .from('resources')
      .insert({
        subject_id, resource_type, title, description,
        year, pyq_type, external_link, aws_s3_key, youtube_url,
        uploaded_by: req.user.id,
        slug,
      })
      .select()
      .single();
    if (error) throw error;

    return res.status(201).json({ resource });
  } catch (err) {
    next(err);
  }
}

// ── PUT /api/resources/:id — update ───────────────────────────────────────
async function update(req, res, next) {
  try {
    const { id } = req.params;

    const { data: existing, error: fetchErr } = await supabase
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchErr || !existing) return res.status(404).json({ error: 'Resource not found' });

    // Legacy protection
    const legacyCheck = blockProfessorOnLegacy(existing);
    legacyCheck(req, res, async () => {
      // Ownership check (professors own-only; admins bypass)
      if (req.user.role === 'professor' && existing.uploaded_by !== req.user.id)
        return res.status(403).json({ error: 'You can only edit your own resources' });

      const allowedFields = ['title', 'description', 'year', 'pyq_type', 'aws_s3_key', 'youtube_url'];
      const updates = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      }

      const { data, error } = await supabase
        .from('resources')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.json({ resource: data });
    });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/resources/:id ──────────────────────────────────────────────
async function remove(req, res, next) {
  try {
    const { id } = req.params;

    const { data: existing } = await supabase
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();
    if (!existing) return res.status(404).json({ error: 'Resource not found' });

    // Legacy protection
    const legacyCheck = blockProfessorOnLegacy(existing);
    legacyCheck(req, res, async () => {
      if (req.user.role === 'professor' && existing.uploaded_by !== req.user.id)
        return res.status(403).json({ error: 'You can only delete your own resources' });

      // Remove S3 object if applicable
      if (existing.aws_s3_key) await deleteObject(existing.aws_s3_key);

      await supabase.from('resources').delete().eq('id', id);
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
    const { error } = await supabase
      .from('saved_resources')
      .insert({ user_id: req.user.id, resource_id: id });
    if (error && error.code === '23505')
      return res.status(409).json({ error: 'Already saved' });
    if (error) throw error;
    return res.status(201).json({ message: 'Resource saved' });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/resources/:id/save ────────────────────────────────────────
async function unsaveResource(req, res, next) {
  try {
    const { id } = req.params;
    await supabase
      .from('saved_resources')
      .delete()
      .eq('user_id', req.user.id)
      .eq('resource_id', id);
    return res.json({ message: 'Resource unsaved' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getBySlug, create, update, remove, saveResource, unsaveResource };
