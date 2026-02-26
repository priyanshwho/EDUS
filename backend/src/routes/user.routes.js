const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { requireAdmin } = require('../middleware/role.middleware');
const supabase = require('../config/supabase.config');

// Admin: list all users
router.get('/', authenticate, requireAdmin, async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, name, email, role, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ users: data });
  } catch (err) { next(err); }
});

// Admin: update user role
router.patch('/:id/role', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['student', 'professor', 'admin'].includes(role))
      return res.status(400).json({ error: 'Invalid role' });
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', req.params.id)
      .select('id, username, email, role')
      .single();
    if (error) throw error;
    return res.json({ user: data });
  } catch (err) { next(err); }
});

// Admin: delete user
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await supabase.from('users').delete().eq('id', req.params.id);
    return res.json({ message: 'User deleted' });
  } catch (err) { next(err); }
});

// Authenticated: get saved resources
router.get('/saved', authenticate, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('saved_resources')
      .select('*, resources(*, subjects(name_full, acronym))')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ saved: data });
  } catch (err) { next(err); }
});

module.exports = router;
