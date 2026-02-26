/**
 * Role-based access control middleware.
 *
 * Usage:
 *   router.post('/upload', authenticate, requireRole('professor', 'admin'), handler)
 *
 * Role hierarchy:
 *   admin      → full access
 *   professor  → can upload/edit own content, post announcements
 *   student    → read-only
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user)
      return res.status(401).json({ error: 'Authentication required' });

    if (!roles.includes(req.user.role))
      return res.status(403).json({
        error: `Access denied. Required role(s): ${roles.join(', ')}`,
      });

    next();
  };
}

/**
 * Admin-only shorthand.
 */
const requireAdmin = requireRole('admin');

/**
 * Professor or admin shorthand.
 */
const requireProfessor = requireRole('professor', 'admin');

/**
 * Verify the requesting user owns the resource or is admin.
 * Attach the restriction so controllers can also check.
 */
function requireOwnerOrAdmin(ownerIdExtractor) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (req.user.role === 'admin') return next();

    const ownerId = ownerIdExtractor(req);
    if (String(ownerId) !== String(req.user.id))
      return res.status(403).json({ error: 'You can only modify your own content' });

    next();
  };
}

module.exports = { requireRole, requireAdmin, requireProfessor, requireOwnerOrAdmin };
