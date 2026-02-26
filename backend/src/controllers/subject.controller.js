const supabase = require('../config/supabase.config');

async function list(req, res, next) {
  try {
    const { branch, semester } = req.query;
    let query = supabase.from('subjects').select('*').order('name_full');
    if (branch)   query = query.eq('branch', branch);
    if (semester) query = query.eq('semester', semester);
    const { data, error } = await query;
    if (error) throw error;
    return res.json({ subjects: data });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { branch, semester, name_full, acronym } = req.body;
    if (!branch || !semester || !name_full || !acronym)
      return res.status(400).json({ error: 'branch, semester, name_full and acronym are required' });

    const { data, error } = await supabase
      .from('subjects')
      .insert({ branch, semester, name_full, acronym, added_by: req.user.id })
      .select()
      .single();
    if (error) throw error;
    return res.status(201).json({ subject: data });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const allowed = ['branch', 'semester', 'name_full', 'acronym'];
    const updates = {};
    for (const f of allowed) if (req.body[f] !== undefined) updates[f] = req.body[f];

    const { data, error } = await supabase
      .from('subjects').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return res.json({ subject: data });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    await supabase.from('subjects').delete().eq('id', id);
    return res.json({ message: 'Subject deleted' });
  } catch (err) { next(err); }
}

module.exports = { list, create, update, remove };
