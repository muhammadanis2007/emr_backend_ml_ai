
const express = require('express');
const router = express.Router();
const multer = require('multer');
const labController = require('../controllers/labController');
const { authenticateToken } = require('../middleware/authMiddleware');

const upload = multer({ dest: 'uploads/', limits: { fileSize: 20 * 1024 * 1024 } });

router.post('/upload-lab-report', authenticateToken, upload.single('labReport'), labController.uploadLabReport);
router.get('/patient/:patientId', authenticateToken, labController.getReportsByPatient);

module.exports = router;
