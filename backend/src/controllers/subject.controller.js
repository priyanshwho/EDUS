const { sql } = require('../db/client');

async function list(req, res, next) {
  try {
    const { branch, semester } = req.query;

    let subjects;
    if (branch && semester) {
      subjects = await sql`
        select * from subjects
        where branch = ${branch} and semester = ${Number(semester)}
        order by name_full
      `;
    } else if (branch) {
      subjects = await sql`
        select * from subjects
        where branch = ${branch}
        order by name_full
      `;
    } else if (semester) {
      subjects = await sql`
        select * from subjects
        where semester = ${Number(semester)}
        order by name_full
      `;
    } else {
      subjects = await sql`select * from subjects order by name_full`;
    }

    return res.json({ subjects });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { branch, semester, name_full, acronym } = req.body;
    if (!branch || !semester || !name_full || !acronym)
      return res.status(400).json({ error: 'branch, semester, name_full and acronym are required' });

    const rows = await sql`
      insert into subjects (branch, semester, name_full, acronym, added_by)
      values (${branch}, ${Number(semester)}, ${name_full}, ${acronym}, ${req.user.id})
      returning *
    `;

    return res.status(201).json({ subject: rows[0] });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;

    const existingRows = await sql`
      select *
      from subjects
      where id = ${id}
      limit 1
    `;
    const existing = existingRows[0] || null;
    if (!existing) return res.status(404).json({ error: 'Subject not found' });

    if (req.user.role === 'professor' && String(existing.added_by) !== String(req.user.id)) {
      return res.status(403).json({ error: 'You can only update your own subjects' });
    }

    const fields = [];
    const values = [];

    if (req.body.branch !== undefined) {
      fields.push(`branch = $${values.length + 1}`);
      values.push(req.body.branch);
    }
    if (req.body.semester !== undefined) {
      fields.push(`semester = $${values.length + 1}`);
      values.push(Number(req.body.semester));
    }
    if (req.body.name_full !== undefined) {
      fields.push(`name_full = $${values.length + 1}`);
      values.push(req.body.name_full);
    }
    if (req.body.acronym !== undefined) {
      fields.push(`acronym = $${values.length + 1}`);
      values.push(req.body.acronym);
    }

    if (fields.length === 0)
      return res.status(400).json({ error: 'No valid fields to update' });

    values.push(id);
    const result = await sql.query(
      `update subjects set ${fields.join(', ')} where id = $${values.length} returning *`,
      values
    );

    const subject = result[0] || null;
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    return res.json({ subject });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;

    const existingRows = await sql`
      select id, added_by
      from subjects
      where id = ${id}
      limit 1
    `;
    const existing = existingRows[0] || null;
    if (!existing) return res.status(404).json({ error: 'Subject not found' });

    if (req.user.role === 'professor' && String(existing.added_by) !== String(req.user.id)) {
      return res.status(403).json({ error: 'You can only delete your own subjects' });
    }

    const rows = await sql`delete from subjects where id = ${id} returning id`;
    return res.json({ message: 'Subject deleted' });
  } catch (err) { next(err); }
}

module.exports = { list, create, update, remove };
