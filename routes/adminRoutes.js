
const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/db');

router.get('/metrics', async (req, res) => {
  try {
    const pool = await poolPromise;
    const feedback = await pool.request().query('SELECT COUNT(*) as total FROM FeedbackTraining');
    const aiPres = await pool.request().query('SELECT COUNT(*) as total FROM Prescriptions WHERE SuggestedByAI = 1');
    const retrain = await pool.request().query('SELECT TOP 10 * FROM ModelTrainingHistory ORDER BY TrainingDate DESC');
    res.json({ feedbackCount: feedback.recordset[0].total, aiSuggestions: aiPres.recordset[0].total, retrainStats: retrain.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fetch failed' });
  }
});

module.exports = router;
