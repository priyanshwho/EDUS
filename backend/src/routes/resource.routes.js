const express = require('express');
const router  = express.Router();
const { authenticate, optionalAuth } = require('../middleware/authenticate');
const { requireProfessor, requireAdmin } = require('../middleware/role.middleware');
const {
  list, getBySlug, create, update, remove, saveResource, unsaveResource,
} = require('../controllers/resource.controller');

router.get('/',          optionalAuth,  list);
router.get('/:slug',     optionalAuth,  getBySlug);
router.post('/',         authenticate, requireProfessor, create);
router.put('/:id',       authenticate, requireProfessor, update);
router.delete('/:id',    authenticate, requireProfessor, remove);
router.post('/:id/save',    authenticate, saveResource);
router.delete('/:id/save',  authenticate, unsaveResource);

module.exports = router;
