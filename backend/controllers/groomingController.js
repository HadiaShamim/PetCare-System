// backend/controllers/groomingController.js
const db      = require('../config/dbConfig');
const PetModel = require('../models/petModel');
const { fcfs } = require('../services/fcfsService');
const { sjf  } = require('../services/sjfService');

/** POST /api/grooming/add */
async function addTask(req, res) {
  try {
    const { pet_id, pet_name, task_type, processing_time } = req.body;
    if (!pet_name || !task_type || !processing_time)
      return res.status(400).json({ error: 'pet_name, task_type, and processing_time are required' });

    let resolvedPetId = pet_id;
    if (!resolvedPetId) {
      resolvedPetId = await PetModel.create({ pet_name, owner_name: 'Unknown' });
    }

    await db.execute(
      `INSERT INTO grooming_tasks (pet_id, pet_name, task_type, processing_time, status, algorithm)
       VALUES (?, ?, ?, ?, 'waiting', 'FCFS')`,
      [resolvedPetId, pet_name, task_type, processing_time]
    );

    res.status(201).json({ message: 'Grooming task added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/** GET /api/grooming/schedule?algorithm=FCFS|SJF */
async function getSchedule(req, res) {
  try {
    const algorithm = (req.query.algorithm || 'FCFS').toUpperCase();
    const [rows] = await db.execute(
      `SELECT * FROM grooming_tasks WHERE status != 'completed' ORDER BY arrival_time ASC`
    );

    const result = algorithm === 'SJF' ? sjf(rows) : fcfs(rows);

    await db.execute(
      `INSERT INTO algorithm_log (department, algorithm, input_snapshot, output_snapshot)
       VALUES ('Grooming', ?, ?, ?)`,
      [algorithm, JSON.stringify(rows), JSON.stringify(result)]
    );

    res.json({ ...result, raw: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/** PUT /api/grooming/:id/complete */
async function markComplete(req, res) {
  try {
    await db.execute(
      `UPDATE grooming_tasks SET status='completed', finish_time=NOW() WHERE id=?`,
      [req.params.id]
    );
    res.json({ message: 'Grooming task completed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/** GET /api/grooming/all */
async function getAll(req, res) {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM grooming_tasks ORDER BY arrival_time DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { addTask, getSchedule, markComplete, getAll };
