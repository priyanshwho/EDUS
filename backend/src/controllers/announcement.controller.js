const { sql } = require('../db/client');

async function list(req, res, next) {
  try {
    const { subject_id } = req.query;

    const announcements = subject_id
      ? await sql`
          select
            a.*,
            case
              when s.id is null then null
              else jsonb_build_object('name_full', s.name_full, 'acronym', s.acronym)
            end as subjects
          from announcements a
          left join subjects s on s.id = a.subject_id
          where a.subject_id = ${subject_id}
          order by a.created_at desc
        `
      : await sql`
          select
            a.*,
            case
              when s.id is null then null
              else jsonb_build_object('name_full', s.name_full, 'acronym', s.acronym)
            end as subjects
          from announcements a
          left join subjects s on s.id = a.subject_id
          order by a.created_at desc
        `;

    return res.json({ announcements });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { subject_id, title, content } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'title and content are required' });

    const rows = await sql`
      insert into announcements (subject_id, title, content, posted_by)
      values (${subject_id || null}, ${title}, ${content}, ${req.user.id})
      returning *
    `;
    return res.status(201).json({ announcement: rows[0] });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const existingRows = await sql`
      select posted_by
      from announcements
      where id = ${id}
      limit 1
    `;
    const existing = existingRows[0] || null;

    if (!existing) return res.status(404).json({ error: 'Announcement not found' });
    if (req.user.role !== 'admin' && existing.posted_by !== req.user.id)
      return res.status(403).json({ error: 'Access denied' });

    await sql`delete from announcements where id = ${id}`;
    return res.json({ message: 'Announcement deleted' });
  } catch (err) { next(err); }
}

module.exports = { list, create, remove };
