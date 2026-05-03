const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { requireProfessor } = require('../middleware/role.middleware');
const { cacheGet, invalidateAllCache } = require('../middleware/cache.middleware');
const { list, create, remove } = require('../controllers/announcement.controller');

router.get('/',       cacheGet({ scope: 'announcements:list', ttlSeconds: 120 }), list);
router.post('/',      authenticate, requireProfessor, invalidateAllCache(), create);
router.delete('/:id', authenticate, requireProfessor, invalidateAllCache(), remove);

module.exports = router;
