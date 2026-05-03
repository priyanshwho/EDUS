const express = require('express');
const router  = express.Router();
const { authenticate, optionalAuth } = require('../middleware/authenticate');
const { requireProfessor } = require('../middleware/role.middleware');
const { cacheGet, invalidateAllCache } = require('../middleware/cache.middleware');
const {
  list, getBySlug, create, update, remove, saveResource, unsaveResource,
} = require('../controllers/resource.controller');
const { createResourceValidator, updateResourceValidator, listResourcesValidator } = require('../validators/resource.validator');

router.get('/',          optionalAuth,  listResourcesValidator, cacheGet({
  scope: 'resources:list',
  ttlSeconds: 120,
}), list);
router.get('/:slug',     optionalAuth,  getBySlug);
router.post('/',         authenticate, requireProfessor, createResourceValidator, invalidateAllCache(), create);
router.put('/:id',       authenticate, requireProfessor, updateResourceValidator, invalidateAllCache(), update);
router.delete('/:id',    authenticate, requireProfessor, invalidateAllCache(), remove);
router.post('/:id/save',    authenticate, invalidateAllCache(), saveResource);
router.delete('/:id/save',  authenticate, invalidateAllCache(), unsaveResource);

module.exports = router;
