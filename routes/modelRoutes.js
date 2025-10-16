
const express = require('express');
const router = express.Router();
const { listModels, activateModel, generateResponse } = require('../services/modelService');

router.get('/', listModels);
router.post('/activate/:key', activateModel);
router.post('/generate', generateResponse);

module.exports = router;
