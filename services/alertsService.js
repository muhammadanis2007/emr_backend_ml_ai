
const cron = require('node-cron');
const { poolPromise } = require('../config/db');
const nodemailer = require('nodemailer');
let io = null;

function setIo(ioInstance) { io = ioInstance; }

async function createAlert(type, message, refId = null) {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('Type', type)
      .input('Message', message)
      .input('RefId', refId)
      .query('INSERT INTO Alerts (AlertType, ReferenceId, Message) VALUES (@Type,@RefId,@Message)');
  } catch (err) {
    console.error('Alert DB insert failed', err);
  }
  if (io) io.emit('alert', { type, message, refId, createdAt: new Date().toISOString() });
  if (process.env.ALERT_EMAIL_TO) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
      await transporter.sendMail({ from: process.env.SMTP_FROM, to: process.env.ALERT_EMAIL_TO, subject: `EMR Alert: ${type}`, text: message });
    } catch (err) {
      console.error('Email send failed', err);
    }
  }
}

async function checkInventoryAndExpiry() {
  try {
    const pool = await poolPromise;
    const threshold = parseInt(process.env.LOW_STOCK_THRESHOLD || '5');
    const low = await pool.request().input('Threshold', threshold).query('SELECT * FROM PharmacyInventory WHERE QuantityAvailable <= @Threshold');
    for (const row of low.recordset) await createAlert('low-stock', `${row.MedicineName} low: ${row.QuantityAvailable}`, row.MedicineId);
    const days = parseInt(process.env.EXPIRY_SOON_DAYS || '30');
    const expireDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const soon = await pool.request().input('ExpireDate', expireDate).query('SELECT * FROM PharmacyInventory WHERE ExpiryDate <= @ExpireDate');
    for (const row of soon.recordset) await createAlert('expired-medicine', `${row.MedicineName} expires on ${row.ExpiryDate}`, row.MedicineId);
  } catch (err) { console.error('Inventory check failed', err); }
}

async function checkAiErrorRates() {
  try {
    const pool = await poolPromise;
    const res = await pool.request().query('SELECT COUNT(*) as cnt FROM FeedbackTraining WHERE CreatedAt >= DATEADD(day, -7, GETDATE())');
    const cnt = res.recordset[0].cnt || 0;
    if (cnt > parseInt(process.env.AI_ERROR_THRESHOLD || '10')) await createAlert('ai-error', `High feedback volume: ${cnt} in last 7 days`);
  } catch (err) { console.error('AI error check failed', err); }
}

function startSchedulers() {
  cron.schedule('*/15 * * * *', () => checkAiErrorRates().catch(console.error));
  cron.schedule('0 * * * *', () => checkInventoryAndExpiry().catch(console.error));
}

module.exports = { setIo, startSchedulers, createAlert };
