
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { poolPromise } = require('../config/db');
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

exports.register = async (req, res) => {
  const { fullName, email, password, role } = req.body;
  if (!fullName || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const pool = await poolPromise;
    const hashed = await bcrypt.hash(password, 10);
    await pool.request()
      .input('FullName', fullName)
      .input('Email', email)
      .input('PasswordHash', hashed)
      .input('Role', role || 'Doctor')
      .query('INSERT INTO Users (FullName, Email, PasswordHash, Role) VALUES (@FullName,@Email,@PasswordHash,@Role)');
    res.status(201).json({ message: 'Registered' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const pool = await poolPromise;
    const result = await pool.request().input('Email', email).query('SELECT * FROM Users WHERE Email=@Email');
    const user = result.recordset[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.PasswordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.Id, email: user.Email, role: user.Role }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user.Id, fullName: user.FullName, email: user.Email, role: user.Role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
};
