
const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const { convert } = require('pdf-poppler');
const { poolPromise } = require('../config/db');
const { generateFromModel } = require('../services/modelService');

async function convertPdfToImages(pdfPath, outputDir) {
  const opts = { format: 'png', out_dir: outputDir, out_prefix: 'page', page: null };
  await convert(pdfPath, opts);
  return fs.readdirSync(outputDir).filter(f => f.endsWith('.png')).map(f => path.join(outputDir, f));
}

async function ocrImage(imagePath) {
  const res = await Tesseract.recognize(imagePath, 'eng', { logger: m => {} });
  return res.data.text;
}

exports.uploadLabReport = async (req, res) => {
  const file = req.file;
  const patientId = req.body.patientId;
  if (!file) return res.status(400).json({ error: 'File required' });
  const uploadsDir = path.join(__dirname, '..', 'tmp_uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
  const tmpPdf = path.join(uploadsDir, file.filename + '.pdf');
  fs.renameSync(file.path, tmpPdf);
  try {
    const images = await convertPdfToImages(tmpPdf, uploadsDir);
    let fullText = '';
    for (const img of images) {
      const t = await ocrImage(img);
      fullText += t + '\n';
      try { fs.unlinkSync(img); } catch(e){}
    }
    // AI analysis
    const ai = await generateFromModel({ input: `Analyze this lab report and summarize abnormalities:\n${fullText}` });
    // Save to DB
    const pool = await poolPromise;
    await pool.request()
      .input('PatientId', patientId)
      .input('LabTestType', req.body.labTestType || 'General')
      .input('ReportText', fullText)
      .input('DiagnosisSummary', ai.text)
      .input('AIModelUsed', ai.meta?.model || 'active')
      .query('INSERT INTO PatientLabReports (PatientId, LabTestType, ReportText, DiagnosisSummary, AIModelUsed) VALUES (@PatientId,@LabTestType,@ReportText,@DiagnosisSummary,@AIModelUsed)');
    try { fs.unlinkSync(tmpPdf); } catch(e){}
    res.json({ extractedText: fullText, aiAnalysis: ai.text });
  } catch (err) {
    console.error(err);
    try { fs.unlinkSync(tmpPdf); } catch(e){}
    res.status(500).json({ error: 'Processing failed' });
  }
};

exports.getReportsByPatient = async (req, res) => {
  const patientId = req.params.patientId;
  try {
    const pool = await poolPromise;
    const result = await pool.request().input('PatientId', patientId).query('SELECT * FROM PatientLabReports WHERE PatientId=@PatientId ORDER BY CreatedAt DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fetch failed' });
  }
};
