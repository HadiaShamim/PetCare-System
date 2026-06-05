// backend/routes/vetRoutes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/vetController');

router.post('/',              ctrl.addCase);
router.get('/schedule',       ctrl.getSchedule);
router.get('/all',            ctrl.getAll);
router.put('/:id/discharge',  ctrl.discharge);

module.exports = router;
