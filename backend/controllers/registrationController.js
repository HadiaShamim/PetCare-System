// backend/controllers/registrationController.js
const db      = require('../config/dbConfig');
const PetModel = require('../models/petModel');
const { fcfs } = require('../services/fcfsService');
const { sjf  } = require('../services/sjfService');

/** POST /api/registration/add */
async function addToQueue(req, res) {
  try {
    const { pet_name, owner_name, species, age, contact, processing_time } = req.body;
    if (!pet_name || !processing_time)
      return res.status(400).json({ error: 'pet_name and processing_time are required' });

    const pet_id = await PetModel.create({ pet_name, owner_name, species, age, contact });

    await db.execute(
      `INSERT INTO registration_queue
         (pet_id, pet_name, processing_time, algorithm, status)
       VALUES (?, ?, ?, 'FCFS', 'waiting')`,
      [pet_id, pet_name, processing_time]
    );

    res.status(201).json({ message: 'Pet added to registration queue', pet_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/** GET /api/registration/queue?algorithm=FCFS|SJF */
async function getQueue(req, res) {
  try {
    const algorithm = (req.query.algorithm || 'FCFS').toUpperCase();
    const [rows] = await db.execute(
      `SELECT * FROM registration_queue WHERE status != 'done' ORDER BY arrival_time ASC`
    );

    const result = algorithm === 'SJF' ? sjf(rows) : fcfs(rows);

    // Log
    await db.execute(
      `INSERT INTO algorithm_log (department, algorithm, input_snapshot, output_snapshot)
       VALUES ('Registration', ?, ?, ?)`,
      [algorithm, JSON.stringify(rows), JSON.stringify(result)]
    );

    res.json({ ...result, raw: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/** PUT /api/registration/:id/done */
async function markDone(req, res) {
  try {
    await db.execute(
      `UPDATE registration_queue SET status='done', finish_time=NOW() WHERE id=?`,
      [req.params.id]
    );
    res.json({ message: 'Marked as done' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/** GET /api/registration/all */
async function getAll(req, res) {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM registration_queue ORDER BY arrival_time DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { addToQueue, getQueue, markDone, getAll };
