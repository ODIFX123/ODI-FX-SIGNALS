# ODI FX SIGNALS - AI-Powered Trading System

A self-learning machine learning system for XAUUSD (Gold) trading signals with adaptive learning from trade outcomes.

## Architecture

- **Backend**: Node.js/Express + TensorFlow.js
- **Frontend**: React PWA (Safari iPhone optimized)
- **AI**: Reinforcement learning model that improves from each trade
- **Database**: PostgreSQL for trade history & model training data
- **Real-time**: WebSocket for live signal updates

## Features

✅ Self-learning AI engine
✅ Market probability analysis
✅ Adaptive strategy (learns from losses)
✅ Real-time signals
✅ Safari iPhone PWA support
✅ Trade outcome logging
✅ Model performance tracking
✅ **Model retrains every 5 trades** for continuous improvement

## Trading Rules

- **TP (Take Profit)**: 70 pips minimum for all winning trades
- **SL (Stop Loss)**: 10 pips = £10 maximum loss only
- **Lot Size**: 0.1 volume
- **Risk/Reward**: 1:7 (Excellent!)
- **Maximum Loss Per Trade**: £10 (strictly enforced)

## Installation

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your PostgreSQL credentials
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Using on Safari iPhone

1. Get your computer's IP: `ipconfig getifaddr en0` (Mac) or `ipconfig` (Windows)
2. On iPhone Safari: `http://YOUR-COMPUTER-IP:3000`
3. Tap Share → Add to Home Screen
4. Open app from home screen - works offline!

## Environment Variables

See `.env.example` files in backend and frontend directories.

## API Endpoints

- `POST /api/webhook/tradingview` - Receive TradingView alerts
- `GET /api/signals/latest` - Get current signal
- `POST /api/trades/log` - Log trade outcome (for learning)
- `GET /api/model/stats` - View model performance
- `WS /ws/signals` - WebSocket for real-time updates

## Model Learning

- **Retrains every 5 trades** for rapid improvement
- Each loss is a lesson the system learns from
- Accuracy & win rate improve continuously
- Goal: 100% win rate through adaptive learning

## License

MIT