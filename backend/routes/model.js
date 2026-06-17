const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/stats', async (req, res) => {
  try {
    const metricsResult = await db.pool.query(
      'SELECT * FROM model_metrics ORDER BY timestamp DESC LIMIT 1'
    );
    const tradesResult = await db.pool.query(
      'SELECT COUNT(*) as total, SUM(CASE WHEN outcome = \'WIN\' THEN 1 ELSE 0 END) as wins FROM trades'
    );
    const trades = tradesResult.rows[0];
    const metrics = metricsResult.rows[0];
    res.json({
      modelVersion: metrics?.version || 1,
      winRate: metrics?.win_rate || 0,
      totalTrades: parseInt(trades.total),
      wins: parseInt(trades.wins) || 0,
      accuracy: metrics?.accuracy || 0,
      lastUpdate: metrics?.timestamp
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;