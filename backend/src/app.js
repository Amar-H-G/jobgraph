require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const { verifyConnectivity, closeDriver } = require('./config/database');

const candidateRoutes = require('./routes/candidateRoutes');
const jobRoutes       = require('./routes/jobRoutes');
const graphRoutes     = require('./routes/graphRoutes');
const errorHandler    = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET'],
}));
app.use(express.json());

// ── Health ──────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    await verifyConnectivity();
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'unreachable', message: 'Database is unavailable.' });
  }
});

// ── Routes ──────────────────────────────────────────────────
app.use('/api/candidates', candidateRoutes);
app.use('/api/jobs',       jobRoutes);
app.use('/api/graph',      graphRoutes);

// ── 404 ─────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// ── Error Handler ────────────────────────────────────────────
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────────
async function start() {
  try {
    await verifyConnectivity();
    app.listen(PORT, () => {
      console.log(`[Server] JobGraph API running on port ${PORT}`);
    });
  } catch (err) {
    console.error('[Server] Failed to connect to CognoDB:', err.message);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => { await closeDriver(); process.exit(0); });
process.on('SIGINT',  async () => { await closeDriver(); process.exit(0); });

start();
