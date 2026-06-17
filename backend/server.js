const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const WebSocket = require('ws');
const db = require('./config/database');
const aiEngine = require('./services/aiEngine');

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

db.initialize();
aiEngine.initialize();

app.use('/api/webhook', require('./routes/webhook'));
app.use('/api/signals', require('./routes/signals'));
app.use('/api/trades', require('./routes/trades'));
app.use('/api/model', require('./routes/model'));

const connectedClients = new Set();

wss.on('connection', (ws) => {
  console.log('Client connected');
  connectedClients.add(ws);
  ws.on('close', () => {
    connectedClients.delete(ws);
  });
  ws.on('error', (error) => console.error('WebSocket error:', error));
});

global.broadcastSignal = (signal) => {
  connectedClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(signal));
    }
  });
};

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 AI Trading System running on port ${PORT}`);
});