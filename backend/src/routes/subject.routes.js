const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { requireProfessor } = require('../middleware/role.middleware');
const { list, create, update, remove } = require('../controllers/subject.controller');

router.get('/',       list);
router.post('/',      authenticate, requireProfessor, create);
router.put('/:id',    authenticate, requireProfessor, update);
router.delete('/:id', authenticate, requireProfessor, remove);

module.exports = router;
