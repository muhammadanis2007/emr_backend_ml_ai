
const { poolPromise } = require('../config/db');
const { generateFromModel } = require('../services/modelService');

exports.addPrescription = async (req, res) => {
  const { visitId, patientId, medicineName, dosage, duration, instructions, medicationList, suggestedByAI } = req.body;
  try {
    const pool = await poolPromise;
    if (medicationList) {
      await pool.request()
        .input('PatientId', patientId)
        .input('Diagnosis', '')
        .input('MedicationList', medicationList)
        .input('SuggestedByAI', suggestedByAI ? 1 : 0)
        .query('INSERT INTO Prescriptions (PatientID, Diagnosis, MedicationList, SuggestedByAI) VALUES (@PatientId,@Diagnosis,@MedicationList,@SuggestedByAI)');
      return res.status(201).json({ message: 'Saved' });
    }
    await pool.request()
      .input('VisitId', visitId)
      .input('MedicineName', medicineName)
      .input('Dosage', dosage)
      .input('Duration', duration)
      .input('Instructions', instructions || '')
      .query('INSERT INTO Prescriptions (VisitID, MedicineName, Dosage, Duration, Instructions) VALUES (@VisitId,@MedicineName,@Dosage,@Duration,@Instructions)');
    res.status(201).json({ message: 'Prescription added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Save failed' });
  }
};

exports.updatePrescription = async (req, res) => {
  const id = req.params.id;
  const { medicineName, dosage, duration, instructions } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request().input('Id', id).input('MedicineName', medicineName).input('Dosage', dosage).input('Duration', duration).input('Instructions', instructions||'').query('UPDATE Prescriptions SET MedicineName=@MedicineName, Dosage=@Dosage, Duration=@Duration, Instructions=@Instructions WHERE PrescriptionID=@Id');
    res.json({ message: 'Updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Update failed' });
  }
};

exports.deletePrescription = async (req, res) => {
  const id = req.params.id;
  try {
    const pool = await poolPromise;
    await pool.request().input('Id', id).query('DELETE FROM Prescriptions WHERE PrescriptionID=@Id');
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Delete failed' });
  }
};

exports.getPrescriptionsByVisit = async (req, res) => {
  const visitId = req.params.visitId;
  try {
    const pool = await poolPromise;
    const result = await pool.request().input('VisitId', visitId).query('SELECT * FROM Prescriptions WHERE VisitID=@VisitId');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fetch failed' });
  }
};

exports.getByPatient = async (req, res) => {
  const patientId = req.params.patientId;
  try {
    const pool = await poolPromise;
    const result = await pool.request().input('PatientId', patientId).query('SELECT * FROM Prescriptions WHERE PatientID=@PatientId ORDER BY PrescriptionID DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fetch failed' });
  }
};

exports.suggestMedications = async (req, res) => {
  const { diagnosis, modelKey } = req.body;
  if (!diagnosis) return res.status(400).json({ error: 'Diagnosis required' });
  try {
    const prompt = `Suggest commonly prescribed medications (name, dosage) for the following diagnosis: ${diagnosis}. Provide JSON array with name and dosage.`;
    const out = await generateFromModel({ input: prompt, modelKey });
    res.json({ medications: out.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Suggestion failed' });
  }
};
