
const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.post('/', prescriptionController.addPrescription);
router.put('/:id', prescriptionController.updatePrescription);
router.delete('/:id', prescriptionController.deletePrescription);
router.get('/visit/:visitId', prescriptionController.getPrescriptionsByVisit);
router.get('/patient/:patientId', prescriptionController.getByPatient);
router.post('/suggest', prescriptionController.suggestMedications);

module.exports = router;
