const supabase = require('../config/supabase.config');

/**
 * Get analytics for a specific professor (or all uploads for admin).
 */
async function getProfessorAnalytics(userId, isAdmin = false) {
  let query = supabase
    .from('resources')
    .select(`
      id, resource_type, pyq_type, created_at,
      subjects ( id, name_full, acronym, branch, semester )
    `);

  if (!isAdmin) query = query.eq('uploaded_by', userId);

  const { data: resources, error } = await query;
  if (error) throw error;

  const total = resources.length;

  // Breakdown by resource_type
  const byType = resources.reduce((acc, r) => {
    const key = r.pyq_type ? `${r.resource_type}:${r.pyq_type}` : r.resource_type;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  // Subject contribution
  const bySubject = resources.reduce((acc, r) => {
    const name = r.subjects?.name_full || 'Unknown';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  // Upload timeline (grouped by month YYYY-MM)
  const timeline = resources.reduce((acc, r) => {
    const month = r.created_at.slice(0, 7);
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  return { total, byType, bySubject, timeline };
}

/**
 * Admin: full platform analytics summary.
 */
async function getPlatformAnalytics() {
  const [usersRes, resourcesRes, subjectsRes] = await Promise.all([
    supabase.from('users').select('id, role, created_at'),
    supabase.from('resources').select('id, resource_type, created_at'),
    supabase.from('subjects').select('id'),
  ]);

  const users     = usersRes.data     || [];
  const resources = resourcesRes.data || [];
  const subjects  = subjectsRes.data  || [];

  const usersByRole = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  const resourcesByType = resources.reduce((acc, r) => {
    acc[r.resource_type] = (acc[r.resource_type] || 0) + 1;
    return acc;
  }, {});

  return {
    totalUsers:     users.length,
    totalResources: resources.length,
    totalSubjects:  subjects.length,
    usersByRole,
    resourcesByType,
  };
}

module.exports = { getProfessorAnalytics, getPlatformAnalytics };
