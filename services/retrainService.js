
const cron = require('node-cron');
const fs = require('fs');
const axios = require('axios');
const { poolPromise } = require('../config/db');

async function runRetrainPipeline() {
  try {
    const pool = await poolPromise;
    const feedback = await pool.request().query('SELECT * FROM FeedbackTraining WHERE IsUsedInTraining = 0');
    if (!feedback.recordset.length) return console.log('No new feedback for retraining');
    const dataset = feedback.recordset.map(r => ({ messages: [{ role: 'user', content: r.OriginalAIOutput }, { role: 'assistant', content: r.CorrectedOutput || r.DoctorFeedback }] }));
    const path = './training_data.jsonl';
    fs.writeFileSync(path, dataset.map(d => JSON.stringify(d)).join('\n'));
    // Upload to OpenAI files & create fine-tune job (requires entitlement)
    const apiKey = process.env.OPENAI_API_KEY;
    const form = new (require('form-data'))();
    form.append('file', fs.createReadStream(path));
    form.append('purpose', 'fine-tune');
    const upload = await axios.post('https://api.openai.com/v1/files', form, { headers: { Authorization: `Bearer ${apiKey}`, ...form.getHeaders() } });
    const fineTune = await axios.post('https://api.openai.com/v1/fine_tuning/jobs', { training_file: upload.data.id, model: 'gpt-4o-mini' }, { headers: { Authorization: `Bearer ${apiKey}` } });
    await pool.request().input('ModelName', 'gpt-4o-mini').input('RecordsUsed', feedback.recordset.length).input('FineTunedModel', fineTune.data.id).input('Status', 'Started').query('INSERT INTO ModelTrainingHistory (ModelName, RecordsUsed, FineTunedModel, Status) VALUES (@ModelName,@RecordsUsed,@FineTunedModel,@Status)');
    await pool.request().query('UPDATE FeedbackTraining SET IsUsedInTraining = 1 WHERE IsUsedInTraining = 0');
    console.log('Fine-tune job started', fineTune.data.id);
  } catch (err) {
    console.error('Retrain failed', err);
  }
}

cron.schedule('0 0 * * *', () => { runRetrainPipeline().catch(console.error); }); // daily at midnight

module.exports = { runRetrainPipeline };
