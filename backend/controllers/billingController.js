// backend/controllers/billingController.js
const db = require('../config/dbConfig');
const PetModel = require('../models/petModel');
const { roundRobin, daycareRoundRobin } = require('../services/roundRobinService');

/** POST /api/billing */
async function addBilling(req, res) {
  try {
    const { pet_id, pet_name, total_amount, time_quantum } = req.body;
    if (!pet_name || !total_amount)
      return res.status(400).json({ error: 'pet_name and total_amount are required' });

    let resolvedPetId = pet_id;
    if (!resolvedPetId) {
      resolvedPetId = await PetModel.create({ pet_name, owner_name: 'Unknown' });
    }

    await db.execute(
      `INSERT INTO billing_queue
         (pet_id, pet_name, total_amount, remaining_amount, time_quantum, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [resolvedPetId, pet_name, total_amount, total_amount, time_quantum || 2]
    );

    res.status(201).json({ message: 'Added to billing queue' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/** GET /api/billing/schedule */
async function getSchedule(req, res) {
  try {
    const [rows] = await db.execute(
      `SELECT * FROM billing_queue WHERE status != 'paid' ORDER BY arrival_time ASC`
    );

    // Use remaining_amount as the "processing_time" for Round Robin
    const procs = rows.map(r => ({
      ...r,
      processing_time: parseFloat(r.remaining_amount),
    }));

    const quantum = rows[0]?.time_quantum || 2;
    const result  = roundRobin(procs, quantum);

    await db.execute(
      `INSERT INTO algorithm_log (department, algorithm, input_snapshot, output_snapshot)
       VALUES ('Billing', 'Round Robin', ?, ?)`,
      [JSON.stringify(rows), JSON.stringify(result)]
    );

    res.json({ ...result, raw: rows, time_quantum: quantum });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/** PUT /api/billing/:id/pay */
async function markPaid(req, res) {
  try {
    await db.execute(
      `UPDATE billing_queue SET status='paid', paid_at=NOW(), remaining_amount=0 WHERE id=?`,
      [req.params.id]
    );
    res.json({ message: 'Payment completed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/** GET /api/billing/all */
async function getAll(req, res) {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM billing_queue ORDER BY arrival_time DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/* ── Daycare ──────────────────────────────────────────────── */

/** GET /api/billing/daycare */
async function getDaycare(req, res) {
  try {
    const [pets] = await db.execute(
      `SELECT DISTINCT pet_id AS id, pet_name FROM daycare_activities`
    );
    const activities = ['Play', 'Training', 'Ball Area'];
    const quantum    = 2;
    const result     = daycareRoundRobin(pets, activities, quantum);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { addBilling, getSchedule, markPaid, getAll, getDaycare };
