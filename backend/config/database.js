const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

const initialize = async () => {
  try {
    const client = await pool.connect();
    await client.query(`CREATE TABLE IF NOT EXISTS signals (
      id SERIAL PRIMARY KEY,
      timestamp TIMESTAMP DEFAULT NOW(),
      pair VARCHAR(10) DEFAULT 'XAUUSD',
      signal_type VARCHAR(10),
      probability DECIMAL(5,2),
      confidence DECIMAL(5,2),
      entry_price DECIMAL(15,2),
      stop_loss DECIMAL(15,2),
      take_profit DECIMAL(15,2),
      model_version INT,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    await client.query(`CREATE TABLE IF NOT EXISTS trades (
      id SERIAL PRIMARY KEY,
      signal_id INT REFERENCES signals(id),
      entry_price DECIMAL(15,2),
      exit_price DECIMAL(15,2),
      profit_loss DECIMAL(15,2),
      outcome VARCHAR(10),
      duration_seconds INT,
      market_conditions TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`);
    await client.query(`CREATE TABLE IF NOT EXISTS model_metrics (
      id SERIAL PRIMARY KEY,
      version INT,
      win_rate DECIMAL(5,2),
      total_trades INT,
      accuracy DECIMAL(5,2),
      timestamp TIMESTAMP DEFAULT NOW()
    )`);
    console.log('✅ Database initialized');
    client.release();
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

module.exports = { pool, initialize };