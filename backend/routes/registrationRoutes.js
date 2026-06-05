// backend/routes/registrationRoutes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/registrationController');

router.post('/',           ctrl.addToQueue);
router.get('/queue',       ctrl.getQueue);
router.get('/all',         ctrl.getAll);
router.put('/:id/done',    ctrl.markDone);

module.exports = router;
