// backend/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path'); // ✅ ADD THIS

const registrationRoutes = require('./routes/registrationRoutes');
const groomingRoutes     = require('./routes/groomingRoutes');
const vetRoutes          = require('./routes/vetRoutes');
const billingRoutes      = require('./routes/billingRoutes');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── API Routes ────────────────────────────────────────────────
app.use('/api/registration', registrationRoutes);
app.use('/api/grooming', groomingRoutes);
app.use('/api/vet', vetRoutes);
app.use('/api/billing', billingRoutes);

// ── FRONTEND SERVING (IMPORTANT FIX) ──────────────────────────
app.use(express.static(path.join(__dirname, '../frontend')));

// Default route (open index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', time: new Date() })
);

// ── 404 handler ───────────────────────────────────────────────
app.use((_req, res) =>
  res.status(404).json({ error: 'Route not found' })
);

// ── Global error handler ──────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start server ──────────────────────────────────────────────
app.listen(PORT, () =>
  console.log(`🐾 PetCare API running on http://localhost:${PORT}`)
);

module.exports = app;