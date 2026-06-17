const express = require('express');
const router = express.Router();
const aiEngine = require('../services/aiEngine');

router.post('/tradingview', async (req, res) => {
  try {
    const { price, rsi, macd, volume, condition } = req.body;
    const marketData = {
      price: parseFloat(price),
      rsi: parseFloat(rsi) || 50,
      macd: parseFloat(macd) || 0,
      volume: parseFloat(volume) || 0,
      volatility: Math.random() * 2,
      ma5: parseFloat(price),
      ma20: parseFloat(price),
      ma50: parseFloat(price),
      adx: Math.random() * 100,
      stoch: parseFloat(rsi) || 50,
      atr: 50,
      ema12: parseFloat(price),
      ema26: parseFloat(price),
      hourOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      trend: condition === 'UPTREND' ? 1 : -1,
      momentum: Math.random() * 100,
      marketSentiment: 50,
      condition: condition || 'NEUTRAL'
    };
    const signal = await aiEngine.generateSignal(marketData);
    if (global.broadcastSignal) {
      global.broadcastSignal(signal);
    }
    res.json({ success: true, signal });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;