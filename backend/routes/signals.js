const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/latest', async (req, res) => {
  try {
    const result = await db.pool.query(
      'SELECT * FROM signals ORDER BY created_at DESC LIMIT 1'
    );
    res.json(result.rows[0] || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/history', async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    const result = await db.pool.query(
      'SELECT * FROM signals ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;