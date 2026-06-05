// backend/routes/groomingRoutes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/groomingController');

router.post('/',              ctrl.addTask);
router.get('/schedule',       ctrl.getSchedule);
router.get('/all',            ctrl.getAll);
router.put('/:id/complete',   ctrl.markComplete);

module.exports = router;
