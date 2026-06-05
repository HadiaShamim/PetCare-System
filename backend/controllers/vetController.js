// backend/controllers/vetController.js
const db = require('../config/dbConfig');
const PetModel = require('../models/petModel');
const { prioritySchedule } = require('../services/priorityService');

/** POST /api/vet/add */
async function addCase(req, res) {
  try {
    const { pet_id, pet_name, case_type, condition_desc, processing_time } = req.body;
    if (!pet_name || !case_type || !processing_time)
      return res.status(400).json({ error: 'pet_name, case_type, and processing_time are required' });

    const priority    = case_type === 'Emergency' ? 1 : 2;
    const room        = case_type === 'Emergency' ? 'Emergency Room' : 'General Room';
    let resolvedPetId = pet_id;
    if (!resolvedPetId) {
      resolvedPetId = await PetModel.create({ pet_name, owner_name: 'Unknown' });
    }

    await db.execute(
      `INSERT INTO vet_cases
         (pet_id, pet_name, case_type, condition_desc, priority, processing_time, room_assigned, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'waiting')`,
      [resolvedPetId, pet_name, case_type, condition_desc || '', priority, processing_time, room]
    );

    res.status(201).json({ message: 'Vet case added', priority, room });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/** GET /api/vet/schedule */
async function getSchedule(req, res) {
  try {
    const [rows] = await db.execute(
      `SELECT * FROM vet_cases WHERE status = 'waiting' ORDER BY arrival_time ASC`
    );

    const result = prioritySchedule(rows);

    await db.execute(
      `INSERT INTO algorithm_log (department, algorithm, input_snapshot, output_snapshot)
       VALUES ('Vet', 'Priority Scheduling', ?, ?)`,
      [JSON.stringify(rows), JSON.stringify(result)]
    );

    res.json({ ...result, raw: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/** PUT /api/vet/:id/discharge */
async function discharge(req, res) {
  try {
    await db.execute(
      `UPDATE vet_cases SET status='discharged', finish_time=NOW() WHERE id=?`,
      [req.params.id]
    );
    res.json({ message: 'Pet discharged' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/** GET /api/vet/all */
async function getAll(req, res) {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM vet_cases ORDER BY arrival_time DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { addCase, getSchedule, discharge, getAll };
