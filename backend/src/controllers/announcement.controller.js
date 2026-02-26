const supabase = require('../config/supabase.config');

async function list(req, res, next) {
  try {
    const { subject_id } = req.query;
    let query = supabase.from('announcements').select('*, subjects(name_full, acronym)').order('created_at', { ascending: false });
    if (subject_id) query = query.eq('subject_id', subject_id);
    const { data, error } = await query;
    if (error) throw error;
    return res.json({ announcements: data });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { subject_id, title, content } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'title and content are required' });
    const { data, error } = await supabase
      .from('announcements')
      .insert({ subject_id, title, content, posted_by: req.user.id })
      .select().single();
    if (error) throw error;
    return res.status(201).json({ announcement: data });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const { data: existing } = await supabase.from('announcements').select('posted_by').eq('id', id).single();
    if (!existing) return res.status(404).json({ error: 'Announcement not found' });
    if (req.user.role !== 'admin' && existing.posted_by !== req.user.id)
      return res.status(403).json({ error: 'Access denied' });
    await supabase.from('announcements').delete().eq('id', id);
    return res.json({ message: 'Announcement deleted' });
  } catch (err) { next(err); }
}

module.exports = { list, create, remove };
