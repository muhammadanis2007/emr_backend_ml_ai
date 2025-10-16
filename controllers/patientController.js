
const { poolPromise } = require('../config/db');

exports.createPatient = async (req, res) => {
  const { fullName, dateOfBirth, gender, contact, address } = req.body;
  if (!fullName) return res.status(400).json({ error: 'Name required' });
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('FullName', fullName)
      .input('DateOfBirth', dateOfBirth)
      .input('Gender', gender)
      .input('Contact', contact)
      .input('Address', address)
      .query('INSERT INTO Patients (FullName, DateOfBirth, Gender, Contact, Address) VALUES (@FullName,@DateOfBirth,@Gender,@Contact,@Address)');
    res.status(201).json({ message: 'Patient created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Create failed' });
  }
};

exports.getAllPatients = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Patients ORDER BY PatientID DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fetch failed' });
  }
};

exports.getPatientById = async (req, res) => {
  const id = req.params.id;
  try {
    const pool = await poolPromise;
    const result = await pool.request().input('Id', id).query('SELECT * FROM Patients WHERE PatientID=@Id');
    if (!result.recordset[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fetch failed' });
  }
};

exports.updatePatient = async (req, res) => {
  const id = req.params.id;
  const { fullName, dateOfBirth, gender, contact, address } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('Id', id)
      .input('FullName', fullName)
      .input('DateOfBirth', dateOfBirth)
      .input('Gender', gender)
      .input('Contact', contact)
      .input('Address', address)
      .query('UPDATE Patients SET FullName=@FullName, DateOfBirth=@DateOfBirth, Gender=@Gender, Contact=@Contact, Address=@Address WHERE PatientID=@Id');
    res.json({ message: 'Updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Update failed' });
  }
};

exports.deletePatient = async (req, res) => {
  const id = req.params.id;
  try {
    const pool = await poolPromise;
    await pool.request().input('Id', id).query('DELETE FROM Patients WHERE PatientID=@Id');
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Delete failed' });
  }
};
