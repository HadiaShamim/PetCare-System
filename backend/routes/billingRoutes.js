// backend/routes/billingRoutes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/billingController');

router.post('/',            ctrl.addBilling);
router.get('/schedule',     ctrl.getSchedule);
router.get('/daycare',      ctrl.getDaycare);
router.get('/all',          ctrl.getAll);
router.put('/:id/pay',      ctrl.markPaid);

module.exports = router;
