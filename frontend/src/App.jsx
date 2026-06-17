import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [signal, setSignal] = useState(null)
  const [signals, setSignals] = useState([])
  const [trades, setTrades] = useState([])
  const [modelStats, setModelStats] = useState(null)
  const [ws, setWs] = useState(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    fetchLatestSignal()
    fetchSignalsHistory()
    fetchTradesHistory()
    fetchModelStats()

    const interval = setInterval(() => {
      fetchModelStats()
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const wsUrl = process.env.NODE_ENV === 'production' 
      ? `wss://${window.location.host}/ws/signals`
      : 'ws://localhost:5001'

    const websocket = new WebSocket(wsUrl)

    websocket.onopen = () => {
      console.log('WebSocket connected')
      setIsConnected(true)
    }

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setSignal(data)
      setSignals(prev => [data, ...prev].slice(0, 10))
    }

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error)
      setIsConnected(false)
    }

    websocket.onclose = () => {
      console.log('WebSocket disconnected')
      setIsConnected(false)
    }

    setWs(websocket)

    return () => {
      if (websocket) websocket.close()
    }
  }, [])

  const fetchLatestSignal = async () => {
    try {
      const response = await axios.get('/api/signals/latest')
      setSignal(response.data)
    } catch (error) {
      console.error('Error fetching latest signal:', error)
    }
  }

  const fetchSignalsHistory = async () => {
    try {
      const response = await axios.get('/api/signals/history?limit=10')
      setSignals(response.data)
    } catch (error) {
      console.error('Error fetching signals history:', error)
    }
  }

  const fetchTradesHistory = async () => {
    try {
      const response = await axios.get('/api/trades/history')
      setTrades(response.data)
    } catch (error) {
      console.error('Error fetching trades history:', error)
    }
  }

  const fetchModelStats = async () => {
    try {
      const response = await axios.get('/api/model/stats')
      setModelStats(response.data)
    } catch (error) {
      console.error('Error fetching model stats:', error)
    }
  }

  const logTrade = async (outcome) => {
    if (!signal) return
    try {
      const profitLoss = outcome === 'WIN' ? 70 : -10
      await axios.post('/api/trades/log', {
        signalId: signal.id,
        entryPrice: signal.entryPrice,
        exitPrice: signal.entryPrice + (outcome === 'WIN' ? 0.70 : -0.10),
        duration: Math.floor(Math.random() * 3600),
        marketConditions: { trend: 'uptrend', rsi: 55, macd: 0.5, volume: 1000 }
      })
      fetchTradesHistory()
      fetchModelStats()
    } catch (error) {
      console.error('Error logging trade:', error)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🤖 ODI FX Signals</h1>
        <div className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="dot"></span>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </header>

      <main className="main">
        {signal && (
          <section className="signal-section">
            <h2>Latest Signal</h2>
            <div className={`signal-card ${signal.type?.toLowerCase()}`}>
              <div className="signal-header">
                <h3>{signal.type} Signal</h3>
                <span className="confidence">{signal.confidence}% Confidence</span>
              </div>
              <div className="signal-details">
                <div className="detail">
                  <label>Entry Price</label>
                  <p>${signal.entryPrice?.toFixed(2)}</p>
                </div>
                <div className="detail">
                  <label>Stop Loss</label>
                  <p>${signal.stopLoss?.toFixed(2)}</p>
                </div>
                <div className="detail">
                  <label>Take Profit</label>
                  <p>${signal.takeProfit?.toFixed(2)}</p>
                </div>
                <div className="detail">
                  <label>Risk/Reward</label>
                  <p>{signal.riskRewardRatio}</p>
                </div>
              </div>
              <div className="signal-details">
                <div className="detail">
                  <label>Pips Target</label>
                  <p>{signal.pipsTarget} pips</p>
                </div>
                <div className="detail">
                  <label>Max Loss</label>
                  <p>£{signal.maxLossGBP}</p>
                </div>
                <div className="detail">
                  <label>Lot Size</label>
                  <p>{signal.lotSize}</p>
                </div>
                <div className="detail">
                  <label>Model</label>
                  <p>v{signal.modelVersion}</p>
                </div>
              </div>
              <div className="signal-actions">
                <button className="btn btn-win" onClick={() => logTrade('WIN')}>✅ 70 PIPS WIN</button>
                <button className="btn btn-loss" onClick={() => logTrade('LOSS')}>❌ £10 LOSS</button>
              </div>
            </div>
          </section>
        )}

        {modelStats && (
          <section className="stats-section">
            <h2>Model Performance</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <label>Win Rate</label>
                <p className="stat-value">{modelStats.winRate?.toFixed(1)}%</p>
              </div>
              <div className="stat-card">
                <label>Accuracy</label>
                <p className="stat-value">{modelStats.accuracy?.toFixed(1)}%</p>
              </div>
              <div className="stat-card">
                <label>Total Trades</label>
                <p className="stat-value">{modelStats.totalTrades}</p>
              </div>
              <div className="stat-card">
                <label>Model v{modelStats.modelVersion}</label>
                <p className="stat-value">🧠 Active</p>
              </div>
            </div>
          </section>
        )}

        <section className="history-section">
          <h2>Signal History</h2>
          <div className="signals-list">
            {signals.map((sig, i) => (
              <div key={i} className={`signal-item ${sig.type?.toLowerCase()}`}>
                <span className="type">{sig.type}</span>
                <span className="confidence">{sig.confidence}%</span>
                <span className="time">{new Date(sig.created_at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="trades-section">
          <h2>Recent Trades</h2>
          <div className="trades-list">
            {trades.slice(0, 10).map((trade, i) => (
              <div key={i} className={`trade-item ${trade.outcome?.toLowerCase()}`}>
                <span className={`outcome ${trade.outcome?.toLowerCase()}`}>
                  {trade.outcome === 'WIN' ? '✅' : '❌'}
                </span>
                <span className="pnl" style={{ color: trade.profit_loss > 0 ? '#00ff00' : '#ff0000' }}>
                  £{trade.profit_loss?.toFixed(2)}
                </span>
                <span className="time">{new Date(trade.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App