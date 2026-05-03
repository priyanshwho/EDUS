const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { requireProfessor } = require('../middleware/role.middleware');
const { cacheGet, invalidateAllCache } = require('../middleware/cache.middleware');
const { list, create, update, remove } = require('../controllers/subject.controller');

router.get('/',       cacheGet({ scope: 'subjects:list', ttlSeconds: 300 }), list);
router.post('/',      authenticate, requireProfessor, invalidateAllCache(), create);
router.put('/:id',    authenticate, requireProfessor, invalidateAllCache(), update);
router.delete('/:id', authenticate, requireProfessor, invalidateAllCache(), remove);

module.exports = router;
