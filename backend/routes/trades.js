const express = require('express');
const router = express.Router();
const aiEngine = require('../services/aiEngine');
const db = require('../config/database');

router.post('/log', async (req, res) => {
  try {
    const { signalId, entryPrice, exitPrice, duration, marketConditions } = req.body;
    const profitLoss = exitPrice - entryPrice;
    const tradeData = {
      signalId,
      entryPrice,
      exitPrice,
      profitLoss,
      duration,
      marketConditions
    };
    const result = await aiEngine.recordTradeOutcome(tradeData);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/history', async (req, res) => {
  try {
    const result = await db.pool.query(
      'SELECT * FROM trades ORDER BY created_at DESC LIMIT 50'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;