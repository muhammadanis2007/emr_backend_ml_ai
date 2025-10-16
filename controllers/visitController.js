
const { poolPromise } = require('../config/db');
const { generateFromModel } = require('../services/modelService');

exports.createVisitWithSymptoms = async (req, res) => {
  const { patientId, symptoms, notes, modelKey } = req.body;
  if (!patientId || !Array.isArray(symptoms)) return res.status(400).json({ error: 'Invalid input' });
  const pool = await poolPromise;
  const transaction = new (await pool).transaction();
  try {
    await transaction.begin();
    const insertVisit = await transaction.request()
      .input('PatientId', patientId)
      .input('Notes', notes || '')
      .query('INSERT INTO PatientVisits (PatientID, Notes) OUTPUT INSERTED.VisitID VALUES (@PatientId, @Notes)');
    const visitId = insertVisit.recordset[0].VisitID;
    for (const s of symptoms) {
      await transaction.request().input('VisitId', visitId).input('SymptomText', s).query('INSERT INTO Symptoms (VisitID, SymptomText) VALUES (@VisitId,@SymptomText)');
    }
    // generate diagnosis via modelService
    const prompt = `Symptoms: ${symptoms.join(', ')}`;
    const out = await generateFromModel({ input: prompt, modelKey });
    await transaction.request()
      .input('VisitId', visitId)
      .input('DiagnosisText', out.text)
      .input('RecommendedTreatment', 'See AI suggestions')
      .input('SuggestedLabTests', 'See AI suggestions')
      .input('LLMSource', modelKey || 'active')
      .query('INSERT INTO Diagnosis (VisitID, DiagnosisText, RecommendedTreatment, SuggestedLabTests, LLMSource) VALUES (@VisitId,@DiagnosisText,@RecommendedTreatment,@SuggestedLabTests,@LLMSource)');
    await transaction.commit();
    res.status(201).json({ message: 'Visit recorded', visitId });
  } catch (err) {
    await transaction.rollback().catch(()=>{});
    console.error(err);
    res.status(500).json({ error: 'Visit creation failed' });
  }
};

exports.getVisitDetails = async (req, res) => {
  const id = req.params.id;
  try {
    const pool = await poolPromise;
    const visit = await pool.request().input('VisitId', id).query('SELECT * FROM PatientVisits WHERE VisitID=@VisitId');
    if (!visit.recordset[0]) return res.status(404).json({ error: 'Not found' });
    const symptoms = await pool.request().input('VisitId', id).query('SELECT * FROM Symptoms WHERE VisitID=@VisitId');
    const diagnosis = await pool.request().input('VisitId', id).query('SELECT * FROM Diagnosis WHERE VisitID=@VisitId');
    const prescriptions = await pool.request().input('VisitId', id).query('SELECT * FROM Prescriptions WHERE VisitID=@VisitId');
    res.json({ visit: visit.recordset[0], symptoms: symptoms.recordset, diagnosis: diagnosis.recordset[0], prescriptions: prescriptions.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fetch failed' });
  }
};
