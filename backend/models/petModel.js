// backend/models/petModel.js
const db = require('../config/dbConfig');

const PetModel = {
  /** Create a new pet master record */
  async create({ pet_name, owner_name, species, age, contact }) {
    const [result] = await db.execute(
      `INSERT INTO pets (pet_name, owner_name, species, age, contact)
       VALUES (?, ?, ?, ?, ?)`,
      [pet_name, owner_name, species || 'Dog', age || null, contact || null]
    );
    return result.insertId;
  },

  async findAll() {
    const [rows] = await db.execute('SELECT * FROM pets ORDER BY created_at DESC');
    return rows;
  },

  async findById(id) {
    const [rows] = await db.execute('SELECT * FROM pets WHERE id = ?', [id]);
    return rows[0] || null;
  },
};

module.exports = PetModel;
