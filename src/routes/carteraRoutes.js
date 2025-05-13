const express = require('express');
const router = express.Router();
const { mostrarCartera } = require('../controllers/carteraController');

router.get('/', mostrarCartera);

module.exports = router;
