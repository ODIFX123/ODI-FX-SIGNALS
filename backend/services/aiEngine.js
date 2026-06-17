const tf = require('@tensorflow/tfjs');
const db = require('../config/database');

let model = null;
let modelVersion = 1;
const trainingData = [];

// XAUUSD trading configuration
const MIN_PIPS_FOR_WINNING_TP = 70; // 70 pips minimum profit target
const PIP_VALUE = 0.01; // For XAUUSD
const LOT_SIZE = 0.1; // Standard lot size
const MAX_LOSS_GBP = 10; // Maximum £10 loss on SL
const STOP_LOSS_PIPS_FINAL = 10; // Fixed: £10 max loss = 10 pips for 0.1 lot
const RETRAIN_INTERVAL = 5; // Retrain every 5 trades for faster learning

const initialize = async () => {
  try {
    model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [20], units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 3, activation: 'softmax' })
      ]
    });
    model.compile({
      optimizer: tf.train.adam(0.01),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });
    console.log('✅ AI Engine initialized');
    console.log(`📌 Configuration: 70 pips TP | 10 pips SL (£10 max loss) | 0.1 lot size`);
    console.log(`🧠 Model retrains every ${RETRAIN_INTERVAL} trades for continuous learning`);
  } catch (error) {
    console.error('AI Engine initialization error:', error);
  }
};

const extractFeatures = (marketData) => {
  return [
    marketData.price || 0,
    marketData.rsi || 50,
    marketData.macd || 0,
    marketData.bbUpper || 0,
    marketData.bbLower || 0,
    marketData.volume || 0,
    marketData.volatility || 0,
    marketData.ma5 || 0,
    marketData.ma20 || 0,
    marketData.ma50 || 0,
    marketData.adx || 0,
    marketData.stoch || 50,
    marketData.atr || 0,
    marketData.ema12 || 0,
    marketData.ema26 || 0,
    marketData.hourOfDay || 0,
    marketData.dayOfWeek || 0,
    marketData.trend || 0,
    marketData.momentum || 0,
    marketData.marketSentiment || 50
  ];
};

const generateSignal = async (marketData) => {
  try {
    if (!model) return null;
    const features = extractFeatures(marketData);
    const input = tf.tensor2d([features]);
    const prediction = model.predict(input);
    const probabilities = prediction.dataSync();
    
    const signalType = probabilities[0] > probabilities[1] ? 'BUY' : 'SELL';
    const confidence = Math.max(...probabilities) * 100;
    
    // Calculate TP and SL with fixed values
    const entryPrice = marketData.price;
    let takeProfit, stopLoss;
    
    if (signalType === 'BUY') {
      // For BUY: TP is 70 pips ABOVE entry, SL is 10 pips below (£10 max loss)
      takeProfit = entryPrice + (MIN_PIPS_FOR_WINNING_TP * PIP_VALUE);
      stopLoss = entryPrice - (STOP_LOSS_PIPS_FINAL * PIP_VALUE);
    } else {
      // For SELL: TP is 70 pips BELOW entry, SL is 10 pips above (£10 max loss)
      takeProfit = entryPrice - (MIN_PIPS_FOR_WINNING_TP * PIP_VALUE);
      stopLoss = entryPrice + (STOP_LOSS_PIPS_FINAL * PIP_VALUE);
    }
    
    const result = await db.pool.query(
      `INSERT INTO signals (pair, signal_type, probability, confidence, entry_price, stop_loss, take_profit, model_version)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      ['XAUUSD', signalType, probabilities[0] * 100, confidence, entryPrice, stopLoss, takeProfit, modelVersion]
    );

    input.dispose();
    prediction.dispose();

    return {
      id: result.rows[0].id,
      type: signalType,
      confidence: Math.round(confidence),
      probability: Math.round(probabilities[0] * 100),
      entryPrice: Number(entryPrice.toFixed(2)),
      stopLoss: Number(stopLoss.toFixed(2)),
      takeProfit: Number(takeProfit.toFixed(2)),
      pipsTarget: MIN_PIPS_FOR_WINNING_TP,
      pipsSL: STOP_LOSS_PIPS_FINAL,
      maxLossGBP: MAX_LOSS_GBP,
      lotSize: LOT_SIZE,
      riskRewardRatio: `1:${(MIN_PIPS_FOR_WINNING_TP / STOP_LOSS_PIPS_FINAL).toFixed(1)}`,
      modelVersion: modelVersion,
      timestamp: new Date(),
      marketCondition: marketData.condition || 'NEUTRAL'
    };
  } catch (error) {
    console.error('Signal generation error:', error);
    return null;
  }
};

const recordTradeOutcome = async (tradeData) => {
  try {
    // Calculate pips achieved
    const pipsAchieved = Math.abs((tradeData.exitPrice - tradeData.entryPrice) / PIP_VALUE);
    
    // Calculate actual GBP loss (for validation)
    const gbpLoss = Math.abs(tradeData.profitLoss);
    
    // Determine if trade was a valid WIN (must have 70+ pips)
    const isValidWin = tradeData.profitLoss > 0 && pipsAchieved >= MIN_PIPS_FOR_WINNING_TP;
    const outcome = isValidWin ? 'WIN' : (tradeData.profitLoss > 0 ? 'PARTIAL_WIN' : 'LOSS');
    
    console.log(`📊 Trade: ${outcome} | Pips: ${pipsAchieved.toFixed(2)} | Loss: £${gbpLoss.toFixed(2)} (Max: £${MAX_LOSS_GBP}) | P&L: ${tradeData.profitLoss}`);
    
    await db.pool.query(
      `INSERT INTO trades (signal_id, entry_price, exit_price, profit_loss, outcome, duration_seconds, market_conditions)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        tradeData.signalId,
        tradeData.entryPrice,
        tradeData.exitPrice,
        tradeData.profitLoss,
        outcome,
        tradeData.duration,
        JSON.stringify({
          ...tradeData.marketConditions,
          pipsAchieved: Number(pipsAchieved.toFixed(2)),
          pipsTP: MIN_PIPS_FOR_WINNING_TP,
          pipsSL: STOP_LOSS_PIPS_FINAL,
          lotSize: LOT_SIZE,
          maxLossGBP: MAX_LOSS_GBP,
          actualLossGBP: gbpLoss,
          isValidWin: isValidWin,
          meetsMinimumTP: pipsAchieved >= MIN_PIPS_FOR_WINNING_TP,
          withinMaxLoss: gbpLoss <= MAX_LOSS_GBP
        })
      ]
    );

    // Add to training data - model learns from all outcomes
    trainingData.push({
      features: extractFeatures(tradeData.marketConditions),
      outcome: isValidWin ? [1, 0, 0] : [0, 1, 0]
    });

    console.log(`📈 Training data: ${trainingData.length}/${RETRAIN_INTERVAL} trades collected`);

    // Retrain model every 5 trades for faster learning
    if (trainingData.length >= RETRAIN_INTERVAL) {
      await retrainModel();
    }

    return { 
      success: true, 
      pipsAchieved: Number(pipsAchieved.toFixed(2)), 
      gbpLoss: gbpLoss,
      isValidWin: isValidWin,
      meetsMinimumTP: pipsAchieved >= MIN_PIPS_FOR_WINNING_TP,
      withinMaxLoss: gbpLoss <= MAX_LOSS_GBP,
      outcome: outcome,
      tradesUntilRetrain: Math.max(0, RETRAIN_INTERVAL - trainingData.length)
    };
  } catch (error) {
    console.error('Trade outcome recording error:', error);
    return { success: false };
  }
};

const retrainModel = async () => {
  try {
    console.log('\n🧠 ⚡ RETRAINING MODEL with', trainingData.length, 'trade outcomes...');
    const features = tf.tensor2d(trainingData.map(d => d.features));
    const labels = tf.tensor2d(trainingData.map(d => d.outcome));
    
    await model.fit(features, labels, {
      epochs: 10,
      batchSize: 32,
      verbose: 0
    });

    modelVersion++;

    // Calculate metrics
    const predictions = model.predict(features);
    const predArray = predictions.argMax(1).dataSync();
    const labelArray = labels.argMax(1).dataSync();
    let correct = 0;
    for (let i = 0; i < predArray.length; i++) {
      if (predArray[i] === labelArray[i]) correct++;
    }
    const accuracy = (correct / predArray.length) * 100;
    const winRate = (trainingData.filter(d => d.outcome[0] === 1).length / trainingData.length) * 100;

    // Save metrics
    await db.pool.query(
      `INSERT INTO model_metrics (version, win_rate, total_trades, accuracy)
       VALUES ($1, $2, $3, $4)`,
      [modelVersion, winRate, trainingData.length, accuracy]
    );

    console.log(`✅ MODEL v${modelVersion} READY! | Accuracy: ${accuracy.toFixed(2)}% | Win Rate: ${winRate.toFixed(2)}%`);
    console.log(`📌 TP: 70 pips | SL: 10 pips (£10) | Lot: 0.1 | Next retrain: 5 trades\n`);

    // Reset training data for next batch
    trainingData.length = 0;

    features.dispose();
    labels.dispose();
    predictions.dispose();
  } catch (error) {
    console.error('Model retraining error:', error);
  }
};

module.exports = { 
  initialize, 
  generateSignal, 
  recordTradeOutcome, 
  retrainModel, 
  MIN_PIPS_FOR_WINNING_TP, 
  STOP_LOSS_PIPS_FINAL,
  MAX_LOSS_GBP,
  LOT_SIZE,
  RETRAIN_INTERVAL,
  PIP_VALUE 
};
