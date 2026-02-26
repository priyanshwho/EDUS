const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { requireProfessor, requireAdmin } = require('../middleware/role.middleware');
const { getProfessorAnalytics, getPlatformAnalytics } = require('../analytics/analytics.service');

// Professor: own analytics
router.get('/my', authenticate, requireProfessor, async (req, res, next) => {
  try {
    const data = await getProfessorAnalytics(req.user.id, false);
    return res.json(data);
  } catch (err) { next(err); }
});

// Admin: full platform analytics
router.get('/platform', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const data = await getPlatformAnalytics();
    return res.json(data);
  } catch (err) { next(err); }
});

// Admin: analytics for a specific professor
router.get('/professor/:userId', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const data = await getProfessorAnalytics(req.params.userId, false);
    return res.json(data);
  } catch (err) { next(err); }
});

module.exports = router;
