const { sql } = require('../db/client');

/**
 * Get analytics for a specific professor (or all uploads for admin).
 */
async function getProfessorAnalytics(userId, isAdmin = false) {
  const resources = isAdmin
    ? await sql`
        select
          r.id,
          r.resource_type,
          r.pyq_type,
          r.created_at,
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
      `
    : await sql`
        select
          r.id,
          r.resource_type,
          r.pyq_type,
          r.created_at,
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
        where r.uploaded_by = ${userId}
      `;

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
  const [users, resources, subjects] = await Promise.all([
    sql`select id, role, created_at from users`,
    sql`select id, resource_type, created_at from resources`,
    sql`select id from subjects`,
  ]);

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
