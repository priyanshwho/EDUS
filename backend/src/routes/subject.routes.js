const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { requireProfessor, requireAdmin } = require('../middleware/role.middleware');
const { list, create, update, remove } = require('../controllers/subject.controller');

router.get('/',       list);
router.post('/',      authenticate, requireProfessor, create);
router.put('/:id',    authenticate, requireAdmin, update);
router.delete('/:id', authenticate, requireAdmin, remove);

module.exports = router;
